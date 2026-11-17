import { describe, it, expect } from 'vitest';
import {
  postValidateResumeOutput,
  generateEditorNotes,
  generateMockAiResponse,
} from '../src/index.js';
import { createSampleResumeData } from '@cvb/shared';

describe('AI Validation and Editorial Tests', () => {
  it('detects banned slop phrases in summary and bullets', () => {
    const output = {
      summary: 'Я опытный специалист, работающий в динамичной среде с полной отдачей.',
      experience: [
        {
          ref: 'e1',
          bullets: ['Успешно играл ключевую роль в проекте'],
          highlights: [0],
        },
      ],
      projects: [],
      strengths: [],
    };

    const context = {
      language: 'ru' as const,
      rawExperienceMap: { e1: 'делал проект' },
      rawProjectsMap: {},
      allRawText: 'делал проект',
    };

    const result = postValidateResumeOutput(output, context);
    expect(result.isValid).toBe(false);
    expect(result.issues.some(i => i.type === 'slop')).toBe(true);
  });

  it('detects fabricated numbers in bullets', () => {
    const output = {
      summary: 'Хороший специалист.',
      experience: [
        {
          ref: 'e1',
          bullets: ['Увеличил продажи на 750%'],
          highlights: [0],
        },
      ],
      projects: [],
      strengths: [],
    };

    const context = {
      language: 'ru' as const,
      rawExperienceMap: { e1: 'занимался продажами' },
      rawProjectsMap: {},
      allRawText: 'занимался продажами',
    };

    const result = postValidateResumeOutput(output, context);
    expect(result.issues.some(i => i.type === 'hallucination_number')).toBe(true);
  });

  it('generates accurate margin notes', () => {
    const raw = 'руковожу командой из 4 человек, делали сайт журнала на next, ускорили загрузку в 3 раза';
    const bullets = [
      'Руководил командой из 4 разработчиков',
      'Перевёл сайт на Next.js',
      'Ускорил загрузку в 3 раза',
    ];

    const notes = generateEditorNotes(raw, bullets);
    expect(notes).toContain('цифры взяты из вашего текста');
    expect(notes).toContain('уточнил названия: next → Next.js');
  });

  it('mock editor generates valid structured response', () => {
    const sample = createSampleResumeData();
    const result = generateMockAiResponse(sample, 'confident');
    expect(result.summary).toBeTruthy();
    expect(result.experience.length).toBeGreaterThan(0);
    expect(result.experience[0].bullets.length).toBeGreaterThan(0);
    expect(result.strengths.length).toBe(3);
  });
});
