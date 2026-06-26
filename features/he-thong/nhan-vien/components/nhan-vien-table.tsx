import React, { memo, useMemo, useCallback, useState } from 'react';
import { Phone, Briefcase, Building2, Mail, KeyRound } from 'lucide-react';
import type { Employee } from '../core/types';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useShallow } from 'zustand/react/shallow';
import type { ColumnConfig } from '../../../../store/createGenericStore';
import { cn, formatDate, getAvatarUrl, formatCurrency } from '../../../../lib/utils';
import GenericTable from '../../../../components/shared/GenericTable';
import { MobileListCard } from '../../../../components/shared/MobileListCard';
import EnumBadge from '../../../../components/ui/EnumBadge';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { useFilterCounts } from '../hooks/use-filter-counts';
import { STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../core/constants';
import { ColumnHeaderFilter } from '../../../../components/shared/column-header/ColumnHeaderFilter';
import { ColumnHeaderSortMenu } from '../../../../components/shared/column-header/ColumnHeaderSortMenu';
import { ColumnHeaderSearch } from '../../../../components/shared/column-header/ColumnHeaderSearch';
import { EmployeeTableRowActions } from './employee-table-row-actions';
import { getDepartmentSubtreeIds } from '../../chuc-vu/utils/build-position-tree-rows';

interface Props {
  data: Employee[];
  isLoading: boolean;
  employeesForFilterCounts: Employee[];
  totalRecordCount?: number;
  serverPaginated?: boolean;
  onEdit: (item: Employee) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: Employee) => void;
  onView: (item: Employee) => void;
}

