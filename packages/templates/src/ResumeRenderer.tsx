import React, { useMemo } from 'react';
import { ResumeData } from '@cvb/shared';
import { templates } from './templates.js';
import { getThemeById } from './themes.js';
import { buildPalette, paletteToCssVars } from './palette.js';

export interface ResumeRendererProps {
  data: ResumeData;
  format?: 'desktop' | 'mobile';
  photoUrl?: string;
  scale?: number;
  className?: string;
}

const FONT_FAMILIES = {
  inter: "'Inter', system-ui, sans-serif",
  roboto: "'Roboto', system-ui, sans-serif",
  pt: "'PT Serif', 'PT Sans', Georgia, serif",
  montserrat: "'Montserrat', system-ui, sans-serif",
};

const FONT_SIZES_DESKTOP = {
  S: '9.5pt',
  M: '10.5pt',
  L: '11.5pt',
};

const FONT_SIZES_MOBILE = {
  S: '14px',
  M: '15px',
  L: '16px',
};

export const ResumeRenderer: React.FC<ResumeRendererProps> = ({
  data,
  format = 'desktop',
  photoUrl,
  scale = 1,
  className = '',
}) => {
  const templateDef = templates[data.design.templateId] || templates.modern;
  const TemplateComponent = templateDef.Component;

  // Build color palette
  const palette = useMemo(() => {
    let accent = data.design.customAccent;
    if (!accent) {
      const theme = getThemeById(data.design.themeId);
      accent = theme.accent;
    }
    return buildPalette(accent);
  }, [data.design.themeId, data.design.customAccent]);

  const cssVars = useMemo(() => {
    return paletteToCssVars(palette);
  }, [palette]);

  const font = FONT_FAMILIES[data.design.font] || FONT_FAMILIES.inter;
  const fontSize = format === 'mobile'
    ? (FONT_SIZES_MOBILE[data.design.fontSize] || FONT_SIZES_MOBILE.M)
    : (FONT_SIZES_DESKTOP[data.design.fontSize] || FONT_SIZES_DESKTOP.M);

  const style: React.CSSProperties = {
    ...cssVars as any,
    fontFamily: font,
    fontSize,
    transform: scale !== 1 ? `scale(${scale})` : undefined,
    transformOrigin: 'top center',
    transition: 'transform 160ms cubic-bezier(0.2, 0, 0, 1)',
  };

  return (
    <div
      className={`resume-sheet relative ${className}`}
      style={style}
      data-template={templateDef.id}
      data-format={format}
    >
      <TemplateComponent data={data} format={format} photoUrl={photoUrl} />
    </div>
  );
};
