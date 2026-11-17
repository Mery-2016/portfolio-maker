export * from './resume.js';
export * from './errors.js';
export * from './translit.js';
export * from './typograf.js';
export * from './migrate.js';

import positionsData from './positions.json' with { type: 'json' };
import skillsData from './skills-dictionary.json' with { type: 'json' };

export const positions: string[] = positionsData;
export const skillsDictionary: {
  hard: string[];
  soft: string[];
  aliases: Record<string, string>;
} = skillsData;
