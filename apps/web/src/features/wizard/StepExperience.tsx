import React, { useState } from 'react';
import { useResumeStore } from '../../store/resume.js';
import { ChevronDown, ChevronRight, GripVertical, Trash2, Plus, Pencil } from 'lucide-react';

export const StepExperience: React.FC = () => {
  const {
    data,
    updateData,
    addExperience,
    removeExperience,
    setEditorialMode,
  } = useResumeStore();

  const [expandedId, setExpandedId] = useState<string | null>(
    data.experience[0]?.id || null
  );

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleUpdateItem = (id: string, field: string, val: any) => {
    const updated = data.experience.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updateData({ experience: updated });
  };

  const canEditAi = !!data.personal.position && data.experience.some(e => e.rawDescription.trim().length > 0);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-baseline">
        <h1 className="font-voice text-2xl font-bold text-[var(--ink)]">Опыт работы</h1>
        <button
          type="button"
          onClick={() => updateData({ noExperience: !data.noExperience })}
          className="text-xs text-[var(--ink-2)] hover:text-[var(--ink)] underline cursor-pointer"
        >
          {data.noExperience ? 'Вернуть опыт работы' : 'Нет опыта работы'}
        </button>
      </div>

      {data.noExperience ? (
        <div className="p-6 text-sm text-[var(--ink-2)] bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] leading-relaxed">
          Опыта работы пока нет — расскажите об учебных проектах и стажировках на шагах «Образование» и «Проекты».
        </div>
      ) : (
        <div className="space-y-3">
          {data.experience.map((item, index) => {
            const isExpanded = expandedId === item.id;
            const title = item.role || item.company
              ? `${item.role || 'Должность'} · ${item.company || 'Компания'}`
              : `Место работы ${index + 1}`;
            const period = `${item.startDate || '—'} — ${item.endDate || 'по н.в.'}`;

            return (
              <div
                key={item.id}
                className="border border-[var(--rule)] bg-[var(--surface)] rounded-[var(--radius-1)] overflow-hidden transition-all"
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[var(--rule)]/10 select-none group"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-[var(--ink-3)] group-hover:text-[var(--ink)] transition-colors">
                      <GripVertical size={16} strokeWidth={1.5} />
                    </span>
                    <div>
                      <div className="text-sm font-semibold text-[var(--ink)] leading-snug">{title}</div>
                      <div className="text-xs text-[var(--ink-2)] font-mono">{period}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExperience(item.id);
                      }}
                      className="p-1 text-[var(--ink-3)] hover:text-[var(--brick)] transition-colors"
                      title="Удалить запись"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                    <span className="text-[var(--ink-2)]">
                      {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                    </span>
                  </div>
                </div>

                {/* Form fields when expanded */}
                {isExpanded && (
                  <div className="p-4 pt-1 border-t border-[var(--rule)] space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                          Компания
                        </label>
                        <input
                          type="text"
                          value={item.company}
                          onChange={(e) => handleUpdateItem(item.id, 'company', e.target.value)}
                          placeholder="Saber Publisher"
                          className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                          Должность
                        </label>
                        <input
                          type="text"
                          value={item.role}
                          onChange={(e) => handleUpdateItem(item.id, 'role', e.target.value)}
                          placeholder="TeamLead"
                          className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                          Начало работы (ГГГГ-ММ)
                        </label>
                        <input
                          type="text"
                          value={item.startDate}
                          onChange={(e) => handleUpdateItem(item.id, 'startDate', e.target.value)}
                          placeholder="2022-03"
                          className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                          Окончание работы
                        </label>
                        <input
                          type="text"
                          value={item.endDate || ''}
                          onChange={(e) => handleUpdateItem(item.id, 'endDate', e.target.value || null)}
                          placeholder="по настоящее время"
                          className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] font-mono"
                        />
                      </div>
                    </div>

                    {/* Multiline auto-growing text description */}
                    <div>
                      <div className="flex justify-between items-baseline mb-1">
                        <label className="text-xs font-medium text-[var(--ink-2)]">
                          Чем вы занимались и чего достигли
                        </label>
                        <span className="text-[11px] font-mono text-[var(--ink-3)]">
                          {item.rawDescription.length} / 1500
                        </span>
                      </div>
                      <textarea
                        rows={4}
                        maxLength={1500}
                        value={item.rawDescription}
                        onChange={(e) => handleUpdateItem(item.id, 'rawDescription', e.target.value)}
                        placeholder="Пишите своими словами: что делали, что получилось. Цифры, если есть"
                        className="w-full p-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] leading-relaxed resize-y"
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={addExperience}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[var(--rule-strong)] text-[var(--ink)] rounded-[var(--radius-1)] hover:bg-[var(--rule)]/20 transition-colors"
            >
              <Plus size={14} strokeWidth={1.5} />
              <span>Добавить место работы</span>
            </button>

            {/* Editorial Trigger Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setEditorialMode(true)}
                disabled={!canEditAi}
                className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-[var(--radius-1)] transition-colors ${
                  canEditAi
                    ? 'bg-[var(--lazur)] text-white hover:bg-[var(--lazur-strong)]'
                    : 'bg-[var(--rule)] text-[var(--ink-3)] cursor-not-allowed'
                }`}
                title={!canEditAi ? 'Редактору нужна должность и хотя бы одно место работы или навыки' : ''}
              >
                <Pencil size={14} strokeWidth={1.5} />
                <span>Отредактировать</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
