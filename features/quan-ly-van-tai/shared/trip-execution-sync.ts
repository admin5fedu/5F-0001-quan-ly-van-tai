import type { TransportRow } from './transport-config';
import { TRANG_THAI_THUC_HIEN_CHUYEN } from '@/lib/constants/trang-thai';
import { isPendingTripApproval, normalizeTripApprovalStatus } from './trip-approval-sync';

export type TripExecutionStatus = (typeof TRANG_THAI_THUC_HIEN_CHUYEN)[number];

export function normalizeExecutionStatus(value: unknown): TripExecutionStatus {
  if (value === 'Đã thực hiện' || value === 'Da thuc hien') return 'Đã thực hiện';
  if (value === 'Đang thực hiện' || value === 'Dang thuc hien') return 'Đang thực hiện';
  if (value === 'Hủy' || value === 'Không thực hiện' || value === 'Khong thuc hien') return 'Hủy';
  if (value === 'Chưa thực hiện' || value === 'Chua thuc hien') return 'Chưa thực hiện';
  return 'Chưa thực hiện';
}

export function isExecutedTripDetail(value: unknown): boolean {
  return normalizeExecutionStatus(value) === 'Đã thực hiện';
}

export function isCtEligibleForPayroll(detail: Pick<TransportRow, 'phe_duyet' | 'trang_thai'>): boolean {
  return (
    normalizeTripApprovalStatus(detail.phe_duyet) === 'Đã duyệt' &&
    isExecutedTripDetail(detail.trang_thai)
  );
}

/** Tài xế có thể báo cáo/sửa CT khi duyệt còn Chưa duyệt (độc lập TT thực hiện). */
export function canDriverReportCt(detail: Pick<TransportRow, 'phe_duyet'>): boolean {
  return isPendingTripApproval(detail.phe_duyet);
}

/** Thống kê CT đã thực hiện / tổng CT (cột cha 2/4, 3/5). */
export function getTripCtCompletionStats(
  tripId: string,
  tripDetails: TransportRow[],
): { executed: number; total: number } {
  const children = tripDetails.filter((detail) => String(detail.id_chuyen_xe) === String(tripId));
  const total = children.length;
  const executed = children.filter((detail) => isExecutedTripDetail(detail.trang_thai)).length;
  return { executed, total };
}

export function formatTripCtCompletionStats(stats: { executed: number; total: number }): string {
  return `${stats.executed}/${stats.total}`;
}