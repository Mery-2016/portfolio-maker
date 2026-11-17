import { pgTable, uuid, text, integer, timestamp, jsonb, bigint, smallint } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { ResumeData } from '@cvb/shared';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').unique(),
  telegramId: bigint('telegram_id', { mode: 'number' }).unique(),
  googleSub: text('google_sub').unique(),
  plan: text('plan').notNull().default('free'),
  uiLang: text('ui_lang').notNull().default('ru'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});

export const resumes = pgTable('resumes', {
  id: uuid('id').primaryKey(),
  ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'cascade' }),
  ownerSession: uuid('owner_session').references(() => sessions.id, { onDelete: 'set null' }),
  title: text('title').notNull().default('Моё резюме'),
  data: jsonb('data').notNull().$type<ResumeData>(),
  version: integer('version').notNull().default(1),
  publicSlug: text('public_slug').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const aiGenerations = pgTable('ai_generations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  resumeId: uuid('resume_id').notNull().references(() => resumes.id, { onDelete: 'cascade' }),
  block: text('block').notNull(),
  model: text('model').notNull(),
  inputTokens: integer('input_tokens'),
  outputTokens: integer('output_tokens'),
  latencyMs: integer('latency_ms'),
  status: text('status').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const exports = pgTable('exports', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  resumeId: uuid('resume_id').notNull().references(() => resumes.id, { onDelete: 'cascade' }),
  format: text('format').notNull(),
  status: text('status').notNull(), // queued | processing | done | failed
  fileKey: text('file_key'),
  sizeBytes: integer('size_bytes'),
  durationMs: integer('duration_ms'),
  error: text('error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const authCodes = pgTable('auth_codes', {
  email: text('email').primaryKey(),
  codeHash: text('code_hash').notNull(),
  attempts: smallint('attempts').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
});
