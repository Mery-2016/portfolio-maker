import React from 'react';
import { useResumeStore } from '../../store/resume.js';

export const StepContacts: React.FC = () => {
  const { data, updateField } = useResumeStore();

  return (
    <div className="space-y-6">
      <h1 className="font-voice text-2xl font-bold text-[var(--ink)]">Контакты</h1>

      {/* Phone */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Телефон
        </label>
        <input
          type="tel"
          value={data.contacts.phone}
          onChange={(e) => updateField('contacts.phone', e.target.value)}
          placeholder="+998 90 123 45 67"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Электронная почта
        </label>
        <input
          type="email"
          value={data.contacts.email}
          onChange={(e) => updateField('contacts.email', e.target.value)}
          placeholder="ivan.petrov@example.com"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>

      {/* Telegram */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Telegram
        </label>
        <input
          type="text"
          value={data.contacts.telegram || ''}
          onChange={(e) => updateField('contacts.telegram', e.target.value)}
          placeholder="@username"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>

      {/* LinkedIn */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          LinkedIn
        </label>
        <input
          type="url"
          value={data.contacts.linkedin || ''}
          onChange={(e) => updateField('contacts.linkedin', e.target.value)}
          placeholder="https://linkedin.com/in/username"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>

      {/* Website */}
      <div>
        <label className="block text-xs font-medium tracking-wide text-[var(--ink-2)] mb-1.5">
          Сайт или портфолио
        </label>
        <input
          type="url"
          value={data.contacts.website || ''}
          onChange={(e) => updateField('contacts.website', e.target.value)}
          placeholder="https://mysite.dev"
          className="w-full h-11 px-3.5 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] hover:border-[var(--rule-strong)] transition-colors"
        />
      </div>
    </div>
  );
};
