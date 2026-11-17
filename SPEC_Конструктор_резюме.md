# SPEC: Конструктор резюме с ИИ (CV Builder AI)

| Поле | Значение |
|---|---|
| Версия | 1.0 |
| Дата | 17.11.2026 |
| Основа | PRD «Конструктор резюме» v1.0 |
| Статус | Черновик к реализации MVP |
| Автор | Руслан Абджемилов |

> Документ описывает **как** реализуется продукт. Требования (**что** и **зачем**) — в PRD. Ссылки вида `FR-n` указывают на функциональные требования PRD.

---

## 0. Принятые допущения

Открытые вопросы PRD закрыты в SPEC следующими допущениями (меняются без переделки архитектуры):

| # | Вопрос PRD | Допущение для MVP |
|---|---|---|
| 1 | Монетизация | Бесплатно с лимитами. Поле `plan` в `users` заложено на будущее |
| 2 | Регистрация для скачивания | Не нужна. Анонимная сессия по cookie; регистрация — для облачного сохранения и доступа с других устройств |
| 3 | Водяной знак | Нет |
| 4 | Хранение ПДн | Сервер и хранилище в Узбекистане (VPS + MinIO). Внешний ИИ-API получает только текст резюме, без фото и контактов |
| 5 | Адаптация под вакансию | v1.1 |

---

## 1. Архитектура

### 1.1. Схема

```
┌──────────────────────────┐        ┌──────────────────────────────────────┐
│  Browser (React SPA)     │ HTTPS  │  Nginx (TLS, gzip, static, rate limit)│
│  - Форма + превью        ├───────►│                                      │
│  - Шаблоны (общие с SSR) │        └───────┬───────────────────┬──────────┘
└──────────────────────────┘                │ /api              │ /
                                            ▼                   ▼
                              ┌──────────────────────┐   static (dist/)
                              │  API (Node/Fastify)  │
                              │  - REST + SSE        │
                              │  - Auth, Resumes     │──────► Claude API
                              │  - AI orchestration  │
                              └───┬──────────┬───────┘
                                  │          │ BullMQ
                         Postgres │          ▼
                                  │   ┌──────────────────────┐
                                  │   │ Export worker        │
                                  │   │ Puppeteer pool       │──► /render/:id (SPA route)
                                  │   └─────────┬────────────┘
                                  ▼             ▼
                             PostgreSQL 16   MinIO (S3)     Redis 7
                                             фото, экспорт  очередь, лимиты, сессии
```

### 1.2. Стек

| Слой | Технология | Версия |
|---|---|---|
| Монорепо | pnpm workspaces + Turborepo | pnpm 9 |
| Frontend | React 19, TypeScript 5.6, Vite 6 | — |
| Состояние | Zustand (+ persist), TanStack Query | — |
| Формы | React Hook Form + Zod | — |
| Стили | Tailwind 4 (UI конструктора), CSS Modules + CSS-переменные (шаблоны резюме) | — |
| DnD | dnd-kit | — |
| Кроп фото | react-easy-crop | — |
| Backend | Node 22 LTS, Fastify 5, TypeScript | — |
| ORM | Drizzle ORM + drizzle-kit (миграции) | — |
| БД | PostgreSQL 16 | — |
| Очередь / кэш | Redis 7, BullMQ | — |
| Файлы | MinIO (S3 API), sharp (обработка фото) | — |
| PDF/PNG | Puppeteer 23 + puppeteer-cluster | — |
| ИИ | `@anthropic-ai/sdk` | — |
| i18n | i18next (UI) | — |
| Тесты | Vitest, Testing Library, Playwright (E2E + визуальные снимки) | — |
| Логи / мониторинг | pino, Sentry | — |
| Деплой | Docker Compose, Nginx, GitHub Actions | — |

### 1.3. Структура репозитория

```
cv-builder/
├── apps/
│   ├── web/                    # React SPA
│   │   ├── src/
│   │   │   ├── app/            # роутинг, провайдеры
│   │   │   ├── features/
│   │   │   │   ├── wizard/     # шаги формы
│   │   │   │   ├── ai/         # кнопки генерации, diff, стриминг
│   │   │   │   ├── design/     # шаблон, тема, шрифт, секции
│   │   │   │   ├── preview/    # живое превью, переключатель desktop/mobile
│   │   │   │   └── export/     # модалка скачивания
│   │   │   ├── pages/
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── Editor.tsx
│   │   │   │   └── Render.tsx  # служебный роут для Puppeteer
│   │   │   ├── store/resume.ts
│   │   │   └── lib/api.ts
│   │   └── vite.config.ts
│   ├── api/                    # Fastify
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── resumes/
│   │   │   │   ├── photos/
│   │   │   │   ├── ai/
│   │   │   │   └── export/
│   │   │   ├── db/schema.ts
│   │   │   ├── plugins/        # session, rateLimit, errors
│   │   │   └── server.ts
│   │   └── drizzle/            # миграции
│   └── worker/                 # Export worker (Puppeteer)
│       └── src/index.ts
├── packages/
│   ├── shared/                 # Zod-схемы, типы ResumeData, константы, коды ошибок
│   ├── templates/              # React-компоненты шаблонов + темы (используются web и Render)
│   └── ai-prompts/             # системные промпты, JSON-схемы ответов
├── docker/
│   ├── docker-compose.yml
│   └── nginx.conf
└── turbo.json
```

**Принцип:** `packages/templates` — единственный источник вёрстки резюме. Превью в редакторе и рендер для экспорта используют один и тот же компонент, поэтому PDF совпадает с превью.

---

## 2. Модель данных

### 2.1. Zod-схема `ResumeData` (`packages/shared/src/resume.ts`)

