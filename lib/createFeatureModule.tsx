/**
 * createFeatureModule – Factory tạo trang quản lý CRUD chuẩn.
 */
import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  Suspense,
  startTransition,
} from 'react';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { List, BarChart3 } from 'lucide-react';
import TabGroup, { type Tab } from '../components/ui/TabGroup';
import ImportDialog from '../components/shared/ImportDialog';
import ExportDialog from '../components/shared/ExportDialog';
import { getLanguage } from './utils';
import { useListWithFilter } from './hooks';
import { useExportData } from './useExportData';
import type { GenericState, SortState } from '../store/createGenericStore';
import { useAuthStore } from '../store/useStore';
import { usePermissionGrantStore } from '../store/usePermissionGrantStore';
import { filterRowsByPermissions } from './permissions';

export interface ImportColumn {
  key: string;
  label: string;
  required?: boolean;
}

export interface ExportColumn {
  key: string;
  label: string;
}

export type FeaturePageHandlerContext<T> = {
  rawData: T[];
  rawDataRef: React.MutableRefObject<T[]>;
  viewingItem: T | null;
  viewingItemRef: React.MutableRefObject<T | null>;
  editingItem: T | null;
  editingItemRef: React.MutableRefObject<T | null>;
  formOrigin: 'list' | 'detail';
  formOriginRef: React.MutableRefObject<'list' | 'detail'>;
  setViewingItem: (item: T | null) => void;
  setEditingItem: (item: T | null) => void;
  setShowForm: (open: boolean) => void;
  setFormOrigin: (origin: 'list' | 'detail') => void;
  clearSelection: () => void;
  keyExtractor: (item: T) => string;
};

export type FeaturePageHandlers<T> = {
  handleEdit: (item: T) => void;
  handleView: (item: T) => void;
  handleDelete: (id: string) => void;
  handleDeleteMany: (ids: string[]) => void;
  handleStatusChange?: (item: T) => void;
  handleStatusChangeMany?: (ids: string[], status: string) => void;
  closeForm: () => void;
  closeDetail: () => void;
  handleAdd?: () => void;
};

export interface FeatureModuleConfig<T, TFilters> {
  id?: string;
  name: string;

  useData: (ctx?: { activeTab?: string }) => {
    data?: T[];
    isLoading: boolean;
    total?: number;
    isServerPaginated?: boolean;
    mode?: 'client' | 'server';
  };

  useStore: () => GenericState<TFilters> & {
    selectedIds: Set<string>;
    clearSelection: () => void;
    setFilter: (key: keyof TFilters & string, value: unknown) => void;
    setPage: (page: number) => void;
  };

  keyExtractor: (item: T) => string;
  filterFn: (item: T, searchTerm: string, filters: TFilters) => boolean;

  tabs?: Tab[];

  TableComponent: React.ComponentType<{
    data: T[];
    isLoading: boolean;
    totalRecordCount?: number;
    serverPaginated?: boolean;
    onEdit: (item: T) => void;
    onView: (item: T) => void;
    onDelete: (id: string) => void;
    onStatusChange?: (item: T) => void;
    [key: string]: unknown;
  }>;

  ToolbarComponent: React.ComponentType<{
    onAdd: () => void;
    onExport: () => void;
    onImport: () => void;
    onDeleteMany: (ids: string[]) => void;
    onStatusChangeMany?: (ids: string[], status: string) => void;
    onBulkEdit?: () => void;
    [key: string]: unknown;
  }>;

  FormComponent: React.ComponentType<{
    initialData?: T | null;
    onClose: () => void;
    [key: string]: unknown;
  }>;

  DetailComponent: React.ComponentType<{
    data: T;
    onClose: () => void;
    onEdit: (item: T) => void;
    onDelete: (id: string) => void;
    [key: string]: unknown;
  }>;

  StatsComponent?: React.ComponentType<Record<string, unknown>>;

  importColumns: ImportColumn[];
  exportColumns: ExportColumn[];
  exportMapFn: (item: T) => Record<string, unknown>;
  exportFileName: string;
  importFileName: string;

  /** Mặc định nếu không có usePageHandlers */
  useDeleteMutation?: () => { mutateAsync: (ids: string[]) => Promise<unknown> };

  onImportData?: (data: Record<string, unknown>[]) => Promise<void>;

  skipClientSort?: (ctx: { isServerPaginated: boolean }) => boolean;

  clientSortFn?: (items: T[], sort: SortState) => T[];

  getTableExtraProps?: (ctx: {
    rawData: T[];
    filteredData: T[];
    isServerPaginated: boolean;
    total: number;
  }) => Record<string, unknown>;

  getToolbarExtraProps?: (ctx: { rawData: T[] }) => Record<string, unknown>;

