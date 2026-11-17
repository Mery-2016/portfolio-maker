import { create } from 'zustand';
import {
  ResumeData,
  createDefaultResumeData,
  DeepPartial,
  migrateResume,
  SectionKey,
} from '@cvb/shared';
import { patchResume, fetchResume } from '../lib/api.js';

interface ToastState {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ResumeStore {
  data: ResumeData;
  serverVersion: number;
  dirtyPaths: Set<string>;
  saveState: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSavedAt: string | null;
  previewMode: 'desktop' | 'mobile';
  currentStep: number; // 1: personal, 2: contacts, 3: exp, 4: edu, 5: skills, 6: design
  editorialMode: boolean;
  editorialItemId?: string;
  toast: ToastState | null;
  themeMode: 'light' | 'dark';

  setThemeMode: (mode: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setPreviewMode: (mode: 'desktop' | 'mobile') => void;
  setCurrentStep: (step: number) => void;
  setEditorialMode: (enabled: boolean, itemId?: string) => void;
  showToast: (message: string, actionLabel?: string, onAction?: () => void) => void;
  hideToast: () => void;

  initResume: (id: string, initialData?: ResumeData, version?: number) => void;
  updateData: (patch: DeepPartial<ResumeData>) => void;
  updateField: (path: string, value: any) => void;

  addExperience: () => void;
  removeExperience: (id: string) => void;
  reorderExperience: (fromIndex: number, toIndex: number) => void;

  addProject: () => void;
  removeProject: (id: string) => void;

  addEducation: () => void;
  removeEducation: (id: string) => void;

  addSkill: (type: 'hard' | 'soft', name: string) => void;
  removeSkill: (type: 'hard' | 'soft', index: number) => void;

  addLanguage: (name: string, level: any) => void;
  removeLanguage: (index: number) => void;

  reorderSections: (newOrder: SectionKey[]) => void;
  toggleSectionVisibility: (section: SectionKey) => void;

  applyAiEvent: (event: string, payload: any) => void;
  revertAi: (block: 'summary' | 'experience' | 'strengths', itemId?: string) => void;
  acceptAi: (block: 'summary' | 'experience' | 'strengths', itemId?: string) => void;

  triggerSave: () => void;
}

let saveTimer: any = null;

export const useResumeStore = create<ResumeStore>((set, get) => {
  const initialTheme = (typeof window !== 'undefined' && localStorage.getItem('cvb:theme') === 'dark') ? 'dark' : 'light';

  return {
    data: createDefaultResumeData(),
    serverVersion: 1,
    dirtyPaths: new Set(),
    saveState: 'idle',
    lastSavedAt: null,
    previewMode: 'desktop',
    currentStep: 1,
    editorialMode: false,
    toast: null,
    themeMode: initialTheme,

    setThemeMode: (mode) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('cvb:theme', mode);
        document.documentElement.setAttribute('data-theme', mode);
      }
      set({ themeMode: mode });
    },

    toggleTheme: () => {
      const next = get().themeMode === 'light' ? 'dark' : 'light';
      get().setThemeMode(next);
    },

    setPreviewMode: (mode) => set({ previewMode: mode }),
    setCurrentStep: (step) => set({ currentStep: step }),
    setEditorialMode: (enabled, itemId) => set({ editorialMode: enabled, editorialItemId: itemId }),

    showToast: (message, actionLabel, onAction) => {
      set({ toast: { message, actionLabel, onAction } });
      setTimeout(() => {
        if (get().toast?.message === message) {
          set({ toast: null });
        }
      }, 5000);
    },

    hideToast: () => set({ toast: null }),

    initResume: (id, initialData, version = 1) => {
      const data = initialData || createDefaultResumeData(id);
      // Check localStorage for offline cached updates
      if (typeof window !== 'undefined') {
        const localKey = `cvb:resume:${id}`;
        const localCached = localStorage.getItem(localKey);
        if (localCached) {
          try {
            const parsed = JSON.parse(localCached);
            if (new Date(parsed.updatedAt) > new Date(data.updatedAt)) {
              set({ data: migrateResume(parsed), serverVersion: version });
              return;
            }
          } catch {}
        }
      }
      set({ data: migrateResume(data), serverVersion: version });
    },

    updateData: (patch) => {
      const current = get().data;
      const updated: ResumeData = {
        ...current,
        personal: { ...current.personal, ...(patch.personal || {}) },
        contacts: { ...current.contacts, ...(patch.contacts || {}) },
        experience: patch.experience !== undefined ? (patch.experience as any) : current.experience,
        projects: patch.projects !== undefined ? (patch.projects as any) : current.projects,
        education: patch.education !== undefined ? (patch.education as any) : current.education,
        skills: {
          hard: patch.skills?.hard !== undefined ? patch.skills.hard : current.skills.hard,
          soft: patch.skills?.soft !== undefined ? patch.skills.soft : current.skills.soft,
          languages: patch.skills?.languages !== undefined ? (patch.skills.languages as any) : current.skills.languages,
        },
        ai: { ...current.ai, ...(patch.ai || {}) },
        design: { ...current.design, ...(patch.design || {}) },
        noExperience: patch.noExperience !== undefined ? patch.noExperience : current.noExperience,
        language: patch.language || current.language,
        updatedAt: new Date().toISOString(),
      };

      // Cache locally immediately
      if (typeof window !== 'undefined') {
        localStorage.setItem(`cvb:resume:${updated.id}`, JSON.stringify(updated));
      }

      set({ data: updated });
      get().triggerSave();
    },

    updateField: (pathStr, value) => {
      const parts = pathStr.split('.');
      const patch: any = {};
      let cursor = patch;
      for (let i = 0; i < parts.length - 1; i++) {
        cursor[parts[i]] = {};
        cursor = cursor[parts[i]];
      }
      cursor[parts[parts.length - 1]] = value;
      get().updateData(patch);
    },

    // Experience
    addExperience: () => {
      const current = get().data.experience;
      const newItem = {
        id: `exp_${Date.now()}`,
        company: '',
        role: '',
        startDate: '2023-01',
        endDate: null,
        rawDescription: '',
        useAi: true,
      };
      get().updateData({ experience: [newItem, ...current] });
    },

    removeExperience: (id) => {
      const current = get().data.experience;
      const itemToDelete = current.find(e => e.id === id);
      const filtered = current.filter(e => e.id !== id);
      get().updateData({ experience: filtered });

      if (itemToDelete) {
        get().showToast('Запись удалена', 'Вернуть', () => {
          get().updateData({ experience: [itemToDelete, ...get().data.experience] });
        });
      }
    },

    reorderExperience: (fromIndex, toIndex) => {
      const items = [...get().data.experience];
      const [moved] = items.splice(fromIndex, 1);
      items.splice(toIndex, 0, moved);
      get().updateData({ experience: items });
    },

    // Projects
    addProject: () => {
      const current = get().data.projects;
      const newItem = {
        id: `proj_${Date.now()}`,
        name: '',
        link: '',
        rawDescription: '',
        useAi: true,
      };
      get().updateData({ projects: [newItem, ...current] });
    },

    removeProject: (id) => {
      const current = get().data.projects;
      const itemToDelete = current.find(p => p.id === id);
      const filtered = current.filter(p => p.id !== id);
      get().updateData({ projects: filtered });

      if (itemToDelete) {
        get().showToast('Проект удалён', 'Вернуть', () => {
          get().updateData({ projects: [itemToDelete, ...get().data.projects] });
        });
      }
    },

    // Education
    addEducation: () => {
      const current = get().data.education;
      const newItem = {
        id: `edu_${Date.now()}`,
        institution: '',
        specialty: '',
        level: 'bachelor' as const,
        graduationYear: new Date().getFullYear(),
      };
      get().updateData({ education: [newItem, ...current] });
    },

    removeEducation: (id) => {
      const current = get().data.education;
      const itemToDelete = current.find(e => e.id === id);
      const filtered = current.filter(e => e.id !== id);
      get().updateData({ education: filtered });

      if (itemToDelete) {
        get().showToast('Запись удалена', 'Вернуть', () => {
          get().updateData({ education: [itemToDelete, ...get().data.education] });
        });
      }
    },

    // Skills
    addSkill: (type, name) => {
      if (!name.trim()) return;
      const current = get().data.skills;
      if (type === 'hard') {
        if (current.hard.some(h => h.name.toLowerCase() === name.trim().toLowerCase())) return;
        get().updateData({
          skills: {
            ...current,
            hard: [...current.hard, { name: name.trim() }],
          },
        });
      } else {
        if (current.soft.some(s => s.toLowerCase() === name.trim().toLowerCase())) return;
        get().updateData({
          skills: {
            ...current,
            soft: [...current.soft, name.trim()],
          },
        });
      }
    },

    removeSkill: (type, index) => {
      const current = get().data.skills;
      if (type === 'hard') {
        const hard = current.hard.filter((_, i) => i !== index);
        get().updateData({ skills: { ...current, hard } });
      } else {
        const soft = current.soft.filter((_, i) => i !== index);
        get().updateData({ skills: { ...current, soft } });
      }
    },

    // Languages
    addLanguage: (name, level) => {
      if (!name.trim()) return;
      const current = get().data.skills;
      get().updateData({
        skills: {
          ...current,
          languages: [...current.languages, { name: name.trim(), level }],
        },
      });
    },

    removeLanguage: (index) => {
      const current = get().data.skills;
      const languages = current.languages.filter((_, i) => i !== index);
      get().updateData({ skills: { ...current, languages } });
    },

    // Sections
    reorderSections: (newOrder) => {
      const current = get().data.design;
      get().updateData({ design: { ...current, sectionOrder: newOrder } });
    },

    toggleSectionVisibility: (section) => {
      const current = get().data.design;
      const isHidden = current.hiddenSections.includes(section);
      const hiddenSections = isHidden
        ? current.hiddenSections.filter(s => s !== section)
        : [...current.hiddenSections, section];
      get().updateData({ design: { ...current, hiddenSections } });
    },

    // AI Events from SSE
    applyAiEvent: (event, payload) => {
      const current = get().data;
      if (event === 'summary') {
        get().updateData({
          ai: { ...current.ai, summary: payload.text },
        });
      } else if (event === 'experience') {
        const updatedExp = current.experience.map(e => {
          if (e.id === payload.itemId) {
            return {
              ...e,
              aiBullets: payload.bullets,
              highlights: payload.highlights,
              notes: payload.notes,
              useAi: true,
            };
          }
          return e;
        });
        get().updateData({ experience: updatedExp });
      } else if (event === 'strengths') {
        get().updateData({
          ai: { ...current.ai, strengths: payload.items },
        });
      } else if (event === 'done') {
        if (payload.version) {
          set({ serverVersion: payload.version });
        }
      }
    },

    revertAi: (block, itemId) => {
      const current = get().data;
      if (block === 'summary') {
        get().updateData({ ai: { ...current.ai, summary: '' } });
      } else if (block === 'experience' && itemId) {
        const exp = current.experience.map(e => e.id === itemId ? { ...e, useAi: false } : e);
        get().updateData({ experience: exp });
      }
    },

    acceptAi: (block, itemId) => {
      const current = get().data;
      if (block === 'experience' && itemId) {
        const exp = current.experience.map(e => e.id === itemId ? { ...e, notes: undefined } : e);
        get().updateData({ experience: exp });
      }
    },

    // Debounced autosave
    triggerSave: () => {
      if (saveTimer) clearTimeout(saveTimer);
      set({ saveState: 'saving' });

      saveTimer = setTimeout(async () => {
        const state = get();
        try {
          const result = await patchResume(state.data.id, state.serverVersion, state.data);
          if (result.status === 'ok') {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            set({
              serverVersion: result.version,
              saveState: 'saved',
              lastSavedAt: `Сохранено в ${timeStr}`,
            });
          } else if (result.status === 'conflict') {
            // Version conflict: merge and re-save
            set({
              data: migrateResume({ ...result.data, ...state.data }),
              serverVersion: result.version,
            });
            get().triggerSave();
          }
        } catch (err) {
          set({ saveState: 'offline' });
        }
      }, 1500);
    },
  };
});
