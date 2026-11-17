import { Lang } from '@cvb/shared';
import ruSlop from './slop/ru.json' with { type: 'json' };
import uzSlop from './slop/uz.json' with { type: 'json' };
import enSlop from './slop/en.json' with { type: 'json' };

const SLOP_DICTIONARIES: Record<Lang, string[]> = {
  ru: ruSlop,
  uz: uzSlop,
  en: enSlop,
};

export interface RawInputContext {
  language: Lang;
  rawExperienceMap: Record<string, string>; // ref -> rawDescription
  rawProjectsMap: Record<string, string>;
  allRawText: string;
}

export interface ValidationIssue {
  type: 'hallucination_number' | 'slop' | 'length' | 'schema';
  message: string;
  field: string;
}

export interface PostValidationResult {
  isValid: boolean;
  issues: ValidationIssue[];
  warnings: string[];
  sanitized: {
    summary: string;
    experience: Array<{ ref: string; bullets: string[]; highlights: number[] }>;
    projects: Array<{ ref: string; bullets: string[] }>;
    strengths: Array<{ title: string; evidence: string }>;
  };
}

export function postValidateResumeOutput(
  output: any,
  context: RawInputContext
): PostValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: string[] = [];
  const slopList = SLOP_DICTIONARIES[context.language] || SLOP_DICTIONARIES.ru;

  let summary = typeof output?.summary === 'string' ? output.summary : '';
  if (summary.length > 700) {
    // Trim to last sentence
    const trimmed = summary.slice(0, 700);
    const lastPeriod = Math.max(trimmed.lastIndexOf('.'), trimmed.lastIndexOf('!'), trimmed.lastIndexOf('?'));
    summary = lastPeriod > 300 ? trimmed.slice(0, lastPeriod + 1) : trimmed;
    warnings.push('SUMMARY_TRIMMED');
  }

  // Check slop in summary
  for (const slopWord of slopList) {
    if (summary.toLowerCase().includes(slopWord.toLowerCase())) {
      issues.push({
        type: 'slop',
        field: 'summary',
        message: `Обнаружен шаблонный оборот: "${slopWord}"`,
      });
    }
  }

  // Process experience
  const sanitizedExp: Array<{ ref: string; bullets: string[]; highlights: number[] }> = [];
  const expItems = Array.isArray(output?.experience) ? output.experience : [];

  for (const item of expItems) {
    const ref = item.ref || 'e1';
    const rawForRef = context.rawExperienceMap[ref] || '';
    const rawNumbers = (rawForRef.match(/\d+/g) || []).map(Number);
    const validBullets: string[] = [];

    const bullets = Array.isArray(item.bullets) ? item.bullets : [];
    for (const b of bullets) {
      if (typeof b !== 'string' || !b.trim()) continue;
      let bullet = b.trim();
      if (bullet.length > 220) {
        bullet = bullet.slice(0, 220);
      }

      // Check numbers
      const bulletNumbers = (bullet.match(/\d+/g) || []).map(Number);
      const unverifiedNumbers = bulletNumbers.filter(
        n => !rawNumbers.includes(n) && n < 1960 && n > 10 // ignore graduation years/common counts
      );

      // Check slop
      let hasSlop = false;
      for (const slopWord of slopList) {
        if (bullet.toLowerCase().includes(slopWord.toLowerCase())) {
          hasSlop = true;
          issues.push({
            type: 'slop',
            field: `experience.${ref}`,
            message: `Шаблонная фраза: "${slopWord}"`,
          });
          break;
        }
      }

      if (unverifiedNumbers.length > 0) {
        issues.push({
          type: 'hallucination_number',
          field: `experience.${ref}`,
          message: `Числа [${unverifiedNumbers.join(', ')}] отсутствуют в исходном описании`,
        });
      }

      // Keep bullet if no critical hallucination
      if (unverifiedNumbers.length === 0 && !hasSlop) {
        validBullets.push(bullet);
      } else if (validBullets.length === 0) {
        // Fallback: don't leave completely empty, keep cleaned bullet
        validBullets.push(bullet);
      }
    }

    sanitizedExp.push({
      ref,
      bullets: validBullets.slice(0, 6),
      highlights: Array.isArray(item.highlights) ? item.highlights : [0],
    });
  }

  // Process projects
  const sanitizedProjects: Array<{ ref: string; bullets: string[] }> = [];
  const projectItems = Array.isArray(output?.projects) ? output.projects : [];
  for (const p of projectItems) {
    const ref = p.ref || 'p1';
    const bullets = Array.isArray(p.bullets) ? p.bullets.filter((b: any) => typeof b === 'string' && b.trim()) : [];
    sanitizedProjects.push({
      ref,
      bullets: bullets.map((b: string) => b.slice(0, 220)).slice(0, 5),
    });
  }

  // Process strengths
  const sanitizedStrengths: Array<{ title: string; evidence: string }> = [];
  const strengthsItems = Array.isArray(output?.strengths) ? output.strengths : [];
  for (const s of strengthsItems) {
    if (typeof s?.title === 'string' && typeof s?.evidence === 'string') {
      sanitizedStrengths.push({
        title: s.title.slice(0, 60),
        evidence: s.evidence.slice(0, 200),
      });
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
    warnings,
    sanitized: {
      summary,
      experience: sanitizedExp,
      projects: sanitizedProjects,
      strengths: sanitizedStrengths,
    },
  };
}
