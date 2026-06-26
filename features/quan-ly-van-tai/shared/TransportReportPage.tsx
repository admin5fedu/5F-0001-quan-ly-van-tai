import React, { useMemo, useState, useCallback, useEffect, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  BarChart3,
  User,
  Car,
  MapPin,
  Calendar,
  DollarSign,
  Activity,
  TrendingUp,
  LayoutTemplate,
} from 'lucide-react';
import MultiSelect from '@/components/ui/MultiSelect';
import DateRangePicker from '@/components/ui/DateRangePicker';
import Tooltip from '@/components/ui/Tooltip';
import EmptyState from '@/components/shared/EmptyState';

import DashboardToolbar from '@/components/shared/DashboardToolbar';
import StatsKpiGrid from '@/components/shared/stats/StatsKpiGrid';
import type { StatsKpiCardItem } from '@/components/shared/stats/types';
import type { FilterGroup } from '@/components/ui/MobileFilterSheet';
import { useMediaQuery } from '@/lib/use-media-query';
import { usePrimaryColor } from '@/lib/theme-utils';
import { cn, getErrorMessage } from '@/lib/utils';
import StatsExportDropdown from '@/features/he-thong/nhan-vien/components/StatsExportDropdown';
import {
  EMPTY_TRANSPORT_LOOKUPS,
  TRANSPORT_MODULES,
  resolveTransportValue,
  type TransportLookupRows,
  type TransportRow,
} from './transport-config';
import { getTransportLookupRows, getTransportRows } from './transport-service';
import { exportTransportToExcel, exportTransportToPdf } from './export-transport-report';
import { getTripReportRows } from './transport-report-rows';

const TransportStatsCharts = lazy(() => import('./TransportStatsCharts'));

const ChartsFallback = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
    {[1, 2].map((i) => (
      <div key={i} className="bg-card rounded-xl border border-border p-3.5 h-[240px] animate-pulse">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="h-[180px] bg-muted/30 rounded-lg" />
      </div>
    ))}
  </div>
);

interface TransportReportPageProps {
  type: 'trips' | 'payroll';
}

const currency = new Intl.NumberFormat('vi-VN');

const DATE_RANGE_PRESETS = [
  { id: 'this_week', label: 'Tuần này' },
  { id: 'last_week', label: 'Tuần trước' },
  { id: 'this_month', label: 'Tháng này' },
  { id: 'last_month', label: 'Tháng trước' },
  { id: 'this_quarter', label: 'Quý này' },
  { id: 'last_quarter', label: 'Quý trước' },
  { id: 'this_year', label: 'Năm nay' },
  { id: 'custom', label: 'Tùy chọn' },
];

const DEFAULT_TRIP_KPI_IDS = ['total-trips', 'total-salary', 'total-cost', 'company-cost'];
const DEFAULT_PAYROLL_KPI_IDS = ['total-drivers', 'total-salary', 'total-deductions', 'total-remaining'];

const TRIP_KPI_LABELS: Record<string, string> = {
  'total-trips': 'Tổng số chuyến',
  'total-salary': 'Tổng lương chuyến',
  'total-cost': 'Tổng chi phí chuyến',
  'company-cost': 'Tổng chi phí công ty',
};

const PAYROLL_KPI_LABELS: Record<string, string> = {
  'total-drivers': 'Số tài xế',
  'total-salary': 'Tổng lương chuyến',
  'total-deductions': 'Tổng trừ tiền khác',
  'total-remaining': 'Tổng thực nhận',
};

interface TransportStatsKpiConfigPopoverProps {
  visibleKpiIds: string[];
  onToggle: (id: string) => void;
  isTripReport: boolean;
}

