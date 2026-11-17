import { z } from 'zod';

export const Lang = z.enum(['ru', 'uz', 'en']);
export type Lang = z.infer<typeof Lang>;

export const TemplateId = z.enum(['classic', 'modern', 'minimal', 'creative', 'ats']);
export type TemplateId = z.infer<typeof TemplateId>;

export const SectionKey = z.enum([
  'summary',
  'strengths',
  'experience',
  'projects',
  'education',
  'skills',
  'languages',
]);
export type SectionKey = z.infer<typeof SectionKey>;

export const EducationLevel = z.enum([
  'secondary',
  'vocational',
  'bachelor',
  'master',
  'course',
  'certificate',
]);
export type EducationLevel = z.infer<typeof EducationLevel>;

export const LangLevel = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']);
export type LangLevel = z.infer<typeof LangLevel>;

export const yearMonthRegex = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isAgeBetween(birthDateStr: string, minAge: number, maxAge: number): boolean {
  const birth = new Date(birthDateStr);
  if (isNaN(birth.getTime())) return false;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return age >= minAge && age <= maxAge;
}

export const PersonalSchema = z.object({
  fullName: z.string().trim().min(2, 'Минимум 2 символа').max(80, 'Максимум 80 символов'),
  position: z.string().trim().min(2, 'Минимум 2 символа').max(100, 'Максимум 100 символов'),
  birthDate: z.string().optional(), // YYYY-MM-DD
  showAge: z.boolean().default(false),
  hideBirthDate: z.boolean().default(false),
  city: z.string().trim().max(60).optional(),
  photoKey: z.string().optional(),
  photoUrl: z.string().optional(),
});
export type Personal = z.infer<typeof PersonalSchema>;

export const ContactsSchema = z.object({
  phone: z.string().trim().min(5, 'Укажите телефон'),
  email: z.string().trim().email('Некорректный email').max(120),
  telegram: z.string().trim().regex(/^@?[a-zA-Z0-9_]{4,32}$/, 'Некорректный ник Telegram').optional().or(z.literal('')),
  linkedin: z.string().trim().url('Некорректная ссылка').optional().or(z.literal('')),
  website: z.string().trim().url('Некорректная ссылка').optional().or(z.literal('')),
});
export type Contacts = z.infer<typeof ContactsSchema>;

export const ExperienceItem = z.object({
  id: z.string(),
  company: z.string().trim().min(1, 'Укажите компанию').max(100),
  role: z.string().trim().min(1, 'Укажите должность').max(100),
  startDate: z.string().regex(yearMonthRegex, 'Формат ГГГГ-ММ'),
  endDate: z.string().regex(yearMonthRegex, 'Формат ГГГГ-ММ').nullable(),
  rawDescription: z.string().max(1500, 'Максимум 1500 символов'),
  aiBullets: z.array(z.string().max(250)).max(6).optional(),
  highlights: z.array(z.number().int().min(0)).optional(),
  useAi: z.boolean().default(true),
  notes: z.array(z.string()).optional(),
  diffMode: z.boolean().optional(),
});
export type ExperienceItem = z.infer<typeof ExperienceItem>;

export const ProjectItem = z.object({
  id: z.string(),
  name: z.string().trim().min(1, 'Укажите название проекта').max(100),
  link: z.string().url('Некорректная ссылка').optional().or(z.literal('')),
  rawDescription: z.string().max(1000),
  aiBullets: z.array(z.string().max(250)).max(5).optional(),
  useAi: z.boolean().default(true),
});
export type ProjectItem = z.infer<typeof ProjectItem>;

export const EducationItem = z.object({
  id: z.string(),
  institution: z.string().trim().min(1, 'Укажите учебное заведение').max(150),
  specialty: z.string().trim().min(1, 'Укажите специальность').max(150),
  level: EducationLevel.default('bachelor'),
  graduationYear: z.number().int().min(1960).max(2040),
});
export type EducationItem = z.infer<typeof EducationItem>;

