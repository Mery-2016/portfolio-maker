import { ResumeData, createDefaultResumeData, DEFAULT_SECTION_ORDER } from './resume.js';

export function migrateResume(raw: any): ResumeData {
  if (!raw || typeof raw !== 'object') {
    return createDefaultResumeData();
  }

  const current = createDefaultResumeData(raw.id);

  return {
    ...current,
    ...raw,
    schemaVersion: 1,
    personal: {
      ...current.personal,
      ...(raw.personal || {}),
    },
    contacts: {
      ...current.contacts,
      ...(raw.contacts || {}),
    },
    experience: Array.isArray(raw.experience) ? raw.experience : [],
    projects: Array.isArray(raw.projects) ? raw.projects : [],
    education: Array.isArray(raw.education) ? raw.education : [],
    skills: {
      hard: Array.isArray(raw.skills?.hard) ? raw.skills.hard : [],
      soft: Array.isArray(raw.skills?.soft) ? raw.skills.soft : [],
      languages: Array.isArray(raw.skills?.languages) ? raw.skills.languages : [],
    },
    ai: {
      ...current.ai,
      ...(raw.ai || {}),
    },
    design: {
      ...current.design,
      ...(raw.design || {}),
      sectionOrder: Array.isArray(raw.design?.sectionOrder) && raw.design.sectionOrder.length > 0
        ? raw.design.sectionOrder
        : [...DEFAULT_SECTION_ORDER],
      hiddenSections: Array.isArray(raw.design?.hiddenSections) ? raw.design.hiddenSections : [],
    },
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}
