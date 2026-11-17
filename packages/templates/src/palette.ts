import { oklch, formatHex, wcagContrast } from 'culori';

export interface PaletteResult {
  accent: string;
  accentStrong: string;
  accentSoft: string;
  sidebarBg: string;
  headerBg: string;
  headerText: string;
  text: string;
  muted: string;
  bg: string;
  rule: string;
  wasAdjusted: boolean;
}

export function buildPalette(hexColor: string): PaletteResult {
  let initial = oklch(hexColor);
  if (!initial) {
    initial = oklch('#2563EB')!;
  }

  // Calculate contrast with white (#FFFFFF)
  let currentHex = formatHex(initial) || hexColor;
  let currentL = initial.l ?? 0.5;
  let currentC = initial.c ?? 0.15;
  let currentH = initial.h ?? 250;

  let wasAdjusted = false;
  let contrast = wcagContrast(currentHex, '#ffffff');

  // If contrast with white is < 4.5:1, reduce L by 0.02 steps until >= 4.5
  while (contrast < 4.5 && currentL > 0.1) {
    currentL -= 0.02;
    wasAdjusted = true;
    const testColor = { mode: 'oklch' as const, l: currentL, c: currentC, h: currentH };
    currentHex = formatHex(testColor) || currentHex;
    contrast = wcagContrast(currentHex, '#ffffff');
  }

  const accent = currentHex;

  // --accent-strong: L - 0.10
  const strongColor = {
    mode: 'oklch' as const,
    l: Math.max(0.1, currentL - 0.1),
    c: currentC,
    h: currentH,
  };
  const accentStrong = formatHex(strongColor) || accent;

  // --accent-soft: L = 0.96, C * 0.25
  const softColor = {
    mode: 'oklch' as const,
    l: 0.96,
    c: currentC * 0.25,
    h: currentH,
  };
  const accentSoft = formatHex(softColor) || '#F3F4F6';

  // --sidebar-bg: L = 0.97, C * 0.15
  const sidebarColor = {
    mode: 'oklch' as const,
    l: 0.97,
    c: currentC * 0.15,
    h: currentH,
  };
  const sidebarBg = formatHex(sidebarColor) || '#F9FAFB';

  // --header-bg for Creative: accent
  const headerBg = accent;
  const headerContrastWithWhite = wcagContrast(accent, '#ffffff');
  const headerText = headerContrastWithWhite >= 4.5 ? '#FFFFFF' : '#111827';

  return {
    accent,
    accentStrong,
    accentSoft,
    sidebarBg,
    headerBg,
    headerText,
    text: '#111827',
    muted: '#4B5563',
    bg: '#FFFFFF',
    rule: '#E5E7EB',
    wasAdjusted,
  };
}

export function paletteToCssVars(palette: PaletteResult): Record<string, string> {
  return {
    '--accent': palette.accent,
    '--accent-strong': palette.accentStrong,
    '--accent-soft': palette.accentSoft,
    '--sidebar-bg': palette.sidebarBg,
    '--header-bg': palette.headerBg,
    '--header-text': palette.headerText,
    '--text': palette.text,
    '--muted': palette.muted,
    '--bg': palette.bg,
    '--rule': palette.rule,
  };
}
