import React from 'react';
import { Lang, TemplateId, SectionKey, DEFAULT_SECTION_ORDER } from '@cvb/shared';
import { TemplateProps } from './types.js';
import { ModernTemplate } from './components/ModernTemplate.js';
import { ClassicTemplate } from './components/ClassicTemplate.js';
import { MinimalTemplate } from './components/MinimalTemplate.js';
import { CreativeTemplate } from './components/CreativeTemplate.js';
import { AtsTemplate } from './components/AtsTemplate.js';

export interface TemplateDefinition {
  id: TemplateId;
  name: Record<Lang, string>;
  photo: 'none' | 'circle' | 'square' | 'optional';
  supportsSkillLevels: boolean;
  supportsThemes: 'full' | 'accent-only';
  defaultSectionOrder: SectionKey[];
  Component: React.FC<TemplateProps>;
}

export const templates: Record<TemplateId, TemplateDefinition> = {
  modern: {
    id: 'modern',
    name: { ru: 'Современный', uz: 'Zamonaviy', en: 'Modern' },
    photo: 'circle',
    supportsSkillLevels: true,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: ModernTemplate,
  },
  classic: {
    id: 'classic',
    name: { ru: 'Классический', uz: 'Klassik', en: 'Classic' },
    photo: 'optional',
    supportsSkillLevels: false,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: ClassicTemplate,
  },
  minimal: {
    id: 'minimal',
    name: { ru: 'Минималистичный', uz: 'Minimal', en: 'Minimal' },
    photo: 'square',
    supportsSkillLevels: false,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: MinimalTemplate,
  },
  creative: {
    id: 'creative',
    name: { ru: 'Выразительный', uz: 'Ijodiy', en: 'Creative' },
    photo: 'square',
    supportsSkillLevels: true,
    supportsThemes: 'full',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: CreativeTemplate,
  },
  ats: {
    id: 'ats',
    name: { ru: 'ATS / Текстовый', uz: 'ATS / Matnli', en: 'ATS Plain' },
    photo: 'none',
    supportsSkillLevels: false,
    supportsThemes: 'accent-only',
    defaultSectionOrder: [...DEFAULT_SECTION_ORDER],
    Component: AtsTemplate,
  },
};
