import { useMemo } from 'react';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { getRootItems } from '@/lib/tree-utils';
import type { Department } from '../../phong-ban/core/types';
import type { Position, PositionFilters } from '../core/types';
import { POSITION_SEARCHABLE_KEYS } from '../utils/search-keys';
import { positionMatchesColumnSearch } from '../utils/column-search';
import { getDepartmentSubtreeIds } from '../utils/build-position-tree-rows';
import { countWithExcludeSelf } from '@/lib/factories/createFilterCountsHook';

function statusChipKey(p: Position): 'Active' | 'Inactive' {
  return p.trang_thai === 'Đang hoạt động' ? 'Active' : 'Inactive';
}

function findRootDepartmentId(deptId: string, departments: Department[]): string {
  let current = departments.find((d) => d.id === deptId);
  while (current?.cha_id) {
    current = departments.find((d) => d.id === current!.cha_id);
  }
  return current?.id ?? deptId;
}

/**
 * Counts cho các filter chips: Phòng gốc / Nhóm / Cấp bậc / Trạng thái.
 * Mỗi count dùng nguyên tắc **exclude-self**.
 */
export function usePositionFilterCounts(
  positions: Position[],
  departments: Department[],
  searchTerm: string,
  filters: PositionFilters,
) {
  return useMemo(() => {
    const matchesSearch = (p: Position) =>
      matchesSearchTerm(p as any, searchTerm, POSITION_SEARCHABLE_KEYS);

    const matchesStatus = (p: Position) =>
      filters.status.length === 0 || filters.status.includes(statusChipKey(p));

    const subtreeIds = getDepartmentSubtreeIds(departments, filters.id_phong_goc);
    const matchesRoot = (p: Position) =>
      filters.id_phong_goc.length === 0 ||
      (p.phong_ban_id != null && subtreeIds.has(p.phong_ban_id));

    const matchesGroup = (p: Position) =>
      filters.phong_ban_id.length === 0 ||
      (p.phong_ban_id != null && filters.phong_ban_id.includes(p.phong_ban_id));

    const matchesLevel = (p: Position) =>
      filters.cap_bac.length === 0 ||
      (p.cap_bac != null && filters.cap_bac.includes(String(p.cap_bac)));

    const baseFilter = (p: Position) =>
      matchesSearch(p) && positionMatchesColumnSearch(p, filters.columnSearch);

    const [rootMap, groupMap, levelMap, statusMap] = countWithExcludeSelf(
      positions,
      baseFilter,
      [
        {
          passesOthers: (p) => matchesStatus(p) && matchesGroup(p) && matchesLevel(p),
          getBucketKey: (p) =>
            p.phong_ban_id ? findRootDepartmentId(p.phong_ban_id, departments) : undefined,
        },
        {
          passesOthers: (p) => matchesStatus(p) && matchesRoot(p) && matchesLevel(p),
          getBucketKey: (p) => p.phong_ban_id,
        },
        {
          passesOthers: (p) => matchesStatus(p) && matchesRoot(p) && matchesGroup(p),
          getBucketKey: (p) => (p.cap_bac != null ? String(p.cap_bac) : undefined),
        },
        {
          passesOthers: (p) => matchesRoot(p) && matchesGroup(p) && matchesLevel(p),
          getBucketKey: (p) => statusChipKey(p),
        },
      ],
    );

    const roots = getRootItems(departments, {
      getParentId: (d) => d.cha_id,
      getOrder: (d) => d.thu_tu,
    });
    const deptCounts: Record<string, number> = {};
    for (const root of roots) {
      deptCounts[root.id] = rootMap[root.id] || 0;
    }

    const distinctLevels = Array.from(
      new Set(positions.map((p) => p.cap_bac).filter((level): level is number => level != null)),
    ).sort((a, b) => a - b);

    return {
      deptCounts,
      groupCounts: groupMap,
      levelCounts: levelMap,
      distinctLevels,
      statusCounts: {
        Active: statusMap.Active ?? 0,
        Inactive: statusMap.Inactive ?? 0,
      },
    };
  }, [positions, departments, searchTerm, filters]);
}
