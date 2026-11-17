import { Lang } from '@cvb/shared';

export interface PromptInput {
  targetPosition: string;
  language: Lang;
  tone: 'neutral' | 'confident' | 'creative';
  noExperience: boolean;
  experience: Array<{
    ref: string;
    company: string;
    role: string;
    period: string;
    raw: string;
  }>;
  projects: Array<{
    ref: string;
    name: string;
    raw: string;
  }>;
  education: Array<{
    institution: string;
    specialty: string;
    level: string;
    year: number;
  }>;
  skills: {
    hard: string[];
    soft: string[];
  };
}

const TONE_DESCRIPTIONS = {
  neutral: 'Сдержанный, фактический, без оценочных эпитетов',
  confident: 'Уверенный, акцент на результатах и ответственности, активные глаголы действия',
  creative: 'Живой, с характером, допускается одна яркая точная формулировка в summary; без сленга и клише',
};

const LANGUAGE_NAMES: Record<Lang, string> = {
  ru: 'Русский',
  uz: 'O‘zbek tili (lotin alifbosi)',
  en: 'English',
};

export function buildSystemPrompt(input: PromptInput): string {
  const langName = LANGUAGE_NAMES[input.language] || 'Русский';
  const toneDesc = TONE_DESCRIPTIONS[input.tone] || TONE_DESCRIPTIONS.neutral;

  return `Ты — профессиональный карьерный консультант и редактор резюме.
Твоя задача — переписать данные кандидата в сильное, честное резюме без лишних слов.

ЖЁСТКИЕ ПРАВИЛА:
1. Используй ТОЛЬКО факты из входных данных. Запрещено добавлять компании, технологии, проекты, должности, сроки, цифры и проценты, которых нет во входе.
2. Если во входе нет цифр — пиши без цифр. Не пиши «на X%» и не используй заглушки.
3. Пиши на языке: ${langName}. Для узбекского — латиница (O‘zbek lotin alifbosi), с апострофом ‘ в o‘, g‘.
4. Деловой стиль. Без местоимения «я». Без клише: «коммуникабельный», «стрессоустойчивый», «ответственный», «целеустремлённый», «быстро обучаюсь», «командный игрок».
5. Тон: ${toneDesc}.
6. Делай акцент на том, что релевантно целевой должности: «${input.targetPosition}».
7. СТРОГИЙ ЗАПРЕТ СЛОПА И ШАБЛОННЫХ ОБОРОТОВ:
   - Не используй фразы: «в динамичной среде», «высококвалифицированный», «результативный», «играл ключевую роль», «внёс значительный вклад», «широкий спектр», «эффективно», «успешно», «с нуля», «страстный», «увлечённый своим делом», «нацелен на результат», «уверенный пользователь ПК», «гибкие навыки», «обладаю», «способствовал», «отвечал за».
   - Не используй конструкцию «не только..., но и...».
   - Не используй больше одного тире на пункт.
   - Избегай перечислений из трёх прилагательных подряд.
   - Разнообразь первые глаголы пунктов (не начинай все пункты одним и тем же глаголом).

ФОРМАТ БЛОКОВ:
- summary: 3–5 предложений, 300–600 символов. Кто кандидат, ключевой опыт, главная ценность для работодателя на целевой должности.
- experience: для каждого ref — 2–5 пунктов. Каждый пункт: глагол действия в прошедшем времени + что сделано + результат (если есть во входе). Не более 180 символов. highlights — индексы 1–2 самых сильных пунктов.
- projects: аналогично, 2–4 пункта.
- strengths: 3–5 сильных сторон. title — 2–5 слов; evidence — одно предложение, ссылающееся на конкретный факт из опыта, проектов или образования.

Если данных мало — пиши кратко, но не выдумывай.
Ответ — строго через инструмент submit_resume.`;
}

export const SUBMIT_RESUME_TOOL = {
  name: 'submit_resume',
  description: 'Отправить отредактированные секции резюме',
  input_schema: {
    type: 'object',
    required: ['summary', 'experience', 'projects', 'strengths'],
    properties: {
      summary: { type: 'string', description: 'Краткое резюме о себе, 300-600 знаков' },
      experience: {
        type: 'array',
        items: {
          type: 'object',
          required: ['ref', 'bullets', 'highlights'],
          properties: {
            ref: { type: 'string' },
            bullets: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 6 },
            highlights: { type: 'array', items: { type: 'integer' } },
          },
        },
      },
      projects: {
        type: 'array',
        items: {
          type: 'object',
          required: ['ref', 'bullets'],
          properties: {
            ref: { type: 'string' },
            bullets: { type: 'array', items: { type: 'string' }, minItems: 1, maxItems: 5 },
          },
        },
      },
      strengths: {
        type: 'array',
        minItems: 1,
        maxItems: 5,
        items: {
          type: 'object',
          required: ['title', 'evidence'],
          properties: {
            title: { type: 'string' },
            evidence: { type: 'string' },
          },
        },
      },
    },
  },
};
