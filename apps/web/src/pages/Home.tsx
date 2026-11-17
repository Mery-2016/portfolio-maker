import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { useResumeStore } from '../store/resume.js';
import { createResume, fetchResumes, deleteResume, duplicateResume } from '../lib/api.js';
import { ResumeRenderer } from '@cvb/templates';
import { createSampleResumeData } from '@cvb/shared';
import { Sun, Moon, Copy, Trash2, Pencil, Plus } from 'lucide-react';
import { springPaper } from '../lib/motion.js';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { themeMode, toggleTheme, initResume } = useResumeStore();
  const [userResumes, setUserResumes] = useState<any[]>([]);
  const [hoveredFanIndex, setHoveredFanIndex] = useState<number | null>(null);

  const sampleData = createSampleResumeData();

  useEffect(() => {
    fetchResumes()
      .then((res) => {
        if (Array.isArray(res)) setUserResumes(res);
      })
      .catch(() => {});
  }, []);

  const handleCreateNew = async () => {
    try {
      const res = await createResume(undefined, 'ru');
      initResume(res.id, res.data, res.version);
      navigate(`/r/${res.id}/edit`);
    } catch {
      // Fallback offline create
      const id = 'res_' + Date.now();
      initResume(id);
      navigate(`/r/${id}/edit`);
    }
  };

  const handleOpenResume = (id: string) => {
    navigate(`/r/${id}/edit`);
  };

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const res = await duplicateResume(id);
      setUserResumes(prev => [res, ...prev]);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await deleteResume(id);
      setUserResumes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] flex flex-col font-ui">
      {/* Top Navbar */}
      <header className="border-b border-[var(--rule)] px-8 py-4 flex items-center justify-between">
        <div className="font-voice text-xl font-bold tracking-tight text-[var(--ink)]">
          Резюме
        </div>

        <div className="flex items-center gap-6 text-sm">
          <span className="text-[var(--ink-2)] text-xs font-mono">RU</span>

          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] rounded-[var(--radius-1)] transition-colors"
            title="Сменить тему"
          >
            {themeMode === 'light' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Main Hero Spread */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-12 lg:py-20 w-full flex flex-col gap-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-12 items-center">
          {/* Left Column */}
          <div className="space-y-6 max-w-xl">
            <h1 className="font-voice text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--ink)] leading-[1.08]">
              Резюме, которое не стыдно отправить
            </h1>

            <p className="text-base sm:text-lg text-[var(--ink-2)] leading-relaxed font-ui">
              Напишите о своём опыте как получится. Редактор переформулирует текст, а вы решите, что оставить.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <button
                type="button"
                onClick={handleCreateNew}
                className="px-6 py-3 bg-[var(--lazur)] text-white font-medium rounded-[var(--radius-1)] hover:bg-[var(--lazur-strong)] text-base transition-colors"
              >
                Начать
              </button>
              <span className="text-xs text-[var(--ink-3)] font-ui">
                Без регистрации. Регистрация нужна, только чтобы открыть резюме с другого устройства
              </span>
            </div>

            {/* Existing user resumes list if any */}
            {userResumes.length > 0 && (
              <div className="pt-6 border-t border-[var(--rule)] space-y-3">
                <div className="text-xs font-medium uppercase tracking-wider text-[var(--ink-2)]">
                  Ваши резюме:
                </div>
                <div className="space-y-2">
                  {userResumes.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => handleOpenResume(r.id)}
                      className="p-3 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] flex items-center justify-between cursor-pointer hover:border-[var(--rule-strong)] group transition-colors"
                    >
                      <div>
                        <div className="text-sm font-semibold text-[var(--ink)]">{r.title}</div>
                        <div className="text-xs text-[var(--ink-3)] font-mono">
                          Обновлено: {new Date(r.updatedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => handleDuplicate(e, r.id)}
                          className="p-1.5 text-[var(--ink-3)] hover:text-[var(--ink)]"
                          title="Дублировать"
                        >
                          <Copy size={15} strokeWidth={1.5} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDelete(e, r.id)}
                          className="p-1.5 text-[var(--ink-3)] hover:text-[var(--brick)]"
                          title="Удалить"
                        >
                          <Trash2 size={15} strokeWidth={1.5} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Fan of 3 Live Sample Sheets on Desk */}
          <div className="relative h-[480px] desk-grain rounded-[var(--radius-2)] border border-[var(--rule)] p-6 overflow-hidden flex items-center justify-center select-none">
            {/* Sheet 1: Behind Left */}
            <motion.div
              className="absolute top-10 w-[300px] h-[400px] bg-white rounded-[var(--radius-0)] shadow-[var(--shadow-sheet)] overflow-hidden cursor-pointer"
              style={{ rotate: -7, x: -60 }}
              animate={hoveredFanIndex === 1 ? { rotate: -10, y: -16, scale: 1.02 } : { rotate: -7, y: 0 }}
              transition={springPaper}
              onMouseEnter={() => setHoveredFanIndex(1)}
              onMouseLeave={() => setHoveredFanIndex(null)}
            >
              <div className="origin-top-left transform scale-[0.4] w-[750px] p-4 pointer-events-none">
                <ResumeRenderer data={{ ...sampleData, design: { ...sampleData.design, templateId: 'classic' } }} />
              </div>
            </motion.div>

            {/* Sheet 2: Behind Right */}
            <motion.div
              className="absolute top-10 w-[300px] h-[400px] bg-white rounded-[var(--radius-0)] shadow-[var(--shadow-sheet)] overflow-hidden cursor-pointer"
              style={{ rotate: 7, x: 60 }}
              animate={hoveredFanIndex === 2 ? { rotate: 10, y: -16, scale: 1.02 } : { rotate: 7, y: 0 }}
              transition={springPaper}
              onMouseEnter={() => setHoveredFanIndex(2)}
              onMouseLeave={() => setHoveredFanIndex(null)}
            >
              <div className="origin-top-left transform scale-[0.4] w-[750px] p-4 pointer-events-none">
                <ResumeRenderer data={{ ...sampleData, design: { ...sampleData.design, templateId: 'creative' } }} />
              </div>
            </motion.div>

            {/* Sheet 3: Center Front */}
            <motion.div
              className="relative z-10 w-[310px] h-[410px] bg-white rounded-[var(--radius-0)] shadow-[var(--shadow-sheet-lifted)] overflow-hidden cursor-pointer"
              style={{ rotate: 0 }}
              animate={hoveredFanIndex === 3 ? { y: -20, scale: 1.03 } : { y: 0 }}
              transition={springPaper}
              onMouseEnter={() => setHoveredFanIndex(3)}
              onMouseLeave={() => setHoveredFanIndex(null)}
              onClick={handleCreateNew}
            >
              <div className="origin-top-left transform scale-[0.41] w-[750px] p-4 pointer-events-none">
                <ResumeRenderer data={sampleData} />
              </div>
            </motion.div>
          </div>
        </div>

        {/* 3 Columns: "Как это работает" */}
        <section className="pt-12 border-t border-[var(--rule)] space-y-8">
          <h2 className="font-voice text-2xl font-bold text-[var(--ink)]">Как это работает</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="space-y-3">
              <div className="font-mono text-2xl font-bold text-[var(--lazur)]">01</div>
              <h3 className="font-semibold text-base text-[var(--ink)]">Вы пишете своими словами</h3>
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                Заполните анкету так, как помните: задачи, проекты, ключевые технологии. Идеальные формулировки не требуются.
              </p>
            </div>

            {/* Step 2 */}
            <div className="space-y-3">
              <div className="font-mono text-2xl font-bold text-[var(--lazur)]">02</div>
              <h3 className="font-semibold text-base text-[var(--ink)]">Редактор правит с объяснениями</h3>
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                Редактор превратит обязанности в измеримые результаты и оставит пометки на полях, почему внесена каждая правка.
              </p>

              {/* Interactive Proofreading Example (DESIGN §11.1) */}
              <div className="p-3 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] text-xs space-y-2">
                <del className="editorial-del block text-[11px]">
                  руководил отделом, ускорили сайт в 3 раза
                </del>
                <ins className="editorial-ins block font-medium">
                  Руководил инженерной командой из 4 человек, ускорил загрузку сайта в 3 раза
                </ins>
                <span className="font-voice text-[11px] text-[var(--ink-2)] block pt-1">
                  — перевёл в достижения · цифры сохранены
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
              <div className="font-mono text-2xl font-bold text-[var(--lazur)]">03</div>
              <h3 className="font-semibold text-base text-[var(--ink)]">Вы скачиваете PDF</h3>
              <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                Получите безупречный файл A4 для компьютера и специальную версию в одну страницу для чтения с экрана телефона.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