const EmployeeTable = memo(function EmployeeTable({
  data,
  isLoading,
  employeesForFilterCounts,
  totalRecordCount,
  serverPaginated = false,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
}: Props) {
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
  const {
    columns, pagination, setPage, setPageSize,
    selectedIds, toggleSelection, toggleAllSelection,
    sort, setSort, resizeColumn,
    searchTerm, filters, setFilter,
  } = useEmployeeStore(
    useShallow((s) => ({
      columns: s.columns,
      pagination: s.pagination,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      selectedIds: s.selectedIds,
      toggleSelection: s.toggleSelection,
      toggleAllSelection: s.toggleAllSelection,
      sort: s.sort,
      setSort: s.setSort,
      resizeColumn: s.resizeColumn,
      searchTerm: s.searchTerm,
      filters: s.filters,
      setFilter: s.setFilter,
    })),
  );

  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { deptCounts, posCounts, statusCounts } = useFilterCounts(employeesForFilterCounts, searchTerm, filters);

  const departmentOptions = useMemo(
    () => departments.map((d) => ({ label: d.ten_phong_ban, value: String(d.id), count: deptCounts[String(d.id)] || 0 })),
    [departments, deptCounts],
  );
  const scopedPositions = useMemo(() => {
    if (filters.id_phong_ban.length === 0) return positions;
    const departmentIds = getDepartmentSubtreeIds(departments, filters.id_phong_ban);
    return positions.filter((p) => p.phong_ban_id && departmentIds.has(String(p.phong_ban_id)));
  }, [departments, positions, filters.id_phong_ban]);
  const positionOptions = useMemo(
    () => scopedPositions.map((p) => ({ label: p.ten_chuc_vu, value: String(p.id), count: posCounts[String(p.id)] || 0 })),
    [scopedPositions, posCounts],
  );
  const statusOptions = useMemo(
    () => STATUS_OPTIONS.map((s) => ({ label: s.label, value: String(s.value), count: statusCounts[String(s.value)] || 0 })),
    [statusCounts],
  );

  const renderColumnHeaderAccessory = useCallback(
    (col: ColumnConfig) => {
      const cs = filters.columnSearch;
      const colSearchActive = Boolean(cs[col.id]?.trim());
      const columnSearchEl = (
        <ColumnHeaderSearch
          variant="inDropdown"
          value={cs[col.id] ?? ''}
          onChange={(v) => setFilter('columnSearch', { ...cs, [col.id]: v })}
          ariaLabel={`${col.label} - tìm kiếm`}
        />
      );

      if (col.id === 'ten_phong_ban') {
        return (
          <ColumnHeaderFilter
            options={departmentOptions}
            value={filters.id_phong_ban}
            onChange={(v) => setFilter('id_phong_ban', v)}
            ariaLabel="Phòng ban"
            sortColumnId="ten_phong_ban"
            sort={sort}
            setSort={setSort}
          />
        );
      }
      if (col.id === 'ten_chuc_vu') {
        return (
          <ColumnHeaderFilter
            options={positionOptions}
            value={filters.id_chuc_vu}
            onChange={(v) => setFilter('id_chuc_vu', v)}
            ariaLabel="Chức vụ"
            sortColumnId="ten_chuc_vu"
            sort={sort}
            setSort={setSort}
          />
        );
      }
      if (col.id === 'trang_thai') {
        return (
          <ColumnHeaderFilter
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(v) => setFilter('trang_thai', v)}
            ariaLabel="Trạng thái"
            sortColumnId="trang_thai"
            sort={sort}
            setSort={setSort}
          />
        );
      }
      return (
        <ColumnHeaderSortMenu
          ariaLabel={col.label}
          sortColumnId={col.id}
          sort={sort}
          setSort={setSort}
          columnSearch={columnSearchEl}
          columnSearchActive={colSearchActive}
        />
      );
    },
    [departmentOptions, positionOptions, statusOptions, filters, setFilter, sort, setSort],
  );

  const renderCell = useCallback((colId: string, item: Employee) => {
    switch (colId) {
      case 'ho_va_ten':
        return (
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={item.avatar || getAvatarUrl(item.ho_va_ten)} className="w-8 h-8 rounded-full border border-border shadow-sm object-cover shrink-0" alt={item.ho_va_ten} />
            <span className="font-semibold text-foreground text-sm truncate">{item.ho_va_ten}</span>
          </div>
        );
      case 'ten_dang_nhap':
        return (
          <span className="inline-flex items-center gap-1.5 font-mono text-xs font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
            <KeyRound size={12} />{item.ten_dang_nhap || '--'}
          </span>
        );
      case 'email':
        return item.email ? (
          <a href={`mailto:${item.email}`} className="flex items-center gap-1.5 text-body-sm text-foreground hover:text-primary transition-colors truncate" onClick={(e) => e.stopPropagation()}>
            <Mail size={12} className="text-primary/60 shrink-0" />
            <span className="truncate">{item.email}</span>
          </a>
        ) : <span className="text-xs text-muted-foreground italic">--</span>;
      case 'so_dien_thoai':
        return (
          <div className="flex items-center gap-1.5 text-body-sm text-foreground tabular-nums">
            <Phone size={12} className="text-primary/60 shrink-0" />
            <span className="truncate">{item.so_dien_thoai || '--'}</span>
          </div>
        );
      case 'ten_chuc_vu':
        return (
          <div className="flex items-center gap-1.5 text-body-sm text-foreground min-w-0">
            <Briefcase size={12} className="text-primary/60 shrink-0" />
            <span className="truncate font-medium">{item.ten_chuc_vu || '--'}</span>
          </div>
        );
      case 'ten_phong_ban':
        return (
          <div className="flex items-center gap-1.5 text-body-sm text-foreground">
            <Building2 size={12} className="text-primary/60 shrink-0" />
            <span className="truncate">{item.ten_phong_ban || '--'}</span>
          </div>
        );
      case 'ten_bo_phan':
        return (
          <div className="flex items-center gap-1.5 text-body-sm text-foreground">
            <Building2 size={12} className="text-primary/60 shrink-0" />
            <span className="truncate">{item.ten_bo_phan || '--'}</span>
          </div>
        );
      case 'luong_co_ban':
        return (
          <span className="font-semibold text-body-sm text-foreground tabular-nums">
            {item.luong_co_ban != null ? formatCurrency(Number(item.luong_co_ban)) : '--'}
          </span>
        );
      case 'la_tai_xe':
        return item.la_tai_xe ? (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
            Tài xế
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">-</span>
        );
      case 'trang_thai':
        return <EnumBadge value={item.trang_thai} config={STATUS_BADGE_CONFIG} truncate />;
      case 'tg_tao':
        return <span className="text-body-sm text-muted-foreground tabular-nums">{item.tg_tao ? formatDate(item.tg_tao) : '--'}</span>;
      case 'actions':
        return (
          <EmployeeTableRowActions
            item={item}
            menuOpenId={rowMenuOpenId}
            onMenuOpenChange={setRowMenuOpenId}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
        );
      default:
        return null;
    }
  }, [onEdit, onDelete, onStatusChange, rowMenuOpenId]);

  const renderMobileCard = useCallback((item: Employee, isSelected: boolean) => (
    <MobileListCard
      selected={isSelected}
      onBodyClick={() => onView(item)}
      onBodyKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onView(item);
        }
      }}
      leading={(
        <div className="relative shrink-0">
          <img
            src={item.avatar || getAvatarUrl(item.ho_va_ten)}
            className="h-12 w-12 rounded-xl border border-border object-cover shadow-sm"
            alt={item.ho_va_ten}
          />
          <div
            className={cn(
              'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-card',
              item.trang_thai === 'Đang làm việc' ? 'bg-emerald-500' : 'bg-muted-foreground/30',
            )}
            aria-hidden
          />
        </div>
      )}
      titleRow={(
        <div className="flex min-w-0 items-center justify-between gap-2">
          <h4 className="truncate text-sm font-semibold text-foreground">{item.ho_va_ten}</h4>
          <div className="shrink-0"><EnumBadge value={item.trang_thai} config={STATUS_BADGE_CONFIG} /></div>
        </div>
      )}
      subheader={item.ten_dang_nhap ? <p className="truncate text-xs font-medium text-primary">{item.ten_dang_nhap}</p> : null}
      footerStart={(
        <label className="inline-flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(item.id)}
            onClick={(e) => e.stopPropagation()}
            aria-label="Chọn"
            className="h-3 w-3 cursor-pointer rounded border-border text-primary accent-primary"
          />
        </label>
      )}
      footerEnd={(
        <EmployeeTableRowActions
          compact
          item={item}
          menuOpenId={rowMenuOpenId}
          onMenuOpenChange={setRowMenuOpenId}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
        />
      )}
    />
  ), [onEdit, onDelete, onStatusChange, onView, rowMenuOpenId, toggleSelection]);

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText="Đang tải dữ liệu"
      selectedIds={selectedIds}
      onToggleSelection={toggleSelection}
      onToggleAll={toggleAllSelection}
      page={pagination.page}
      pageSize={pagination.pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sort={sort}
      onSort={setSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      onRowClick={onView}
      keyExtractor={(item) => item.id}
      onResizeColumn={resizeColumn}
      stickyLeftCount={2}
      renderColumnHeaderAccessory={renderColumnHeaderAccessory}
      hideSortOnColumnLabel
      totalRecordCount={totalRecordCount}
      serverPaginated={serverPaginated}
    />
  );
});

export default EmployeeTable;
