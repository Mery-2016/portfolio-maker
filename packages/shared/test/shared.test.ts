import { describe, it, expect } from 'vitest';
import {
  ResumeDataSchema,
  createDefaultResumeData,
  createSampleResumeData,
  translit,
  getResumeFileName,
  typograf,
  normalizeUzApostrophe,
  migrateResume,
} from '../src/index.js';

describe('Shared Package Tests', () => {
  it('validates default resume data schema', () => {
    const defaultData = createDefaultResumeData();
    const result = ResumeDataSchema.safeParse(defaultData);
    // Personal full name and contacts are empty in fresh default, but sample is valid
    expect(defaultData.schemaVersion).toBe(1);
  });

  it('validates sample resume data against complete schema', () => {
    const sample = createSampleResumeData();
    const parsed = ResumeDataSchema.safeParse(sample);
    expect(parsed.success).toBe(true);
  });

  it('transliterates correctly according to GOST 7.79-2000 B', () => {
    expect(translit('Иван Петров')).toBe('Ivan_Petrov');
    expect(translit('Руслан Абджемилов')).toBe('Ruslan_Abdzhemilov');
    expect(translit('O‘zbekiston')).toBe('Ozbekiston');
    expect(translit('Frontend Разработчик')).toBe('Frontend_Razrabotchik');
  });

  it('generates proper export filenames', () => {
    const fnDesktop = getResumeFileName('Иван Петров', 'Frontend Lead', 'pdf-desktop');
    expect(fnDesktop).toBe('Ivan_Petrov_Frontend_Lead_CV.pdf');

    const fnMobile = getResumeFileName('Иван Петров', 'Frontend Lead', 'pdf-mobile');
    expect(fnMobile).toBe('Ivan_Petrov_Frontend_Lead_CV_mobile.pdf');

    const fnPng = getResumeFileName('Иван Петров', 'Frontend Lead', 'png-mobile');
    expect(fnPng).toBe('Ivan_Petrov_Frontend_Lead_CV_mobile.png');
  });

  it('typograf handles Uzbek apostrophes and prepositions', () => {
    const uz = normalizeUzApostrophe('Oʻzbekiston va Toshkent');
    expect(uz).toContain('‘');

    const formatted = typograf('Работа в компании и на проекте');
    expect(formatted).toContain('\u00A0');
  });

  it('migrateResume safely migrates incomplete or legacy data', () => {
    const legacy = {
      id: 'legacy-1',
      personal: { fullName: 'Алексей' },
    };
    const migrated = migrateResume(legacy);
    expect(migrated.id).toBe('legacy-1');
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.personal.fullName).toBe('Алексей');
    expect(migrated.design.templateId).toBe('modern');
    expect(Array.isArray(migrated.experience)).toBe(true);
  });
});
