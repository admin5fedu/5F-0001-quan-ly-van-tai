import React from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StatusChoiceTone = 'success' | 'danger';

export type StatusChoiceOption<T extends string> = {
  value: T;
  label: string;
  tone: StatusChoiceTone;
};

type StatusChoiceFormProps<T extends string> = {
  sectionLabel: string;
  options: StatusChoiceOption<T>[];
  value: T;
  onChange: (value: T) => void;
  hint?: string;
};

/**
 * Hai thẻ chọn trạng thái trong confirm dialog — bám pattern popup duyệt (03-ui-ux)
 * và ConfirmDialog message slot của template @ 47947e6.
 */
export function StatusChoiceForm<T extends string>({
  sectionLabel,
  options,
  value,
  onChange,
  hint,
}: StatusChoiceFormProps<T>) {
  return (
    <div className="space-y-2">
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground/80">
        {sectionLabel}
      </label>
      <div className="flex gap-3">
        {options.map((option) => {
          const selected = value === option.value;
          const isSuccess = option.tone === 'success';
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={cn(
                'flex-1 flex items-center justify-start py-3 px-4 rounded-xl border transition-all font-bold text-sm cursor-pointer',
                selected
                  ? isSuccess
                    ? 'bg-[#def7ec]/50 border-[#31c48d] text-foreground'
                    : 'bg-[#fde8e8]/50 border-[#f05a5a] text-foreground'
                  : 'bg-background border-border text-[#4b5563] hover:bg-muted/30',
              )}
            >
              <div
                className={cn(
                  'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mr-3',
                  isSuccess ? 'bg-[#def7ec]' : 'bg-[#fde8e8]',
                )}
              >
                {isSuccess ? (
                  <Check size={14} className="text-[#0e9f6e] stroke-[3.5]" />
                ) : (
                  <X size={14} className="text-[#e02424] stroke-[3.5]" />
                )}
              </div>
              {option.label}
            </button>
          );
        })}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export const confirmNoteFieldClass =
  'w-full min-h-24 rounded-xl border border-border bg-[#f9fafb] px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none';

export const confirmCurrencyInputClass =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';