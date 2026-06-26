import type { TransportRow } from './transport-config';

export type TripApprovalStatus = 'Đã duyệt' | 'Không duyệt' | 'Chưa duyệt';

export function normalizeTripApprovalStatus(value: unknown): TripApprovalStatus {
  if (value === 'Đã duyệt' || value === 'Không duyệt' || value === 'Chưa duyệt') return value;
  if (value === 'Chờ duyệt' || value === 'Chua duyet') return 'Chưa duyệt';
  return 'Chưa duyệt';
}

/** Chỉ cho sửa / báo cáo khi còn Chưa duyệt (Đã duyệt và Không duyệt đều khóa). */
export function isPendingTripApproval(value: unknown): boolean {
  return normalizeTripApprovalStatus(value) === 'Chưa duyệt';
}

/**
 * Rollup trạng thái chuyến cha từ các dòng CT.
 * Còn bất kỳ CT `Chưa duyệt` → cha `Chưa duyệt` (kể cả 2/3 CT đã duyệt).
 */
export function deriveParentTripStatus(childApprovals: unknown[]): TripApprovalStatus {
  if (childApprovals.length === 0) return 'Chưa duyệt';
  const statuses = childApprovals.map(normalizeTripApprovalStatus);
  if (statuses.includes('Chưa duyệt')) return 'Chưa duyệt';
  if (statuses.includes('Đã duyệt')) return 'Đã duyệt';
  return 'Không duyệt';
}

export function collectParentTripIdsFromChildren(
  children: TransportRow[],
  childIds?: string[],
): string[] {
  const idSet = childIds ? new Set(childIds.map(String)) : null;
  const parentIds = new Set<string>();
  for (const child of children) {
    if (idSet && !idSet.has(String(child.id))) continue;
    const parentId = child.id_chuyen_xe;
    if (parentId != null && String(parentId) !== '') {
      parentIds.add(String(parentId));
    }
  }
  return [...parentIds];
}