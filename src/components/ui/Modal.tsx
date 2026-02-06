import { useEffect, useCallback, useId, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

const SPRING = { type: 'spring' as const, stiffness: 380, damping: 28, mass: 0.8 };
const FADE = { duration: 0.2 };

const reducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, subtitle, children }: ModalProps) {
  const titleId = useId();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={FADE}
        >
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
            aria-hidden
          />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative w-full max-w-[420px] max-h-[80vh] overflow-y-auto overflow-x-hidden rounded-3xl border border-white/40 bg-white/55 px-7 pt-7 pb-6 ring-1 ring-inset ring-white/30 shadow-[0_8px_40px_-4px_rgba(0,0,0,0.08),0_4px_16px_-2px_rgba(0,0,0,0.05)]"
            style={{ backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' }}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96, y: 8 }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={
              reducedMotion
                ? { opacity: 0, transition: { duration: 0.15 } }
                : { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.15 } }
            }
            transition={SPRING}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={onClose}
              className="absolute top-5 right-5 flex h-8 w-8 items-center justify-center rounded-xl bg-transparent transition-colors duration-150 hover:bg-black/[0.04] cursor-pointer"
              aria-label="关闭"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-[var(--color-text-muted)]">
                <path d="M4 4l8 8M12 4l-8 8" />
              </svg>
            </button>

            {/* Header */}
            <ModalHeader id={titleId} title={title} subtitle={subtitle} />

            {/* Content */}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

interface ModalHeaderProps {
  id: string;
  title: string;
  subtitle?: string;
}

export function ModalHeader({ id, title, subtitle }: ModalHeaderProps) {
  return (
    <div className="mb-6 flex flex-col gap-1">
      <h2 id={id} className="text-lg font-semibold tracking-[-0.01em] text-[var(--color-text)]">
        {title}
      </h2>
      {subtitle && (
        <p className="text-[13px] font-normal text-[var(--color-text-subtle)]">{subtitle}</p>
      )}
    </div>
  );
}
