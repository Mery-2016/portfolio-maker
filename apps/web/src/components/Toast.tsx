import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useResumeStore } from '../store/resume.js';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useResumeStore();

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration: 0.16 }}
          className="fixed bottom-6 left-6 z-50 flex items-center justify-between gap-4 max-w-[400px] px-4 py-2.5 bg-[var(--ink)] text-[var(--paper)] rounded-[var(--radius-1)] shadow-lg text-sm"
        >
          <span>{toast.message}</span>
          {toast.actionLabel && toast.onAction && (
            <button
              onClick={() => {
                toast.onAction?.();
                hideToast();
              }}
              className="text-[var(--lazur)] hover:underline font-medium shrink-0"
            >
              {toast.actionLabel}
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
