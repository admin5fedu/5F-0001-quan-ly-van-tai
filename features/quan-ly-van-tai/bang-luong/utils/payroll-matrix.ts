import type { TransportLookupRows, TransportRow } from '../../shared/transport-config';
import { isCtEligibleForPayroll } from '../../shared/trip-execution-sync';

function getYearMonth(value: unknown): { year: number; month: number } | null {
  const date = String(value ?? '');
  if (!date) return null;
  const parts = date.split(/[-T]/);
  if (parts.length < 2) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]);
  if (!Number.isFinite(year) || !Number.isFinite(month)) return null;
  return { year, month };
}

export function getPayrollTripDetails(
  payrollRow: TransportRow,
  lookups: Partial<TransportLookupRows>,
  approvedOnly = true,
): Array<TransportRow & { trip?: TransportRow }> {
  const year = Number(payrollRow.nam);
  const month = Number(payrollRow.thang);
  const tripsInPeriod = (lookups.trips || []).filter((trip) => {
    const parsed = getYearMonth(trip.ngay);
    return (
      parsed !== null &&
      parsed.year === year &&
      parsed.month === month &&
      String(trip.id_tai_xe) === String(payrollRow.id_tai_xe) &&
      (!approvedOnly || trip.trang_thai === 'Đã duyệt')
    );
  });
  const tripById = new Map(tripsInPeriod.map((trip) => [String(trip.id), trip]));
  return (lookups.tripDetails || [])
    .filter((detail) => tripById.has(String(detail.id_chuyen_xe)))
    .filter((detail) => !approvedOnly || isCtEligibleForPayroll(detail))
    .map((detail) => ({ ...detail, trip: tripById.get(String(detail.id_chuyen_xe)) }))
    .sort((a, b) => String(a.trip?.ngay ?? '').localeCompare(String(b.trip?.ngay ?? ''), 'vi'));
}

function getDaysInPayrollMonth(payrollRow: TransportRow): number {
  const year = Number(payrollRow.nam);
  const month = Number(payrollRow.thang);
  if (!Number.isFinite(year) || !Number.isFinite(month) || month < 1 || month > 12) return 0;
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getPayrollDateKey(payrollRow: TransportRow, day: number): string {
  const year = Number(payrollRow.nam);
  const month = Number(payrollRow.thang);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function buildPayrollMatrix(
  details: Array<TransportRow & { trip?: TransportRow }>,
  payrollRow?: TransportRow,
) {
  const grouped = new Map<string, Array<TransportRow & { trip?: TransportRow }>>();
  for (const detail of details) {
    const dayKey = String(detail.trip?.ngay ?? 'Chưa có ngày');
    grouped.set(dayKey, [...(grouped.get(dayKey) || []), detail]);
  }
  const sortedDates = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b, 'vi'));
  return sortedDates.map((date) => {
    const parts = date.split('-');
    const dayLabel = parts.length === 3 ? String(Number(parts[2])) : date;
    return { date, dayLabel, rows: grouped.get(date) || [] };
  });
}

export const formatPayrollMoney = (value: unknown): string =>
  `${new Intl.NumberFormat('vi-VN').format(Number(value) || 0)}\u00A0đ`;