```ts
import { z } from 'zod';

export const Lang = z.enum(['ru', 'uz', 'en']);
export const TemplateId = z.enum(['classic', 'modern', 'minimal', 'creative', 'ats']);
export const SectionKey = z.enum([
  'summary', 'strengths', 'experience', 'projects', 'education', 'skills', 'languages',
]);
export const EducationLevel = z.enum([
  'secondary', 'vocational', 'bachelor', 'master', 'course', 'certificate',
]);
export const LangLevel = z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native']);

const yearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);
const id = z.string().uuid();

export const PersonalSchema = z.object({
  fullName: z.string().trim().min(2).max(80),
  position: z.string().trim().min(2).max(100),
  birthDate: z.string().date().optional(),          // YYYY-MM-DD
  showAge: z.boolean().default(false),
  hideBirthDate: z.boolean().default(false),
  city: z.string().trim().max(60).optional(),
  photoKey: z.string().optional(),                   // ключ в S3
}).refine(p => !p.birthDate || isAgeBetween(p.birthDate, 14, 80), {
  path: ['birthDate'], message: 'AGE_OUT_OF_RANGE',
});

export const ContactsSchema = z.object({
  phone: z.string().regex(/^\+\d{7,15}$/),          // E.164
  email: z.string().email().max(120),
  telegram: z.string().regex(/^@?[a-zA-Z0-9_]{5,32}$/).optional(),
  linkedin: z.string().url().regex(/linkedin\.com/).optional(),
  website: z.string().url().optional(),
});

export const ExperienceItem = z.object({
  id,
  company: z.string().trim().min(1).max(100),
  role: z.string().trim().min(1).max(100),
  startDate: yearMonth,
  endDate: yearMonth.nullable(),                     // null = по настоящее время
  rawDescription: z.string().max(1500),
  aiBullets: z.array(z.string().max(220)).max(6).optional(),
  highlights: z.array(z.number().int().min(0)).optional(),
  useAi: z.boolean().default(true),                  // показывать AI-версию или raw
}).refine(e => !e.endDate || e.endDate >= e.startDate, {
  path: ['endDate'], message: 'END_BEFORE_START',
});

export const ProjectItem = z.object({
  id,
  name: z.string().trim().min(1).max(100),
  link: z.string().url().optional(),
  rawDescription: z.string().max(1000),
  aiBullets: z.array(z.string().max(220)).max(5).optional(),
});

export const EducationItem = z.object({
  id,
  institution: z.string().trim().min(1).max(150),
  specialty: z.string().trim().min(1).max(150),
  level: EducationLevel,
  graduationYear: z.number().int().min(1960).max(2040),
});

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

export const AiSchema = z.object({
  summary: z.string().max(700).optional(),
  strengths: z.array(z.object({
    title: z.string().max(60),
    evidence: z.string().max(200),
  })).max(5).optional(),
  tone: z.enum(['neutral', 'confident', 'creative']).default('neutral'),
  generatedAt: z.string().datetime().optional(),
  inputHash: z.string().optional(),                  // для кэша / определения «устарело»
});

export const DesignSchema = z.object({
  templateId: TemplateId.default('modern'),
  themeId: z.string().default('blue'),
  customAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  font: z.enum(['inter', 'roboto', 'pt', 'montserrat']).default('inter'),
  fontSize: z.enum(['S', 'M', 'L']).default('M'),
  sectionOrder: z.array(SectionKey),
  hiddenSections: z.array(SectionKey).default([]),
});

export const ResumeDataSchema = z.object({
  id,
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
  updatedAt: z.string().datetime(),
});

export type ResumeData = z.infer<typeof ResumeDataSchema>;
```

**Черновик и финал.** В черновике все поля необязательны: для автосохранения используется `ResumeDataSchema.deepPartial()`. Полная схема проверяется при ИИ-генерации (нужен минимум данных) и при экспорте.

**Минимум для ИИ-генерации:** `personal.position` и хотя бы одно из `experience[].rawDescription`, `projects[].rawDescription` или `skills.hard`.

### 2.2. Схема БД (PostgreSQL, Drizzle)

```sql
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         citext UNIQUE,
  telegram_id   bigint UNIQUE,
  google_sub    text UNIQUE,
  plan          text NOT NULL DEFAULT 'free',
  ui_lang       text NOT NULL DEFAULT 'ru',
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- Сессия: анонимная или привязанная к пользователю
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid REFERENCES users(id) ON DELETE CASCADE,
  token_hash    text NOT NULL UNIQUE,          -- sha256 от cookie-токена
  created_at    timestamptz NOT NULL DEFAULT now(),
  expires_at    timestamptz NOT NULL
);

CREATE TABLE resumes (
  id            uuid PRIMARY KEY,
  owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  owner_session uuid REFERENCES sessions(id) ON DELETE SET NULL,
  title         text NOT NULL DEFAULT 'Моё резюме',
  data          jsonb NOT NULL,                -- ResumeData
  version       integer NOT NULL DEFAULT 1,    -- оптимистичная блокировка
  public_slug   text UNIQUE,                   -- v1.1, FR-19
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CHECK (owner_user_id IS NOT NULL OR owner_session IS NOT NULL)
);
CREATE INDEX resumes_owner_user_idx    ON resumes(owner_user_id);
CREATE INDEX resumes_owner_session_idx ON resumes(owner_session);

CREATE TABLE ai_generations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id     uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  block         text NOT NULL,      -- full | summary | experience | strengths | skills | check
  model         text NOT NULL,
  input_tokens  integer,
  output_tokens integer,
  latency_ms    integer,
  status        text NOT NULL,      -- ok | invalid_output | provider_error | rejected_facts
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX ai_gen_resume_day_idx ON ai_generations(resume_id, created_at);

CREATE TABLE exports (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id     uuid NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
  format        text NOT NULL,      -- pdf-desktop | pdf-mobile | png-mobile
  status        text NOT NULL,      -- queued | processing | done | failed
  file_key      text,
  size_bytes    integer,
  duration_ms   integer,
  error         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_codes (               -- вход по email-коду
  email         citext NOT NULL,
  code_hash     text NOT NULL,
  attempts      smallint NOT NULL DEFAULT 0,
  expires_at    timestamptz NOT NULL,
  PRIMARY KEY (email)
);
```

**Миграция схемы JSON:** поле `schemaVersion` в `data`. При чтении данные проходят через `migrateResume(data)` в `packages/shared`, которая поднимает их до актуальной версии.

**Очистка:** анонимные резюме без активности дольше 30 дней удаляет ночной cron вместе с файлами в S3. Файлы экспорта удаляются через 24 часа (lifecycle-правило бакета `exports`).

### 2.3. Хранилище файлов (MinIO)

| Бакет | Ключ | Доступ | Срок хранения |
|---|---|---|---|
| `photos` | `{resumeId}/{uuid}.webp` | приватный, presigned GET 1 ч | пока жив `resume` |
| `exports` | `{resumeId}/{exportId}.{pdf\|png}` | приватный, presigned GET 15 мин | 24 ч |

---

## 3. API

### 3.1. Общие правила

