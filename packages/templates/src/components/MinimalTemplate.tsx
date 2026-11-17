import React from 'react';
import { ResumeData, SectionKey } from '@cvb/shared';
import { getSectionTitle } from '../i18n.js';
import { ContactLinks } from './ContactLinks.js';
import { TemplateProps } from '../types.js';

export const MinimalTemplate: React.FC<TemplateProps> = ({ data, format, photoUrl }) => {
  const isMobile = format === 'mobile';
  const lang = data.language;
  const isHidden = (sec: SectionKey) => data.design.hiddenSections.includes(sec);
  const displayPhoto = photoUrl || data.personal.photoUrl;

  const renderSection = (sec: SectionKey) => {
    if (isHidden(sec)) return null;

    let title = getSectionTitle(sec, lang);
    let content: React.ReactNode = null;

    switch (sec) {
      case 'summary':
        if (!data.ai.summary) return null;
        content = (
          <p className="text-sm leading-relaxed text-[var(--text)] whitespace-pre-line">
            {data.ai.summary}
          </p>
        );
        break;

      case 'strengths':
        if (!data.ai.strengths || data.ai.strengths.length === 0) return null;
        content = (
          <div className="space-y-1.5 text-sm">
            {data.ai.strengths.map((str, idx) => (
              <div key={idx}>
                <span className="font-semibold text-[var(--text)]">{str.title} — </span>
                <span className="text-[var(--muted)]">{str.evidence}</span>
              </div>
            ))}
          </div>
        );
        break;

      case 'experience':
        if (data.experience.length === 0) return null;
        content = (
          <div className="space-y-5">
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
                  <div className="text-xs text-[var(--accent)] font-medium mb-1.5">{item.company}</div>
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
        );
        break;

      case 'projects':
        if (data.projects.length === 0) return null;
        content = (
          <div className="space-y-4">
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
        );
        break;

      case 'education':
        if (data.education.length === 0) return null;
        content = (
          <div className="space-y-2">
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
        );
        break;

      case 'skills':
        if (data.skills.hard.length === 0 && data.skills.soft.length === 0) return null;
        content = (
          <div className="space-y-1.5 text-xs text-[var(--text)]">
            {data.skills.hard.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {data.skills.hard.map((s, idx) => (
                  <span key={idx} className="bg-[var(--accent-soft)] px-2 py-0.5 rounded text-[var(--text)] font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            )}
            {data.skills.soft.length > 0 && (
              <div className="text-[var(--muted)] pt-1">
                {data.skills.soft.join(' · ')}
              </div>
            )}
          </div>
        );
        break;

      case 'languages':
        if (data.skills.languages.length === 0) return null;
        content = (
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {data.skills.languages.map((l, idx) => (
              <span key={idx} className="text-[var(--text)]">
                <span className="font-medium">{l.name}:</span> <span className="text-[var(--muted)]">{l.level}</span>
              </span>
            ))}
          </div>
        );
        break;

      default:
        return null;
    }

    if (!content) return null;

    if (isMobile) {
      return (
        <section key={sec} className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] mb-2">
            {title}
          </h3>
          {content}
        </section>
      );
    }

    return (
      <div key={sec} className="grid grid-cols-[160px_1fr] gap-6 mb-7 break-inside-avoid">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--accent)] pt-0.5">
          {title}
        </h3>
        <div>{content}</div>
      </div>
    );
  };

  const containerClass = isMobile
    ? 'p-5 font-sans bg-[var(--bg)] text-[var(--text)]'
    : 'w-[794px] min-h-[1123px] bg-[var(--bg)] text-[var(--text)] p-12 font-sans leading-normal shadow-[var(--shadow-sheet)]';

  return (
    <div className={containerClass} data-format={format}>
      {/* Header */}
      <header className="mb-8 pb-5 border-b border-[var(--rule)]">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] mb-1">
              {data.personal.fullName || 'Имя Фамилия'}
            </h1>
            <h2 className="text-sm font-semibold text-[var(--accent)] mb-3">
              {data.personal.position || 'Желаемая должность'}
            </h2>
            <ContactLinks contacts={data.contacts} format={format} />
          </div>
          {displayPhoto && (
            <img
              src={displayPhoto}
              alt={data.personal.fullName}
              className="w-20 h-20 rounded-md object-cover border border-[var(--rule)] shrink-0"
            />
          )}
        </div>
      </header>

      {/* Sections */}
      <div>{data.design.sectionOrder.map(renderSection)}</div>
    </div>
  );
};
