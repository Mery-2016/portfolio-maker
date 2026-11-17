import React, { useState } from 'react';
import { useResumeStore } from '../../store/resume.js';
import { Plus, Trash2, ChevronDown, ChevronRight, GripVertical } from 'lucide-react';
import { EducationLevel } from '@cvb/shared';

const EDUCATION_LEVEL_NAMES: Record<EducationLevel, string> = {
  secondary: 'Среднее',
  vocational: 'Среднее специальное',
  bachelor: 'Бакалавриат',
  master: 'Магистратура',
  course: 'Курсы',
  certificate: 'Сертификат',
};

export const StepEducation: React.FC = () => {
  const { data, updateData, addEducation, removeEducation } = useResumeStore();
  const [expandedId, setExpandedId] = useState<string | null>(data.education[0]?.id || null);

  const toggleExpand = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const handleUpdateItem = (id: string, field: string, val: any) => {
    const updated = data.education.map(item => {
      if (item.id === id) {
        return { ...item, [field]: val };
      }
      return item;
    });
    updateData({ education: updated });
  };

  return (
    <div className="space-y-6">
      <h1 className="font-voice text-2xl font-bold text-[var(--ink)]">Образование</h1>

      <div className="space-y-3">
        {data.education.map((item, index) => {
          const isExpanded = expandedId === item.id;
          const title = item.institution || `Учебное заведение ${index + 1}`;

          return (
            <div
              key={item.id}
              className="border border-[var(--rule)] bg-[var(--surface)] rounded-[var(--radius-1)] overflow-hidden"
            >
              <div
                onClick={() => toggleExpand(item.id)}
                className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[var(--rule)]/10 select-none group"
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-[var(--ink-3)] group-hover:text-[var(--ink)] transition-colors">
                    <GripVertical size={16} strokeWidth={1.5} />
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink)]">{title}</div>
                    <div className="text-xs text-[var(--ink-2)]">
                      {item.specialty || 'Специальность'} · {item.graduationYear}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEducation(item.id);
                    }}
                    className="p-1 text-[var(--ink-3)] hover:text-[var(--brick)] transition-colors"
                  >
                    <Trash2 size={16} strokeWidth={1.5} />
                  </button>
                  <span className="text-[var(--ink-2)]">
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 pt-1 border-t border-[var(--rule)] space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                      Учебное заведение
                    </label>
                    <input
                      type="text"
                      value={item.institution}
                      onChange={(e) => handleUpdateItem(item.id, 'institution', e.target.value)}
                      placeholder="ТУИТ"
                      className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                        Специальность
                      </label>
                      <input
                        type="text"
                        value={item.specialty}
                        onChange={(e) => handleUpdateItem(item.id, 'specialty', e.target.value)}
                        placeholder="Программная инженерия"
                        className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                        Уровень
                      </label>
                      <select
                        value={item.level}
                        onChange={(e) => handleUpdateItem(item.id, 'level', e.target.value)}
                        className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)]"
                      >
                        {Object.entries(EDUCATION_LEVEL_NAMES).map(([lvl, label]) => (
                          <option key={lvl} value={lvl}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-[var(--ink-2)] mb-1">
                      Год окончания
                    </label>
                    <input
                      type="number"
                      min={1960}
                      max={2040}
                      value={item.graduationYear}
                      onChange={(e) => handleUpdateItem(item.id, 'graduationYear', Number(e.target.value))}
                      className="w-full h-10 px-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] font-mono"
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={addEducation}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium border border-[var(--rule-strong)] text-[var(--ink)] rounded-[var(--radius-1)] hover:bg-[var(--rule)]/20 transition-colors"
        >
          <Plus size={14} strokeWidth={1.5} />
          <span>Добавить образование</span>
        </button>
      </div>
    </div>
  );
};
