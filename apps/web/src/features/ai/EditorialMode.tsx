import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useResumeStore } from '../../store/resume.js';
import { Pencil, Undo2, Check, RotateCw, X } from 'lucide-react';
import DiffMatchPatch from 'diff-match-patch';

const dmp = new DiffMatchPatch();

export const EditorialMode: React.FC = () => {
  const {
    data,
    setEditorialMode,
    applyAiEvent,
    acceptAi,
    revertAi,
    showToast,
  } = useResumeStore();

  const [tone, setTone] = useState<'neutral' | 'confident' | 'creative'>(data.ai.tone || 'neutral');
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeStage, setActiveStage] = useState<string | null>(null);
  const [showDiffMap, setShowDiffMap] = useState<Record<string, boolean>>({});

  const startEditorialRun = async () => {
    setIsStreaming(true);
    setActiveStage('Подготовка...');

    try {
      const response = await fetch(`/api/v1/resumes/${data.id}/ai/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tone, language: data.language }),
      });

      if (!response.ok) {
        throw new Error('Ошибка запуска редактора');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No readable stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split('\n\n');
        buffer = events.pop() || '';

        for (const evt of events) {
          if (!evt.trim()) continue;
          const lines = evt.split('\n');
          let eventName = 'message';
          let eventData = '';

          for (const line of lines) {
            if (line.startsWith('event: ')) {
              eventName = line.slice(7).trim();
            } else if (line.startsWith('data: ')) {
              eventData = line.slice(6).trim();
            }
          }

          if (eventData) {
            try {
              const payload = JSON.parse(eventData);
              if (eventName === 'stage') {
                setActiveStage(payload.stage === 'skills' ? 'Сверяю навыки...' : 'Редактирую текст...');
              } else {
                applyAiEvent(eventName, payload);
              }
            } catch (err) {
              console.error('Error parsing SSE event:', err);
            }
          }
        }
      }

      showToast('Текст отредактирован. Вы можете принять или изменить правки');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Не удалось завершить правку');
    } finally {
      setIsStreaming(false);
      setActiveStage(null);
    }
  };

  const toggleDiff = (id: string) => {
    setShowDiffMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const renderDiff = (raw: string, aiBullets: string[]) => {
    const aiText = aiBullets.join(' ');
    const diffs = dmp.diff_main(raw, aiText);
    dmp.diff_cleanupSemantic(diffs);

    return (
      <div className="p-3 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-xs leading-relaxed font-mono">
        {diffs.map(([op, text], idx) => {
          if (op === 1) {
            // Added
            return (
              <ins key={idx} className="bg-[var(--lazur-wash)] text-[var(--lazur-strong)] underline no-underline decoration-transparent">
                {text}
              </ins>
            );
          }
          if (op === -1) {
            // Deleted
            return (
              <del key={idx} className="bg-[var(--brick-wash)] text-[var(--brick)] line-through">
                {text}
              </del>
            );
          }
          return <span key={idx} className="text-[var(--ink)]">{text}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar of Editorial Desk */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[var(--rule)]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-voice text-2xl font-bold text-[var(--ink)]">Редактор</h1>
            <span className="px-2 py-0.5 text-xs font-mono bg-[var(--lazur-wash)] text-[var(--lazur)] rounded">
              правка текста
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)] mt-1">
            Редактор переформулирует опыт в измеримые достижения, не добавляя вымышленных фактов.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Tone Selector */}
          <div className="flex items-center gap-1.5 text-xs text-[var(--ink-2)]">
            <span>Тон:</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="h-8 px-2 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-xs text-[var(--ink)]"
            >
              <option value="neutral">Сдержанно</option>
              <option value="confident">Уверенно</option>
              <option value="creative">Живее</option>
            </select>
          </div>

          <button
            type="button"
            onClick={startEditorialRun}
            disabled={isStreaming}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--lazur)] text-white text-xs font-medium rounded-[var(--radius-1)] hover:bg-[var(--lazur-strong)] disabled:opacity-50 transition-colors"
          >
            <Pencil size={13} strokeWidth={1.5} />
            <span>{isStreaming ? 'Редактирую…' : 'Отредактировать заново'}</span>
          </button>

          <button
            type="button"
            onClick={() => setEditorialMode(false)}
            className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] border border-[var(--rule)] rounded-[var(--radius-1)]"
            title="Вернуться к анкете"
          >
            <X size={16} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Scanning status banner */}
      {isStreaming && (
        <div className="p-3 bg-[var(--lazur-wash)] border border-[var(--lazur)]/20 rounded-[var(--radius-1)] text-xs flex items-center justify-between">
          <span className="text-[var(--lazur-strong)] font-medium font-voice">
            {activeStage || 'Читаю и анализирую опыт...'}
          </span>
          <div className="w-24 h-1 bg-[var(--rule)] overflow-hidden rounded-full">
            <motion.div
              className="h-full bg-[var(--lazur)]"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
            />
          </div>
        </div>
      )}

      {/* Summary Editorial Block */}
      {data.ai.summary && (
        <div className="p-4 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] space-y-3">
          <div className="flex justify-between items-baseline">
            <span className="text-xs uppercase tracking-wider font-bold text-[var(--lazur)]">
              О себе (Summary)
            </span>
            <span className="font-voice text-xs text-[var(--ink-2)]">
              написано по вашему опыту и навыкам
            </span>
          </div>

          <div className="p-3 bg-[var(--lazur-wash)] border-l-2 border-[var(--lazur)] rounded-[var(--radius-1)] text-sm text-[var(--ink)] leading-relaxed">
            {data.ai.summary}
          </div>
        </div>
      )}

      {/* Experience Editorial Blocks */}
      <div className="space-y-4">
        {data.experience.map((exp) => {
          const hasAi = exp.useAi && exp.aiBullets && exp.aiBullets.length > 0;
          const showDiff = showDiffMap[exp.id] || false;

          return (
            <div
              key={exp.id}
              className="border border-[var(--rule)] bg-[var(--surface)] rounded-[var(--radius-1)] p-4 space-y-3.5 relative"
            >
              {/* Header */}
              <div className="flex justify-between items-baseline pb-2 border-b border-[var(--rule)]">
                <div>
                  <span className="text-sm font-bold text-[var(--ink)]">
                    {exp.role || 'Должность'} · {exp.company || 'Компания'}
                  </span>
                  <span className="text-xs text-[var(--ink-3)] font-mono ml-2">
                    {exp.startDate} — {exp.endDate || 'по н.в.'}
                  </span>
                </div>

                {hasAi && (
                  <button
                    type="button"
                    onClick={() => toggleDiff(exp.id)}
                    className="text-xs text-[var(--lazur)] hover:underline"
                  >
                    {showDiff ? 'Показать результат' : 'Сравнить с оригиналом (Diff)'}
                  </button>
                )}
              </div>

              {/* Diff View */}
              {showDiff && hasAi ? (
                renderDiff(exp.rawDescription, exp.aiBullets!)
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_180px] gap-4">
                  {/* Left Column: Strikethrough raw text + Inserted AI bullets */}
                  <div className="space-y-3">
                    {/* Struck-through original user text if AI is active */}
                    {hasAi && exp.rawDescription && (
                      <div className="space-y-1">
                        <div className="text-[11px] uppercase tracking-wider text-[var(--brick)] font-semibold">
                          Исходный текст:
                        </div>
                        <div className="p-2.5 bg-[var(--brick-wash)] text-[var(--ink-3)] line-through rounded-[var(--radius-1)] text-xs leading-relaxed">
                          {exp.rawDescription}
                        </div>
                      </div>
                    )}

                    {/* AI Edited version */}
                    {hasAi ? (
                      <div className="space-y-1">
                        <div className="text-[11px] uppercase tracking-wider text-[var(--lazur)] font-semibold">
                          Правка редактора:
                        </div>
                        <div className="p-3 bg-[var(--lazur-wash)] border-l-2 border-[var(--lazur)] rounded-[var(--radius-1)] text-xs space-y-1.5">
                          {exp.aiBullets!.map((bullet, bIdx) => (
                            <div key={bIdx} className="text-[var(--ink)] leading-relaxed flex items-start gap-1.5">
                              <span className="text-[var(--lazur)] shrink-0 font-bold">•</span>
                              <span>{bullet}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-[var(--paper)] rounded-[var(--radius-1)] text-xs text-[var(--ink)]">
                        {exp.rawDescription || 'Нет описания'}
                      </div>
                    )}
                  </div>

                  {/* Right Column: Margin Notes in Comic Relief (DESIGN §9.3) */}
                  <div className="space-y-2 border-l border-[var(--rule)] pl-3 text-xs">
                    <span className="font-voice text-[11px] text-[var(--ink-3)] uppercase tracking-wider block">
                      Пометки на полях
                    </span>
                    {exp.notes && exp.notes.length > 0 ? (
                      exp.notes.map((note, nIdx) => (
                        <div
                          key={nIdx}
                          className="font-voice text-xs text-[var(--ink-2)] flex items-start gap-1.5 leading-snug"
                        >
                          <span className="text-[var(--lazur)] shrink-0">—</span>
                          <span>{note}</span>
                        </div>
                      ))
                    ) : (
                      <div className="font-voice text-xs text-[var(--ink-3)] italic">
                        перевёл в достижения
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Action Buttons for this item (DESIGN §9.2) */}
              {hasAi && (
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[var(--rule)]">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => acceptAi('experience', exp.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-[var(--olive)] text-white rounded-[var(--radius-1)] hover:opacity-90 font-medium transition-opacity"
                    >
                      <Check size={13} strokeWidth={2} />
                      <span>Принять</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => revertAi('experience', exp.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[var(--rule-strong)] text-[var(--ink)] rounded-[var(--radius-1)] hover:bg-[var(--rule)]/20 transition-colors"
                    >
                      <Undo2 size={13} strokeWidth={1.5} />
                      <span>Оставить мой текст</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
