import fs from 'fs';
import path from 'path';

const EMOJI = /\p{Extended_Pictographic}/u;

const BANNED_RU = [
  'мечты', 'раскрой', 'потенциал', 'откройте для себя', 'новый уровень', 'волшеб', 'магия',
  'умный', 'невероятн', 'идеальн', 'всего лишь', 'легко и просто', 'в один клик',
  'не просто', 'революц', 'уникальн', 'инновацион', 'ии-', 'нейросет', 'бустан', 'апгрейд',
];

const BANNED_EN = [
  'dream', 'unlock', 'unleash', 'supercharge', 'magic', 'seamless', 'effortless',
  'game-changer', 'next level', 'ai-powered', 'revolutionary', 'cutting-edge',
];

interface LintRule {
  name: string;
  test: (content: string) => string | null;
  isWarning?: boolean;
}

const RULES: LintRule[] = [
  {
    name: 'Emoji Prohibition',
    test: (text: string) => {
      const match = text.match(EMOJI);
      return match ? `Обнаружен эмодзи: "${match[0]}"` : null;
    },
  },
  {
    name: 'Exclamation Mark Prohibition',
    test: (text: string) => {
      // Check for exclamation marks inside user-facing text strings
      const match = text.match(/!/);
      return match ? 'Восклицательный знак в тексте запрещён кодексом дизайна' : null;
    },
  },
  {
    name: 'Dash Cascade Prohibition',
    test: (text: string) => {
      const match = text.match(/—.*—.*—/);
      return match ? 'Каскад тире запрещён' : null;
    },
  },
  {
    name: 'Banned Words RU',
    test: (text: string) => {
      const lower = text.toLowerCase();
      for (const word of BANNED_RU) {
        if (lower.includes(word)) {
          return `Запрещённое слово / клише RU: "${word}"`;
        }
      }
      return null;
    },
  },
  {
    name: 'Banned Words EN',
    test: (text: string) => {
      const lower = text.toLowerCase();
      for (const word of BANNED_EN) {
        if (lower.includes(word)) {
          return `Запрещённое слово / клише EN: "${word}"`;
        }
      }
      return null;
    },
  },
];

function extractStringsFromFile(filePath: string): string[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  if (filePath.endsWith('.json')) {
    try {
      const parsed = JSON.parse(content);
      const strings: string[] = [];
      const walk = (val: any) => {
        if (typeof val === 'string') strings.push(val);
        else if (Array.isArray(val)) val.forEach(walk);
        else if (val && typeof val === 'object') Object.values(val).forEach(walk);
      };
      walk(parsed);
      return strings;
    } catch {
      return [content];
    }
  }

  // For code files, extract string literals
  const stringLiterals: string[] = [];
  const regex = /(['"`])((?:\\.|(?!\1)[^\\])*)\1/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const str = match[2];
    // Filter out imports, CSS variables, HTML tags
    if (str.length > 2 && !str.startsWith('var(--') && !str.startsWith('@') && !str.includes('http') && !/^[a-zA-Z0-9_\-\.\/]+$/.test(str)) {
      stringLiterals.push(str);
    }
  }
  return stringLiterals;
}

export function lintFile(filePath: string): { errors: string[]; warnings: string[] } {
  const strings = extractStringsFromFile(filePath);
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const text of strings) {
    for (const rule of RULES) {
      const errorMsg = rule.test(text);
      if (errorMsg) {
        const msg = `${path.basename(filePath)}: "${text.slice(0, 30)}..." -> ${errorMsg}`;
        if (rule.isWarning) {
          warnings.push(msg);
        } else {
          errors.push(msg);
        }
      }
    }
  }

  return { errors, warnings };
}

// Check files when run directly
const filesToCheck = [
  'c:/porfolio-maker/packages/shared/src/positions.json',
  'c:/porfolio-maker/packages/shared/src/skills-dictionary.json',
  'c:/porfolio-maker/packages/templates/src/i18n.ts',
];

let hasErrors = false;
console.log('Running Copy-Lint (DESIGN §13.3 anti-slop check)...');
for (const f of filesToCheck) {
  if (fs.existsSync(f)) {
    const { errors, warnings } = lintFile(f);
    for (const w of warnings) console.warn('WARN:', w);
    for (const e of errors) {
      console.error('ERROR:', e);
      hasErrors = true;
    }
  }
}

if (hasErrors) {
  console.error('Copy-lint failed. Please fix violations.');
  process.exit(1);
} else {
  console.log('Copy-lint passed clean: no slop, no emojis, no clichés.');
}