export const SkillsSchema = z.object({
  hard: z.array(z.object({
    name: z.string().trim().min(1).max(40),
    level: z.number().int().min(1).max(5).optional(),
  })).max(30),
  soft: z.array(z.string().trim().min(1).max(40)).max(15),
  languages: z.array(z.object({
    name: z.string().trim().min(1).max(30),
    level: LangLevel,
  })).max(8),
});
export type Skills = z.infer<typeof SkillsSchema>;

export const AiSchema = z.object({
  summary: z.string().max(700).optional(),
  strengths: z.array(z.object({
    title: z.string().max(60),
    evidence: z.string().max(200),
  })).max(5).optional(),
  tone: z.enum(['neutral', 'confident', 'creative']).default('neutral'),
  generatedAt: z.string().optional(),
  inputHash: z.string().optional(),
});
export type Ai = z.infer<typeof AiSchema>;

export const DesignSchema = z.object({
  templateId: TemplateId.default('modern'),
  themeId: z.string().default('blue'),
  customAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  font: z.enum(['inter', 'roboto', 'pt', 'montserrat']).default('inter'),
  fontSize: z.enum(['S', 'M', 'L']).default('M'),
  sectionOrder: z.array(SectionKey),
  hiddenSections: z.array(SectionKey).default([]),
});
export type Design = z.infer<typeof DesignSchema>;

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'summary',
  'strengths',
  'experience',
  'projects',
  'education',
  'skills',
  'languages',
];

export const ResumeDataSchema = z.object({
  id: z.string(),
  schemaVersion: z.literal(1),
  language: Lang.default('ru'),
  noExperience: z.boolean().default(false),
  personal: PersonalSchema,
  contacts: ContactsSchema,
  experience: z.array(ExperienceItem).max(15),
  projects: z.array(ProjectItem).max(10),
  education: z.array(EducationItem).max(10),
  skills: SkillsSchema,
  ai: AiSchema,
  design: DesignSchema,
  updatedAt: z.string(),
});
export type ResumeData = z.infer<typeof ResumeDataSchema>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? U[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export function createDefaultResumeData(id?: string, lang: Lang = 'ru'): ResumeData {
  return {
    id: id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `res_${Date.now()}`),
    schemaVersion: 1,
    language: lang,
    noExperience: false,
    personal: {
      fullName: '',
      position: '',
      birthDate: '',
      showAge: false,
      hideBirthDate: false,
      city: '',
      photoKey: '',
      photoUrl: '',
    },
    contacts: {
      phone: '',
      email: '',
      telegram: '',
      linkedin: '',
      website: '',
    },
    experience: [],
    projects: [],
    education: [],
    skills: {
      hard: [],
      soft: [],
      languages: [],
    },
    ai: {
      tone: 'neutral',
    },
    design: {
      templateId: 'modern',
      themeId: 'blue',
      font: 'inter',
      fontSize: 'M',
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      hiddenSections: [],
    },
    updatedAt: new Date().toISOString(),
  };
}

