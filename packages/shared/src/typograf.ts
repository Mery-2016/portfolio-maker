const PREPOSITIONS_RU = ['в', 'на', 'с', 'из', 'по', 'за', 'к', 'от', 'о', 'об', 'у', 'и', 'а', 'но', 'не', 'до', 'для', 'под', 'при'];
const PREPOSITIONS_UZ = ['va', 'ham', 'bilan', 'uchun', 'kabi', 'shu', 'bu', 'u', 'bir', 'da', 'ga', 'dan'];
const PREPOSITIONS_EN = ['a', 'an', 'the', 'in', 'on', 'at', 'to', 'for', 'of', 'by', 'and', 'or', 'as', 'is'];

const ALL_SHORT_WORDS = new Set([
  ...PREPOSITIONS_RU,
  ...PREPOSITIONS_UZ,
  ...PREPOSITIONS_EN,
  ...PREPOSITIONS_RU.map(w => w.toUpperCase()),
  ...PREPOSITIONS_RU.map(w => w[0].toUpperCase() + w.slice(1)),
  ...PREPOSITIONS_UZ.map(w => w[0].toUpperCase() + w.slice(1)),
  ...PREPOSITIONS_EN.map(w => w[0].toUpperCase() + w.slice(1)),
]);

export function normalizeUzApostrophe(text: string): string {
  if (!text) return '';
  // Convert modifier letter turned comma (ʻ), right single quote (’), backtick to left single quotation mark (‘)
  return text.replace(/[ʻ’`']/g, '‘');
}

export function typograf(text: string): string {
  if (!text) return '';

  let out = text;

  // Uzbek apostrophe normalize
  out = normalizeUzApostrophe(out);

  // Dash with non-breaking space: " - " or " — " -> "\u00A0— "
  out = out.replace(/(?<=\S)\s+[-—–]\s+/g, '\u00A0— ');

  // Non-breaking space after short prepositions/conjunctions (Unicode aware)
  out = out.replace(/(^|[\s(«"„])([a-zA-Zа-яА-ЯёЁ]{1,2})\s+/gu, (match, prefix, word) => {
    if (ALL_SHORT_WORDS.has(word) || word.length === 1) {
      return `${prefix}${word}\u00A0`;
    }
    return match;
  });

  return out;
}
