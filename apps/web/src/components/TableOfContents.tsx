import React from 'react';
import { motion } from 'motion/react';
import { useResumeStore } from '../store/resume.js';

interface StepItem {
  id: number;
  title: string;
  getStatus: (data: any) => string;
  isComplete: (data: any) => boolean;
}

const STEPS: StepItem[] = [
  {
    id: 1,
    title: 'Личные данные',
    getStatus: (d) => (d.personal.fullName && d.personal.position ? '✓' : ''),
    isComplete: (d) => !!(d.personal.fullName && d.personal.position),
  },
  {
    id: 2,
    title: 'Контакты',
    getStatus: (d) => (d.contacts.phone || d.contacts.email ? '✓' : ''),
    isComplete: (d) => !!(d.contacts.phone || d.contacts.email),
  },
  {
    id: 3,
    title: 'Опыт',
    getStatus: (d) => {
      const count = d.experience.length;
      if (count === 0) return '';
      if (count === 1) return '1 запись';
      if (count < 5) return `${count} записи`;
      return `${count} записей`;
    },
    isComplete: (d) => d.experience.length > 0,
  },
  {
    id: 4,
    title: 'Образование',
    getStatus: (d) => {
      const count = d.education.length;
      return count > 0 ? `${count}` : '';
    },
    isComplete: (d) => d.education.length > 0,
  },
  {
    id: 5,
    title: 'Навыки',
    getStatus: (d) => {
      const count = d.skills.hard.length;
      return count > 0 ? `${count}` : '';
    },
    isComplete: (d) => d.skills.hard.length > 0,
  },
  {
    id: 6,
    title: 'Вид',
    getStatus: () => '',
    isComplete: () => true,
  },
];

export const TableOfContents: React.FC = () => {
  const { currentStep, setCurrentStep, data, setEditorialMode, editorialMode } = useResumeStore();

  return (
    <nav className="w-56 shrink-0 pr-4 select-none">
      <div className="font-voice text-lg font-bold text-[var(--ink)] mb-3 pb-1 border-b border-[var(--rule)]">
        Содержание
      </div>

      <div className="flex flex-col space-y-1 relative">
        {STEPS.map((step) => {
          const isActive = currentStep === step.id && !editorialMode;
          const status = step.getStatus(data);

          return (
            <button
              key={step.id}
              onClick={() => {
                setEditorialMode(false);
                setCurrentStep(step.id);
              }}
              className={`relative flex items-baseline w-full text-left py-1.5 px-2 text-sm rounded-[var(--radius-1)] transition-colors group ${
                isActive
                  ? 'text-[var(--ink)] font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--rule)]/20'
              }`}
            >
              {/* Sliding lazur marker indicator */}
              {isActive && (
                <motion.div
                  layoutId="toc-marker"
                  className="absolute left-0 top-1 bottom-1 w-0.5 bg-[var(--lazur)] rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}

              <span className="shrink-0">{step.title}</span>

              {/* Dotted leader filler */}
              <span className="flex-1 mx-2 border-b border-dotted border-[var(--rule-strong)] translate-y-[-3px] opacity-60 group-hover:opacity-100" />

              <span className="shrink-0 font-mono text-xs text-[var(--ink-3)] font-medium">
                {step.id}
              </span>

              {status && (
                <span
                  className={`ml-2 text-xs font-mono shrink-0 ${
                    status === '✓' ? 'text-[var(--olive)]' : 'text-[var(--ink-2)]'
                  }`}
                >
                  {status}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
