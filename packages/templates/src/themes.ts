import { Lang } from '@cvb/shared';

export interface Theme {
  id: string;
  name: Record<Lang, string>;
  accent: string;
}

export const themes: Theme[] = [
  { id: 'blue', name: { ru: 'Лазурный', uz: 'Moviy', en: 'Blue' }, accent: '#2563EB' },
  { id: 'emerald', name: { ru: 'Изумрудный', uz: 'Zumrad', en: 'Emerald' }, accent: '#059669' },
  { id: 'graphite', name: { ru: 'Графитовый', uz: 'Grafit', en: 'Graphite' }, accent: '#374151' },
  { id: 'burgundy', name: { ru: 'Бордовый', uz: 'To‘q qizil', en: 'Burgundy' }, accent: '#9F1239' },
  { id: 'violet', name: { ru: 'Фиолетовый', uz: 'Binafsha', en: 'Violet' }, accent: '#7C3AED' },
  { id: 'terracotta', name: { ru: 'Терракотовый', uz: 'Pishgan g‘isht', en: 'Terracotta' }, accent: '#C2410C' },
  { id: 'teal', name: { ru: 'Морской', uz: 'Dengiz to‘lqini', en: 'Teal' }, accent: '#0F766E' },
  { id: 'mono', name: { ru: 'Монохром', uz: 'Monoxrom', en: 'Monochrome' }, accent: '#111111' },
];

export function getThemeById(id: string): Theme {
  return themes.find(t => t.id === id) || themes[0];
}
