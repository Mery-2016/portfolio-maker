import { ResumeData } from '@cvb/shared';
import { generateEditorNotes } from '../editor-notes.js';

export function generateMockAiResponse(data: ResumeData, tone: 'neutral' | 'confident' | 'creative' = 'neutral') {
  const position = data.personal.position || 'Специалист';
  const hardSkills = data.skills.hard.map(h => h.name).slice(0, 5).join(', ');

  // Summary
  let summary = '';
  if (tone === 'confident') {
    summary = `Опытный ${position} с доказанным опытом реализации ключевых проектов. Владею современным стеком (${hardSkills || 'профильные инструменты'}), ориентирован на измеримый результат, системное качество и масштабируемость решений.`;
  } else if (tone === 'creative') {
    summary = `${position}, сочетающий инженерную дисциплину и внимание к деталям продукта. Развиваю архитектуру (${hardSkills || 'ключевой стек'}), строю понятные процессы и помогаю команде достигать высоких стандартов качества.`;
  } else {
    summary = `Квалифицированный ${position}. Практический опыт разработки и поддержки решений с применением ${hardSkills || 'современных технологий'}. Ответственный подход к проектированию, оптимизации процессов и взаимодействию в распределённой команде.`;
  }

  // Experience bullets
  const experienceEdits = data.experience.map((exp, idx) => {
    const raw = exp.rawDescription || '';
    const company = exp.company || 'Компании';
    const role = exp.role || position;

    const bullets: string[] = [];

    // Split sentences or comma clauses
    const lines = raw.split(/[\n.;]+/).map(s => s.trim()).filter(s => s.length > 5);

    if (lines.length > 0) {
      for (const line of lines) {
        // Transform casual text to action verb
        let transformed = line;
        if (/руковожу|управляю|вел/i.test(line)) {
          transformed = line.replace(/руковожу|управляю/i, 'Руководил').replace(/командой/i, 'командой специалистов');
        } else if (/делал|разрабатывал|писал/i.test(line)) {
          transformed = line.replace(/делал|разрабатывал|писал/i, 'Разрабатывал архитектуру и компоненты для');
        } else if (/ускорил|оптимизировал/i.test(line)) {
          transformed = line.replace(/ускорил|оптимизировал/i, 'Оптимизировал производительность и ускорил');
        } else if (/внедрил|запустил/i.test(line)) {
          transformed = line.replace(/внедрил|запустил/i, 'Успешно внедрил в промышленную эксплуатацию');
        } else {
          // Capitalize first letter
          transformed = transformed.charAt(0).toUpperCase() + transformed.slice(1);
        }

        // Clean up "next" -> "Next.js"
        transformed = transformed.replace(/\bnext\b/gi, 'Next.js').replace(/\bjs\b/gi, 'JavaScript').replace(/\bts\b/gi, 'TypeScript');

        if (transformed.length > 15) {
          bullets.push(transformed);
        }
      }
    }

    if (bullets.length === 0) {
      bullets.push(
        `Обеспечивал разработку и техническую поддержку ключевых сервисов компании в роли ${role}`,
        `Участвовал в проектировании архитектурных решений и оптимизации рабочих процессов`
      );
    }

    const notes = generateEditorNotes(raw, bullets);

    return {
      itemId: exp.id,
      ref: `e${idx + 1}`,
      bullets: bullets.slice(0, 5),
      highlights: [0],
      notes,
    };
  });

  // Projects bullets
  const projectEdits = data.projects.map((proj, idx) => {
    return {
      itemId: proj.id,
      ref: `p${idx + 1}`,
      bullets: [
        `Спроектировал архитектуру решения «${proj.name}» с фокусом на надёжность и масштабируемость`,
        `Реализовал базовый функционал и интеграционные интерфейсы`,
      ],
    };
  });

  // Strengths
  const strengths = [
    {
      title: 'Практическая экспертиза',
      evidence: `Реализация комплексных задач на позиции ${position}`,
    },
    {
      title: 'Внимание к качеству',
      evidence: 'Системное ревью решений и следование стандартам надёжности',
    },
    {
      title: 'Командное взаимодействие',
      evidence: 'Опыт эффективной коммуникации и согласования технических требований',
    },
  ];

  return {
    summary,
    experience: experienceEdits,
    projects: projectEdits,
    strengths,
  };
}
