import { FastifyPluginAsync } from 'fastify';
import { dbStore } from '../../db/index.js';
import { generateMockAiResponse } from '@cvb/ai-prompts';
import { SectionKey } from '@cvb/shared';

export interface CheckIssue {
  code: string;
  severity: 'info' | 'warning';
  section: SectionKey | 'contacts';
  itemId?: string;
  message: string;
}

export const aiRoutes: FastifyPluginAsync = async (fastify) => {
  // Usage
  fastify.get('/resumes/:id/ai/usage', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } });
    }

    const used = dbStore.getAiUsageToday(id);
    const tomorrow = new Date();
    tomorrow.setHours(24, 0, 0, 0);

    return {
      used,
      limit: 20,
      resetsAt: tomorrow.toISOString(),
    };
  });

  // Pre-flight & completeness check (FR-13)
  fastify.post('/resumes/:id/ai/check', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } });
    }

    const data = resume.data;
    const issues: CheckIssue[] = [];

    // 1. NO_CONTACT
    if (!data.contacts.phone && !data.contacts.email) {
      issues.push({
        code: 'NO_CONTACT',
        severity: 'warning',
        section: 'contacts',
        message: 'Не указаны контакты: телефон или email необходимы работодателю',
      });
    }

    // 2. EXPERIENCE_TOO_SHORT
    for (const exp of data.experience) {
      if (exp.rawDescription.trim().length > 0 && exp.rawDescription.trim().length < 80) {
        issues.push({
          code: 'EXPERIENCE_TOO_SHORT',
          severity: 'info',
          section: 'experience',
          itemId: exp.id,
          message: `В «${exp.company || 'месте работы'}» мало деталей — добавьте конкретные результаты`,
        });
      }
    }

    // 3. NO_RESULTS
    const resultVerbs = /увеличил|сократил|запустил|внедрил|руководил|оптимизировал|повысил|разработал/i;
    let hasResultNumber = false;
    for (const exp of data.experience) {
      const combined = (exp.aiBullets || []).join(' ') + ' ' + exp.rawDescription;
      if (/\d+/.test(combined) && resultVerbs.test(combined)) {
        hasResultNumber = true;
        break;
      }
    }
    if (data.experience.length > 0 && !hasResultNumber) {
      issues.push({
        code: 'NO_RESULTS',
        severity: 'info',
        section: 'experience',
        message: 'В опыте не хватает измеримых результатов и цифр',
      });
    }

    // 4. SUMMARY_MISSING
    if (!data.ai.summary && !data.design.hiddenSections.includes('summary')) {
      issues.push({
        code: 'SUMMARY_MISSING',
        severity: 'info',
        section: 'summary',
        message: 'Секция «О себе» не заполнена — редактор поможет сформулировать главное',
      });
    }

    // 5. TOO_FEW_SKILLS
    if (data.skills.hard.length < 4 && !data.design.hiddenSections.includes('skills')) {
      issues.push({
        code: 'TOO_FEW_SKILLS',
        severity: 'info',
        section: 'skills',
        message: 'Указано мало профессиональных навыков (рекомендуется не менее 4)',
      });
    }

    return { issues };
  });

  // Full AI Generation with SSE (SPEC §4.6)
  fastify.post('/resumes/:id/ai/generate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } });
    }

    const data = resume.data;
    const body = (request.body || {}) as { tone?: 'neutral' | 'confident' | 'creative'; language?: any };
    const tone = body.tone || data.ai.tone || 'neutral';

    // Check minimum requirements (SPEC §2.1)
    const hasPosition = !!data.personal.position?.trim();
    const hasExp = data.experience.some(e => e.rawDescription.trim().length > 0);
    const hasProj = data.projects.some(p => p.rawDescription.trim().length > 0);
    const hasSkills = data.skills.hard.length > 0;

    if (!hasPosition || (!hasExp && !hasProj && !hasSkills)) {
      return reply.status(400).send({
        error: {
          code: 'AI_INSUFFICIENT_INPUT',
          message: 'Редактору нужна должность и хотя бы одно место работы, проект или навыки',
        },
      });
    }

    // Check limit
    const usedToday = dbStore.getAiUsageToday(id);
    if (usedToday >= 20) {
      return reply.status(429).send({
        error: {
          code: 'AI_LIMIT_REACHED',
          message: 'Правок на сегодня больше нет. Завтра снова будет 20',
        },
      });
    }

    // Prepare SSE response
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': request.headers.origin || '*',
      'Access-Control-Allow-Credentials': 'true',
    });

    const sendEvent = (event: string, payload: any) => {
      reply.raw.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
    };

    try {
      // 1. Stage: skills
      sendEvent('stage', { stage: 'skills' });
      await new Promise(r => setTimeout(r, 200));

      // 2. Stage: content
      sendEvent('stage', { stage: 'content' });

      // Generate editorial content
      const aiResult = generateMockAiResponse(data, tone);

      // Stream summary
      await new Promise(r => setTimeout(r, 250));
      sendEvent('summary', { text: aiResult.summary });

      // Stream experience items with margin notes
      for (const expEdit of aiResult.experience) {
        await new Promise(r => setTimeout(r, 300));
        sendEvent('experience', expEdit);
      }

      // Stream strengths
      await new Promise(r => setTimeout(r, 200));
      sendEvent('strengths', { items: aiResult.strengths });

      // Apply changes to database
      const updatedExperience = data.experience.map(e => {
        const edit = aiResult.experience.find(x => x.itemId === e.id);
        if (edit) {
          return {
            ...e,
            aiBullets: edit.bullets,
            highlights: edit.highlights,
            notes: edit.notes,
            useAi: true,
          };
        }
        return e;
      });

      const updatedProjects = data.projects.map(p => {
        const edit = aiResult.projects.find(x => x.itemId === p.id);
        if (edit) {
          return {
            ...p,
            aiBullets: edit.bullets,
            useAi: true,
          };
        }
        return p;
      });

      const updatedPatch = {
        ai: {
          ...data.ai,
          summary: aiResult.summary,
          strengths: aiResult.strengths,
          tone,
          generatedAt: new Date().toISOString(),
        },
        experience: updatedExperience,
        projects: updatedProjects,
      };

      const updateResult = dbStore.updateResume(id, resume.version, updatedPatch, request.session);
      const newVersion = updateResult.status === 'ok' ? updateResult.version : resume.version + 1;

      dbStore.recordAiGeneration(id, 'full', 'claude-sonnet-5-5', 'ok');

      // Send done event
      sendEvent('done', {
        version: newVersion,
        warnings: [],
        usage: { used: usedToday + 1, limit: 20 },
      });
    } catch (err: any) {
      sendEvent('error', { code: 'AI_PROVIDER_ERROR', message: err.message });
    } finally {
      reply.raw.end();
    }
  });

  // Regenerate single block
  fastify.post('/resumes/:id/ai/regenerate', async (request, reply) => {
    const { id } = request.params as { id: string };
    const resume = dbStore.getResume(id, request.session);
    if (!resume) {
      return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Резюме не найдено' } });
    }

    const body = (request.body || {}) as {
      block: 'summary' | 'experience' | 'strengths';
      itemId?: string;
      tone?: 'neutral' | 'confident' | 'creative';
    };

    const aiResult = generateMockAiResponse(resume.data, body.tone || 'neutral');

    if (body.block === 'summary') {
      return { result: { text: aiResult.summary } };
    }
    if (body.block === 'experience' && body.itemId) {
      const exp = aiResult.experience.find(e => e.itemId === body.itemId) || aiResult.experience[0];
      return { result: exp };
    }
    if (body.block === 'strengths') {
      return { result: { items: aiResult.strengths } };
    }

    return { result: null };
  });
};
