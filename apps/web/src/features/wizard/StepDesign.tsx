import React from 'react';
import { useResumeStore } from '../../store/resume.js';
import { TemplateId, SectionKey } from '@cvb/shared';
import { templates, themes, getThemeById, buildPalette } from '@cvb/templates';
import { Eye, EyeOff, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';

const FONTS = [
  { id: 'inter', name: 'Inter (Современный гротеск)' },
  { id: 'roboto', name: 'Roboto (Геометричный)' },
  { id: 'pt', name: 'PT Serif / PT Sans (Книжный)' },
  { id: 'montserrat', name: 'Montserrat (Акцидентный)' },
];

const FONT_SIZES = [
  { id: 'S', name: 'Компактный (S)' },
  { id: 'M', name: 'Стандартный (M)' },
  { id: 'L', name: 'Крупный (L)' },
];

const SECTION_LABELS: Record<SectionKey, string> = {
  summary: 'О себе (Summary)',
  strengths: 'Ключевые преимущества',
  experience: 'Опыт работы',
  projects: 'Проекты',
  education: 'Образование',
  skills: 'Навыки',
  languages: 'Языки',
};

export const StepDesign: React.FC = () => {
  const { data, updateData, reorderSections, toggleSectionVisibility } = useResumeStore();

  const currentTheme = getThemeById(data.design.themeId);
  const currentAccent = data.design.customAccent || currentTheme.accent;
  const palette = buildPalette(currentAccent);

  const handleSelectTemplate = (id: TemplateId) => {
    updateData({ design: { ...data.design, templateId: id } });
  };

  const handleSelectTheme = (themeId: string) => {
    updateData({
      design: {
        ...data.design,
        themeId,
        customAccent: undefined,
      },
    });
  };

  const handleCustomColor = (color: string) => {
    updateData({
      design: {
        ...data.design,
        customAccent: color,
      },
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const order = [...data.design.sectionOrder];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= order.length) return;
    const [item] = order.splice(index, 1);
    order.splice(target, 0, item);
    reorderSections(order);
  };

  return (
    <div className="space-y-8">
      <h1 className="font-voice text-2xl font-bold text-[var(--ink)]">Внешний вид</h1>

      {/* 1. Templates */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-3">
          Шаблон оформления
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.values(templates).map((tpl) => {
            const isSelected = data.design.templateId === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectTemplate(tpl.id)}
                className={`p-3 text-left rounded-[var(--radius-1)] border transition-all text-xs flex flex-col justify-between h-28 ${
                  isSelected
                    ? 'border-[var(--ink)] bg-[var(--surface)] shadow-[var(--shadow-sheet-lifted)] -translate-y-0.5'
                    : 'border-[var(--rule)] bg-[var(--surface)] hover:border-[var(--rule-strong)]'
                }`}
              >
                <div>
                  <div className={`font-semibold ${isSelected ? 'text-[var(--ink)] font-bold' : 'text-[var(--ink-2)]'}`}>
                    {tpl.name.ru}
                  </div>
                  <div className="text-[11px] text-[var(--ink-3)] mt-1">
                    {tpl.id === 'modern' && 'Сайдбар 32% + основная колонка'}
                    {tpl.id === 'classic' && '1 колонка, классическая вёрстка'}
                    {tpl.id === 'minimal' && 'Сетка 25/75, заголовки слева'}
                    {tpl.id === 'creative' && 'Акцентная шапка, 2 колонки'}
                    {tpl.id === 'ats' && 'Текстовый ATS-формат без графики'}
                  </div>
                </div>

                {isSelected && (
                  <span className="text-[10px] font-mono text-[var(--lazur)] font-bold">Выбран</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Color Themes */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-3">
          Цветовой акцент
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {themes.map((t) => {
            const isSelected = data.design.themeId === t.id && !data.design.customAccent;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTheme(t.id)}
                style={{ backgroundColor: t.accent }}
                title={t.name.ru}
                className={`w-8 h-8 rounded-[var(--radius-1)] transition-transform ${
                  isSelected
                    ? 'ring-2 ring-[var(--ink)] ring-offset-2 scale-110'
                    : 'hover:scale-105'
                }`}
              />
            );
          })}

          {/* Custom color */}
          <label
            title="Свой цвет"
            className={`relative w-8 h-8 rounded-[var(--radius-1)] border-2 border-dashed border-[var(--rule-strong)] flex items-center justify-center cursor-pointer transition-transform ${
              data.design.customAccent ? 'ring-2 ring-[var(--ink)] ring-offset-2' : ''
            }`}
          >
            <input
              type="color"
              value={data.design.customAccent || '#2563EB'}
              onChange={(e) => handleCustomColor(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <span className="text-[10px] font-mono font-bold text-[var(--ink-2)]">#</span>
          </label>
        </div>

        {palette.wasAdjusted && (
          <p className="text-xs text-[var(--ochre)] mt-2">
            Цвет затемнён для читаемости и контраста по WCAG AA.
          </p>
        )}
      </div>

      {/* 3. Typography & Size */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-2">
            Шрифт резюме
          </label>
          <select
            value={data.design.font}
            onChange={(e) => updateData({ design: { ...data.design, font: e.target.value as any } })}
            className="w-full h-11 px-3 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
          >
            {FONTS.map((f) => (
              <option key={f.id} value={f.id}>{f.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-2">
            Размер шрифта
          </label>
          <select
            value={data.design.fontSize}
            onChange={(e) => updateData({ design: { ...data.design, fontSize: e.target.value as any } })}
            className="w-full h-11 px-3 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
          >
            {FONT_SIZES.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 4. Section Order & Visibility */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-3">
          Порядок и видимость секций
        </label>
        <div className="space-y-1.5">
          {data.design.sectionOrder.map((sec, idx) => {
            const isHidden = data.design.hiddenSections.includes(sec);

            return (
              <div
                key={sec}
                className="flex items-center justify-between p-2.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[var(--ink-3)]">
                    <GripVertical size={16} strokeWidth={1.5} />
                  </span>
                  <span className={isHidden ? 'line-through text-[var(--ink-3)]' : 'text-[var(--ink)]'}>
                    {SECTION_LABELS[sec]}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveSection(idx, 'up')}
                      className="px-1.5 py-0.5 text-xs border border-[var(--rule)] rounded text-[var(--ink-2)] disabled:opacity-30"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      disabled={idx === data.design.sectionOrder.length - 1}
                      onClick={() => moveSection(idx, 'down')}
                      className="px-1.5 py-0.5 text-xs border border-[var(--rule)] rounded text-[var(--ink-2)] disabled:opacity-30"
                    >
                      ↓
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleSectionVisibility(sec)}
                    className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
                    title={isHidden ? 'Показать' : 'Скрыть'}
                  >
                    {isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
