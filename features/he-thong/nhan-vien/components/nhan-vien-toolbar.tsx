import React, { useEffect, useMemo } from 'react';
import { Plus, Download, Upload, Building2, Briefcase, Tag, Check, Power, Pencil } from 'lucide-react';
import Button from '../../../../components/ui/Button';
import Tooltip from '../../../../components/ui/Tooltip';
import { useResourcePermissions } from '@/hooks/use-resource-permissions';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useShallow } from 'zustand/react/shallow';
import GenericToolbar from '../../../../components/shared/GenericToolbar';
import FilterChipMultiSelect from '../../../../components/shared/FilterChipMultiSelect';
import ToolbarFilterChipGroup, {
  INLINE_CHIP_CLASS,
  MENU_CHIP_CLASS,
  type ToolbarFilterChipItem,
} from '../../../../components/shared/ToolbarFilterChipGroup';
import { BTN_ADD } from '../../../../lib/button-labels';
import { useDepartments } from '../../phong-ban/hooks/use-phong-ban';
import { usePositions } from '../../chuc-vu/hooks/use-chuc-vu';
import { STATUS_OPTIONS, type TrangThaiNhanVien } from '../core/constants';
import { useFilterCounts } from '../hooks/use-filter-counts';
import type { Employee } from '../core/types';
import { countColumnSearchActive } from '../utils/column-search';
import { getDepartmentSubtreeIds } from '../../chuc-vu/utils/build-position-tree-rows';

interface Props {
  employees: Employee[];
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: TrangThaiNhanVien) => void;
  onBulkEdit?: () => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

