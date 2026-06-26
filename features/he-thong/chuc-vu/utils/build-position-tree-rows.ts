import type { Department } from '../../phong-ban/core/types';
import type { Position } from '../core/types';
import { flattenTreeToSortedList } from '@/lib/tree-utils';
import { getLanguage } from '@/lib/utils';

export type PositionTreeRow =
  | {
      kind: 'department';
      id: string;
      department: Department;
      level: number;
      positionCount: number;
    }
  | {
      kind: 'position';
      id: string;
      position: Position;
      level: number;
    };

const deptTreeOptions = {
  getId: (d: Department) => d.id,
  getParentId: (d: Department) => d.cha_id,
  getOrder: (d: Department) => d.thu_tu,
  includeOrphans: true as const,
};

/** Id phòng ban trong phạm vi lọc phòng gốc (BFS subtree). */
export function getDepartmentSubtreeIds(
  departments: Department[],
  rootFilterIds: string[],
): Set<string> {
  if (rootFilterIds.length === 0) return new Set(departments.map((d) => d.id));
  const visible = new Set<string>();
  let current = new Set(rootFilterIds);
  while (current.size > 0) {
    current.forEach((id) => visible.add(id));
    const next = new Set<string>();
    departments.forEach((d) => {
      if (d.cha_id && current.has(d.cha_id)) next.add(d.id);
    });
    current = next;
  }
  return visible;
}

export function defaultPositionSort(a: Position, b: Position): number {
  const capA = a.cap_bac ?? 999;
  const capB = b.cap_bac ?? 999;
  if (capA !== capB) return capA - capB;
  if (a.thu_tu !== b.thu_tu) return a.thu_tu - b.thu_tu;
  return a.ten_chuc_vu.localeCompare(b.ten_chuc_vu, getLanguage());
}

/** Ghép cây phòng ban (DFS) + chức vụ con trực tiếp dưới từng phòng ban. */
export function buildPositionTreeRows(
  departments: Department[],
  positions: Position[],
  sortPositions: (a: Position, b: Position) => number = defaultPositionSort,
): PositionTreeRow[] {
  const flatDepts = flattenTreeToSortedList(departments, deptTreeOptions);
  const byDept = new Map<string, Position[]>();
  const validDeptIds = new Set(departments.map((d) => d.id));
  const orphanPositions: Position[] = [];

  for (const p of positions) {
    if (p.phong_ban_id && validDeptIds.has(p.phong_ban_id)) {
      const list = byDept.get(p.phong_ban_id) ?? [];
      list.push(p);
      byDept.set(p.phong_ban_id, list);
    } else {
      orphanPositions.push(p);
    }
  }

  for (const list of byDept.values()) {
    list.sort(sortPositions);
  }

  const rows: PositionTreeRow[] = [];
  for (const dept of flatDepts) {
    const deptPositions = byDept.get(dept.id) ?? [];
    rows.push({
      kind: 'department',
      id: `dept:${dept.id}`,
      department: dept,
      level: dept.cap_do,
      positionCount: deptPositions.length,
    });
    for (const pos of deptPositions) {
      rows.push({
        kind: 'position',
        id: pos.id,
        position: pos,
        level: dept.cap_do + 1,
      });
    }
  }

  // Gộp các chức vụ mồ côi vào nhóm giả lập
  if (orphanPositions.length > 0) {
    orphanPositions.sort(sortPositions);
    const orphanDept: Department = {
      id: 'orphan-dept',
      ten_phong_ban: 'Chức vụ chưa phân phòng ban (hoặc phòng ban đã bị xóa)',
      ma_phong_ban: 'CHUNG',
      cap_do: 1,
      thu_tu: 9999,
      trang_thai: 'Đang hoạt động',
      tg_tao: new Date().toISOString(),
      tg_cap_nhat: new Date().toISOString(),
    };
    rows.push({
      kind: 'department',
      id: 'dept:orphan',
      department: orphanDept,
      level: 1,
      positionCount: orphanPositions.length,
    });
    for (const pos of orphanPositions) {
      rows.push({
        kind: 'position',
        id: pos.id,
        position: pos,
        level: 2,
      });
    }
  }

  return rows;
}

export function isPositionTreeRowSelectable(row: PositionTreeRow): boolean {
  return row.kind === 'position';
}
