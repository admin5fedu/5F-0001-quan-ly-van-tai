import { useMemo } from 'react';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { getRootItems } from '@/lib/tree-utils';
import type { Department } from '../core/types';
import type { DepartmentFilters } from '../store/useDepartmentStore';
import { DEPARTMENT_SEARCHABLE_KEYS } from '../utils/search-keys';
import { departmentMatchesColumnSearch } from '../utils/column-search';
import { countWithExcludeSelf } from '@/lib/factories/createFilterCountsHook';

function statusChipKey(d: Department): 'Active' | 'Inactive' {
  return d.trang_thai === 'Đang hoạt động' ? 'Active' : 'Inactive';
}

function buildVisibleIdsUnderRoots(rootIds: string[], departments: Department[]): Set<string> {
  const visibleIds = new Set<string>();
  let current = new Set<string>(rootIds);
  while (current.size > 0) {
    current.forEach((id) => visibleIds.add(id));
    const next = new Set<string>();
    departments.forEach((d) => {
      if (d.cha_id && current.has(d.cha_id)) next.add(d.id);
    });
    current = next;
  }
  return visibleIds;
}

/** Count cross-filter cho chip toolbar Phòng ban (exclude-self). */
export function useDepartmentFilterCounts(
  departments: Department[],
  searchTerm: string,
  filters: DepartmentFilters,
) {
  return useMemo(() => {
    const parentNameOf = (d: Department) =>
      d.cha_id ? departments.find((p) => p.id === d.cha_id)?.ten_phong_ban ?? '' : '';

    const matchesSearch = (d: Department) =>
      matchesSearchTerm(
        { ...(d as unknown as Record<string, unknown>), ten_phong_cha: parentNameOf(d) },
        searchTerm,
        DEPARTMENT_SEARCHABLE_KEYS,
      );

    const matchesStatus = (d: Department) => {
      const key = statusChipKey(d);
      return filters.status.length === 0 || filters.status.includes(key);
    };

    const matchesRoot = (d: Department) => {
      if (filters.id_phong_goc.length === 0) return true;
      return buildVisibleIdsUnderRoots(filters.id_phong_goc, departments).has(d.id);
    };

    const roots = getRootItems(departments, {
      getParentId: (d) => d.cha_id,
      getOrder: (d) => d.thu_tu,
    });

    const rootByDeptId = new Map<string, string>();
    for (const root of roots) {
      for (const id of buildVisibleIdsUnderRoots([root.id], departments)) {
        rootByDeptId.set(id, root.id);
      }
    }

    const baseFilter = (d: Department) =>
      matchesSearch(d) && departmentMatchesColumnSearch(d, filters.columnSearch, parentNameOf(d));

    const [rootMap, statusMap] = countWithExcludeSelf(departments, baseFilter, [
      {
        passesOthers: (d) => matchesStatus(d),
        getBucketKey: (d) => rootByDeptId.get(d.id),
      },
      {
        passesOthers: (d) => matchesRoot(d),
        getBucketKey: (d) => statusChipKey(d),
      },
    ]);

    return {
      rootCounts: rootMap,
      statusCounts: {
        Active: statusMap.Active ?? 0,
        Inactive: statusMap.Inactive ?? 0,
      },
    };
  }, [departments, searchTerm, filters]);
}
