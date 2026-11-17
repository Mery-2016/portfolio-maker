import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ResumeData, createDefaultResumeData, migrateResume } from '@cvb/shared';

export interface DbSession {
  id: string;
  userId: string | null;
  tokenHash: string;
  createdAt: string;
  expiresAt: string;
}

export interface DbResume {
  id: string;
  ownerUserId: string | null;
  ownerSession: string;
  title: string;
  data: ResumeData;
  version: number;
  publicSlug?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DbExport {
  id: string;
  resumeId: string;
  format: 'pdf-desktop' | 'pdf-mobile' | 'png-mobile';
  status: 'queued' | 'processing' | 'done' | 'failed';
  fileKey?: string | null;
  url?: string;
  fileName?: string;
  sizeBytes?: number;
  durationMs?: number;
  error?: string | null;
  createdAt: string;
}

export interface DbAiGeneration {
  id: string;
  resumeId: string;
  block: string;
  model: string;
  status: string;
  createdAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
const EXPORTS_DIR = path.resolve(process.cwd(), 'data', 'exports');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(EXPORTS_DIR)) fs.mkdirSync(EXPORTS_DIR, { recursive: true });

class DatabaseStore {
  private sessions: Map<string, DbSession> = new Map(); // tokenHash -> DbSession
  private resumes: Map<string, DbResume> = new Map(); // id -> DbResume
  private exports: Map<string, DbExport> = new Map(); // id -> DbExport
  private aiGenerations: DbAiGeneration[] = [];
  private dbFilePath = path.join(DATA_DIR, 'store.json');

  constructor() {
    this.loadFromFile();
  }

  private loadFromFile() {
    if (fs.existsSync(this.dbFilePath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(this.dbFilePath, 'utf-8'));
        if (raw.sessions) raw.sessions.forEach((s: DbSession) => this.sessions.set(s.tokenHash, s));
        if (raw.resumes) raw.resumes.forEach((r: DbResume) => this.resumes.set(r.id, r));
        if (raw.exports) raw.exports.forEach((e: DbExport) => this.exports.set(e.id, e));
        if (raw.aiGenerations) this.aiGenerations = raw.aiGenerations;
      } catch (err) {
        console.error('Failed to load store from file:', err);
      }
    }
  }