const TransportStatsKpiConfigPopover: React.FC<TransportStatsKpiConfigPopoverProps> = ({
  visibleKpiIds,
  onToggle,
  isTripReport,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const kpiIds = isTripReport ? DEFAULT_TRIP_KPI_IDS : DEFAULT_PAYROLL_KPI_IDS;
  const labels = isTripReport ? TRIP_KPI_LABELS : PAYROLL_KPI_LABELS;

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
      <Tooltip content="Cấu hình thẻ hiển thị" placement="bottom">
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
            Hiển thị chỉ số KPI
          </p>
          <div className="space-y-1.5">
            {kpiIds.map((id) => {
              const label = labels[id] ?? id;
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

function getLocalNow() {
  return new Date();
}

function getStartAndEndOfPreset(preset: string, customStartStr?: string, customEndStr?: string) {
  const now = getLocalNow();
  let start = '';
  let end = '';
  
  const formatDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  switch (preset) {
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      start = formatDateString(startOfWeek);
      end = formatDateString(endOfWeek);
      break;
    }
    case 'last_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      start = formatDateString(startOfWeek);
      end = formatDateString(endOfWeek);
      break;
    }
    case 'this_month': {
      const y = now.getFullYear();
      const m = now.getMonth();
      start = formatDateString(new Date(y, m, 1));
      end = formatDateString(new Date(y, m + 1, 0));
      break;
    }
    case 'last_month': {
      const y = now.getFullYear();
      const m = now.getMonth() - 1;
      start = formatDateString(new Date(y, m, 1));
      end = formatDateString(new Date(y, m + 1, 0));
      break;
    }
    case 'this_quarter': {
      const y = now.getFullYear();
      const q = Math.floor(now.getMonth() / 3);
      start = formatDateString(new Date(y, q * 3, 1));
      end = formatDateString(new Date(y, (q + 1) * 3, 0));
      break;
    }
    case 'last_quarter': {
      const y = now.getFullYear();
      const q = Math.floor(now.getMonth() / 3) - 1;
      const targetYear = q < 0 ? y - 1 : y;
      const targetQuarter = q < 0 ? 3 : q;
      start = formatDateString(new Date(targetYear, targetQuarter * 3, 1));
      end = formatDateString(new Date(targetYear, (targetQuarter + 1) * 3, 0));
      break;
    }
    case 'this_year': {
      const y = now.getFullYear();
      start = formatDateString(new Date(y, 0, 1));
      end = formatDateString(new Date(y, 12, 0));
      break;
    }
    case 'custom':
    default:
      start = customStartStr || '';
      end = customEndStr || '';
      break;
  }
  return { start, end };
}

function getPresetLabel(preset: string, start: string, end: string) {
  if (preset === 'custom') {
    if (start && end) {
      const [sy, sm, sd] = start.split('-');
      const [ey, em, ed] = end.split('-');
      return `${sd}/${sm}/${sy} – ${ed}/${em}/${ey}`;
    }
    return 'Tùy chọn';
  }
  if (!start || !end) return '';

  const [sy, sm, sd] = start.split('-');
  const [ey, em, ed] = end.split('-');

  switch (preset) {
    case 'this_week':
    case 'last_week':
      return `Tuần ${Number(sd)}/${Number(sm)} – ${Number(ed)}/${Number(em)}/${ey}`;
    case 'this_month':
    case 'last_month':
      return `Tháng ${Number(sm)}/${sy}`;
    case 'this_quarter':
    case 'last_quarter': {
      const q = Math.floor((Number(sm) - 1) / 3) + 1;
      return `Quý ${q}/${sy}`;
    }
    case 'this_year':
      return `Năm ${sy}`;
    default:
      return '';
  }
}

function getPayrollReportRows(payrollRows: TransportRow[], lookups: Partial<TransportLookupRows> = EMPTY_TRANSPORT_LOOKUPS) {
  return payrollRows.map((row) => ({
    id: row.id,
    nam: row.nam,
    thang: row.thang,
    id_tai_xe: row.id_tai_xe,
    tai_xe: resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups),
    tong_luong_chuyen: Number(row.tong_luong_chuyen ?? 0),
    tong_chi_phi_chuyen: Number(row.tong_chi_phi_chuyen ?? 0),
    tru_tien_khac: Number(row.tru_tien_khac ?? row.tong_chi_phi_khac ?? 0),
    tong_con_lai: Number(row.tong_con_lai ?? 0),
    trang_thai: row.trang_thai,
  }));
}

const TransportReportPage: React.FC<TransportReportPageProps> = ({ type }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialDriver = searchParams.get('id_tai_xe');
  const initialVehicle = searchParams.get('id_xe');
  const initialLocation = searchParams.get('id_dia_diem');

  const [datePreset, setDatePreset] = useState<string>('this_month');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [drivers, setDrivers] = useState<string[]>(() => initialDriver ? [initialDriver] : []);
  const [locations, setLocations] = useState<string[]>(() => initialLocation ? [initialLocation] : []);
  const [vehicles, setVehicles] = useState<string[]>(() => initialVehicle ? [initialVehicle] : []);
  
  const [statsTableTab, setStatsTableTab] = useState<'location' | 'driver'>('location');
  
  const isTripReport = type === 'trips';
  const { hex: primaryHex } = usePrimaryColor();
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const chartHeight = isMdUp ? 240 : 200;
  const [chartsVisible, setChartsVisible] = useState(false);

  const defaultKpiIds = isTripReport ? DEFAULT_TRIP_KPI_IDS : DEFAULT_PAYROLL_KPI_IDS;
  const storageKey = isTripReport ? 'transport-stats-kpi-trips' : 'transport-stats-kpi-payroll';

  const [visibleKpiIds, setVisibleKpiIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return defaultKpiIds;
      const parsed = JSON.parse(raw) as string[];
      return Array.isArray(parsed) && parsed.length > 0 ? parsed : defaultKpiIds;
    } catch {
      return defaultKpiIds;
    }
  });

  const handleToggleKpi = useCallback((id: string) => {
    setVisibleKpiIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((k) => k !== id)
        : [...prev, id];
      if (next.length === 0) return prev;
      localStorage.setItem(storageKey, JSON.stringify(next));
      return next;
    });
  }, [storageKey]);

  useEffect(() => {
    const timer = setTimeout(() => setChartsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const { data: lookups = EMPTY_TRANSPORT_LOOKUPS, isLoading: isLoadingLookups, error: lookupError } = useQuery({
    queryKey: ['transport', 'lookups'],
    queryFn: getTransportLookupRows,
  });

  const tripDetailsQuery = useQuery({
    queryKey: ['transport', 'report-trip-details'],
    queryFn: () => getTransportRows(TRANSPORT_MODULES.tripDetails),
    enabled: isTripReport,
  });

  const payrollQuery = useQuery({
    queryKey: ['transport', 'report-payroll'],
    queryFn: () => getTransportRows(TRANSPORT_MODULES.payroll),
    enabled: !isTripReport,
  });

  const sourceRows = useMemo(
    () => (isTripReport ? tripDetailsQuery.data ?? [] : payrollQuery.data ?? []),
    [isTripReport, tripDetailsQuery.data, payrollQuery.data],
  );
  const isLoading = isLoadingLookups || (isTripReport ? tripDetailsQuery.isLoading : payrollQuery.isLoading);
  const error = lookupError ?? (isTripReport ? tripDetailsQuery.error : payrollQuery.error);

  const rows = useMemo(
    () => (isTripReport ? getTripReportRows(sourceRows, lookups) : getPayrollReportRows(sourceRows, lookups)),
    [isTripReport, sourceRows, lookups],
  );

  const { start: dateStart, end: dateEnd } = useMemo(() => {
    return getStartAndEndOfPreset(datePreset, customStart, customEnd);
  }, [datePreset, customStart, customEnd]);

  const displayLabel = useMemo(() => {
    return getPresetLabel(datePreset, dateStart, dateEnd);
  }, [datePreset, dateStart, dateEnd]);

  const matchDate = useCallback((row: any) => {
    if (isTripReport) {
      const rowDate = String(row.ngay ?? '');
      if (!rowDate) return true;
      if (dateStart && rowDate < dateStart) return false;
      if (dateEnd && rowDate > dateEnd) return false;
      return true;
    } else {
      const rYear = Number(row.nam);
      const rMonth = Number(row.thang);
      if (!rYear || !rMonth) return true;
      if (dateStart) {
        const [sYear, sMonth] = dateStart.split('-').map(Number);
        if (rYear < sYear || (rYear === sYear && rMonth < sMonth)) return false;
      }
      if (dateEnd) {
        const [eYear, eMonth] = dateEnd.split('-').map(Number);
        if (rYear > eYear || (rYear === eYear && rMonth > eMonth)) return false;
      }
      return true;
    }
  }, [isTripReport, dateStart, dateEnd]);

  const filtered = useMemo(
    () =>
      rows.filter((row) => {
        const matchDriver = drivers.length === 0 || drivers.includes(String(row.id_tai_xe ?? ''));
        const matchLocation = !isTripReport || locations.length === 0 || locations.includes(String((row as any).id_dia_diem ?? ''));
        const matchVehicle = !isTripReport || vehicles.length === 0 || vehicles.includes(String((row as any).id_xe ?? ''));
        const matchDateRange = matchDate(row);
        return matchDriver && matchLocation && matchVehicle && matchDateRange;
      }),
    [rows, drivers, locations, vehicles, matchDate, isTripReport],
  );

  // Summaries
  const totalSalary = useMemo(() => {
    return filtered.reduce((sum, row) => sum + Number((row as any).tien_luong ?? (row as any).tong_luong_chuyen ?? 0), 0);
  }, [filtered]);

  const totalCost = useMemo(() => {
    return filtered.reduce(
      (sum, row) => sum + Number((row as any).chi_phi ?? (row as any).tong_chi_phi_chuyen ?? 0) + Number((row as any).tru_tien_khac ?? 0),
      0,
    );
  }, [filtered]);

  const totalRemaining = useMemo(() => {
    return filtered.reduce((sum, row) => sum + Number((row as any).tong_con_lai ?? 0), 0);
  }, [filtered]);

  const totalDeductions = useMemo(() => {
    return filtered.reduce((sum, row) => sum + Number((row as any).tru_tien_khac ?? 0), 0);
  }, [filtered]);

  // KPI items matching StatsKpiCardItem
  const allKpis = useMemo((): StatsKpiCardItem[] => {
    if (isTripReport) {
      return [
        {
          id: 'total-trips',
          label: 'Tổng số chuyến',
          value: filtered.length,
          icon: Activity,
          color: 'text-cyan-500',
          bg: 'bg-cyan-500/10',
        },
        {
          id: 'total-salary',
          label: 'Tổng lương chuyến',
          value: currency.format(totalSalary),
          icon: DollarSign,
          color: 'text-emerald-500',
          bg: 'bg-emerald-500/10',
        },
        {
          id: 'total-cost',
          label: 'Tổng chi phí chuyến',
          value: currency.format(totalCost),
          icon: DollarSign,
          color: 'text-amber-500',
          bg: 'bg-amber-500/10',
        },
        {
          id: 'company-cost',
          label: 'Tổng chi phí công ty',
          value: currency.format(totalSalary + totalCost),
          icon: DollarSign,
          color: 'text-indigo-500',
          bg: 'bg-indigo-500/10',
        },
      ];
    }

    return [
      {
        id: 'total-drivers',
        label: 'Số tài xế',
        value: filtered.length,
        icon: User,
        color: 'text-primary',
        bg: 'bg-primary/10',
      },
      {
        id: 'total-salary',
        label: 'Tổng lương chuyến',
        value: currency.format(totalSalary),
        icon: DollarSign,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10',
      },
      {
        id: 'total-deductions',
        label: 'Tổng trừ tiền khác',
        value: currency.format(totalDeductions),
        icon: DollarSign,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10',
      },
      {
        id: 'total-remaining',
        label: 'Tổng thực nhận',
        value: currency.format(totalRemaining),
        icon: DollarSign,
        color: 'text-cyan-500',
        bg: 'bg-cyan-500/10',
      },
    ];
  }, [isTripReport, filtered.length, totalSalary, totalCost, totalDeductions, totalRemaining]);

  const kpis = useMemo(() => {
    return allKpis.filter((k) => visibleKpiIds.includes(k.id));
  }, [allKpis, visibleKpiIds]);

  // Grouped charts data
  const locationData = useMemo(() => {
    if (!isTripReport) return [];
    const counts: Record<string, { id: string; name: string; value: number }> = {};
    filtered.forEach((row) => {
      const locId = String((row as any).id_dia_diem ?? 'unknown');
      const locName = String((row as any).dia_diem ?? 'Chưa xác định');
      if (!counts[locId]) {
        counts[locId] = { id: locId, name: locName, value: 0 };
      }
      counts[locId].value += 1;
    });
    return Object.values(counts);
  }, [filtered, isTripReport]);

  const driverTripData = useMemo(() => {
    if (!isTripReport) return [];
    const counts: Record<string, { id: string; name: string; value: number }> = {};
    filtered.forEach((row) => {
      const drvId = String((row as any).id_tai_xe ?? 'unknown');
      const drvName = String((row as any).tai_xe ?? 'Chưa xác định');
      if (!counts[drvId]) {
        counts[drvId] = { id: drvId, name: drvName, value: 0 };
      }
      counts[drvId].value += 1;
    });
    return Object.values(counts);
  }, [filtered, isTripReport]);

  const financeTrendData = useMemo(() => {
    if (!isTripReport) return [];
    const daily: Record<string, { salary: number; cost: number }> = {};
    filtered.forEach((row) => {
      const day = String((row as any).ngay ?? '');
      if (!day) return;
      if (!daily[day]) {
        daily[day] = { salary: 0, cost: 0 };
      }
      daily[day].salary += Number((row as any).tien_luong ?? 0);
      daily[day].cost += Number((row as any).chi_phi ?? 0);
    });
    return Object.entries(daily)
      .map(([label, v]) => ({
        label,
        salary: v.salary,
        cost: v.cost,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered, isTripReport]);

  const driverPayrollData = useMemo(() => {
    if (isTripReport) return [];
    return filtered.map((row) => ({
      id: String((row as any).id_tai_xe ?? 'unknown'),
      name: String((row as any).tai_xe ?? 'Chưa xác định'),
      tong_luong_chuyen: Number((row as any).tong_luong_chuyen ?? 0),
      tru_tien_khac: Number((row as any).tru_tien_khac ?? 0),
      tong_con_lai: Number((row as any).tong_con_lai ?? 0),
    }));
  }, [filtered, isTripReport]);

  const payrollTrendData = useMemo(() => {
    if (isTripReport) return [];
    const monthly: Record<string, number> = {};
    filtered.forEach((row) => {
      const key = `${(row as any).nam}-${String((row as any).thang).padStart(2, '0')}`;
      monthly[key] = (monthly[key] ?? 0) + Number((row as any).tong_con_lai ?? 0);
    });
    return Object.entries(monthly)
      .map(([key, total]) => {
        const [year, month] = key.split('-');
        return {
          label: `T${Number(month)}/${year}`,
          total,
          sortKey: key,
        };
      })
      .sort((a, b) => a.sortKey.localeCompare(b.sortKey));
  }, [filtered, isTripReport]);

  // Pivot statistics for tables:
  const locationPivot = useMemo(() => {
    if (!isTripReport) return [];
    const map: Record<string, { id: string; name: string; trips: number; salary: number; cost: number }> = {};
    filtered.forEach((row: any) => {
      const locId = row.id_dia_diem || 'unknown';
      const locName = row.dia_diem || 'Chưa xác định';
      if (!map[locId]) {
        map[locId] = { id: locId, name: locName, trips: 0, salary: 0, cost: 0 };
      }
      map[locId].trips += 1;
      map[locId].salary += Number(row.tien_luong ?? 0);
      map[locId].cost += Number(row.chi_phi ?? 0);
    });
    const list = Object.values(map);
    const totalTrips = filtered.length || 1;
    return list.map(item => ({
      ...item,
      rate: Math.round((item.trips / totalTrips) * 100),
    })).sort((a, b) => b.trips - a.trips);
  }, [filtered, isTripReport]);

  const driverPivot = useMemo(() => {
    if (!isTripReport) return [];
    const map: Record<string, { id: string; name: string; trips: number; salary: number; cost: number }> = {};
    filtered.forEach((row: any) => {
      const drvId = row.id_tai_xe || 'unknown';
      const drvName = row.tai_xe || 'Chưa xác định';
      if (!map[drvId]) {
        map[drvId] = { id: drvId, name: drvName, trips: 0, salary: 0, cost: 0 };
      }
      map[drvId].trips += 1;
      map[drvId].salary += Number(row.tien_luong ?? 0);
      map[drvId].cost += Number(row.chi_phi ?? 0);
    });
    const list = Object.values(map);
    const totalTrips = filtered.length || 1;
    return list.map(item => ({
      ...item,
      rate: Math.round((item.trips / totalTrips) * 100),
    })).sort((a, b) => b.trips - a.trips);
  }, [filtered, isTripReport]);

  const payrollPivot = useMemo(() => {
    if (isTripReport) return [];
    return filtered.map((row: any) => {
      const gross = Number(row.tong_luong_chuyen ?? 0);
      const net = Number(row.tong_con_lai ?? 0);
      return {
        id: row.id_tai_xe || 'unknown',
        name: row.tai_xe || 'Chưa xác định',
        gross,
        deductions: Number(row.tru_tien_khac ?? 0),
        net,
        rate: gross > 0 ? Math.round((net / gross) * 100) : 0,
      };
    }).sort((a, b) => b.net - a.net);
  }, [filtered, isTripReport]);

  const summaryData = useMemo(() => {
    if (isTripReport) {
      return statsTableTab === 'location' ? locationPivot : driverPivot;
    }
    return payrollPivot;
  }, [isTripReport, statsTableTab, locationPivot, driverPivot, payrollPivot]);

  const renderMiniSummary = useMemo(() => {
    if (filtered.length === 0) {
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-0.5 flex-wrap animate-none">
          <span>Không có dữ liệu trong khoảng thời gian đã chọn.</span>
        </div>
      );
    }

    if (isTripReport) {
      const topDriver = driverPivot[0] ? `${driverPivot[0].name} (${driverPivot[0].trips} chuyến)` : '—';
      const topLocation = locationPivot[0] ? `${locationPivot[0].name} (${locationPivot[0].trips} chuyến)` : '—';
      const executionRate =
        filtered.length > 0
          ? Math.round((filtered.filter((r) => r.trang_thai === 'Đã thực hiện').length / filtered.length) * 100)
          : 100;
      const approvalRate =
        filtered.length > 0
          ? Math.round((filtered.filter((r) => r.phe_duyet === 'Đã duyệt').length / filtered.length) * 100)
          : 100;

      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-0.5 flex-wrap animate-none">
          {locationPivot.length > 0 && (
            <span>
              Địa điểm giao nhận nhiều nhất:{' '}
              <strong className="text-foreground font-semibold">{topLocation}</strong>
            </span>
          )}
          {driverPivot.length > 0 && (
            <>
              <span className="text-border">|</span>
              <span>
                Tài xế hoạt động tích cực nhất:{' '}
                <strong className="text-foreground font-semibold">{topDriver}</strong>
              </span>
            </>
          )}
          {filtered.length > 0 && (
            <>
              <span className="text-border">|</span>
              <span>
                Tỷ lệ TH:{' '}
                <strong className="text-foreground font-semibold">{executionRate}%</strong>
              </span>
              <span className="text-border">|</span>
              <span>
                Tỷ lệ duyệt:{' '}
                <strong className="text-foreground font-semibold">{approvalRate}%</strong>
              </span>
            </>
          )}
        </div>
      );
    } else {
      const avgNet = filtered.length > 0 ? Math.round(totalRemaining / filtered.length) : 0;
      const topPaid = payrollPivot[0] ? `${payrollPivot[0].name} (${currency.format(payrollPivot[0].net)} đ)` : '—';

      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-0.5 flex-wrap animate-none">
          <span>
            Số tài xế nhận lương:{' '}
            <strong className="text-foreground font-semibold">{filtered.length}</strong>
          </span>
          {filtered.length > 0 && (
            <>
              <span className="text-border">|</span>
              <span>
                Thực nhận bình quân:{' '}
                <strong className="text-foreground font-semibold">{currency.format(avgNet)} đ</strong>
              </span>
            </>
          )}
          {payrollPivot.length > 0 && (
            <>
              <span className="text-border">|</span>
              <span>
                Thực nhận cao nhất:{' '}
                <strong className="text-foreground font-semibold">{topPaid}</strong>
              </span>
            </>
          )}
        </div>
      );
    }
  }, [filtered, isTripReport, driverPivot, locationPivot, totalRemaining, payrollPivot]);

  const title = isTripReport ? 'Thống kê chuyến đi' : 'Thống kê lương';

  // Toolbar elements
  const handleClearFilters = useCallback(() => {
    setDatePreset('this_month');
    setCustomStart('');
    setCustomEnd('');
    setDrivers([]);
    setLocations([]);
    setVehicles([]);
  }, []);

  const dateRangePickerPresets = DATE_RANGE_PRESETS;

  const renderFilters = useMemo(() => (
    <>
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={{ preset: datePreset, customStart, customEnd }}
        onChange={(v) => {
          setDatePreset(v.preset);
          setCustomStart(v.customStart);
          setCustomEnd(v.customEnd);
        }}
        displayLabel={displayLabel}
        className="shrink-0"
      />
      <MultiSelect
        options={(lookups?.drivers || []).map((row) => ({ label: String(row.ho_ten), value: String(row.id) }))}
        value={drivers}
        onChange={setDrivers}
        icon={User}
        placeholder="Tất cả tài xế"
        className="w-[148px] shrink-0"
      />
      {isTripReport && (
        <>
          <MultiSelect
            options={(lookups?.locations || []).map((row) => ({ label: String(row.ten), value: String(row.id) }))}
            value={locations}
            onChange={setLocations}
            icon={MapPin}
            placeholder="Tất cả địa điểm"
            className="w-[148px] shrink-0"
          />
          <MultiSelect
            options={(lookups?.vehicles || []).map((row) => ({ label: `${row.bien_so} - ${row.hang}`, value: String(row.id) }))}
            value={vehicles}
            onChange={setVehicles}
            icon={Car}
            placeholder="Tất cả xe"
            className="w-[148px] shrink-0"
          />
        </>
      )}
    </>
  ), [lookups, drivers, locations, vehicles, datePreset, customStart, customEnd, isTripReport, displayLabel]);

  const handleExportReport = useCallback(
    async (format: 'excel' | 'pdf') => {
      const exportedAt = new Intl.DateTimeFormat('vi-VN', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date());

      const dateRangeText =
        datePreset === 'custom'
          ? `${customStart} – ${customEnd}`
          : DATE_RANGE_PRESETS.find((p) => p.id === datePreset)?.label || 'Thống kê';

      const filterDriverLabels = drivers.map(
        (id) => String((lookups?.drivers || []).find((d) => String(d.id) === id)?.ho_ten ?? id)
      );
      const filterLocationLabels = locations.map(
        (id) => String((lookups?.locations || []).find((l) => String(l.id) === id)?.ten ?? id)
      );
      const filterVehicleLabels = vehicles.map((id) => {
        const v = (lookups?.vehicles || []).find((veh) => String(veh.id) === id);
        return v ? String(v.bien_so ?? '') + (v.hang ? ' - ' + String(v.hang) : '') : id;
      });

      const meta = {
        dateRangeLabel: dateRangeText,
        filterDriverLabels,
        filterLocationLabels,
        filterVehicleLabels,
        exportedAt,
        statsTableTab,
      };

      try {
        if (format === 'excel') {
          await exportTransportToExcel(meta, kpis, summaryData, type);
        } else {
          await exportTransportToPdf(meta, kpis, summaryData, type);
        }
        toast.success('Xuất báo cáo thành công!');
      } catch (err) {
        toast.error('Có lỗi xảy ra khi xuất báo cáo!');
      }
    },
    [datePreset, customStart, customEnd, drivers, locations, vehicles, lookups, kpis, summaryData, type, statsTableTab]
  );

  const renderActions = useMemo(() => (
    <div className="flex items-center gap-1.5 shrink-0">
      <TransportStatsKpiConfigPopover
        visibleKpiIds={visibleKpiIds}
        onToggle={handleToggleKpi}
        isTripReport={isTripReport}
      />
      <StatsExportDropdown onExport={handleExportReport} compact={false} />
    </div>
  ), [visibleKpiIds, handleToggleKpi, isTripReport, handleExportReport]);

  const filterGroups = useMemo((): FilterGroup[] => {
    const groups: FilterGroup[] = [
      {
        key: 'driver',
        label: 'Tài xế',
        icon: User,
        options: (lookups?.drivers || []).map((d) => ({ label: String(d.ho_ten), value: String(d.id) })),
        value: drivers,
        onChange: setDrivers,
      },
    ];
    if (isTripReport) {
      groups.push(
        {
          key: 'location',
          label: 'Địa điểm',
          icon: MapPin,
          options: (lookups?.locations || []).map((l) => ({ label: String(l.ten), value: String(l.id) })),
          value: locations,
          onChange: setLocations,
        },
        {
          key: 'vehicle',
          label: 'Xe',
          icon: Car,
          options: (lookups?.vehicles || []).map((v) => ({ label: `${v.bien_so} - ${v.hang}`, value: String(v.id) })),
          value: vehicles,
          onChange: setVehicles,
        }
      );
    }
    return groups;
  }, [lookups, drivers, locations, vehicles, isTripReport]);

  const activeFilterCount = 
    (drivers.length > 0 ? 1 : 0) + 
    (locations.length > 0 ? 1 : 0) + 
    (vehicles.length > 0 ? 1 : 0) + 
    (datePreset !== 'this_month' || customStart || customEnd ? 1 : 0);

  // Drill-down handlers
  const handleDrillDown = useCallback((row: any) => {
    if (isTripReport) {
      if (statsTableTab === 'location') {
        setSearchParams({ tab: 'danh-sach-ct', id_dia_diem: row.id });
      } else {
        setSearchParams({ tab: 'danh-sach', id_tai_xe: row.id });
      }
    } else {
      setSearchParams({ tab: 'danh-sach', id_tai_xe: row.id });
    }
  }, [isTripReport, statsTableTab, setSearchParams]);

  const handleDrillDownLocation = useCallback((locId: string) => {
    if (locId === 'unknown') return;
    setSearchParams({ tab: 'danh-sach-ct', id_dia_diem: locId });
  }, [setSearchParams]);

  const handleDrillDownDriver = useCallback((drvId: string) => {
    if (drvId === 'unknown') return;
    setSearchParams({ tab: 'danh-sach', id_tai_xe: drvId });
  }, [setSearchParams]);

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 bg-background">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground">Đang tải dữ liệu thống kê...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8 bg-background">
        <EmptyState title="Không tải được dữ liệu" description={getErrorMessage(error)} />
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col bg-muted/10">
      <DashboardToolbar
        filters={renderFilters}
        actions={renderActions}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={handleClearFilters}
        className="static z-auto"
      />

      <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="min-w-0 max-w-full space-y-3 p-3 sm:p-4 pb-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          
          {/* Lưới KPI cards tiêu chuẩn */}
          <StatsKpiGrid items={kpis} />

          {/* Dòng Mini Summary */}
          {renderMiniSummary}

          {/* Biểu đồ Recharts */}
          {chartsVisible ? (
            <Suspense fallback={<ChartsFallback />}>
              <TransportStatsCharts
                type={type}
                chartsVisible={chartsVisible}
                chartHeight={chartHeight}
                isMdUp={isMdUp}
                primaryHex={primaryHex}
                locationData={locationData}
                driverTripData={driverTripData}
                financeTrendData={financeTrendData}
                driverPayrollData={driverPayrollData}
                payrollTrendData={payrollTrendData}
                onDrillDownLocation={handleDrillDownLocation}
                onDrillDownDriver={handleDrillDownDriver}
              />
            </Suspense>
          ) : (
            <ChartsFallback />
          )}

          {/* Bảng dữ liệu thống kê tổng hợp (Pivot) */}
          <div className="min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-4 py-2.5 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <BarChart3 size={14} className="text-primary" aria-hidden />
                <h3 className="text-xs font-semibold text-foreground">
                  {isTripReport ? 'Bảng tổng hợp chuyến đi' : 'Bảng tổng hợp lương tài xế'}
                </h3>
              </div>
              
              {isTripReport && (
                <div className="flex bg-muted p-0.5 rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setStatsTableTab('location')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                      statsTableTab === 'location' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Theo địa điểm
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatsTableTab('driver')}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-semibold transition-all",
                      statsTableTab === 'driver' ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Theo tài xế
                  </button>
                </div>
              )}
            </div>

            <div className="max-w-full min-w-0 w-full overflow-x-auto overflow-y-auto overscroll-x-contain overscroll-y-contain rounded-b-xl custom-scrollbar max-h-[400px]">
              {error ? (
                <div className="flex h-40 items-center justify-center p-6 bg-card">
                  <EmptyState title="Không tải được dữ liệu" description={getErrorMessage(error)} />
                </div>
              ) : summaryData.length === 0 ? (
                <div className="flex h-40 items-center justify-center p-6 bg-card">
                  <EmptyState title="Không có dữ liệu" description="Thử thay đổi bộ lọc." />
                </div>
              ) : (
                <table className="w-full min-w-[36rem] text-xs border-separate border-spacing-0">
                  <thead>
                    <tr className="border-b border-border bg-muted">
                      <th
                        scope="col"
                        className="sticky top-0 left-0 z-[5] text-left px-4 py-2 font-semibold text-foreground/80 bg-muted border-b border-r border-border whitespace-nowrap"
                      >
                        {isTripReport ? (statsTableTab === 'location' ? 'Địa điểm' : 'Tài xế') : 'Tài xế'}
                      </th>
                      {isTripReport ? (
                        <>
                          <th scope="col" className="sticky top-0 z-[4] text-center px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Tổng số chuyến</th>
                          <th scope="col" className="sticky top-0 z-[4] text-right px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Lương chuyến đi</th>
                          <th scope="col" className="sticky top-0 z-[4] text-right px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Chi phí chuyến đi</th>
                          <th scope="col" className="sticky top-0 z-[4] text-center px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Tỷ lệ chuyến</th>
                        </>
                      ) : (
                        <>
                          <th scope="col" className="sticky top-0 z-[4] text-right px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Tổng lương chuyến</th>
                          <th scope="col" className="sticky top-0 z-[4] text-right px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Khấu trừ khác</th>
                          <th scope="col" className="sticky top-0 z-[4] text-right px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Thực nhận cuối cùng</th>
                          <th scope="col" className="sticky top-0 z-[4] text-center px-3 py-2 font-semibold text-foreground/80 bg-muted border-b border-border whitespace-nowrap">Tỷ lệ thực nhận / lương</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {summaryData.map((row) => (
                      <tr
                        key={row.id}
                        onClick={() => handleDrillDown(row)}
                        className="group cursor-pointer transition-colors duration-150 bg-card even:bg-muted/15 hover:bg-accent [&>td]:border-b [&>td]:border-border"
                      >
                        <td className="sticky left-0 z-[2] font-semibold bg-card group-hover:bg-accent transition-colors duration-150 border-r border-border px-4 py-2.5 text-foreground max-w-[14rem] truncate">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {isTripReport && statsTableTab === 'location' ? (
                              <MapPin size={12} className="text-primary/60 shrink-0" />
                            ) : (
                              <User size={12} className="text-primary/60 shrink-0" />
                            )}
                            <span className="truncate">{row.name}</span>
                          </div>
                        </td>
                        {isTripReport ? (
                          (() => {
                            const r = row as { trips: number; salary: number; cost: number; rate: number };
                            return (
                              <>
                                <td className="text-center px-3 py-2.5 font-semibold text-foreground tabular-nums">{r.trips}</td>
                                <td className="text-right px-3 py-2.5 text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">{currency.format(r.salary)} đ</td>
                                <td className="text-right px-3 py-2.5 text-amber-600 dark:text-amber-400 font-medium tabular-nums">{currency.format(r.cost)} đ</td>
                                <td className="text-center px-3 py-2.5">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                      <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${r.rate}%` }}
                                      />
                                    </div>
                                    <span className="text-muted-foreground tabular-nums font-medium w-8 text-right">
                                      {r.rate}%
                                    </span>
                                  </div>
                                </td>
                              </>
                            );
                          })()
                        ) : (
                          (() => {
                            const r = row as { gross: number; deductions: number; net: number; rate: number };
                            return (
                              <>
                                <td className="text-right px-3 py-2.5 font-semibold text-foreground tabular-nums">{currency.format(r.gross)} đ</td>
                                <td className="text-right px-3 py-2.5 text-rose-500 font-medium tabular-nums">{currency.format(r.deductions)} đ</td>
                                <td className="text-right px-3 py-2.5 text-cyan-600 dark:text-cyan-400 font-semibold tabular-nums">{currency.format(r.net)} đ</td>
                                <td className="text-center px-3 py-2.5">
                                  <div className="flex items-center justify-center gap-1.5">
                                    <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                      <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${r.rate}%` }}
                                      />
                                    </div>
                                    <span className="text-muted-foreground tabular-nums font-medium w-8 text-right">
                                      {r.rate}%
                                    </span>
                                  </div>
                                </td>
                              </>
                            );
                          })()
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TransportReportPage;
