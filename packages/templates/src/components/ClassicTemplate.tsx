import React from 'react';
import { ResumeData, SectionKey } from '@cvb/shared';
import { getSectionTitle } from '../i18n.js';
import { ContactLinks } from './ContactLinks.js';
import { TemplateProps } from '../types.js';

export const ClassicTemplate: React.FC<TemplateProps> = ({ data, format, photoUrl }) => {
  const isMobile = format === 'mobile';
  const lang = data.language;
  const isHidden = (sec: SectionKey) => data.design.hiddenSections.includes(sec);
  const displayPhoto = photoUrl || data.personal.photoUrl;

  const renderSection = (sec: SectionKey) => {
    if (isHidden(sec)) return null;

    switch (sec) {
      case 'summary':
        if (!data.ai.summary) return null;
        return (
          <section key="summary" className="mb-6 break-inside-avoid">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--accent)] mb-2 pb-1 border-b border-[var(--accent)]">
              {getSectionTitle('summary', lang)}
            </h3>
            <p className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-line">
              {data.ai.summary}
            </p>
          </section>
        );

      case 'strengths':
        if (!data.ai.strengths || data.ai.strengths.length === 0) return null;
        return (
          <section key="strengths" className="mb-6 break-inside-avoid">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--accent)] mb-2.5 pb-1 border-b border-[var(--accent)]">
              {getSectionTitle('strengths', lang)}
            </h3>
            <div className="space-y-1.5 text-sm">
              {data.ai.strengths.map((str, idx) => (
                <div key={idx}>
                  <span className="font-semibold text-[var(--text)]">{str.title} — </span>
                  <span className="text-[var(--muted)]">{str.evidence}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'experience':
        if (data.experience.length === 0) return null;
        return (
          <section key="experience" className="mb-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--accent)] mb-3 pb-1 border-b border-[var(--accent)] break-after-avoid">
              {getSectionTitle('experience', lang)}
            </h3>
            <div className="flex flex-col gap-4">
              {data.experience.map(item => {
                const bullets = (item.useAi && item.aiBullets && item.aiBullets.length > 0)
                  ? item.aiBullets
                  : (item.rawDescription ? item.rawDescription.split('\n').filter(Boolean) : []);

                return (
                  <div key={item.id} className="break-inside-avoid exp-item">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <span className="font-bold text-sm text-[var(--text)]">{item.role}</span>
                      <span className="text-xs text-[var(--muted)] font-mono">
                        {item.startDate} — {item.endDate || getSectionTitle('present', lang)}
                      </span>
                    </div>
                    <div className="text-xs font-medium italic text-[var(--muted)] mb-1.5">
                      {item.company}
                    </div>
                    {bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[var(--text)] leading-relaxed">
                        {bullets.map((b, bIdx) => (
                          <li key={bIdx} className={item.highlights?.includes(bIdx) ? 'font-medium' : ''}>
                            {b}
                          </li>
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
          <section key="projects" className="mb-6">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--accent)] mb-3 pb-1 border-b border-[var(--accent)] break-after-avoid">
              {getSectionTitle('projects', lang)}
            </h3>
            <div className="flex flex-col gap-3">
              {data.projects.map(proj => {
                const bullets = proj.aiBullets && proj.aiBullets.length > 0
                  ? proj.aiBullets
                  : (proj.rawDescription ? [proj.rawDescription] : []);

                return (
                  <div key={proj.id} className="break-inside-avoid project-item">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-sm text-[var(--text)]">{proj.name}</span>
                      {proj.link && (
                        <a href={proj.link} target="_blank" rel="noreferrer" className="text-xs text-[var(--accent)] hover:underline">
                          {proj.link.replace(/^https?:\/\//, '')}
                        </a>
                      )}
                    </div>
                    {bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[var(--text)] leading-relaxed">
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
          <section key="education" className="mb-6 break-inside-avoid edu-item">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--accent)] mb-3 pb-1 border-b border-[var(--accent)] break-after-avoid">
              {getSectionTitle('education', lang)}
            </h3>
            <div className="flex flex-col gap-2">
              {data.education.map(edu => (
                <div key={edu.id} className="flex justify-between items-baseline text-sm">
                  <div>
                    <span className="font-bold text-[var(--text)]">{edu.institution}</span>
                    <span className="text-xs text-[var(--muted)] ml-2">— {edu.specialty}</span>
                  </div>
                  <span className="text-xs text-[var(--muted)] font-mono">{edu.graduationYear}</span>
                </div>
              ))}
            </div>
          </section>
        );

      case 'skills':
        if (data.skills.hard.length === 0 && data.skills.soft.length === 0) return null;
        return (
          <section key="skills" className="mb-6 break-inside-avoid">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--accent)] mb-2.5 pb-1 border-b border-[var(--accent)]">
              {getSectionTitle('skills', lang)}
            </h3>
            <div className="space-y-1.5 text-xs text-[var(--text)]">
              {data.skills.hard.length > 0 && (
                <div>
                  <span className="font-semibold text-[var(--muted)]">Hard skills: </span>
                  <span>{data.skills.hard.map(s => s.name).join(', ')}</span>
                </div>
              )}
              {data.skills.soft.length > 0 && (
                <div>
                  <span className="font-semibold text-[var(--muted)]">Soft skills: </span>
                  <span>{data.skills.soft.join(', ')}</span>
                </div>
              )}
            </div>
          </section>
        );

      case 'languages':
        if (data.skills.languages.length === 0) return null;
        return (
          <section key="languages" className="mb-6 break-inside-avoid">
            <h3 className="text-xs uppercase tracking-widest font-bold text-[var(--accent)] mb-2.5 pb-1 border-b border-[var(--accent)]">
              {getSectionTitle('languages', lang)}
            </h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
              {data.skills.languages.map((l, idx) => (
                <span key={idx} className="text-[var(--text)]">
                  <span className="font-medium">{l.name}:</span> <span className="text-[var(--muted)]">{l.level}</span>
                </span>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const containerClass = isMobile
    ? 'p-5 font-serif bg-[var(--bg)] text-[var(--text)]'
    : 'w-[794px] min-h-[1123px] bg-[var(--bg)] text-[var(--text)] p-12 font-serif leading-normal shadow-[var(--shadow-sheet)]';

  return (
    <div className={containerClass} data-format={format}>
      {/* Header */}
      <header className="text-center mb-8 pb-4 border-b-2 border-[var(--rule)]">
        {displayPhoto && (
          <div className="flex justify-center mb-3">
            <img
              src={displayPhoto}
              alt={data.personal.fullName}
              className="w-24 h-24 rounded-full object-cover border border-[var(--rule)] shadow-sm"
            />
          </div>
        )}
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] mb-1">
          {data.personal.fullName || 'Имя Фамилия'}
        </h1>
        <h2 className="text-sm font-medium tracking-wide uppercase text-[var(--accent)] mb-3">
          {data.personal.position || 'Желаемая должность'}
        </h2>
        <div className="flex justify-center">
          <ContactLinks contacts={data.contacts} format={format} className="justify-center" />
        </div>
      </header>

      {/* Sections */}
      {data.design.sectionOrder.map(renderSection)}
    </div>
  );
};
