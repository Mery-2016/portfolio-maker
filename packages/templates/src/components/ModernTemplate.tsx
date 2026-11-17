import React from 'react';
import { ResumeData, SectionKey } from '@cvb/shared';
import { getSectionTitle, getSkillLevelName } from '../i18n.js';
import { ContactLinks } from './ContactLinks.js';
import { TemplateProps } from '../types.js';

export const ModernTemplate: React.FC<TemplateProps> = ({ data, format, photoUrl }) => {
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
            <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-2">
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
            <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-2.5">
              {getSectionTitle('strengths', lang)}
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {data.ai.strengths.map((str, idx) => (
                <div key={idx} className="text-sm">
                  <span className="font-semibold text-[var(--text)]">{str.title}: </span>
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
            <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-3 pb-1 border-b border-[var(--rule)] break-after-avoid">
              {getSectionTitle('experience', lang)}
            </h3>
            <div className="flex flex-col gap-5">
              {data.experience.map(item => {
                const bullets = (item.useAi && item.aiBullets && item.aiBullets.length > 0)
                  ? item.aiBullets
                  : (item.rawDescription ? item.rawDescription.split('\n').filter(Boolean) : []);

                return (
                  <div key={item.id} className="break-inside-avoid exp-item">
                    <div className="flex justify-between items-baseline gap-2 mb-1">
                      <span className="font-bold text-sm text-[var(--text)]">{item.role}</span>
                      <span className="text-xs text-[var(--muted)] shrink-0 font-medium font-mono">
                        {item.startDate} — {item.endDate || getSectionTitle('present', lang)}
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-[var(--accent)] mb-1.5">{item.company}</div>
                    {bullets.length > 0 && (
                      <ul className="list-disc list-outside pl-4 space-y-1 text-xs text-[var(--text)] leading-relaxed">
                        {bullets.map((b, bIdx) => {
                          const isHighlighted = item.highlights?.includes(bIdx);
                          return (
                            <li key={bIdx} className={isHighlighted ? 'font-medium text-[var(--text)]' : 'text-[var(--text)]'}>
                              {b}
                            </li>
                          );
                        })}
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
            <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-3 pb-1 border-b border-[var(--rule)] break-after-avoid">
              {getSectionTitle('projects', lang)}
            </h3>
            <div className="flex flex-col gap-4">
              {data.projects.map(proj => {
                const bullets = proj.aiBullets && proj.aiBullets.length > 0
                  ? proj.aiBullets
                  : (proj.rawDescription ? [proj.rawDescription] : []);

                return (
                  <div key={proj.id} className="break-inside-avoid project-item">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="font-bold text-sm text-[var(--text)]">{proj.name}</span>
                      {proj.link && (
                        <a
                          href={proj.link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-[var(--accent)] hover:underline truncate max-w-[200px]"
                        >
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
            <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-3 pb-1 border-b border-[var(--rule)] break-after-avoid">
              {getSectionTitle('education', lang)}
            </h3>
            <div className="flex flex-col gap-3">
              {data.education.map(edu => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline gap-2">
                    <span className="font-bold text-sm text-[var(--text)]">{edu.institution}</span>
                    <span className="text-xs text-[var(--muted)] font-mono">{edu.graduationYear}</span>
                  </div>
                  <div className="text-xs text-[var(--muted)]">{edu.specialty}</div>
                </div>
              ))}
            </div>
          </section>
        );

      default:
        return null;
    }
  };

  const renderSidebarSkills = () => (
    <>
      {data.skills.hard.length > 0 && !isHidden('skills') && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-2.5">
            {getSectionTitle('skills', lang)}
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.hard.map((skill, idx) => (
              <span
                key={idx}
                className="text-xs px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--text)] font-medium"
              >
                {skill.name}
                {skill.level && (
                  <span className="ml-1 text-[10px] text-[var(--muted)] opacity-80">
                    · {getSkillLevelName(skill.level, lang)}
                  </span>
                )}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.skills.soft.length > 0 && !isHidden('skills') && (
        <div className="mb-6">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--muted)] mb-2">
            Soft Skills
          </h4>
          <ul className="text-xs text-[var(--text)] space-y-1">
            {data.skills.soft.map((s, idx) => (
              <li key={idx} className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] shrink-0" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.skills.languages.length > 0 && !isHidden('languages') && (
        <div className="mb-6">
          <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-2.5">
            {getSectionTitle('languages', lang)}
          </h3>
          <div className="space-y-1.5 text-xs">
            {data.skills.languages.map((l, idx) => (
              <div key={idx} className="flex justify-between items-center text-[var(--text)]">
                <span>{l.name}</span>
                <span className="text-[var(--muted)] font-mono font-medium">{l.level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );

  if (isMobile) {
    return (
      <div className="p-5 font-sans bg-[var(--bg)] text-[var(--text)]" data-format="mobile">
        {/* Mobile Header */}
        <div className="flex items-center gap-4 mb-4">
          {displayPhoto && (
            <img
              src={displayPhoto}
              alt={data.personal.fullName}
              className="w-20 h-20 rounded-full object-cover border-2 border-[var(--accent)] shadow-sm shrink-0"
            />
          )}
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--text)] leading-tight">
              {data.personal.fullName || 'Имя Фамилия'}
            </h1>
            <h2 className="text-sm font-semibold text-[var(--accent)] mt-0.5">
              {data.personal.position || 'Желаемая должность'}
            </h2>
            {data.personal.city && (
              <div className="text-xs text-[var(--muted)] mt-0.5">{data.personal.city}</div>
            )}
          </div>
        </div>

        {/* Contacts */}
        <div className="mb-6">
          <ContactLinks contacts={data.contacts} format="mobile" />
        </div>

        {/* Skills */}
        {renderSidebarSkills()}

        {/* Main Content Sections */}
        {data.design.sectionOrder.map(renderSection)}
      </div>
    );
  }

  // Desktop (A4 Layout)
  return (
    <div
      className="w-[794px] min-h-[1123px] bg-[var(--bg)] text-[var(--text)] flex font-sans leading-normal shadow-[var(--shadow-sheet)]"
      data-format="desktop"
    >
      {/* 32% Sidebar */}
      <aside className="w-[32%] bg-[var(--sidebar-bg)] p-8 border-r border-[var(--rule)] flex flex-col shrink-0">
        {displayPhoto && (
          <div className="mb-6 flex justify-center">
            <img
              src={displayPhoto}
              alt={data.personal.fullName}
              className="w-32 h-32 rounded-full object-cover border-2 border-[var(--accent)] shadow-sm"
            />
          </div>
        )}

        {/* Contacts in Sidebar */}
        <div className="mb-8">
          <h3 className="text-xs uppercase tracking-wider font-bold text-[var(--accent)] mb-3 pb-1 border-b border-[var(--rule)]">
            {getSectionTitle('contacts', lang)}
          </h3>
          <ContactLinks contacts={data.contacts} format="desktop" className="flex-col gap-2.5 text-xs" />
          {data.personal.city && (
            <div className="text-xs text-[var(--muted)] mt-2">
              {data.personal.city}
            </div>
          )}
        </div>

        {/* Skills & Languages */}
        {renderSidebarSkills()}
      </aside>

      {/* 68% Main Column */}
      <main className="w-[68%] p-8 flex flex-col">
        {/* Header */}
        <header className="mb-6 pb-4 border-b border-[var(--rule)]">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] mb-1">
            {data.personal.fullName || 'Имя Фамилия'}
          </h1>
          <h2 className="text-base font-semibold text-[var(--accent)]">
            {data.personal.position || 'Желаемая должность'}
          </h2>
        </header>

        {/* Main Sections */}
        {data.design.sectionOrder.map(renderSection)}
      </main>
    </div>
  );
};