  private persist() {
    try {
      const data = {
        sessions: Array.from(this.sessions.values()),
        resumes: Array.from(this.resumes.values()),
        exports: Array.from(this.exports.values()),
        aiGenerations: this.aiGenerations,
      };
      fs.writeFileSync(this.dbFilePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist store:', err);
    }
  }

  // --- SESSIONS ---
  public getOrCreateSession(token: string | undefined): { session: DbSession; token: string; isNew: boolean } {
    if (token) {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const existing = this.sessions.get(tokenHash);
      if (existing && new Date(existing.expiresAt) > new Date()) {
        return { session: existing, token, isNew: false };
      }
    }

    // Create new anonymous session
    const newToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(newToken).digest('hex');
    const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

    const session: DbSession = {
      id: crypto.randomUUID(),
      userId: null,
      tokenHash,
      createdAt: new Date().toISOString(),
      expiresAt,
    };

    this.sessions.set(tokenHash, session);
    this.persist();
    return { session, token: newToken, isNew: true };
  }

  // --- RESUMES ---
  public listResumes(session: DbSession): Array<{ id: string; title: string; updatedAt: string; templateId: string; thumbnailUrl?: string }> {
    const list: Array<{ id: string; title: string; updatedAt: string; templateId: string; thumbnailUrl?: string }> = [];
    for (const r of this.resumes.values()) {
      const isOwner = (session.userId && r.ownerUserId === session.userId) || r.ownerSession === session.id;
      if (isOwner) {
        list.push({
          id: r.id,
          title: r.title,
          updatedAt: r.updatedAt,
          templateId: r.data.design.templateId,
          thumbnailUrl: r.data.personal.photoUrl,
        });
      }
    }
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  public getResume(id: string, session: DbSession): DbResume | null {
    const resume = this.resumes.get(id);
    if (!resume) return null;
    const isOwner = (session.userId && resume.ownerUserId === session.userId) || resume.ownerSession === session.id;
    if (!isOwner) return null;
    return resume;
  }

  public createResume(id: string | undefined, session: DbSession, language: any = 'ru'): DbResume {
    const resumeId = id || crypto.randomUUID();
    const data = createDefaultResumeData(resumeId, language);
    const now = new Date().toISOString();

    const resume: DbResume = {
      id: resumeId,
      ownerUserId: session.userId,
      ownerSession: session.id,
      title: 'Моё резюме',
      data,
      version: 1,
      createdAt: now,
      updatedAt: now,
    };

    this.resumes.set(resumeId, resume);
    this.persist();
    return resume;
  }

  public updateResume(
    id: string,
    expectedVersion: number,
    patch: any,
    session: DbSession
  ): { status: 'ok'; version: number } | { status: 'conflict'; version: number; data: ResumeData } {
    const resume = this.resumes.get(id);
    if (!resume) {
      throw new Error('NOT_FOUND');
    }

    const isOwner = (session.userId && resume.ownerUserId === session.userId) || resume.ownerSession === session.id;
    if (!isOwner) {
      throw new Error('FORBIDDEN');
    }

    if (resume.version !== expectedVersion) {
      return { status: 'conflict', version: resume.version, data: resume.data };
    }

    // Merge logic according to SPEC §3.3:
    // - objects merged deeply
    // - arrays replaced completely
    const current = resume.data;
    const merged: ResumeData = {
      ...current,
      personal: { ...current.personal, ...(patch.personal || {}) },
      contacts: { ...current.contacts, ...(patch.contacts || {}) },
      experience: patch.experience !== undefined ? patch.experience : current.experience,
      projects: patch.projects !== undefined ? patch.projects : current.projects,
      education: patch.education !== undefined ? patch.education : current.education,
      skills: {
        hard: patch.skills?.hard !== undefined ? patch.skills.hard : current.skills.hard,
        soft: patch.skills?.soft !== undefined ? patch.skills.soft : current.skills.soft,
        languages: patch.skills?.languages !== undefined ? patch.skills.languages : current.skills.languages,
      },
      ai: { ...current.ai, ...(patch.ai || {}) },
      design: {
        ...current.design,
        ...(patch.design || {}),
        sectionOrder: patch.design?.sectionOrder !== undefined ? patch.design.sectionOrder : current.design.sectionOrder,
        hiddenSections: patch.design?.hiddenSections !== undefined ? patch.design.hiddenSections : current.design.hiddenSections,
      },
      noExperience: patch.noExperience !== undefined ? patch.noExperience : current.noExperience,
      language: patch.language || current.language,
      updatedAt: new Date().toISOString(),
    };

    resume.data = merged;
    resume.version += 1;
    resume.updatedAt = new Date().toISOString();
    if (merged.personal.fullName) {
      resume.title = `${merged.personal.fullName} — ${merged.personal.position || 'Резюме'}`;
    }

    this.persist();
    return { status: 'ok', version: resume.version };
  }

  public duplicateResume(id: string, session: DbSession): DbResume {
    const original = this.getResume(id, session);
    if (!original) throw new Error('NOT_FOUND');

    const newId = crypto.randomUUID();
    const clonedData = JSON.parse(JSON.stringify(original.data));
    clonedData.id = newId;
    clonedData.updatedAt = new Date().toISOString();

    const clone: DbResume = {
      id: newId,
      ownerUserId: session.userId,
      ownerSession: session.id,
      title: `${original.title} (Копия)`,
      data: clonedData,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.resumes.set(newId, clone);
    this.persist();
    return clone;
  }

  public deleteResume(id: string, session: DbSession): boolean {
    const resume = this.getResume(id, session);
    if (!resume) return false;
    this.resumes.delete(id);
    this.persist();
    return true;
  }

  // --- AI USAGE & GENERATIONS ---
  public getAiUsageToday(resumeId: string): number {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    return this.aiGenerations.filter(
      g => g.resumeId === resumeId && new Date(g.createdAt) >= startOfDay && g.status === 'ok'
    ).length;
  }

  public recordAiGeneration(resumeId: string, block: string, model: string, status: string) {
    this.aiGenerations.push({
      id: crypto.randomUUID(),
      resumeId,
      block,
      model,
      status,
      createdAt: new Date().toISOString(),
    });
    this.persist();
  }

  // --- EXPORTS ---
  public createExport(resumeId: string, format: 'pdf-desktop' | 'pdf-mobile' | 'png-mobile'): DbExport {
    const exp: DbExport = {
      id: crypto.randomUUID(),
      resumeId,
      format,
      status: 'queued',
      createdAt: new Date().toISOString(),
    };
    this.exports.set(exp.id, exp);
    this.persist();
    return exp;
  }

  public getExport(id: string): DbExport | null {
    return this.exports.get(id) || null;
  }

  public updateExport(id: string, updates: Partial<DbExport>) {
    const exp = this.exports.get(id);
    if (exp) {
      Object.assign(exp, updates);
      this.persist();
    }
  }

  public savePhoto(resumeId: string, buffer: Buffer, ext: string = 'webp'): string {
    const filename = `${resumeId}_${Date.now()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  }
}

export const dbStore = new DatabaseStore();
