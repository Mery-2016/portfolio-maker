import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { useResumeStore } from '../store/resume.js';
import { fetchResume } from '../lib/api.js';
import { TableOfContents } from '../components/TableOfContents.js';
import { StepPersonal } from '../features/wizard/StepPersonal.js';
import { StepContacts } from '../features/wizard/StepContacts.js';
import { StepExperience } from '../features/wizard/StepExperience.js';
import { StepEducation } from '../features/wizard/StepEducation.js';
import { StepSkills } from '../features/wizard/StepSkills.js';
import { StepDesign } from '../features/wizard/StepDesign.js';
import { EditorialMode } from '../features/ai/EditorialMode.js';
import { ExportModal } from '../features/export/ExportModal.js';
import { Toast } from '../components/Toast.js';
import { ResumeRenderer } from '@cvb/templates';
import { Sun, Moon, Download, ArrowLeft } from 'lucide-react';
import { springPaper } from '../lib/motion.js';

export const Editor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    data,
    initResume,
    currentStep,
    setCurrentStep,
    previewMode,
    setPreviewMode,
    editorialMode,
    saveState,
    lastSavedAt,
    themeMode,
    toggleTheme,
  } = useResumeStore();

  const [exportOpen, setExportOpen] = useState(false);
  const [scale, setScale] = useState(0.85);
  const deskRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id) {
      fetchResume(id)
        .then((res) => {
          initResume(id, res.data, res.version);
        })
        .catch(() => {
          // Fallback init
          initResume(id);
        });
    }
  }, [id, initResume]);

  // Adjust preview sheet scale dynamically to fit available desk width
  useEffect(() => {
    const handleResize = () => {
      if (deskRef.current) {
        const deskWidth = deskRef.current.clientWidth - 64; // padding
        if (previewMode === 'desktop') {
          const targetScale = Math.min(1, Math.max(0.45, deskWidth / 820));
          setScale(targetScale);
        } else {
          setScale(1);
        }
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [previewMode]);

  const renderCurrentStep = () => {
    if (editorialMode) {
      return <EditorialMode />;
    }

    switch (currentStep) {
      case 1:
        return <StepPersonal />;
      case 2:
        return <StepContacts />;
      case 3:
        return <StepExperience />;
      case 4:
        return <StepEducation />;
      case 5:
        return <StepSkills />;
      case 6:
        return <StepDesign />;
      default:
        return <StepPersonal />;
    }
  };

  const getSaveIndicatorText = () => {
    if (saveState === 'saving') return 'Сохраняется…';
    if (saveState === 'offline') return 'Нет сети. Изменения на этом устройстве';
    return lastSavedAt || 'Сохранено';
  };

  return (
    <div className="h-screen flex flex-col bg-[var(--paper)] text-[var(--ink)] overflow-hidden font-ui">
      {/* Top Bar */}
      <header className="h-14 border-b border-[var(--rule)] px-6 flex items-center justify-between shrink-0 bg-[var(--paper)] z-20">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            title="На главную"
          >
            <ArrowLeft size={18} strokeWidth={1.5} />
          </button>
          <div className="text-sm font-semibold text-[var(--ink)] truncate max-w-xs sm:max-w-md">
            Резюме · {data.personal.fullName || 'Без имени'}
          </div>
        </div>

        <div className="flex items-center gap-5">
          {/* Autosave status text */}
          <div className="text-xs text-[var(--ink-2)] font-mono transition-opacity">
            {getSaveIndicatorText()}
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="p-1.5 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
            title="Сменить тему"
          >
            {themeMode === 'light' ? <Moon size={18} strokeWidth={1.5} /> : <Sun size={18} strokeWidth={1.5} />}
          </button>

          {/* Download button */}
          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[var(--lazur)] text-white text-xs font-medium rounded-[var(--radius-1)] hover:bg-[var(--lazur-strong)] transition-colors"
          >
            <Download size={14} strokeWidth={2} />
            <span>Скачать</span>
          </button>
        </div>
      </header>

      {/* Main 3-Column Desk Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Table of Contents */}
        <aside className="hidden lg:block w-56 border-r border-[var(--rule)] p-6 overflow-y-auto shrink-0 bg-[var(--paper)]">
          <TableOfContents />
        </aside>

        {/* Middle Column: Active Form Step / Editorial Mode */}
        <main className="w-full lg:w-[560px] p-6 lg:p-8 overflow-y-auto border-r border-[var(--rule)] shrink-0 bg-[var(--paper)]">
          {renderCurrentStep()}
        </main>

        {/* Right Column: Editorial Desk with Resume Sheet */}
        <section
          ref={deskRef}
          className="flex-1 hidden md:flex flex-col items-center justify-between p-8 desk-grain overflow-y-auto relative select-none"
        >
          {/* Sheet Container with FLIP transition */}
          <div className="flex-1 flex items-center justify-center w-full min-h-[600px] py-4">
            <motion.div
              layout
              transition={springPaper}
              className={`bg-white rounded-[var(--radius-0)] shadow-[var(--shadow-sheet)] overflow-hidden transition-all duration-300 ${
                previewMode === 'mobile'
                  ? 'w-[390px] border border-[var(--rule)] rounded-[var(--radius-2)]'
                  : 'w-[794px]'
              }`}
            >
              <ResumeRenderer
                data={data}
                format={previewMode}
                scale={previewMode === 'desktop' ? scale : 1}
              />
            </motion.div>
          </div>

          {/* Device switch segment: Компьютер · Телефон (DESIGN §11.2) */}
          <div className="mt-4 flex items-center gap-2 p-1 bg-[var(--surface)] border border-[var(--rule)] rounded-[var(--radius-1)] shadow-sm z-10">
            <button
              type="button"
              onClick={() => setPreviewMode('desktop')}
              className={`px-3 py-1 text-xs rounded-[var(--radius-1)] transition-colors font-medium ${
                previewMode === 'desktop'
                  ? 'bg-[var(--paper)] text-[var(--ink)] shadow-sm font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Компьютер
            </button>
            <span className="text-[var(--rule-strong)]">·</span>
            <button
              type="button"
              onClick={() => setPreviewMode('mobile')}
              className={`px-3 py-1 text-xs rounded-[var(--radius-1)] transition-colors font-medium ${
                previewMode === 'mobile'
                  ? 'bg-[var(--paper)] text-[var(--ink)] shadow-sm font-semibold'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)]'
              }`}
            >
              Телефон
            </button>
          </div>
        </section>
      </div>

      {/* Export Modal */}
      {exportOpen && <ExportModal onClose={() => setExportOpen(false)} />}

      {/* Toast Notification */}
      <Toast />
    </div>
  );
};
