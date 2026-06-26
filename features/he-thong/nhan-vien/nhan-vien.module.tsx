import React, { lazy } from 'react';
import { List, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { queryKeys } from '@/lib/query-keys';
import { masterDataQueryOptions, SERVER_GC_TIME_MS } from '@/lib/supabase/query-config';
import { getDepartments } from '../phong-ban/services/phong-ban-service';
import { getPositions } from '../chuc-vu/services/chuc-vu-service';
import { DRAWER_Z_CONTENT_BASE } from '@/lib/dialog-sizes';
import { createFeatureModule } from '@/lib/createFeatureModule';
import { formatDate, getLanguage } from '../../../lib/utils';
import { matchesSearchTerm } from '../../../lib/searchUtils';
import { employeeMatchesColumnSearch } from './utils/column-search';
import type { Employee, EmployeeFilters } from './core/types';
import { useEmployeeStore } from './store/useEmployeeStore';
import { useEmployees } from './hooks/use-nhan-vien';
import { useEmployeePageHandlers } from './hooks/use-employee-page-handlers';
import EmployeeToolbar from './components/nhan-vien-toolbar';
import EmployeeTable from './components/nhan-vien-table';
import type { SortState } from '../../../store/createGenericStore';
import { txt } from '../../../lib/text';

const EmployeeForm = lazy(() => import('./components/nhan-vien-form'));
const EmployeeDetail = lazy(() => import('./components/nhan-vien-detail'));
const EmployeeStats = lazy(() => import('./components/nhan-vien-stats'));
const BulkEditSheet = lazy(() => import('./components/nhan-vien-bulk-edit'));

const DrawerLazyFallback: React.FC = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
    style={{ zIndex: DRAWER_Z_CONTENT_BASE }}
  >
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
  </div>
);

const NHAN_VIEN_SEARCHABLE_KEYS = [
  'ho_va_ten',
  'ten_dang_nhap',
  'email',
  'so_dien_thoai',
  'ten_phong_ban',
  'ten_bo_phan',
  'ten_chuc_vu',
  'trang_thai',
];

function employeeSortKey(columnId: string): keyof Employee {
  if (columnId === 'ten_phong_ban') return 'ten_phong_ban';
  if (columnId === 'ten_bo_phan') return 'ten_bo_phan';
  if (columnId === 'ten_chuc_vu') return 'ten_chuc_vu';
  return columnId as keyof Employee;
}

function clientSortEmployees(items: Employee[], sort: SortState): Employee[] {
  if (!sort.column || !sort.direction) return items;
  const sorted = [...items];
  sorted.sort((a, b) => {
    const key = employeeSortKey(sort.column!);
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    const cmp = String(aVal).localeCompare(String(bVal), getLanguage());
    return sort.direction === 'desc' ? -cmp : cmp;
  });
  return sorted;
}