export function createSampleResumeData(): ResumeData {
  return {
    id: 'sample-resume-preview',
    schemaVersion: 1,
    language: 'ru',
    noExperience: false,
    personal: {
      fullName: 'Иван Петров',
      position: 'Frontend TeamLead',
      birthDate: '1995-06-15',
      showAge: true,
      hideBirthDate: false,
      city: 'Ташкент',
      photoUrl: '',
    },
    contacts: {
      phone: '+998 90 123 45 67',
      email: 'ivan.petrov@example.com',
      telegram: '@ivan_dev',
      linkedin: 'https://linkedin.com/in/ivan-petrov',
      website: 'https://ivanpetrov.dev',
    },
    experience: [
      {
        id: 'exp-1',
        company: 'Saber Publisher',
        role: 'Frontend TeamLead',
        startDate: '2022-03',
        endDate: null,
        rawDescription: 'Руковожу командой из 4 человек, перевели сайт журнала на Next.js, ускорили загрузку в 3 раза, внедрили дизайн-систему.',
        aiBullets: [
          'Руководил инженерной командой из 4 разработчиков, выстроив процессы код-ревью и тестирования',
          'Перевёл сайт цифрового издания на стек Next.js и TypeScript',
          'Ускорил загрузку ключевых страниц в 3 раза за счёт серверного рендеринга и оптимизации ассетов',
          'Разработал и внедрил внутреннюю UI-библиотеку компонентов, сократив время сборки экранов на 40%',
        ],
        highlights: [0, 2],
        useAi: true,
        notes: ['перевёл в достижения', 'цифры взяты из вашего текста'],
      },
      {
        id: 'exp-2',
        company: 'Digital Solutions Lab',
        role: 'Senior Frontend Developer',
        startDate: '2019-09',
        endDate: '2022-02',
        rawDescription: 'Разработка SPA на React и Redux, интеграция с REST API, рефакторинг монолитного клиентского приложения.',
        aiBullets: [
          'Проектировал и разрабатывал клиентскую архитектуру высоконагруженных SPA-сервисов на React',
          'Оптимизировал взаимодействие с REST API и кэширование данных',
          'Провёл рефакторинг легаси-модулей, повысив стабильность работы клиентского приложения',
        ],
        highlights: [0],
        useAi: true,
        notes: ['уточнил формулировки'],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        name: 'Design System & UI Kit',
        link: 'https://github.com/example/ui-kit',
        rawDescription: 'Открытая библиотека доступных React-компонентов с поддержкой тем оформления и WCAG 2.1.',
        aiBullets: [
          'Спроектировал модульный UI-кит с поддержкой светлой и тёмной тем и строгой типизацией',
          'Обеспечил соответствие стандартам доступности WCAG 2.1 AA',
        ],
        useAi: true,
      },
    ],
    education: [
      {
        id: 'edu-1',
        institution: 'Ташкентский университет информационных технологий',
        specialty: 'Программная инженерия',
        level: 'bachelor',
        graduationYear: 2017,
      },
    ],
    skills: {
      hard: [
        { name: 'TypeScript', level: 5 },
        { name: 'React', level: 5 },
        { name: 'Next.js', level: 4 },
        { name: 'Node.js', level: 4 },
        { name: 'Tailwind CSS', level: 5 },
        { name: 'REST API', level: 5 },
        { name: 'Git', level: 4 },
        { name: 'CI/CD', level: 3 },
      ],
      soft: [
        'Управление командой',
        'Наставничество',
        'Фасилитация встреч',
        'Деловая переписка',
      ],
      languages: [
        { name: 'Русский', level: 'native' },
        { name: 'Узбекский', level: 'C1' },
        { name: 'Английский', level: 'B2' },
      ],
    },
    ai: {
      summary: 'Frontend-руководитель с опытом более 6 лет в проектировании и масштабировании веб-приложений. Специализируюсь на React, Next.js и современной веб-производительности. Успешно сформировал и ведёт команду разработки, сократив сроки релизов и повысив скорость работы продуктов.',
      strengths: [
        { title: 'Техническое лидерство', evidence: 'Руководство инженерной командой и выстраивание стандартов качества' },
        { title: 'Оптимизация производительности', evidence: 'Трёхкратное ускорение загрузки цифрового издания' },
        { title: 'Архитектурный подход', evidence: 'Внедрение дизайн-системы и перевод легаси-монолита на современный стек' },
      ],
      tone: 'confident',
      generatedAt: new Date().toISOString(),
    },
    design: {
      templateId: 'modern',
      themeId: 'blue',
      font: 'inter',
      fontSize: 'M',
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      hiddenSections: [],
    },
    updatedAt: new Date().toISOString(),
  };
}
