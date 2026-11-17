const GOST_B: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh',
  з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'x', ц: 'cz',
  ч: 'ch', ш: 'sh', щ: 'shh', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu',
  я: 'ya',
  А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'Yo', Ж: 'Zh',
  З: 'Z', И: 'I', Й: 'J', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O',
  П: 'P', Р: 'R', С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'X', Ц: 'Cz',
  Ч: 'Ch', Ш: 'Sh', Щ: 'Shh', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu',
  Я: 'Ya',
  'ў': 'o', 'Ў': 'O', 'ғ': 'g', 'Ғ': 'G', 'қ': 'q', 'Қ': 'Q', 'ҳ': 'h', 'Ҳ': 'H'
};

export function translit(input: string): string {
  if (!input) return '';
  // Normalize Uzbek apostrophes: ‘, ’, `, ʻ -> removed or standard
  const normalized = input
    .replace(/[ʻ’‘`]/g, '')
    .normalize('NFC');

  let result = '';
  for (const char of normalized) {
    if (GOST_B[char] !== undefined) {
      result += GOST_B[char];
    } else {
      result += char;
    }
  }

  // Replace spaces and special characters with underscores, keeping alphanumeric and hyphens
  return result
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}

export function getResumeFileName(
  fullName: string,
  position: string,
  format: 'pdf-desktop' | 'pdf-mobile' | 'png-mobile'
): string {
  const namePart = translit(fullName.trim()) || 'Candidate';
  const posPart = translit(position.trim()) || 'Resume';
  const isMobile = format === 'pdf-mobile' || format === 'png-mobile';
  const ext = format === 'png-mobile' ? 'png' : 'pdf';
  const mobileSuffix = isMobile ? '_mobile' : '';

  return `${namePart}_${posPart}_CV${mobileSuffix}.${ext}`;
}
