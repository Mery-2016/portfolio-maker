import React, { useState } from 'react';
import { useResumeStore } from '../../store/resume.js';
import { skillsDictionary, LangLevel } from '@cvb/shared';
import { X, Plus } from 'lucide-react';

const LANG_LEVELS: LangLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'native'];

export const StepSkills: React.FC = () => {
  const { data, addSkill, removeSkill, addLanguage, removeLanguage } = useResumeStore();

  const [hardInput, setHardInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [langNameInput, setLangNameInput] = useState('');
  const [langLevelInput, setLangLevelInput] = useState<LangLevel>('B2');

  const [hardSuggestions, setHardSuggestions] = useState<string[]>([]);

  const handleHardInputChange = (val: string) => {
    setHardInput(val);
    if (val.trim().length > 0) {
      const lower = val.toLowerCase();
      const matches = skillsDictionary.hard.filter(s => s.toLowerCase().includes(lower));
      setHardSuggestions(matches.slice(0, 6));
    } else {
      setHardSuggestions([]);
    }
  };

  const handleAddHard = (name: string) => {
    if (!name.trim()) return;
    addSkill('hard', name);
    setHardInput('');
    setHardSuggestions([]);
  };

  const handleAddSoft = (name: string) => {
    if (!name.trim()) return;
    addSkill('soft', name);
    setSoftInput('');
  };

  const handleAddLanguage = () => {
    if (!langNameInput.trim()) return;
    addLanguage(langNameInput, langLevelInput);
    setLangNameInput('');
  };

  return (
    <div className="space-y-7">
      <h1 className="font-voice text-2xl font-bold text-[var(--ink)]">Навыки и языки</h1>

      {/* Hard Skills */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-2">
          Профессиональные навыки (Hard Skills)
        </label>

        {/* Input */}
        <div className="relative mb-3">
          <input
            type="text"
            value={hardInput}
            onChange={(e) => handleHardInputChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddHard(hardInput);
              }
            }}
            placeholder="Начните вводить навык, например React или Excel"
            className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
          />

          {hardSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] shadow-lg z-20 py-1 flex flex-wrap gap-1 p-2">
              {hardSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleAddHard(s)}
                  className="px-2.5 py-1 text-xs bg-[var(--paper)] hover:bg-[var(--lazur-wash)] text-[var(--ink)] rounded-full transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 min-h-8">
          {data.skills.hard.map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs bg-[var(--surface)] border border-[var(--rule)] rounded-full text-[var(--ink)] group hover:border-[var(--rule-strong)] transition-colors select-none"
            >
              <span>{skill.name}</span>
              <button
                type="button"
                onClick={() => removeSkill('hard', idx)}
                className="text-[var(--ink-3)] group-hover:text-[var(--brick)] transition-colors"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Soft Skills */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-2">
          Личные качества и подход к работе (Soft Skills)
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={softInput}
            onChange={(e) => setSoftInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddSoft(softInput);
              }
            }}
            placeholder="Например: Наставничество, Переговоры"
            className="flex-1 h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
          />
          <button
            type="button"
            onClick={() => handleAddSoft(softInput)}
            className="px-4 text-xs font-medium border border-[var(--rule-strong)] text-[var(--ink)] rounded-[var(--radius-1)] hover:bg-[var(--rule)]/20 transition-colors"
          >
            Добавить
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.skills.soft.map((skill, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs bg-[var(--surface)] border border-[var(--rule)] rounded-full text-[var(--ink)] group hover:border-[var(--rule-strong)] transition-colors select-none"
            >
              <span>{skill}</span>
              <button
                type="button"
                onClick={() => removeSkill('soft', idx)}
                className="text-[var(--ink-3)] group-hover:text-[var(--brick)] transition-colors"
              >
                <X size={12} strokeWidth={1.5} />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Languages */}
      <div>
        <label className="block text-xs font-medium uppercase tracking-wider text-[var(--ink-2)] mb-2">
          Владение языками
        </label>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={langNameInput}
            onChange={(e) => setLangNameInput(e.target.value)}
            placeholder="Язык, например: Английский"
            className="flex-1 h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
          />
          <select
            value={langLevelInput}
            onChange={(e) => setLangLevelInput(e.target.value as LangLevel)}
            className="w-28 h-11 px-2.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
          >
            {LANG_LEVELS.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAddLanguage}
            className="px-4 text-xs font-medium border border-[var(--rule-strong)] text-[var(--ink)] rounded-[var(--radius-1)] hover:bg-[var(--rule)]/20 transition-colors"
          >
            Добавить
          </button>
        </div>

        <div className="space-y-1.5">
          {data.skills.languages.map((l, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center px-3 py-2 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm"
            >
              <span className="text-[var(--ink)] font-medium">{l.name}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-[var(--ink-2)]">{l.level}</span>
                <button
                  type="button"
                  onClick={() => removeLanguage(idx)}
                  className="text-[var(--ink-3)] hover:text-[var(--brick)]"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
