import type { Employee, EmployeeFilters } from '../core/types';
import { createFilterCountsHook } from '@/lib/factories/createFilterCountsHook';
import { employeeMatchesColumnSearch } from '../utils/column-search';

export const useFilterCounts = createFilterCountsHook<
  Employee,
  EmployeeFilters,
  {
    deptCounts: Record<string, number>;
    posCounts: Record<string, number>;
    statusCounts: Record<string, number>;
  }
>({
  matchesSearch: (emp, searchTerm) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      emp.ho_va_ten.toLowerCase().includes(searchLower) ||
      String(emp.ten_dang_nhap ?? '').toLowerCase().includes(searchLower) ||
      String(emp.email ?? '').toLowerCase().includes(searchLower) ||
      String(emp.so_dien_thoai ?? '').includes(searchLower) ||
      String(emp.ten_chuc_vu ?? '').toLowerCase().includes(searchLower) ||
      String(emp.ten_phong_ban ?? '').toLowerCase().includes(searchLower)
    );
  },
  matchesColumnSearch: (emp, filters) => employeeMatchesColumnSearch(emp, filters.columnSearch),
  getDimensions: (_items, _searchTerm, filters) => {
    const matchesDept = (emp: Employee) =>
      filters.id_phong_ban.length === 0 ||
      (emp.id_phong_ban != null && filters.id_phong_ban.includes(emp.id_phong_ban));

    const matchesPosition = (emp: Employee) =>
      filters.id_chuc_vu.length === 0 ||
      (emp.id_chuc_vu != null && filters.id_chuc_vu.includes(emp.id_chuc_vu));

    const matchesStatus = (emp: Employee) =>
      filters.trang_thai.length === 0 ||
      filters.trang_thai.includes(String(emp.trang_thai));

    return [
      {
        passesOthers: (emp) => matchesPosition(emp) && matchesStatus(emp),
        getBucketKey: (emp) => emp.id_phong_ban,
      },
      {
        passesOthers: (emp) => matchesDept(emp) && matchesStatus(emp),
        getBucketKey: (emp) => emp.id_chuc_vu,
      },
      {
        passesOthers: (emp) => matchesDept(emp) && matchesPosition(emp),
        getBucketKey: (emp) => String(emp.trang_thai),
      },
    ];
  },
  buildResult: (_items, _searchTerm, _filters, countMaps) => ({
    deptCounts: countMaps[0] ?? {},
    posCounts: countMaps[1] ?? {},
    statusCounts: countMaps[2] ?? {},
  }),
});