- База: `/api/v1`. JSON, `Content-Type: application/json` (кроме загрузки фото — `multipart/form-data`).
- Аутентификация: httpOnly cookie `sid` (Secure, SameSite=Lax, 90 дней). Сессию создаёт первый запрос к `/api/v1/session`; она бывает анонимной или привязанной к пользователю.
- CSRF: заголовок `X-Requested-With: cvb` для всех методов, изменяющих данные, плюс проверка `Origin`.
- Доступ к резюме: запрос проходит, если `owner_user_id` совпадает с пользователем сессии или `owner_session` — с самой сессией.
- Формат ошибки:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "…", "details": [{ "path": "contacts.email", "code": "invalid_string" }] } }
```

### 3.2. Коды ошибок (`packages/shared/src/errors.ts`)

| Код | HTTP | Когда |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Данные не прошли Zod |
| `AI_INSUFFICIENT_INPUT` | 400 | Нет минимума данных для генерации |
| `UNAUTHORIZED` | 401 | Нет сессии |
| `FORBIDDEN` | 403 | Чужое резюме |
| `NOT_FOUND` | 404 | — |
| `VERSION_CONFLICT` | 409 | Устаревший `version` при PATCH |
| `PAYLOAD_TOO_LARGE` | 413 | Фото > 5 МБ |
| `UNSUPPORTED_MEDIA` | 415 | Не JPG/PNG/WEBP |
| `AI_LIMIT_REACHED` | 429 | > 20 генераций на резюме в сутки |
| `RATE_LIMITED` | 429 | Общий rate limit |
| `AI_PROVIDER_ERROR` | 502 | Claude API недоступен / таймаут |
| `AI_INVALID_OUTPUT` | 502 | Ответ ИИ не прошёл валидацию после повтора |
| `EXPORT_FAILED` | 500 | Ошибка рендера |

### 3.3. Эндпоинты

#### Сессия и авторизация

| Метод | Путь | Тело / ответ |
|---|---|---|
| `POST` | `/session` | → `{ userId: string \| null, isAnonymous: boolean }`. Создаёт анонимную сессию, если её нет |
| `POST` | `/auth/email/request` | `{ email }` → `204`. Код из 6 цифр, TTL 10 мин, не больше 5 запросов в час на email |
| `POST` | `/auth/email/verify` | `{ email, code }` → `{ userId }`. Не больше 5 попыток. **Анонимные резюме сессии переносятся на пользователя** |
| `POST` | `/auth/telegram` | данные Telegram Login Widget → `{ userId }`, проверка HMAC по bot token |
| `GET` | `/auth/google/callback` | OAuth 2.0 PKCE |
| `POST` | `/auth/logout` | → `204` |
| `DELETE` | `/me` | → `204`. Удаление аккаунта, резюме и файлов (жёсткое удаление в течение 24 ч) |

#### Резюме

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| `GET` | `/resumes` | — | `[{ id, title, updatedAt, templateId, thumbnailUrl? }]` |
| `POST` | `/resumes` | `{ language?: Lang }` | `201 { id, version, data }`. `data` заполнен значениями по умолчанию |
| `GET` | `/resumes/:id` | — | `{ id, version, data, photoUrl? }` |
| `PATCH` | `/resumes/:id` | `{ version, patch: DeepPartial<ResumeData> }` | `{ version }` |
| `DELETE` | `/resumes/:id` | — | `204` |
| `POST` | `/resumes/:id/duplicate` | — | `201 { id }` |

**PATCH — правила слияния:**
- объекты сливаются глубоко;
- массивы (`experience`, `education`, `projects`, `skills.*`, `design.sectionOrder`) **заменяются целиком**: клиент всегда шлёт массив полностью;
- результат проверяется через `deepPartial()` и сохраняется с `version = version + 1`;
- если `version` не совпадает, сервер возвращает `409` с актуальными `{ version, data }`. Клиент повторяет слияние на своей стороне (последняя запись побеждает по каждому полю) и отправляет снова.

#### Фото

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| `POST` | `/resumes/:id/photo` | multipart: `file` (уже обрезанный на клиенте, ≤ 5 МБ) | `{ photoKey, photoUrl }` |
| `DELETE` | `/resumes/:id/photo` | — | `204` |

Обработка на сервере (sharp): проверка magic bytes → `rotate()` по EXIF → удаление всех метаданных → resize 600×600 (cover) → WEBP q=82. Старое фото удаляется.

#### ИИ

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| `POST` | `/resumes/:id/ai/generate` | `{ tone?, language? }` | **SSE**-поток (см. 4.6) |
| `POST` | `/resumes/:id/ai/regenerate` | `{ block: 'summary' \| 'experience' \| 'strengths', itemId?: string, tone? }` | `{ result }` — JSON блока |
| `POST` | `/resumes/:id/ai/check` | — | `{ issues: CheckIssue[] }` (FR-13) |
| `GET` | `/resumes/:id/ai/usage` | — | `{ used: number, limit: 20, resetsAt }` |

Результат генерации **автоматически записывается** в `data.ai`, `experience[].aiBullets` и `projects[].aiBullets`. Исходный `rawDescription` при этом не меняется, поэтому кнопка «Вернуть исходный текст» просто ставит `useAi=false`.

#### Экспорт

| Метод | Путь | Тело | Ответ |
|---|---|---|---|
| `POST` | `/resumes/:id/export` | `{ format: 'pdf-desktop' \| 'pdf-mobile' \| 'png-mobile' }` | `202 { exportId }` |
| `GET` | `/exports/:exportId` | — | `{ status, url?, fileName?, error? }` |

Клиент опрашивает `GET /exports/:id` каждые 700 мс, максимум 20 с. Когда приходит `status: 'done'`, браузер скачивает `url` (presigned, `Content-Disposition: attachment; filename=…`).

**Дедупликация:** если файл с тем же `sha256(data + format)` уже экспортирован за последние 24 ч, сразу возвращается готовый `exportId`.

### 3.4. Rate limits (Redis, скользящее окно)

| Область | Лимит |
|---|---|
| Все запросы на IP | 300 / мин |
| `PATCH /resumes/:id` | 60 / мин на сессию |
| `POST /ai/*` | 20 / сутки на резюме, 60 / сутки на сессию, 10 / мин на IP |
| `POST /export` | 30 / час на сессию |
| `POST /resumes` | 20 / сутки на сессию |
| `POST /auth/email/request` | 5 / час на email, 20 / час на IP |

---

## 4. ИИ-модуль

### 4.1. Модели и задачи

| Задача | Модель | max_tokens | Таймаут |
|---|---|---|---|
| Нормализация и распределение навыков (FR-11) | `claude-haiku-5-5` | 800 | 15 с |
| Полная генерация: summary + опыт + проекты + сильные стороны (FR-8 — FR-10) | `claude-sonnet-5-5` | 4000 | 45 с |
| Перегенерация одного блока | `claude-sonnet-5-5` | 1500 | 25 с |
| Проверка полноты (FR-13) | `claude-haiku-5-5` | 800 | 15 с |

ID моделей задаются в env (`AI_MODEL_MAIN`, `AI_MODEL_FAST`) и не зашиваются в код.

### 4.2. Подготовка входа

1. Взять `ResumeData` и **убрать персональные данные**: контакты, фото, дату рождения и город не отправлять; `fullName` заменить на `"Кандидат"`.
2. Пустые `rawDescription` пропускаются.
3. Каждому пункту опыта присваивается короткий `ref` (`e1`, `e2`, `p1`…), чтобы сопоставлять ответ без UUID.
4. `inputHash = sha256(JSON входа + tone + language)`. Если хэш совпадает с `data.ai.inputHash`, генерация не запускается и возвращается кэш (без списания лимита).

Пример отправляемого входа:

```json
{
  "targetPosition": "Frontend-разработчик",
  "language": "ru",
  "tone": "confident",
  "noExperience": false,
  "experience": [
    { "ref": "e1", "company": "Saber Publisher", "role": "TeamLead", "period": "2022-03 — н.в.",
      "raw": "руковожу командой из 4 человек, сделали сайт журнала на next, ускорили загрузку в 3 раза" }
  ],
  "projects": [],
  "education": [{ "institution": "ТУИТ", "specialty": "Программная инженерия", "level": "bachelor", "year": 2020 }],
  "skills": { "hard": ["React", "TypeScript", "Next.js"], "soft": ["Наставничество"] }
}
```

### 4.3. Системный промпт (полная генерация) — `packages/ai-prompts/generate.ts`

```text
Ты — профессиональный карьерный консультант и редактор резюме.
Твоя задача — переписать данные кандидата в сильное, честное резюме.

ЖЁСТКИЕ ПРАВИЛА:
1. Используй ТОЛЬКО факты из входных данных. Запрещено добавлять компании, технологии,
   проекты, должности, сроки, цифры и проценты, которых нет во входе.
2. Если во входе нет цифр — пиши без цифр. Не пиши «на X%» и не используй заглушки.
3. Пиши на языке: {{language_name}}. Для узбекского — латиница (O‘zbek lotin alifbosi).
4. Деловой стиль. Без местоимения «я». Без клише: «коммуникабельный», «стрессоустойчивый»,
   «ответственный», «целеустремлённый», «быстро обучаюсь».
5. Тон: {{tone_description}}.
6. Делай акцент на том, что релевантно целевой должности: «{{target_position}}».

ФОРМАТ БЛОКОВ:
- summary: 3–5 предложений, 300–600 символов. Кто кандидат, ключевой опыт, главная ценность
  для работодателя на целевой должности.
- experience: для каждого ref — 3–5 пунктов. Каждый пункт: глагол действия в прошедшем
  времени + что сделано + результат (если есть во входе). Не более 180 символов.
  highlights — индексы 1–2 самых сильных пунктов.
- projects: аналогично, 2–4 пункта.
- strengths: 3–5 сильных сторон. title — 2–5 слов; evidence — одно предложение,
  ссылающееся на конкретный факт из опыта, проектов или образования.

Если данных мало — пиши кратко, но не выдумывай.
Ответ — строго через инструмент `submit_resume`.
```

Значения `{{tone_description}}`:

| tone | Описание для промпта |
|---|---|
| `neutral` | Сдержанный, фактический, без оценочных эпитетов |
| `confident` | Уверенный, акцент на результатах и ответственности, активные глаголы |
| `creative` | Живой, с характером, допускается одна яркая формулировка в summary; без сленга |

### 4.4. Structured output (tool use)

Ответ запрашивается через принудительный вызов инструмента: `tool_choice: { type: 'tool', name: 'submit_resume' }`.

```json
{
  "name": "submit_resume",
  "input_schema": {
    "type": "object",
    "required": ["summary", "experience", "projects", "strengths"],
    "properties": {
      "summary": { "type": "string" },
      "experience": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["ref", "bullets", "highlights"],
          "properties": {
            "ref": { "type": "string" },
            "bullets": { "type": "array", "items": { "type": "string" }, "minItems": 1, "maxItems": 5 },
            "highlights": { "type": "array", "items": { "type": "integer" } }
          }
        }
      },
      "projects": { "type": "array", "items": { "$ref": "#/properties/experience/items" } },
      "strengths": {
        "type": "array", "minItems": 1, "maxItems": 5,
        "items": {
          "type": "object", "required": ["title", "evidence"],
          "properties": { "title": { "type": "string" }, "evidence": { "type": "string" } }
        }
      }
    }
  }
}
```

### 4.5. Пост-валидация (защита от выдуманных фактов)

Порядок проверок результата:

1. **Схема:** Zod-проверка ответа. `ref` должны совпадать с входными; лишние пункты отбрасываются, недостающие помечаются как ошибка.
2. **Длины:** `summary` ≤ 700, пункт ≤ 220. При превышении — обрезка по последнему предложению.
3. **Числа:** из каждого пункта извлекаются числа (`\d+([.,]\d+)?` и числительные «вдвое», «в три раза» → 2, 3). Каждое число должно встречаться во входе того же `ref` (для `summary` и `strengths` — во всём входе). Годы из периодов работы и образования разрешены.
4. **Сущности:** токены с заглавной буквы или латиницей длиной ≥ 3 (технологии, компании) сверяются со словарём входа (компании, навыки, учебные заведения, raw-тексты) с нормализацией регистра и транслитерации. Неизвестная сущность — нарушение.
5. **Язык:** быстрая эвристика по алфавиту (кириллица для `ru`, латиница для `uz`/`en`; для `uz` — наличие `o‘`, `g‘`, `sh`, `ch`).

**Реакция на нарушения:**
- нарушения в пунктах 1, 3 или 4 → **один повтор** запроса с добавленным сообщением: «Предыдущий ответ содержал факты, которых нет во входе: [список]. Исправь.»;
- повтор тоже с нарушениями → проблемные пункты удаляются, остальное возвращается, в `ai_generations.status` пишется `rejected_facts`, клиент получает предупреждение `warnings: ['SOME_ITEMS_REMOVED']`;
- ответ после повтора не проходит схему → `AI_INVALID_OUTPUT`.

### 4.6. SSE-протокол `POST /ai/generate`

`Content-Type: text/event-stream`. Валидация идёт по блокам, поэтому сервер отправляет каждый блок, как только он собран и проверен:

```
event: stage        data: {"stage":"skills"}
event: skills       data: {"hard":[...],"soft":[...]}
event: stage        data: {"stage":"content"}
event: summary      data: {"text":"..."}
event: experience   data: {"itemId":"<uuid>","bullets":[...],"highlights":[0]}
event: experience   data: {"itemId":"<uuid>","bullets":[...],"highlights":[1]}
event: strengths    data: {"items":[{"title":"...","evidence":"..."}]}
event: done         data: {"version":12,"warnings":[],"usage":{"used":3,"limit":20}}
event: error        data: {"code":"AI_PROVIDER_ERROR","message":"..."}
```

Реализация: стрим Anthropic (`messages.stream`) → накопление `input_json_delta` → инкрементальный парсер JSON (`partial-json`) → когда объект блока закрылся, по нему прогоняется валидация 4.5 и он уходит в SSE. Повтор при нарушениях выполняется в конце и заменяет только проблемные блоки (событие `experience` с тем же `itemId` перезаписывает предыдущее).

Перед закрытием потока результат сохраняется в БД с `version + 1`.

### 4.7. Нормализация навыков (Haiku)

Вход: `{ hard: string[], soft: string[], targetPosition }`. Выход (tool `submit_skills`):

```json
{ "hard": ["JavaScript", "React", "Git"], "soft": ["Наставничество"], "moved": [{"from":"hard","to":"soft","name":"Работа в команде"}] }
```

Правила: каноничное написание (`js` → `JavaScript`, `реакт` → `React`), удаление дублей, перенос навыка между hard и soft. **Новые навыки добавлять запрещено**: выход проверяется на то, что каждый навык есть во входе (после нормализации через словарь синонимов в `packages/shared/skills-dictionary.json`, ~1500 записей).

### 4.8. Проверка полноты (FR-13)

Сначала работают детерминированные правила (без ИИ, мгновенно):

| Код | Условие |
|---|---|
| `NO_CONTACT` | Нет ни телефона, ни email |
| `EXPERIENCE_TOO_SHORT` | `rawDescription` < 80 символов |
| `NO_RESULTS` | В пунктах опыта нет чисел и глаголов результата из словаря («увеличил», «сократил», «запустил»…) |
| `SUMMARY_MISSING` | Нет `ai.summary` |
| `AI_OUTDATED` | Хэш текущих данных ≠ `ai.inputHash` |
| `TOO_FEW_SKILLS` | Меньше 4 hard-навыков |
| `LONG_RESUME` | Desktop-версия получается больше 2 страниц |

Потом ИИ-проверка (Haiku) возвращает до 3 смысловых подсказок вида `{ code: 'AI_HINT', section, message }`.

```ts
type CheckIssue = { code: string; severity: 'info' | 'warning'; section: SectionKey | 'contacts'; itemId?: string; message: string };
```

### 4.9. Ошибки провайдера

- `429` / `529` / `5xx` от Claude → экспоненциальный повтор: 2 попытки, 1 с и 3 с.
- Таймауты по таблице 4.1.
- Неуспешные генерации **не списывают лимит** пользователя.
- Логируются модель, токены, задержка и статус (`ai_generations`). Тексты резюме в логи не пишутся.

---

## 5. Frontend

### 5.1. Маршруты

| Путь | Компонент | Описание |
|---|---|---|
| `/` | `Home` | Лендинг + «Создать резюме» + список своих резюме |
| `/r/:id/edit/:step?` | `Editor` | Конструктор; `step` ∈ `personal, contacts, experience, education, skills, design` |
| `/render/:id` | `Render` | Служебный: только шаблон, без UI. Query: `format`, `token` |
| `/login` | `Login` | — |

### 5.2. Хранилище состояния (`store/resume.ts`)

```ts
interface ResumeStore {
  data: ResumeData;
  serverVersion: number;
  dirtyPaths: Set<string>;               // что изменилось с последнего сохранения
  saveState: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  ai: { status: 'idle' | 'streaming' | 'error'; stage?: string; error?: AppError };
  previewMode: 'desktop' | 'mobile';

  update<P extends Path<ResumeData>>(path: P, value: PathValue<ResumeData, P>): void;
  addItem(section: 'experience' | 'education' | 'projects'): void;
  removeItem(section: …, id: string): void;
  reorder(section: …, from: number, to: number): void;
  applyAiEvent(e: AiSseEvent): void;
  revertAi(block: 'summary' | 'experience' | 'strengths', itemId?: string): void;
}
```

**Автосохранение (FR-7):**
1. `update` → данные пишутся в localStorage (`cvb:resume:{id}`) сразу.
2. Через debounce 1500 мс, но не реже чем раз в 3 с при непрерывном вводе, уходит `PATCH` с изменёнными ветками верхнего уровня.
3. Ответ `409` → слияние: серверное значение для полей вне `dirtyPaths` + локальное для полей внутри них, затем повтор.
4. Нет сети → `saveState='offline'`, очередь ждёт события `online`.
5. При открытии: если локальная копия новее серверной (`updatedAt`), появляется баннер «Восстановить несохранённые изменения?».

### 5.3. Мастер формы

- Каждый шаг — отдельная форма React Hook Form со своей Zod-схемой (подсхема `ResumeDataSchema`). Валидация `onBlur`, а при попытке уйти со шага ошибки только **показываются**: переход между шагами свободный (по PRD).
- Индикатор шага: ✓ заполнен / ! есть ошибки / ○ пусто.
- Списки опыта, образования и проектов: карточки со сворачиванием, dnd-kit для сортировки, «Удалить» с отменой (toast 5 с).
- Телефон: `libphonenumber-js`, страна по умолчанию UZ, хранение в E.164.
- Должность и навыки: автоподсказки из `packages/shared/positions.json` и `skills-dictionary.json` (поиск по префиксу и синонимам на клиенте, без сети).
- Дата рождения: три select (день / месяц / год) — на мобильных удобнее нативного date-picker.

### 5.4. Фото (FR-1)

1. `<input type="file" accept="image/jpeg,image/png,image/webp">`. Проверка размера ≤ 5 МБ и MIME на клиенте.
2. Модалка `react-easy-crop`: aspect 1:1, zoom 1–3, поворот на 90°. Маска — круг или квадрат, в зависимости от текущего шаблона (только визуально: хранится квадрат).
3. Обрезанный кадр рендерится в canvas 800×800 → `toBlob('image/webp', 0.9)` → `POST /photo`.
4. Шаблоны сами накладывают нужную форму (`border-radius`).

### 5.5. Превью

- Колонка справа (≥ 1024 px) или вкладка «Превью» (< 1024 px).
- Компонент `<ResumeRenderer data format="desktop|mobile" />` из `packages/templates`.
- Desktop-режим: лист A4 (`794×1123` CSS px при 96 dpi), масштабируется `transform: scale()` под ширину колонки, страницы разделены визуально (`PageBreaker`, см. 6.4).
- Mobile-режим: рамка телефона, ширина 390 px, непрерывная прокрутка.
- Перерисовка — через `useDeferredValue(data)`, чтобы ввод не тормозил (цель — ≤ 150 мс).

### 5.6. ИИ в интерфейсе

- Кнопка «✨ Сгенерировать с ИИ» доступна, если выполнен минимум (2.1); иначе tooltip с указанием, чего не хватает.
- Перед генерацией: popover с выбором тона и языка резюме.
- Во время генерации: блоки без результата показывают скелетон, пришедшие появляются с fade-in. Форма остаётся доступной.
- У каждого ИИ-блока в редакторе (шаг «Дизайн» и карточки опыта):
  - **Принять** — снимает отметку «новое»;
  - **Ещё вариант** — `POST /ai/regenerate` для блока;
  - **Редактировать** — inline-textarea; правка сохраняется в `aiBullets` / `summary`;
  - **Исходный текст** — `useAi=false` (для summary и strengths — скрыть секцию);
  - переключатель «Ваш текст ↔ ИИ» показывает diff (`diff-match-patch`, по словам).
- Счётчик «Осталось генераций: 17 из 20».

### 5.7. Модалка экспорта (FR-20)

```
┌─────────────────────────────────────────┐
│  Скачать резюме                         │
│                                         │
│  🖥  Для ПК          PDF · A4           │
│  📱  Для телефона    PDF · 1 страница   │
│  🖼  Картинка        PNG · 1080 px      │
│                                         │
│  ⚠ 2 подсказки по улучшению  [Показать] │
└─────────────────────────────────────────┘
```

При открытии модалки запускается `/ai/check` (параллельно с выбором формата, скачивание не блокирует).

Имя файла: `{FullNameTranslit}_{PositionTranslit}_CV[_mobile].{ext}`. Транслитерация — `packages/shared/translit.ts` (ГОСТ 7.79-2000 Б для кириллицы, `o‘` → `o`).

---

## 6. Шаблоны и темы

### 6.1. Контракт шаблона (`packages/templates`)

```ts
export interface TemplateProps {
  data: ResumeData;
  format: 'desktop' | 'mobile';
  photoUrl?: string;
  t: (key: SectionTitleKey) => string;     // заголовки секций на языке резюме
}

export interface TemplateDefinition {
  id: TemplateId;
  name: Record<Lang, string>;
  photo: 'none' | 'circle' | 'square' | 'optional';
  supportsSkillLevels: boolean;
  supportsThemes: 'full' | 'accent-only';  // ats → accent-only
  defaultSectionOrder: SectionKey[];
  Component: React.FC<TemplateProps>;
}

export const templates: Record<TemplateId, TemplateDefinition>;
```

Каждый шаблон собирается из общих секционных компонентов (`<Header>`, `<Summary>`, `<Experience>`, `<Skills>`…) с собственными CSS Modules. Порядок и видимость секций берутся из `design.sectionOrder` и `design.hiddenSections`.

**Заголовки секций** на трёх языках хранятся в `packages/templates/i18n.ts` и не зависят от языка интерфейса.

### 6.2. Раскладка по форматам

| Шаблон | Desktop | Mobile |
|---|---|---|
| Classic | 1 колонка | 1 колонка |
| Modern | Сайдбар 32% (фото, контакты, навыки, языки) + основная колонка | Шапка с фото → блок контактов-кнопок → навыки-чипсы → основной контент |
| Minimal | 1 колонка, заголовки секций слева (grid 25/75) | 1 колонка, заголовки над контентом |
| Creative | Цветная шапка на всю ширину + 2 колонки, шкалы навыков | Цветная шапка → 1 колонка, шкалы → чипсы с точками |
| ATS | 1 колонка, только текст, без иконок, таблиц и графики | 1 колонка |

Mobile-специфика всех шаблонов:
- контакты — крупные строки-кнопки высотой ≥ 44 px со ссылками `tel:`, `mailto:`, `https://t.me/…`, `linkedin`;
- основной текст ≥ 14 px, заголовки ≥ 18 px;
- без многоколоночных сеток.

Реализация: каждый шаблон получает `format` и меняет `data-format` на корневом элементе; различия задаются через CSS-селекторы `[data-format="mobile"]`. Отдельные компоненты на каждый формат не нужны.

### 6.3. Темы (FR-15)

```ts
export interface Theme {
  id: string;
  name: Record<Lang, string>;
  accent: string;          // базовый HEX
}

export const themes: Theme[] = [
  { id: 'blue',      accent: '#2563EB' },
  { id: 'emerald',   accent: '#059669' },
  { id: 'graphite',  accent: '#374151' },
  { id: 'burgundy',  accent: '#9F1239' },
  { id: 'violet',    accent: '#7C3AED' },
  { id: 'terracotta',accent: '#C2410C' },
  { id: 'teal',      accent: '#0F766E' },
  { id: 'mono',      accent: '#111111' },
];
```

**Генерация палитры** (`buildPalette(accent)`, в пространстве OKLCH через `culori`):

| CSS-переменная | Правило |
|---|---|
| `--accent` | исходный цвет; если контраст с белым < 4.5:1, L уменьшается шагами 0.02, пока не станет ≥ 4.5 |
| `--accent-strong` | L − 0.10 |
| `--accent-soft` | L = 0.96, C × 0.25 (фоны плашек, чипсы) |
| `--sidebar-bg` | L = 0.97, C × 0.15 (Modern) |
| `--header-bg` | `--accent` (Creative), текст на нём — белый или `#111`, что контрастнее |
| `--text` | `#111827` |
| `--muted` | `#4B5563` |
| `--bg` | `#FFFFFF` |
| `--rule` | `#E5E7EB` |

Переменные применяются инлайн-стилем на корне шаблона, поэтому смена темы не перерисовывает дерево. Для `customAccent` палитра строится так же. Если автокоррекцию пришлось применить, рядом с color picker показывается предупреждение: «Цвет затемнён для читаемости».

ATS: применяется только `--accent` к заголовкам секций, остальное монохромно.

### 6.4. Шрифты (FR-16)

| id | Заголовки | Текст | Подмножества |
|---|---|---|---|
| `inter` | Inter 700 | Inter 400/500 | cyrillic, latin, latin-ext |
| `roboto` | Roboto 700 | Roboto 400/500 | cyrillic, latin, latin-ext |
| `pt` | PT Serif 700 | PT Sans 400/700 | cyrillic, latin, latin-ext |
| `montserrat` | Montserrat 700 | Montserrat 400/500 | cyrillic, latin, latin-ext |

Шрифты лежат локально (`@fontsource/*`), WOFF2, `font-display: block` в `/render` (чтобы Puppeteer не снял страницу до загрузки шрифтов) и `swap` в редакторе. Узбекский апостроф `‘` (U+2018) и `ʻ` (U+02BB) есть во всех выбранных гарнитурах (проверить тестом).

Масштаб размеров:

| fontSize | Базовый (desktop) | Базовый (mobile) |
|---|---|---|
| S | 9.5 pt | 14 px |
| M | 10.5 pt | 15 px |
| L | 11.5 pt | 16 px |

### 6.5. Разбивка на страницы (desktop)

- В `/render` используется нативная печатная пагинация Chromium: `@page { size: A4; margin: 16mm 16mm 18mm; }`.
- Блоки `.exp-item`, `.edu-item`, `.project-item`, `.strength-item` получают `break-inside: avoid`. Заголовки секций — `break-after: avoid`.
- Сайдбар Modern на второй странице: фон сайдбара повторяется через `position: fixed` внутри печатного контекста (Chromium повторяет fixed-элементы на каждой странице).
- **В превью** `PageBreaker` симулирует это: измеряет высоты блоков (`ResizeObserver`) и рисует линии разрыва страниц с той же логикой. Окончательная разбивка — по Chromium; расхождение ловят визуальные тесты (раздел 9).

---

## 7. Экспорт

### 7.1. Поток

```
POST /export  →  проверка ResumeDataSchema (полная)
              →  dedup по sha256(data + format)
              →  INSERT exports(status='queued')  →  BullMQ 'export' job
Worker        →  status='processing'
              →  выдаёт render-token (JWT, 60 с, scope: resumeId + format)
              →  cluster.execute(page => …)
              →  загрузка в MinIO  →  status='done', file_key, size_bytes, duration_ms
Клиент        →  GET /exports/:id  →  presigned URL
```

### 7.2. Служебный роут `/render/:id`

- Отдаётся тем же SPA. При загрузке `Render.tsx` делает `GET /api/v1/render-data/:id?token=…` — эндпоинт принимает **только** render-token (не cookie). В ответе `ResumeData` и `photoUrl` в виде data-URI (base64), чтобы не зависеть от сети внутри Puppeteer.
- Рендерит `<ResumeRenderer format>` без UI конструктора.
- Когда шрифты (`document.fonts.ready`) и фото загружены, ставит `window.__RENDER_READY__ = true`.
- `robots: noindex`; доступ к `/render` и `/api/v1/render-data` в Nginx разрешён только из внутренней сети Docker.

### 7.3. Параметры Puppeteer

```ts
const cluster = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_CONTEXT,
  maxConcurrency: Number(process.env.EXPORT_CONCURRENCY ?? 3),
  puppeteerOptions: { args: ['--no-sandbox', '--font-render-hinting=none', '--disable-dev-shm-usage'] },
  timeout: 20_000,
});

// Общее
await page.goto(`${RENDER_ORIGIN}/render/${id}?format=${fmt}&token=${token}`, { waitUntil: 'networkidle0' });
await page.waitForFunction('window.__RENDER_READY__ === true', { timeout: 10_000 });
await page.emulateMediaType('print');           // только для pdf-desktop

// pdf-desktop (FR-17)
await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true, tagged: true });

// pdf-mobile (FR-18)
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
const h = await page.evaluate(() => document.documentElement.scrollHeight);
await page.pdf({ width: '390px', height: `${h + 1}px`, printBackground: true, pageRanges: '1' });
// В mobile-шаблоне: @page { size: 390px auto; margin: 0 } и никаких break-* правил

// png-mobile
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1080 / 390 });
await page.screenshot({ type: 'png', fullPage: true, omitBackground: false });
```

**Ограничения PNG:** высота больше 12 000 px (≈ 4400 CSS px) → `deviceScaleFactor` снижается пропорционально, чтобы файл не превышал ~8 МБ.

**Метаданные PDF** (после генерации, `pdf-lib`): `Title` = «{ФИО} — {должность}», `Author` = ФИО, `Creator` = «CV Builder AI», `Lang` = язык резюме.

### 7.4. Требования к результату

| Проверка | pdf-desktop | pdf-mobile | png-mobile |
|---|---|---|---|
| Текст выделяемый | ✓ | ✓ | — |
| Ссылки кликабельные | ✓ | ✓ | — |
| Размер | ≤ 2 МБ | ≤ 2 МБ | ≤ 8 МБ |
| Время p95 | ≤ 5 с | ≤ 5 с | ≤ 5 с |
| Страниц | 1–3 | 1 | — |

Автотест: `pdf-parse` проверяет, что ФИО, должность и email есть в извлечённом тексте; `pdf-lib` — число страниц и наличие аннотаций-ссылок.

---

## 8. Безопасность и ПДн

| Область | Мера |
|---|---|
| Транспорт | TLS 1.2+ (Let's Encrypt), HSTS |
| Сессии | Токен 32 байта (`crypto.randomBytes`), в БД — только sha256; cookie httpOnly, Secure, SameSite=Lax |
| CSRF | Заголовок `X-Requested-With` + проверка `Origin` |
| Заголовки | CSP (`default-src 'self'; img-src 'self' data: blob: {S3_PUBLIC}; connect-src 'self'`), `X-Content-Type-Options`, `Referrer-Policy: strict-origin` |
| Фото | Проверка magic bytes, перекодирование sharp, удаление EXIF (геолокация) |
| Puppeteer | Отдельный контейнер без доступа в интернет (только internal-сеть); `--no-sandbox` компенсируется отдельным непривилегированным пользователем и seccomp-профилем Docker; запросы страницы ограничены `RENDER_ORIGIN` через `page.setRequestInterception` |
| ИИ | Ключ только в env API-сервера; в Claude не уходят контакты, фото, дата рождения, город, ФИО (2.2) |
| Prompt injection | Пользовательский текст передаётся только как JSON-данные в user-сообщении, не в system; выход проходит валидацию 4.5 и рендерится как текст (React-экранирование, без `dangerouslySetInnerHTML`) |
| Хранение | Шифрование диска VPS (LUKS) и MinIO SSE; ежедневный бэкап Postgres (`pg_dump`, 14 дней) |
| Удаление | `DELETE /me` и `DELETE /resumes/:id` удаляют файлы в S3 синхронно, строки в БД — сразу; бэкапы ротируются за 14 дней |
| Логи | pino с redaction: `*.email`, `*.phone`, `*.rawDescription`, `*.fullName`, `cookie`, `authorization` |

---

## 9. Тестирование

| Уровень | Инструмент | Что покрывается | Цель |
|---|---|---|---|
| Unit | Vitest | Zod-схемы, `buildPalette` (контраст ≥ 4.5 для всех тем и 200 случайных цветов), translit, migrateResume, пост-валидация ИИ (числа, сущности), merge PATCH | ≥ 85% для `packages/shared` и `ai` |
| Компоненты | Vitest + Testing Library | Шаги формы, DnD, ИИ-блоки (accept/regenerate/revert), модалка экспорта | Ключевые сценарии |
| API | Vitest + Fastify inject + Testcontainers (Postgres, Redis, MinIO) | Все эндпоинты, права доступа, 409, rate limits, перенос анонимных резюме при логине | Все коды ошибок 3.2 |
| ИИ (eval) | Отдельный набор `evals/` — 30 резюме RU + 30 UZ + 15 EN, включая «мало данных» и «без опыта» | Галлюцинации (автопроверка 4.5 + ручная разметка), язык, длины, клише | 0 выдуманных цифр; ≥ 90% пунктов без нарушений с первой попытки; запуск при изменении промпта |
| E2E | Playwright (Chromium, Mobile Safari-эмуляция) | Happy path PRD §3 на ПК и мобильном, восстановление черновика, экспорт трёх форматов | Smoke перед каждым деплоем |
| Визуальные | Playwright `toHaveScreenshot` | 5 шаблонов × 3 темы × 2 формата × 3 набора данных (короткий / средний / длинный 3 стр.) — сравнение `/render` и превью | Расхождение ≤ 0.5% пикселей |
| Нагрузка | k6 | 50 одновременных экспортов, 30 SSE-генераций | Экспорт p95 ≤ 5 с при 3 воркерах × 3 контекста |

Моки ИИ: в unit, компонентных и E2E тестах `AI_PROVIDER=mock` возвращает фиксированные ответы из `packages/ai-prompts/fixtures/`.

---

## 10. Инфраструктура и деплой

### 10.1. Docker Compose (прод)

| Сервис | Образ | Ресурсы | Сети |
|---|---|---|---|
| `nginx` | nginx:1.27-alpine | — | public, internal |
| `api` | `cvb/api` (Node 22 alpine) | 1 vCPU, 512 МБ, ×2 реплики | internal, egress (Claude API) |
| `worker` | `cvb/worker` (node:22-bookworm + Chromium + шрифты) | 2 vCPU, 2 ГБ | internal |
| `postgres` | postgres:16-alpine | 1 ГБ | internal |
| `redis` | redis:7-alpine | 256 МБ | internal |
| `minio` | minio/minio | — | internal |

Минимальный VPS: 4 vCPU / 8 ГБ RAM / 80 ГБ SSD.

### 10.2. Переменные окружения

```bash
# api
NODE_ENV=production
APP_ORIGIN=https://cv.example.uz
DATABASE_URL=postgres://…
REDIS_URL=redis://redis:6379
S3_ENDPOINT=http://minio:9000
S3_ACCESS_KEY=…
S3_SECRET_KEY=…
S3_BUCKET_PHOTOS=photos
S3_BUCKET_EXPORTS=exports
SESSION_SECRET=…
RENDER_TOKEN_SECRET=…
ANTHROPIC_API_KEY=…
AI_PROVIDER=anthropic            # anthropic | mock
AI_MODEL_MAIN=claude-sonnet-5-5
AI_MODEL_FAST=claude-haiku-5-5
AI_DAILY_LIMIT_PER_RESUME=20
SMTP_URL=smtp://…
TELEGRAM_BOT_TOKEN=…
GOOGLE_CLIENT_ID=…
GOOGLE_CLIENT_SECRET=…
SENTRY_DSN=…

# worker
RENDER_ORIGIN=http://nginx-internal
EXPORT_CONCURRENCY=3
```

### 10.3. CI/CD (GitHub Actions)

1. **PR:** lint (ESLint, Prettier) → typecheck → unit + API-тесты → сборка → визуальные тесты.
2. **main:** сборка Docker-образов → push в GHCR → деплой по SSH (`docker compose pull && up -d`) → миграции `drizzle-kit migrate` → E2E smoke на проде → при провале — откат на предыдущий тег.
3. **Изменение `packages/ai-prompts`:** обязательный прогон `evals/` с отчётом в комментарий к PR.

### 10.4. Мониторинг

- Sentry: фронт и бэк, release-теги.
- Метрики (Prometheus-формат, `/metrics` только из internal): длина очереди экспорта, длительность экспорта по форматам, задержка и ошибки ИИ, токены в день, 5xx.
- Алерты (Telegram-бот): очередь экспорта > 20 в течение 2 мин; доля ошибок ИИ > 10% за 15 мин; 5xx > 1% за 5 мин; диск > 80%.

---

## 11. Аналитика

Сбор — самохостинг Umami или PostHog (данные в РУз). События из PRD §10 отправляются с клиента. Свойства событий не содержат ПДн: только `resumeId` (хэш), `templateId`, `themeId`, `format`, `block`, `step`, `language`, `durationMs`.

Дополнительно сервер пишет `ai_generations` и `exports` — из них считаются метрики целей PRD §1.3 (SQL-представления `v_funnel_daily`, `v_ai_acceptance`).

**Как считается «ИИ-текст принят» (цель ≥ 60%):** блок ИИ, который на момент экспорта совпадает с исходной генерацией с нормализованным расстоянием Левенштейна ≤ 0.15. Для этого в момент генерации в `ai_generations` сохраняется хэш и длина каждого блока (не текст).

---

## 12. План реализации (по спринтам PRD)

| Спринт | Задачи (из SPEC) | Результат |
|---|---|---|
| **1** | Монорепо, Docker Compose dev; `packages/shared` (схемы 2.1); БД 2.2 + миграции; сессии; `POST/GET/PATCH /resumes`; фото (3.3, 5.4); мастер формы 5.3; store + автосохранение 5.2; шаблон Classic + превью desktop | Можно заполнить форму и видеть превью |
| **2** | ИИ-модуль 4.1–4.6, 4.9; SSE на фронте; ИИ-блоки 5.6; шаблоны Modern, ATS; `evals/` (первые 30 резюме) | Полная ИИ-генерация со стримингом |
| **3** | Темы 6.3; mobile-раскладка 6.2; экспорт 7.1–7.3 (pdf-desktop, pdf-mobile); модалка 5.7; авторизация (email-код, Telegram, Google) + перенос анонимных резюме | Скачивание PDF в двух версиях |
| **4** | Нормализация навыков 4.7; проверка 4.8; шаблоны Minimal, Creative; png-mobile; шрифты 6.4; аналитика 11; визуальные тесты; нагрузка; безопасность 8 (аудит); прод-деплой 10 | **MVP-релиз** |

---

## 13. Определение готовности (DoD) для задачи

- [ ] Код покрыт тестами по разделу 9 для затронутого слоя.
- [ ] Типы и Zod-схемы обновлены в `packages/shared`; при изменении `ResumeData` — повышен `schemaVersion` и добавлена миграция.
- [ ] Новые строки UI есть в RU, UZ, EN.
- [ ] Нет ПДн в логах и событиях аналитики.
- [ ] Визуальные снимки обновлены осознанно (если менялись шаблоны).
- [ ] При изменении промптов — прогон `evals/` без регрессии.
