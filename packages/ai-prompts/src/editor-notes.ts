export interface MarginNoteRule {
  id: string;
  note: string;
  severity?: 'normal' | 'warning';
}

export function generateEditorNotes(
  rawText: string,
  generatedBullets: string[],
  removedHallucination: boolean = false
): string[] {
  const notes: string[] = [];
  const rawLower = (rawText || '').toLowerCase();
  const bulletsCombined = generatedBullets.join(' ');
  const bulletsLower = bulletsCombined.toLowerCase();

  // 1. Check if raw text was short (< 80 chars)
  if (rawText.trim().length > 0 && rawText.trim().length < 80) {
    notes.push('мало деталей — добавьте результат');
  }

  // 2. Check for numbers transferred from raw input
  const rawNumbers: string[] = rawText.match(/\d+/g) || [];
  const bulletNumbers: string[] = bulletsCombined.match(/\d+/g) || [];
  if (rawNumbers.length > 0 && bulletNumbers.some((n: string) => rawNumbers.includes(n))) {
    notes.push('цифры взяты из вашего текста');
  }

  // 3. Check for tech name normalization (e.g., next -> Next.js, react -> React)
  if (rawLower.includes('next') && bulletsCombined.includes('Next.js')) {
    notes.push('уточнил названия: next → Next.js');
  } else if (rawLower.includes('js') && bulletsCombined.includes('JavaScript')) {
    notes.push('уточнил названия: js → JavaScript');
  } else if (rawLower.includes('ts') && bulletsCombined.includes('TypeScript')) {
    notes.push('уточнил названия: ts → TypeScript');
  }

  // 4. Check for clichés removed
  const cliches = ['стрессоустойчив', 'коммуникабельн', 'быстро обуча', 'ответственн', 'командный игрок'];
  if (cliches.some(c => rawLower.includes(c)) && !cliches.some(c => bulletsLower.includes(c))) {
    notes.push('убрал общие слова');
  }

  // 5. Converted to achievements (action verbs like Руководил, Перевёл, Разработал, Внедрил, Ускорил)
  const actionVerbs = ['разработал', 'внедрил', 'руководил', 'ускорил', 'перевёл', 'спроектировал', 'оптимизировал', 'сократил', 'повысил'];
  if (actionVerbs.some(v => bulletsLower.includes(v))) {
    if (!notes.includes('перевёл в достижения')) {
      notes.push('перевёл в достижения');
    }
  }

  // 6. Removed hallucination
  if (removedHallucination) {
    notes.push('убрал пункт, которого нет в ваших данных');
  }

  // Return at most 2 notes as per DESIGN §9.3
  return notes.slice(0, 2);
}
