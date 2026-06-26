
import React, { useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, Info, X } from 'lucide-react';
import Button from '../ui/Button';
import { useConfirmStore } from '../../store/useConfirmStore';
import { DIALOG_SIZE } from '../../lib/dialog-sizes';
import { cn } from '../../lib/utils';
import { Z_INDEX_APP_MODAL_CLASS } from '../../lib/dialog-sizes';

const ConfirmDialog: React.FC = () => {
  const { isOpen, options, close, isLoading, setLoading } = useConfirmStore();
  const { title, subtitle, message, variant, size, confirmText, cancelText, onConfirm, onCancel } = options;
  const dialogRef = useRef<HTMLDivElement>(null);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
      close();
    } catch (error) {
      if (import.meta.env.DEV) console.error("Confirm action failed", error);
      setLoading(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (onCancel) onCancel();
    close();
  }, [onCancel, close]);

  // Focus trap + Escape key
  useEffect(() => {
    if (!isOpen) return;
    const el = dialogRef.current;
    if (el) el.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        handleCancel();
        return;
      }
      // Trap focus within dialog
      if (e.key === 'Tab' && el) {
        const focusable = el.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, handleCancel]);

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <div className="w-12 h-12 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4"><Trash2 size={24} /></div>;
      case 'warning':
        return <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4"><AlertTriangle size={24} /></div>;
      case 'success':
        return null;
      default:
        return <div className="w-12 h-12 rounded-xl bg-primary/15 text-primary flex items-center justify-center mb-4"><Info size={24} /></div>;
    }
  };

  const getConfirmButtonClass = () => {
    switch (variant) {
      case 'danger': return 'bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-200 dark:shadow-rose-950/40';
      case 'warning': return 'bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-200 dark:shadow-amber-950/40';
      case 'success': return 'bg-[#86cf9c] hover:bg-[#77c18d] text-white shadow-sm shadow-emerald-100 dark:shadow-emerald-950/10';
      default: return 'bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={cn('fixed inset-0 flex items-center justify-center p-4', Z_INDEX_APP_MODAL_CLASS)}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={!isLoading ? handleCancel : undefined}
            className="absolute inset-0 bg-black/40 dark:bg-black/60"
            style={{ zIndex: 0 }}
          />
          <motion.div
            ref={dialogRef}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            tabIndex={-1}
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className={cn(
              "relative z-10 bg-card w-full shadow-2xl border border-border/40 flex flex-col outline-none overflow-hidden",
              variant === 'success' ? "rounded-2xl p-0 items-stretch" : "rounded-xl p-6 items-center text-center",
              size ? DIALOG_SIZE[size] : (variant === 'success' ? DIALOG_SIZE.MEDIUM : DIALOG_SIZE.CONFIRM)
            )}
            style={{ zIndex: 10 }}
          >
            {variant === 'success' ? (
              <>
                {/* Header */}
                <div className="bg-[#f8faf9] px-6 py-5 flex flex-col items-start border-b border-border/40">
                  <h3 
                    id="confirm-dialog-title" 
                    className="text-lg font-bold text-foreground leading-snug"
                  >
                    {title}
                  </h3>
                  {subtitle && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Đơn <span className="font-semibold text-foreground/80">{subtitle}</span>
                    </p>
                  )}
                </div>

                {/* Body */}
                <div className="p-6 bg-background text-sm text-muted-foreground leading-relaxed w-full">
                  {message}
                </div>

                {/* Footer */}
                <div className="bg-[#f8faf9] px-6 py-4 flex justify-end gap-3 border-t border-border/40">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel} 
                    disabled={isLoading}
                    className="border border-border bg-white hover:bg-muted text-foreground px-5 h-10 rounded-lg text-sm font-medium transition-colors"
                  >
                    {cancelText}
                  </Button>
                  <Button 
                    onClick={handleConfirm} 
                    isLoading={isLoading}
                    className={cn("px-5 h-10 rounded-lg text-sm font-medium transition-colors", getConfirmButtonClass())}
                  >
                    {confirmText}
                  </Button>
                </div>
              </>
            ) : (
              <>
                {getIcon()}
                
                <h3 
                  id="confirm-dialog-title" 
                  className="text-base font-semibold text-foreground mb-2"
                >
                  {title}
                </h3>
                
                <div className="text-sm text-muted-foreground leading-relaxed w-full text-center mb-6">
                  {message}
                </div>

                <div className="flex gap-3 w-full justify-stretch">
                  <Button 
                    variant="outline" 
                    onClick={handleCancel} 
                    disabled={isLoading}
                    className="border-border text-muted-foreground hover:bg-muted h-11 rounded-lg flex-1"
                  >
                    {cancelText}
                  </Button>
                  <Button 
                    onClick={handleConfirm} 
                    isLoading={isLoading}
                    className={cn("h-11 rounded-lg flex-1", getConfirmButtonClass())}
                  >
                    {confirmText}
                  </Button>
                </div>

                {!isLoading && (
                  <button 
                    onClick={handleCancel}
                    aria-label="Đóng"
                    className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmDialog;
