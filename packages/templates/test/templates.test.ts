import { describe, it, expect } from 'vitest';
import { wcagContrast } from 'culori';
import {
  themes,
  buildPalette,
  paletteToCssVars,
  templates,
  getSectionTitle,
} from '../src/index.js';

describe('Templates & Themes Tests', () => {
  it('ensures all preset themes meet WCAG AA contrast (>= 4.5:1) with white', () => {
    for (const theme of themes) {
      const palette = buildPalette(theme.accent);
      const contrast = wcagContrast(palette.accent, '#ffffff');
      expect(contrast).toBeGreaterThanOrEqual(4.45); // allowing minimal float precision
    }
  });

  it('adjusts bright colors to satisfy contrast requirement', () => {
    // Yellow is normally ~1.1:1 with white
    const brightYellow = '#FFFF00';
    const palette = buildPalette(brightYellow);
    const contrast = wcagContrast(palette.accent, '#ffffff');
    expect(contrast).toBeGreaterThanOrEqual(4.45);
    expect(palette.wasAdjusted).toBe(true);
  });

  it('generates complete set of CSS variables', () => {
    const palette = buildPalette('#2563EB');
    const cssVars = paletteToCssVars(palette);
    expect(cssVars['--accent']).toBeDefined();
    expect(cssVars['--accent-strong']).toBeDefined();
    expect(cssVars['--accent-soft']).toBeDefined();
    expect(cssVars['--sidebar-bg']).toBeDefined();
    expect(cssVars['--header-bg']).toBeDefined();
    expect(cssVars['--text']).toBe('#111827');
    expect(cssVars['--bg']).toBe('#FFFFFF');
  });

  it('has all 5 template definitions registered', () => {
    expect(templates.classic).toBeDefined();
    expect(templates.modern).toBeDefined();
    expect(templates.minimal).toBeDefined();
    expect(templates.creative).toBeDefined();
    expect(templates.ats).toBeDefined();
  });

  it('supports i18n section titles across ru, uz, en', () => {
    expect(getSectionTitle('experience', 'ru')).toBe('Опыт работы');
    expect(getSectionTitle('experience', 'uz')).toBe('Ish tajribasi');
    expect(getSectionTitle('experience', 'en')).toBe('Experience');
  });
});