const NhanVienPage = createFeatureModule<Employee, EmployeeFilters>({
  id: 'nhan-vien',
  name: 'Nhân viên',
  tabs: [
    { id: 'list', label: txt('employee.tabList'), icon: List },
    { id: 'stats', label: txt('employee.tabStats'), icon: BarChart3 },
  ],
  urlTabs: { validTabs: ['list', 'stats'], defaultTab: 'list' },
  useData: (ctx) => {
    const result = useEmployees({ loadFullForStats: ctx?.activeTab === 'stats' });
    return {
      data: result.data,
      isLoading: result.isLoading,
      total: result.total,
      isServerPaginated: result.isServerPaginated,
      mode: result.mode,
    };
  },
  useStore: useEmployeeStore,
  keyExtractor: (e) => e.id,
  filterFn: (emp, term, f) => {
    const matchesSearch = matchesSearchTerm(emp as any, term, NHAN_VIEN_SEARCHABLE_KEYS);
    const matchesStatus = f.trang_thai.length === 0 || f.trang_thai.includes(emp.trang_thai);
    const matchesDept = f.id_phong_ban.length === 0 || (emp.id_phong_ban ? f.id_phong_ban.includes(emp.id_phong_ban) : false);
    const matchesPosition = f.id_chuc_vu.length === 0 || (emp.id_chuc_vu ? f.id_chuc_vu.includes(emp.id_chuc_vu) : false);
    const matchesColumnText = employeeMatchesColumnSearch(emp, f.columnSearch);
    return !!(matchesSearch && matchesStatus && matchesDept && matchesPosition && matchesColumnText);
  },
  skipClientSort: ({ isServerPaginated }) => isServerPaginated,
  clientSortFn: clientSortEmployees,
  enableServerPaginationEffects: true,
  useMount: (queryClient) => {
    const prefetchOpts = { staleTime: Infinity, gcTime: SERVER_GC_TIME_MS };
    const prefetchMaster = () => {
      void queryClient.prefetchQuery({
        queryKey: queryKeys.departments.all,
        queryFn: getDepartments,
        ...masterDataQueryOptions,
        ...prefetchOpts,
      });
      void queryClient.prefetchQuery({
        queryKey: queryKeys.positions.all,
        queryFn: getPositions,
        ...masterDataQueryOptions,
        ...prefetchOpts,
      });
    };
    const idleId =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(prefetchMaster, { timeout: 3000 })
        : window.setTimeout(prefetchMaster, 500);
    return () => {
      if (typeof cancelIdleCallback !== 'undefined' && typeof idleId === 'number') cancelIdleCallback(idleId);
      else clearTimeout(idleId as number);
    };
  },
  getToolbarExtraProps: ({ rawData }) => ({ employees: rawData }),
  getTableExtraProps: ({ rawData }) => ({ employeesForFilterCounts: rawData }),
  buildStatsProps: ({ rawData, isLoading, setFilter, onTabChange }) => ({
    employees: rawData,
    isLoading,
    onDrillDownDept: (deptId: string) => {
      setFilter('id_phong_ban', [deptId]);
      onTabChange('list');
    },
    onDrillDownStatus: (status: string) => {
      setFilter('trang_thai', [status]);
      onTabChange('list');
    },
  }),
  TableComponent: EmployeeTable as any,
  ToolbarComponent: EmployeeToolbar as any,
  FormComponent: EmployeeForm as any,
  DetailComponent: EmployeeDetail as any,
  StatsComponent: EmployeeStats as any,
  BulkEditComponent: ({ selectedItems, onClose, onSuccess }) => (
    <BulkEditSheet
      selectedEmployees={selectedItems}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  ),
  lazyDrawers: DrawerLazyFallback,
  getFormKey: (editing) => editing?.id ?? 'new',
  trackFormOrigin: true,
  usePageHandlers: useEmployeePageHandlers,
  exportColumns: [
    { key: 'ho_va_ten', label: 'Họ và tên' },
    { key: 'ten_dang_nhap', label: 'Tên đăng nhập' },
    { key: 'email', label: 'Email thực tế' },
    { key: 'so_dien_thoai', label: 'Số điện thoại' },
    { key: 'ten_chuc_vu', label: 'Chức vụ' },
    { key: 'ten_phong_ban', label: 'Phòng ban' },
    { key: 'ten_bo_phan', label: 'Bộ phận' },
    { key: 'luong_co_ban', label: 'Lương cơ bản' },
    { key: 'trang_thai', label: 'Trạng thái' },
    { key: 'tg_tao_text', label: 'Ngày tạo' },
  ],
  exportMapFn: (emp) => ({
    ho_va_ten: emp.ho_va_ten,
    ten_dang_nhap: emp.ten_dang_nhap,
    email: emp.email,
    so_dien_thoai: emp.so_dien_thoai,
    ten_chuc_vu: emp.ten_chuc_vu,
    ten_phong_ban: emp.ten_phong_ban,
    ten_bo_phan: emp.ten_bo_phan,
    luong_co_ban: emp.luong_co_ban ?? 0,
    trang_thai: emp.trang_thai,
    tg_tao_text: emp.tg_tao ? formatDate(emp.tg_tao) : '',
  }),
  exportFileName: 'nhan-vien',
});

export default NhanVienPage;