  buildStatsProps?: (ctx: {
    rawData: T[];
    isLoading: boolean;
    setFilter: (key: keyof TFilters & string, value: unknown) => void;
    onTabChange: (tabId: string) => void;
  }) => Record<string, unknown>;

  urlTabs?: { validTabs: readonly string[]; defaultTab: string };

  /** Reset trang khi bật server mode hoặc đổi sort */
  enableServerPaginationEffects?: boolean;

  useMount?: (queryClient: ReturnType<typeof useQueryClient>) => void | (() => void);

  lazyDrawers?: React.FC;

  getFormKey?: (editing: T | null) => string;

  trackFormOrigin?: boolean;

  usePageHandlers?: (ctx: FeaturePageHandlerContext<T>) => FeaturePageHandlers<T>;

  BulkEditComponent?: React.ComponentType<{
    selectedItems: T[];
    onClose: () => void;
    onSuccess: () => void;
  }>;

  renderExtras?: (ctx: {
    selectedIds: Set<string>;
    rawData: T[];
    clearSelection: () => void;
  }) => React.ReactNode;
}

export function createFeatureModule<T, TFilters>(
  config: FeatureModuleConfig<T, TFilters>,
): React.FC {
  const {
    id,
    name,
    tabs: configTabs = [],
    urlTabs,
    useData,
    useStore,
    keyExtractor,
    filterFn,
    TableComponent,
    ToolbarComponent,
    FormComponent,
    DetailComponent,
    StatsComponent,
    importColumns,
    exportColumns,
    exportMapFn,
    exportFileName,
    importFileName,
    useDeleteMutation,
    onImportData,
    skipClientSort,
    clientSortFn,
    getTableExtraProps,
    getToolbarExtraProps,
    buildStatsProps,
    enableServerPaginationEffects = false,
    useMount,
    lazyDrawers,
    getFormKey,
    trackFormOrigin = false,
    usePageHandlers,
    BulkEditComponent,
    renderExtras,
  } = config;

  const TABS: Tab[] =
    configTabs ??
    [
      { id: 'list', label: 'Danh sách', icon: List },
      ...(StatsComponent ? [{ id: 'stats', label: 'Thống kê', icon: BarChart3 }] : []),
    ];

  const DrawerFallback = lazyDrawers ?? (() => null);

  const FeaturePage: React.FC = () => {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = urlTabs ? searchParams.get('tab') : null;
    const [activeTab, setActiveTab] = useState<string>(() => {
      if (urlTabs && tabFromUrl && urlTabs.validTabs.includes(tabFromUrl)) return tabFromUrl;
      return urlTabs?.defaultTab ?? 'list';
    });
    const [showForm, setShowForm] = useState(false);
    const [editingItem, setEditingItem] = useState<T | null>(null);
    const [viewingItem, setViewingItem] = useState<T | null>(null);
    const [formOrigin, setFormOrigin] = useState<'list' | 'detail'>('list');
    const [showImport, setShowImport] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showBulkEdit, setShowBulkEdit] = useState(false);

    const viewingItemRef = useRef<T | null>(null);
    const editingItemRef = useRef<T | null>(null);
    const formOriginRef = useRef<'list' | 'detail'>('list');
    const rawDataRef = useRef<T[]>([]);

    const {
      searchTerm,
      filters,
      sort,
      resetState,
      clearSelection,
      selectedIds,
      pagination,
      columns,
      setFilter,
      setPage,
    } = useStore();

    const {
      data: rawData = [],
      isLoading,
      total: dataTotal = 0,
      isServerPaginated = false,
      mode: listMode = 'client',
    } = useData({ activeTab });

    const deleteMutation = useDeleteMutation?.();

    useEffect(() => {
      viewingItemRef.current = viewingItem;
    }, [viewingItem]);
    useEffect(() => {
      editingItemRef.current = editingItem;
    }, [editingItem]);
    useEffect(() => {
      formOriginRef.current = formOrigin;
    }, [formOrigin]);
    const user = useAuthStore((s) => s.user);
    const { capBac, employeeRecord, matrixActive } = usePermissionGrantStore();

    const permittedRawData = useMemo(() => {
      if (!matrixActive || user?.role === 'admin') return rawData;
      return filterRowsByPermissions(rawData, { id: id || '' }, user, capBac, employeeRecord);
    }, [rawData, user, matrixActive, capBac, employeeRecord]);

    useEffect(() => {
      rawDataRef.current = permittedRawData;
    }, [permittedRawData]);

    const prevListMode = useRef(listMode);
    useEffect(() => {
      if (!enableServerPaginationEffects) return;
      if (prevListMode.current !== listMode && listMode === 'server') {
        setPage(1);
      }
      prevListMode.current = listMode;
    }, [listMode, setPage, enableServerPaginationEffects]);

    useEffect(() => {
      if (!enableServerPaginationEffects || !isServerPaginated) return;
      setPage(1);
    }, [sort.column, sort.direction, isServerPaginated, setPage, enableServerPaginationEffects]);

    useEffect(() => {
      if (!urlTabs) return;
      if (tabFromUrl && urlTabs.validTabs.includes(tabFromUrl)) {
        queueMicrotask(() => setActiveTab(tabFromUrl));
      }
    }, [tabFromUrl]);

    const handleTabChange = useCallback(
      (id: string) => {
        if (urlTabs && !urlTabs.validTabs.includes(id)) return;
        setActiveTab(id);
        if (urlTabs) {
          setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            next.set('tab', id);
            return next;
          });
        }
      },
      [setSearchParams],
    );

    useEffect(() => {
      const cleanup = useMount?.(queryClient);
      return () => cleanup?.();
    }, [queryClient, useMount]);

    useEffect(() => () => resetState(), [resetState]);

    useEffect(() => {
      if (!viewingItem) return;
      const fresh = permittedRawData.find((e) => keyExtractor(e) === keyExtractor(viewingItem));
      if (fresh && fresh !== viewingItem) queueMicrotask(() => setViewingItem(fresh));
    }, [permittedRawData, viewingItem, keyExtractor]);

    const handlerCtx: FeaturePageHandlerContext<T> = {
      rawData: permittedRawData,
      rawDataRef,
      viewingItem,
      viewingItemRef,
      editingItem,
      editingItemRef,
      formOrigin,
      formOriginRef,
      setViewingItem,
      setEditingItem,
      setShowForm,
      setFormOrigin,
      clearSelection,
      keyExtractor,
    };

    const customHandlers = usePageHandlers ? usePageHandlers(handlerCtx) : undefined;

    const stableFilterFn = useCallback(
      (item: T, term: string, f: TFilters) => filterFn(item, term, f),
      [filterFn],
    );
    const filteredData = useListWithFilter(permittedRawData, searchTerm, filters, stableFilterFn);

    const sortedData = useMemo(() => {
      if (skipClientSort?.({ isServerPaginated })) return filteredData;
      if (clientSortFn) return clientSortFn(filteredData, sort);
      if (!sort.column || !sort.direction) return filteredData;
      const sorted = [...filteredData];
      sorted.sort((a: T, b: T) => {
        const key = sort.column as keyof T;
        const aVal = a[key] ?? '';
        const bVal = b[key] ?? '';
        const cmp =
          typeof aVal === 'number' && typeof bVal === 'number'
            ? aVal - bVal
            : String(aVal).localeCompare(String(bVal), getLanguage());
        return sort.direction === 'desc' ? -cmp : cmp;
      });
      return sorted;
    }, [filteredData, sort, isServerPaginated, skipClientSort, clientSortFn]);

    const tableExtra =
      getTableExtraProps?.({
        rawData: permittedRawData,
        filteredData,
        isServerPaginated,
        total: dataTotal,
      }) ?? {};

    const toolbarExtra = getToolbarExtraProps?.({ rawData: permittedRawData }) ?? {};

    const stableExportMapFn = useCallback((item: T) => exportMapFn(item), [exportMapFn]);
    const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
      useExportData({
        data: filteredData,
        isOpen: showExport,
        mapFn: stableExportMapFn,
        pagination,
        selectedIds,
        keyExtractor,
      });

    const visibleColumnKeys = useMemo(
      () => columns.filter((c) => c.visible).map((c) => c.id),
      [columns],
    );

    const defaultHandleEdit = (item: T) => {
      if (trackFormOrigin) {
        setFormOrigin(viewingItemRef.current ? 'detail' : 'list');
      }
      startTransition(() => {
        setEditingItem(item);
        setShowForm(true);
      });
    };

    const defaultHandleView = (item: T) => {
      startTransition(() => setViewingItem(item));
    };

    const defaultCloseDetail = () => setViewingItem(null);

    const defaultCloseForm = () => {
      setShowForm(false);
      if (trackFormOrigin) {
        const ed = editingItemRef.current;
        if (formOriginRef.current === 'detail' && ed) {
          const fresh = rawDataRef.current.find((e) => keyExtractor(e) === keyExtractor(ed));
          setViewingItem(fresh ?? null);
        }
      }
      setEditingItem(null);
    };

    const defaultHandleDelete = async (id: string) => {
      await deleteMutation?.mutateAsync([id]);
      if (viewingItem && keyExtractor(viewingItem) === id) setViewingItem(null);
      if (editingItem && keyExtractor(editingItem) === id) setShowForm(false);
    };

    const defaultHandleDeleteMany = async (ids: string[]) => {
      await deleteMutation?.mutateAsync(ids);
      clearSelection();
    };

    const defaultHandleAdd = () => {
      if (trackFormOrigin) setFormOrigin('list');
      startTransition(() => setShowForm(true));
    };

    const handleEdit = customHandlers?.handleEdit ?? defaultHandleEdit;
    const handleView = customHandlers?.handleView ?? defaultHandleView;
    const handleDelete = customHandlers?.handleDelete ?? defaultHandleDelete;
    const handleDeleteMany = customHandlers?.handleDeleteMany ?? defaultHandleDeleteMany;
    const handleStatusChange = customHandlers?.handleStatusChange;
    const handleStatusChangeMany = customHandlers?.handleStatusChangeMany;
    const closeForm = customHandlers?.closeForm ?? defaultCloseForm;
    const closeDetail = customHandlers?.closeDetail ?? defaultCloseDetail;
    const handleAdd = customHandlers?.handleAdd ?? defaultHandleAdd;

    const handleImportData = async (data: Record<string, unknown>[]) => {
      if (onImportData) await onImportData(data);
      else toast.success(`Import ${data.length} ${name.toLowerCase()} thành công`);
    };

    const statsProps =
      StatsComponent && buildStatsProps
        ? buildStatsProps({
            rawData: permittedRawData,
            isLoading,
            setFilter,
            onTabChange: handleTabChange,
          })
        : { data: permittedRawData, isLoading };

    const formKey = getFormKey?.(editingItem) ?? 'new';
    const formContent = (
      <FormComponent key={formKey} initialData={editingItem} onClose={closeForm} />
    );
    const detailContent = viewingItem && (
      <DetailComponent
        data={viewingItem}
        onClose={closeDetail}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    );

    return (
      <div className="flex flex-col h-page relative">
        {TABS.length > 1 && (
          <div className="shrink-0 relative z-0">
            <TabGroup
              tabs={TABS}
              activeTab={activeTab}
              onChange={urlTabs ? handleTabChange : setActiveTab}
            />
          </div>
        )}

        {activeTab === 'list' ? (
          <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden relative z-0">
            <ToolbarComponent
              onAdd={handleAdd}
              onExport={() => setShowExport(true)}
              onImport={() => setShowImport(true)}
              onDeleteMany={handleDeleteMany}
              onStatusChangeMany={handleStatusChangeMany}
              onBulkEdit={BulkEditComponent ? () => setShowBulkEdit(true) : undefined}
              {...toolbarExtra}
            />
            <div className="flex-1 min-h-0">
              <TableComponent
                data={sortedData}
                isLoading={isLoading}
                totalRecordCount={dataTotal}
                serverPaginated={isServerPaginated}
                onEdit={handleEdit}
                onView={handleView}
                onDelete={handleDelete}
                onStatusChange={handleStatusChange}
                {...tableExtra}
              />
            </div>
          </div>
        ) : StatsComponent ? (
          <div className="flex-1 min-h-0 flex flex-col mt-1.5 rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden">
              <StatsComponent {...statsProps} />
            </div>
          </div>
        ) : null}

        {renderExtras?.({ selectedIds, rawData: permittedRawData, clearSelection })}

        <AnimatePresence mode="sync">
          {showForm &&
            (lazyDrawers ? (
              <Suspense fallback={<DrawerFallback />}>{formContent}</Suspense>
            ) : (
              formContent
            ))}
          {viewingItem &&
            !showForm &&
            (lazyDrawers ? (
              <Suspense fallback={<DrawerFallback />}>{detailContent}</Suspense>
            ) : (
              detailContent
            ))}
          {showImport && (
            <ImportDialog
              open={showImport}
              onClose={() => setShowImport(false)}
              columns={importColumns}
              onImport={handleImportData}
              templateFileName={importFileName}
            />
          )}
          {showExport && (
            <ExportDialog
              open={showExport}
              onClose={() => setShowExport(false)}
              columns={exportColumns}
              data={exportData}
              paginatedData={paginatedExportData}
              selectedData={selectedExportData}
              fileName={exportFileName}
              visibleColumnKeys={visibleColumnKeys}
            />
          )}
          {BulkEditComponent && showBulkEdit && selectedIds.size > 0 && (
            <BulkEditComponent
              selectedItems={permittedRawData.filter((e) => selectedIds.has(keyExtractor(e)))}
              onClose={() => setShowBulkEdit(false)}
              onSuccess={clearSelection}
            />
          )}
        </AnimatePresence>
      </div>
    );
  };

  FeaturePage.displayName = `${name}Page`;
  return FeaturePage;
}
