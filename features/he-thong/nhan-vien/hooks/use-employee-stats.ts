import { useMemo, useCallback } from 'react';
import {
  Users,
  UserCheck,
  Clock,
  UserX,
} from 'lucide-react';
import type { Employee } from '../core/types';
import {
  DEPT_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  DEFAULT_KPI_IDS,
} from '../core/stats-constants';
import type { StatsDateRange, KpiItem, StatsTrends, StatsMiniSummary } from '../core/stats-types';
import { isEmployedOnOrBefore, getMonthKeysEndingAt } from '../utils/stats-date-range';

interface UseEmployeeStatsParams {
  employees: Employee[];
  filterDept: string[];
  filterStatus: string[];
  dateRange: StatsDateRange;
  /** KPI ids to show (from localStorage or default) */
  visibleKpiIds?: string[];
}

export function useEmployeeStats({
  employees,
  filterDept,
  filterStatus,
  dateRange,
  visibleKpiIds = [...DEFAULT_KPI_IDS],
}: UseEmployeeStatsParams) {
  const filtered = useMemo(() => {
    const asAt = dateRange.end;
    return employees.filter((emp) => {
      if (!isEmployedOnOrBefore(emp.tg_tao, asAt)) return false;
      const matchDept =
        filterDept.length === 0 || (emp.id_phong_ban && filterDept.includes(emp.id_phong_ban));
      const matchStatus =
        filterStatus.length === 0 || filterStatus.includes(emp.trang_thai);
      return matchDept && matchStatus;
    });
  }, [employees, filterDept, filterStatus, dateRange.end]);

  const total = filtered.length;
  const active = filtered.filter((e) => e.trang_thai === 'Đang làm việc').length;
  const probation = filtered.filter((e) => e.trang_thai === 'Thử việc').length;
  const inactive = filtered.filter((e) => e.trang_thai === 'Nghỉ việc' || e.trang_thai === 'Nghỉ phép').length;

  const pct = useCallback(
    (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%'),
    [total],
  );

  const trends = useMemo((): StatsTrends => {
    const end = dateRange.end;
    const thisMonth = `${end.getFullYear()}-${String(end.getMonth() + 1).padStart(2, '0')}`;
    const prevDate = new Date(end.getFullYear(), end.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    const hiredThisMonth = filtered.filter(
      (e) => e.tg_tao && e.tg_tao.startsWith(thisMonth)
    ).length;
    const hiredPrevMonth = filtered.filter(
      (e) => e.tg_tao && e.tg_tao.startsWith(prevMonth)
    ).length;

    const totalDelta = hiredThisMonth;
    const activeDelta = hiredThisMonth - hiredPrevMonth;

    const samePeriodLastYear = new Date(end);
    samePeriodLastYear.setFullYear(samePeriodLastYear.getFullYear() - 1);
    const filteredLastYear = employees.filter((e) => {
      if (!isEmployedOnOrBefore(e.tg_tao, samePeriodLastYear)) return false;
      const matchDept = filterDept.length === 0 || (e.id_phong_ban && filterDept.includes(e.id_phong_ban));
      const matchStatus = filterStatus.length === 0 || filterStatus.includes(e.trang_thai);
      return matchDept && matchStatus;
    });
    const totalLastYear = filteredLastYear.length;
    const activeLastYear = filteredLastYear.filter((e) => e.trang_thai === 'Đang làm việc').length;
    const totalYoYDelta = total - totalLastYear;
    const activeYoYDelta = totalLastYear > 0 ? active - activeLastYear : undefined;

    return {
      totalDelta,
      activeDelta,
      hiredThisMonth,
      hiredPrevMonth,
      totalYoY: totalYoYDelta,
      activeYoY: activeYoYDelta,
    };
  }, [filtered, dateRange.end, employees, filterDept, filterStatus, total, active]);

  const deptData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      const dept = e.ten_phong_ban || 'Chưa phân bổ';
      map[dept] = (map[dept] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filtered]);

  const statusData = useMemo(
    () =>
      (Object.entries(STATUS_LABELS) as [string, string][]).map(([key, name]) => ({
        key,
        name,
        value: filtered.filter((e) => e.trang_thai === key).length,
        fill: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
      })),
    [filtered]
  );

  const monthKeys = useMemo(
    () => getMonthKeysEndingAt(dateRange.end, 12),
    [dateRange.end]
  );

  const hiringData = useMemo(
    () =>
      monthKeys.map(({ key, label }) => ({
        label,
        count: filtered.filter((e) => e.tg_tao && e.tg_tao.startsWith(key)).length,
      })),
    [filtered, monthKeys]
  );

  const genderData: Array<{ name: string; value: number; fill: string }> = [];

  const deptSummary = useMemo(() => {
    const map: Record<
      string,
      { total: number; active: number; probation: number; inactive: number }
    > = {};
    filtered.forEach((e) => {
      const dept = e.ten_phong_ban || 'Chưa phân bổ';
      if (!map[dept]) map[dept] = { total: 0, active: 0, probation: 0, inactive: 0 };
      map[dept].total++;
      if (e.trang_thai === 'Đang làm việc') map[dept].active++;
      else if (e.trang_thai === 'Thử việc') map[dept].probation++;
      else map[dept].inactive++;
    });
    return Object.entries(map)
      .map(([name, stats]) => ({
        name,
        ...stats,
        rate: stats.total > 0 ? ((stats.active / stats.total) * 100).toFixed(0) : '0',
      }))
      .sort((a, b) => b.total - a.total);
  }, [filtered]);

  const miniSummary = useMemo((): StatsMiniSummary => {
    const topDept = deptData[0] ?? null;
    return {
      hiredThisMonth: trends.hiredThisMonth,
      maleCount: 0,
      femaleCount: 0,
      topDept,
    };
  }, [deptData, trends.hiredThisMonth]);

  const allKpis: KpiItem[] = useMemo(
    () => [
      {
        id: 'total',
        label: 'Tổng nhân viên',
        value: total,
        icon: Users,
        color: 'text-primary',
        bg: 'bg-primary/10',
        pct: null,
        delta: trends.totalDelta,
      },
      {
        id: 'active',
        label: 'Đang làm việc',
        value: active,
        icon: UserCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        pct: pct(active),
        delta: trends.activeDelta,
      },
      {
        id: 'probation',
        label: 'Thử việc',
        value: probation,
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        pct: pct(probation),
        delta: null,
      },
      {
        id: 'inactive',
        label: 'Nghỉ việc / phép',
        value: inactive,
        icon: UserX,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        pct: pct(inactive),
        delta: null,
      },
    ],
    [total, active, probation, inactive, pct, trends]
  );

  const kpis = useMemo(
    () => allKpis.filter((k) => visibleKpiIds.includes(k.id)),
    [allKpis, visibleKpiIds]
  );

  return {
    filtered,
    total,
    active,
    probation,
    inactive,
    pct,
    trends,
    deptData,
    statusData,
    hiringData,
    genderData,
    deptSummary,
    miniSummary,
    kpis,
    DEPT_COLORS,
  };
}
