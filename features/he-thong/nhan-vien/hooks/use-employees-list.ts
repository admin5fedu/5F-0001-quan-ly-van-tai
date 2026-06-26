import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { SortState } from '@/store/createGenericStore';
import { SERVER_PAGINATION_THRESHOLD } from '@/lib/constants/list-pagination';
import { queryKeys } from '@/lib/query-keys';
import { EMPLOYEES_LIST_QUERY_PARAMS } from '@/lib/query-keys';
import { listQueryOptions } from '@/lib/supabase/query-config';
import {
  getEmployeeCount,
  getEmployees,
  getEmployeesPage,
} from '../services/nhan-vien-service';
import type { Employee } from '../core/types';

export type EmployeesListMode = 'client' | 'server';

export type UseEmployeesListParams = {
  page: number;
  pageSize: number;
  sort: SortState;
  /** Khi true (tab stats + server mode), tải tối đa 500 bản ghi cho biểu đồ. */
  loadFullForStats?: boolean;
};

export type UseEmployeesListResult = {
  employees: Employee[];
  total: number;
  mode: EmployeesListMode;
  isLoading: boolean;
  isFetching: boolean;
  isServerPaginated: boolean;
};

function sortToQuery(sort: SortState) {
  const orderBy =
    sort.column && sort.column.length > 0 ? sort.column : EMPLOYEES_LIST_QUERY_PARAMS.orderBy;
  const ascending = sort.direction !== 'desc';
  return { orderBy, ascending };
}

export function useEmployeesList({
  page,
  pageSize,
  sort,
  loadFullForStats = false,
}: UseEmployeesListParams): UseEmployeesListResult {
  const { data: totalCount = 0, isLoading: countLoading } = useQuery({
    queryKey: queryKeys.employees.count,
    queryFn: getEmployeeCount,
    ...listQueryOptions,
  });

  const isServerMode = totalCount > SERVER_PAGINATION_THRESHOLD;
  const mode: EmployeesListMode = isServerMode ? 'server' : 'client';
  const { orderBy, ascending } = sortToQuery(sort);

  const clientQueryKey = queryKeys.employees.list({
    limit: EMPLOYEES_LIST_QUERY_PARAMS.limit,
    offset: EMPLOYEES_LIST_QUERY_PARAMS.offset,
    orderBy: EMPLOYEES_LIST_QUERY_PARAMS.orderBy,
    ascending: EMPLOYEES_LIST_QUERY_PARAMS.ascending,
  });

  const serverPageKey = queryKeys.employees.page({
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy,
    ascending,
  });

  const statsQueryKey = [...queryKeys.employees.all, 'stats-sample', EMPLOYEES_LIST_QUERY_PARAMS.limit] as const;

  const listQuery = useQuery({
    queryKey: loadFullForStats
      ? statsQueryKey
      : isServerMode
        ? serverPageKey
        : clientQueryKey,
    queryFn: async () => {
      if (loadFullForStats) {
        return getEmployees({
          limit: EMPLOYEES_LIST_QUERY_PARAMS.limit,
          offset: 0,
          orderBy,
          ascending,
        });
      }
      if (isServerMode) {
        const result = await getEmployeesPage({
          limit: pageSize,
          offset: (page - 1) * pageSize,
          orderBy,
          ascending,
        });
        return result;
      }
      return getEmployees();
    },
    placeholderData: keepPreviousData,
    enabled: !countLoading,
    ...listQueryOptions,
  });

  const { employees, total } = useMemo(() => {
    if (loadFullForStats) {
      const rows = (listQuery.data as Employee[] | undefined) ?? [];
      return { employees: rows, total: totalCount };
    }
    if (isServerMode) {
      const pageResult = listQuery.data as { items: Employee[]; total: number } | undefined;
      return {
        employees: pageResult?.items ?? [],
        total: pageResult?.total ?? totalCount,
      };
    }
    const rows = (listQuery.data as Employee[] | undefined) ?? [];
    return { employees: rows, total: rows.length };
  }, [loadFullForStats, isServerMode, listQuery.data, totalCount]);

  return {
    employees,
    total,
    mode,
    isLoading: countLoading || listQuery.isLoading,
    isFetching: listQuery.isFetching,
    isServerPaginated: isServerMode && !loadFullForStats,
  };
}
