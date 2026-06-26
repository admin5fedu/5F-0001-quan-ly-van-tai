import React, { useState, useRef, useEffect } from 'react';
import { txt } from '../../../../lib/text';
import { LayoutTemplate } from 'lucide-react';
import Tooltip from '../../../../components/ui/Tooltip';
import { DEFAULT_KPI_IDS } from '../core/stats-constants';

export interface StatsKpiConfigPopoverProps {
  visibleKpiIds: string[];
  onToggle: (id: string) => void;
}

const KPI_LABEL_KEYS: Record<string, string> = {
  total: 'employee.stats.totalEmployees',
  active: 'employee.stats.working',
  probation: 'employee.stats.probation',
  inactive: 'employee.stats.leaveResigned',
};

const StatsKpiConfigPopover: React.FC<StatsKpiConfigPopoverProps> = ({
  visibleKpiIds,
  onToggle,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Tooltip content={txt('employee.stats.kpiOptions')} placement="bottom">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="h-8 w-8 flex items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-muted"
        >
          <LayoutTemplate size={14} />
        </button>
      </Tooltip>
      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-card rounded-xl shadow-xl border border-border z-50 p-2.5">
          <p className="text-[11px] font-semibold text-muted-foreground mb-2">
            {txt('employee.stats.showKpi')}
          </p>
          <div className="space-y-1.5">
            {DEFAULT_KPI_IDS.map((id) => {
              const label = txt(KPI_LABEL_KEYS[id] ?? id);
              return (
                <label
                  key={id}
                  className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={visibleKpiIds.includes(id)}
                    onChange={() => onToggle(id)}
                    className="w-3.5 h-3.5 rounded border-border accent-primary"
                  />
                  {label}
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsKpiConfigPopover;