const EmployeeToolbar: React.FC<Props> = ({
  employees, onAdd, onExport, onImport, onDeleteMany, onStatusChangeMany, onBulkEdit,
}) => {
  const { canCreate, canImport, canExport, canEdit, canDelete } = useResourcePermissions('employees');
  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    selectedIds,
    clearSelection,
  } = useEmployeeStore(
    useShallow((s) => ({
      searchTerm: s.searchTerm,
      setSearchTerm: s.setSearchTerm,
      filters: s.filters,
      setFilter: s.setFilter,
      columns: s.columns,
      toggleColumn: s.toggleColumn,
      reorderColumns: s.reorderColumns,
      resetColumns: s.resetColumns,
      selectedIds: s.selectedIds,
      clearSelection: s.clearSelection,
    })),
  );

  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();
  const { deptCounts, posCounts, statusCounts } = useFilterCounts(employees, searchTerm, filters);

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

  const activeFilterCount = useMemo(() => {
    const columnSearchN = countColumnSearchActive(filters.columnSearch);
    return (searchTerm ? 1 : 0)
      + columnSearchN
      + (filters.id_phong_ban.length > 0 ? 1 : 0)
      + (filters.id_chuc_vu.length > 0 ? 1 : 0)
      + (filters.trang_thai.length > 0 ? 1 : 0);
  }, [searchTerm, filters]);

  useEffect(() => {
    if (filters.id_phong_ban.length === 0 || filters.id_chuc_vu.length === 0) return;
    const scopedIds = new Set(scopedPositions.map((p) => String(p.id)));
    const nextPositionIds = filters.id_chuc_vu.filter((id) => scopedIds.has(id));
    if (nextPositionIds.length !== filters.id_chuc_vu.length) {
      setFilter('id_chuc_vu', nextPositionIds);
    }
  }, [filters.id_phong_ban, filters.id_chuc_vu, scopedPositions, setFilter]);

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('columnSearch', {});
    setFilter('id_phong_ban', []);
    setFilter('id_chuc_vu', []);
    setFilter('trang_thai', []);
  };

  const filterGroups = useMemo(() => [
    {
      key: 'id_phong_ban',
      label: 'Phòng ban',
      icon: Building2,
      options: departmentOptions,
      value: filters.id_phong_ban,
      onChange: (val: string[]) => setFilter('id_phong_ban', val),
    },
    {
      key: 'id_chuc_vu',
      label: 'Chức vụ',
      icon: Briefcase,
      options: positionOptions,
      value: filters.id_chuc_vu,
      onChange: (val: string[]) => setFilter('id_chuc_vu', val),
    },
    {
      key: 'trang_thai',
      label: 'Trạng thái',
      icon: Tag,
      options: statusOptions,
      value: filters.trang_thai,
      onChange: (val: string[]) => setFilter('trang_thai', val),
    },
  ], [departmentOptions, positionOptions, statusOptions, filters, setFilter]);

  const bulkStatusActions = useMemo(
    () => (
      <>
        {onBulkEdit && (
          <button
            type="button"
            onClick={onBulkEdit}
            className="h-8 px-3 flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg border border-primary/20 active:scale-95 transition-all"
            aria-label="Chỉnh sửa hàng loạt"
          >
            <Pencil size={14} className="stroke-[2.5px] shrink-0" />
            <span className="text-xs font-medium">Sửa {selectedIds.size} dòng</span>
          </button>
        )}
        <button
          type="button"
          onClick={() => onStatusChangeMany(Array.from(selectedIds), 'Đang làm việc')}
          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center sm:gap-1.5 text-primary bg-primary/10 border border-primary/20 active:scale-95 sm:hover:bg-primary/15 sm:transition-all"
          aria-label="Đang làm việc"
        >
          <Check size={14} className="stroke-[2.5px] shrink-0" />
          <span className="hidden sm:inline text-xs font-medium">Đang làm việc</span>
        </button>
        <button
          type="button"
          onClick={() => onStatusChangeMany(Array.from(selectedIds), 'Nghỉ việc')}
          className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center sm:gap-1.5 text-muted-foreground bg-muted/50 rounded-lg border border-border active:scale-95 sm:hover:bg-muted sm:transition-all"
          aria-label="Nghỉ việc"
        >
          <Power size={14} className="stroke-[2.5px] shrink-0" />
          <span className="hidden sm:inline text-xs font-medium">Nghỉ việc</span>
        </button>
      </>
    ),
    [onBulkEdit, onStatusChangeMany, selectedIds],
  );

  const mobileActions = useMemo(() => [
    ...(onBulkEdit && selectedIds.size > 0 && canEdit ? [{
      key: 'bulk-edit',
      label: 'Chỉnh sửa hàng loạt',
      icon: Pencil,
      onClick: onBulkEdit,
      description: `Sửa thông tin cho ${selectedIds.size} nhân viên đã chọn`,
    }] : []),
    ...(canImport ? [{
      key: 'import',
      label: 'Import dữ liệu',
      icon: Upload,
      onClick: onImport,
      description: 'Nhập danh sách nhân viên',
    }] : []),
    ...(canExport ? [{
      key: 'export',
      label: 'Export dữ liệu',
      icon: Download,
      onClick: onExport,
      description: 'Xuất danh sách nhân viên',
    }] : []),
  ], [onImport, onExport, onBulkEdit, selectedIds.size, canImport, canExport, canEdit]);

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'id_phong_ban',
        active: filters.id_phong_ban.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={departmentOptions}
            value={filters.id_phong_ban}
            onChange={(val) => setFilter('id_phong_ban', val)}
            placeholder="Phòng ban"
            icon={Building2}
            className={chipClass(layout)}
          />
        ),
      },
      {
        id: 'id_chuc_vu',
        active: filters.id_chuc_vu.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={positionOptions}
            value={filters.id_chuc_vu}
            onChange={(val) => setFilter('id_chuc_vu', val)}
            placeholder="Chức vụ"
            icon={Briefcase}
            className={chipClass(layout, 'w-[136px]')}
          />
        ),
      },
      {
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilter('trang_thai', val)}
            placeholder="Trạng thái"
            icon={Tag}
            className={chipClass(layout, 'w-[132px]')}
          />
        ),
      },
    ],
    [departmentOptions, positionOptions, statusOptions, filters.id_phong_ban, filters.id_chuc_vu, filters.trang_thai, setFilter],
  );

  const renderFilters = useMemo(() => <ToolbarFilterChipGroup items={filterChipItems} maxVisible={3} />, [filterChipItems]);

  const renderActions = (
    <>
      {canImport && (
        <Tooltip content="Import dữ liệu" placement="bottom">
          <Button variant="outline" size="sm" onClick={onImport} className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted">
            <Upload className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {canExport && (
        <Tooltip content="Export dữ liệu" placement="bottom">
          <Button variant="outline" size="sm" onClick={onExport} className="inline-flex min-h-[44px] min-w-[44px] md:min-h-0 md:min-w-0 h-8 w-8 p-0 items-center justify-center border-border text-muted-foreground hover:bg-muted">
            <Download className="w-4 h-4" />
          </Button>
        </Tooltip>
      )}
      {canCreate && (
        <Button onClick={onAdd} size="sm" className="bg-primary text-white hover:bg-primary/90 shadow-sm h-8 px-3">
          <Plus className="w-4 h-4 mr-1.5" />
          <span className="text-xs">{BTN_ADD()}</span>
        </Button>
      )}
    </>
  );

  return (
    <GenericToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      bulkActions={canEdit ? bulkStatusActions : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      showBack
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
    />
  );
};

export default EmployeeToolbar;
