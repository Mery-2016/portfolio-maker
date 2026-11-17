import React from 'react';
import { ResumeData, SectionKey } from '@cvb/shared';
import { getSectionTitle } from '../i18n.js';
import { TemplateProps } from '../types.js';

export const AtsTemplate: React.FC<TemplateProps> = ({ data, format }) => {
  const isMobile = format === 'mobile';
  const lang = data.language;
  const isHidden = (sec: SectionKey) => data.design.hiddenSections.includes(sec);

  const contactList = [
    data.contacts.phone,
    data.contacts.email,
    data.contacts.telegram ? `Telegram: ${data.contacts.telegram}` : null,
    data.contacts.linkedin ? `LinkedIn: ${data.contacts.linkedin}` : null,
    data.contacts.website ? `Portfolio: ${data.contacts.website}` : null,
    data.personal.city,
  ].filter(Boolean);

  const renderSection = (sec: SectionKey) => {
    if (isHidden(sec)) return null;

    switch (sec) {
      case 'summary':
        if (!data.ai.summary) return null;
        return (
          <section key="summary" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--rule)] pb-0.5 mb-2">
              {getSectionTitle('summary', lang)}
            </h2>
            <p className="text-xs leading-relaxed text-[#111827] whitespace-pre-line">
              {data.ai.summary}
            </p>
          </section>
        );

      case 'strengths':
        if (!data.ai.strengths || data.ai.strengths.length === 0) return null;
        return (
          <section key="strengths" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--rule)] pb-0.5 mb-2">
              {getSectionTitle('strengths', lang)}
            </h2>
            <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[#111827]">
              {data.ai.strengths.map((str, idx) => (
                <li key={idx}>
                  <strong>{str.title}:</strong> {str.evidence}
                </li>
              ))}
            </ul>
          </section>
        );

      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key="experience" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--rule)] pb-0.5 mb-2">
              {getSectionTitle('experience', lang)}
            </h2>
            <div className="space-y-4">
              {data.experience.map(item => {
                const bullets = (item.useAi && item.aiBullets && item.aiBullets.length > 0)
                  ? item.aiBullets
                  : (item.rawDescription ? item.rawDescription.split('\n').filter(Boolean) : []);

                return (
                  <div key={item.id} className="text-xs">
                    <div className="flex justify-between font-bold text-[#111827]">
                      <span>{item.role}</span>
                      <span>{item.startDate} — {item.endDate || getSectionTitle('present', lang)}</span>
                    </div>
                    <div className="italic text-[#374151] mb-1">{item.company}</div>
                    {bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-[#111827] leading-relaxed">
                        {bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'projects':
        if (data.projects.length === 0) return null;
        return (
          <section key="projects" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--rule)] pb-0.5 mb-2">
              {getSectionTitle('projects', lang)}
            </h2>
            <div className="space-y-3">
              {data.projects.map(proj => {
                const bullets = proj.aiBullets && proj.aiBullets.length > 0
                  ? proj.aiBullets
                  : (proj.rawDescription ? [proj.rawDescription] : []);

                return (
                  <div key={proj.id} className="text-xs">
                    <div className="font-bold text-[#111827]">{proj.name}</div>
                    {proj.link && <div className="text-[#4B5563]">{proj.link}</div>}
                    {bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-[#111827] leading-relaxed mt-1">
                        {bullets.map((b, bIdx) => (
                          <li key={bIdx}>{b}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );

      case 'education':
        if (data.education.length === 0) return null;
        return (
          <section key="education" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--rule)] pb-0.5 mb-2">
              {getSectionTitle('education', lang)}
            </h2>
            <div className="space-y-2 text-xs">
              {data.education.map(edu => (
                <div key={edu.id} className="flex justify-between">
                  <div>
                    <span className="font-bold text-[#111827]">{edu.institution}</span>
                    <span className="text-[#374151]"> — {edu.specialty}</span>
                  </div>
                  <span className="text-[#374151]">{edu.graduationYear}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'skills':
        if (data.skills.hard.length === 0 && data.skills.soft.length === 0) return null;
        return (
          <section key="skills" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--rule)] pb-0.5 mb-2">
              {getSectionTitle('skills', lang)}
            </h2>
            <div className="space-y-1 text-xs text-[#111827]">
              {data.skills.hard.length > 0 && (
                <div>
                  <strong>Hard Skills:</strong> {data.skills.hard.map(s => s.name).join(', ')}
                </div>
              )}
              {data.skills.soft.length > 0 && (
                <div>
                  <strong>Soft Skills:</strong> {data.skills.soft.join(', ')}
                </div>
              )}
            </div>
          </section>
        );

      case 'languages':
        if (data.skills.languages.length === 0) return null;
        return (
          <section key="languages" className="mb-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] border-b border-[var(--rule)] pb-0.5 mb-2">
              {getSectionTitle('languages', lang)}
            </h2>
            <div className="text-xs text-[#111827]">
              {data.skills.languages.map(l => `${l.name} (${l.level})`).join(', ')}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const containerClass = isMobile
    ? 'p-5 font-mono bg-white text-[#111827]'
    : 'w-[794px] min-h-[1123px] bg-white text-[#111827] p-12 font-sans leading-normal shadow-[var(--shadow-sheet)]';

  return (
    <div className={containerClass} data-format={format}>
      <header className="mb-6 pb-2 border-b-2 border-[#111827]">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827] uppercase">
          {data.personal.fullName || 'ИМЯ ФАМИЛИЯ'}
        </h1>
        <h2 className="text-sm font-semibold text-[var(--accent)] uppercase mb-2">
          {data.personal.position || 'ЖЕЛАЕМАЯ ДОЛЖНОСТЬ'}
        </h2>
        <div className="text-xs text-[#374151]">
          {contactList.join(' | ')}
        </div>
      </header>

      <div>{data.design.sectionOrder.map(renderSection)}</div>
    </div>
  );
};
