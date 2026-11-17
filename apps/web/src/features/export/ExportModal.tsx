import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useResumeStore } from '../../store/resume.js';
import { startExport, pollExport, checkCompleteness } from '../../lib/api.js';
import { Monitor, Smartphone, Image as ImageIcon, X, Download } from 'lucide-react';

interface ExportModalProps {
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onClose }) => {
  const { data } = useResumeStore();
  const [format, setFormat] = useState<'pdf-desktop' | 'pdf-mobile' | 'png-mobile'>('pdf-desktop');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [issues, setIssues] = useState<any[]>([]);
  const [showIssues, setShowIssues] = useState(false);

  useEffect(() => {
    // Run pre-flight check in parallel
    checkCompleteness(data.id)
      .then((res) => {
        if (res.issues) setIssues(res.issues);
      })
      .catch(() => {});
  }, [data.id]);

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      const { exportId } = await startExport(data.id, format);
      setExportProgress(30);

      // Poll until done
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        setExportProgress(Math.min(90, 30 + attempts * 15));

        try {
          const res = await pollExport(exportId);
          if (res.status === 'done' && res.url) {
            clearInterval(interval);
            setExportProgress(100);

            // Trigger download
            const a = document.createElement('a');
            a.href = res.url;
            a.download = res.fileName || 'Resume.pdf';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => {
              setIsExporting(false);
              onClose();
            }, 600);
          } else if (res.status === 'failed') {
            clearInterval(interval);
            setIsExporting(false);
            alert('Ошибка экспорта: ' + (res.error || 'попробуйте снова'));
          }
        } catch {
          if (attempts > 20) {
            clearInterval(interval);
            setIsExporting(false);
          }
        }
      }, 700);
    } catch (err: any) {
      setIsExporting(false);
      alert('Не удалось начать экспорт: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(26_28_30_/_0.32)]">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md p-6 bg-[var(--surface)] text-[var(--ink)] rounded-[var(--radius-2)] border border-[var(--rule)] shadow-xl overflow-hidden"
      >
        {/* Printer Head Scanning Animation during export */}
        {isExporting && (
          <motion.div
            className="absolute left-0 right-0 h-0.5 bg-[var(--lazur)] z-30"
            initial={{ top: 0 }}
            animate={{ top: '100%' }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
          />
        )}

        <div className="flex justify-between items-center mb-5">
          <h2 className="font-voice text-xl font-bold">Скачать резюме</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors"
          >
            <X size={20} strokeWidth={1.5} />
          </button>
        </div>

        {/* Export Formats */}
        <div className="space-y-2.5 mb-6">
          {/* Desktop PDF */}
          <label
            onClick={() => setFormat('pdf-desktop')}
            className={`flex items-center justify-between p-3.5 border rounded-[var(--radius-1)] cursor-pointer transition-colors ${
              format === 'pdf-desktop'
                ? 'border-[var(--lazur)] bg-[var(--lazur-wash)] text-[var(--ink)]'
                : 'border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--surface)] text-[var(--ink-2)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Monitor size={20} strokeWidth={1.5} className="text-[var(--ink-2)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">Для компьютера</div>
                <div className="text-xs text-[var(--ink-2)]">PDF · Формат A4, постраничная вёрстка</div>
              </div>
            </div>
            <input
              type="radio"
              name="exportFormat"
              checked={format === 'pdf-desktop'}
              onChange={() => setFormat('pdf-desktop')}
              className="accent-[var(--lazur)]"
            />
          </label>

          {/* Mobile PDF */}
          <label
            onClick={() => setFormat('pdf-mobile')}
            className={`flex items-center justify-between p-3.5 border rounded-[var(--radius-1)] cursor-pointer transition-colors ${
              format === 'pdf-mobile'
                ? 'border-[var(--lazur)] bg-[var(--lazur-wash)] text-[var(--ink)]'
                : 'border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--surface)] text-[var(--ink-2)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <Smartphone size={20} strokeWidth={1.5} className="text-[var(--ink-2)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">Для телефона</div>
                <div className="text-xs text-[var(--ink-2)]">PDF · Одна длинная страница без разрывов</div>
              </div>
            </div>
            <input
              type="radio"
              name="exportFormat"
              checked={format === 'pdf-mobile'}
              onChange={() => setFormat('pdf-mobile')}
              className="accent-[var(--lazur)]"
            />
          </label>

          {/* Mobile PNG */}
          <label
            onClick={() => setFormat('png-mobile')}
            className={`flex items-center justify-between p-3.5 border rounded-[var(--radius-1)] cursor-pointer transition-colors ${
              format === 'png-mobile'
                ? 'border-[var(--lazur)] bg-[var(--lazur-wash)] text-[var(--ink)]'
                : 'border-[var(--rule)] hover:border-[var(--rule-strong)] bg-[var(--surface)] text-[var(--ink-2)]'
            }`}
          >
            <div className="flex items-center gap-3">
              <ImageIcon size={20} strokeWidth={1.5} className="text-[var(--ink-2)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--ink)]">Картинка</div>
                <div className="text-xs text-[var(--ink-2)]">PNG · 1080 px для отправки в Telegram / WhatsApp</div>
              </div>
            </div>
            <input
              type="radio"
              name="exportFormat"
              checked={format === 'png-mobile'}
              onChange={() => setFormat('png-mobile')}
              className="accent-[var(--lazur)]"
            />
          </label>
        </div>

        {/* Pre-flight warnings if any */}
        {issues.length > 0 && (
          <div className="mb-6 p-3 bg-[var(--paper)] border border-[var(--rule)] rounded-[var(--radius-1)] text-xs">
            <div className="flex justify-between items-center text-[var(--ochre)] font-medium">
              <span>Есть {issues.length} замечания. Можно скачать и так.</span>
              <button
                type="button"
                onClick={() => setShowIssues(!showIssues)}
                className="underline text-[var(--ink-2)] hover:text-[var(--ink)]"
              >
                {showIssues ? 'Скрыть' : 'Показать'}
              </button>
            </div>
            {showIssues && (
              <ul className="mt-2 space-y-1 list-disc pl-4 text-[var(--ink-2)]">
                {issues.map((iss, idx) => (
                  <li key={idx}>{iss.message}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Action Button */}
        <div className="flex justify-end gap-3 pt-3 border-t border-[var(--rule)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm border border-[var(--rule-strong)] rounded-[var(--radius-1)] text-[var(--ink)] hover:bg-[var(--rule)]/20 transition-colors"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-2 px-5 py-2 text-sm bg-[var(--lazur)] text-white rounded-[var(--radius-1)] hover:bg-[var(--lazur-strong)] font-medium transition-colors"
          >
            <Download size={15} strokeWidth={2} />
            <span>{isExporting ? `Готовим файл… ${exportProgress}%` : 'Скачать'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};
