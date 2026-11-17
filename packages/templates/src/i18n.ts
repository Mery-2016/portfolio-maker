import { Lang, SectionKey } from '@cvb/shared';

export type SectionTitleKey = SectionKey | 'contacts' | 'present' | 'age' | 'yearsOld';

export const SECTION_TITLES: Record<SectionTitleKey, Record<Lang, string>> = {
  summary: {
    ru: 'О себе',
    uz: 'Men haqimda',
    en: 'Summary',
  },
  strengths: {
    ru: 'Ключевые преимущества',
    uz: 'Kuchli tomonlar',
    en: 'Key Strengths',
  },
  experience: {
    ru: 'Опыт работы',
    uz: 'Ish tajribasi',
    en: 'Experience',
  },
  projects: {
    ru: 'Проекты',
    uz: 'Loyihalar',
    en: 'Projects',
  },
  education: {
    ru: 'Образование',
    uz: 'Ta‘lim',
    en: 'Education',
  },
  skills: {
    ru: 'Навыки',
    uz: 'Ko‘nikmalar',
    en: 'Skills',
  },
  languages: {
    ru: 'Владение языками',
    uz: 'Tillar',
    en: 'Languages',
  },
  contacts: {
    ru: 'Контакты',
    uz: 'Aloqa',
    en: 'Contacts',
  },
  present: {
    ru: 'по н.в.',
    uz: 'hozirgacha',
    en: 'present',
  },
  age: {
    ru: 'Возраст',
    uz: 'Yosh',
    en: 'Age',
  },
  yearsOld: {
    ru: 'лет',
    uz: 'yosh',
    en: 'years old',
  },
};

export function getSectionTitle(key: SectionTitleKey, lang: Lang): string {
  return SECTION_TITLES[key]?.[lang] || SECTION_TITLES[key]?.ru || key;
}

export const SKILL_LEVEL_NAMES: Record<number, Record<Lang, string>> = {
  1: { ru: 'Базовый', uz: 'Boshlang‘ich', en: 'Beginner' },
  2: { ru: 'Базовый', uz: 'Boshlang‘ich', en: 'Elementary' },
  3: { ru: 'Уверенный', uz: 'Ishonchli', en: 'Intermediate' },
  4: { ru: 'Уверенный', uz: 'Yaxshi', en: 'Advanced' },
  5: { ru: 'Эксперт', uz: 'Ekspert', en: 'Expert' },
};

export function getSkillLevelName(level: number | undefined, lang: Lang): string {
  if (!level) return '';
  return SKILL_LEVEL_NAMES[level]?.[lang] || SKILL_LEVEL_NAMES[level]?.ru || '';
}
