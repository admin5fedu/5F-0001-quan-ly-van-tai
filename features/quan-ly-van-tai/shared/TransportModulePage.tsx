import React, { useMemo, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  CheckCircle2,
  Download,
  Edit,
  Plus,
  Printer,
  Save,
  Trash2,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Car,
  Calendar,
  CreditCard,
  DollarSign,
  FileText,
  Hash,
  Activity,
  Layers,
  Tag,
  Copy,
  Compass,
  Briefcase,
  Wrench,
  Scale,
  UserCheck,
  Milestone,
  Check,
  RefreshCw,
  Power,
  ClipboardList,
  Banknote,
  Receipt,
  MinusCircle,
  Wallet,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Combobox from '@/components/ui/Combobox';
import { useAuthStore, useUIStore } from '@/store/useStore';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';
import {
  can,
  canEditRow,
  canDeleteRow,
  canApproveRow,
  canAddChildRow,
  isRowLockedForUser,
  filterRowsByPermissions,
  APP_RESOURCE_TO_MODULE,
  type AppResource,
} from '@/lib/permissions';
import { getTransportStatusKey } from './transport-config';
import EnumBadge from '@/components/ui/EnumBadge';
import DetailField from '@/components/shared/DetailField';
import DetailFieldGrid from '@/components/shared/DetailFieldGrid';
import DetailSection from '@/components/shared/DetailSection';
import FormGrid from '@/components/shared/FormGrid';
import FormSection from '@/components/shared/FormSection';
import GenericDrawer, { DRAWER_WIDTH_DETAIL, DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import { DIALOG_SIZE } from '@/lib/dialog-sizes';
import {
  APPROVAL_STATUS_BADGE_CONFIG,
  EXECUTION_STATUS_BADGE_CONFIG,
  HOAT_DONG_STATUS_BADGE_CONFIG,
} from './approval-badge-config';
import { DriverCtPickerDialog, resolveCtLocationLabel } from './DriverCtPickerDialog';
import { DriverCtReportDialog, type DriverCtReportValues } from './DriverCtReportDialog';
import { getReportableCtRowsForTrip, shouldPickCtBeforeReport } from './driver-ct-report-flow';
import { StatusChoiceForm, confirmNoteFieldClass } from './StatusChoiceForm';
import GenericTable from '@/components/shared/GenericTable';
import GenericToolbar from '@/components/shared/GenericToolbar';
import ExportDialog from '@/components/shared/ExportDialog';
import { useExportData } from '@/lib/useExportData';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useConfirmStore } from '@/store/useConfirmStore';
import type { ColumnConfig, SortState } from '@/store/createGenericStore';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import { BTN_ADD, BTN_CLOSE, BTN_EDIT, BTN_DELETE, CONFIRM_YES } from '@/lib/button-labels';
import { cn, getErrorMessage, getAvatarUrl } from '@/lib/utils';
import { ColumnHeaderFilter } from '@/components/shared/column-header/ColumnHeaderFilter';
import { ColumnHeaderSortMenu } from '@/components/shared/column-header/ColumnHeaderSortMenu';
import { ColumnHeaderSearch } from '@/components/shared/column-header/ColumnHeaderSearch';
import DetailToolbar, { type DetailToolbarAction } from '@/components/shared/DetailToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import EmbeddedChildDataGrid from '@/components/shared/EmbeddedChildDataGrid';
import ToolbarFilterChipGroup from '@/components/shared/ToolbarFilterChipGroup';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import {
  EMPTY_TRANSPORT_LOOKUPS,
  getRelationOptions,
  resolveTransportValue,
  resolveLocationGroup,
  STATUS_OPTIONS,
  PAYROLL_STATUS_OPTIONS,
  APPROVAL_OPTIONS,
  EXECUTION_STATUS_OPTIONS,
  TRANSPORT_MODULES,
  type TransportField,
  type TransportLookupRows,
  type TransportModuleConfig,
  type TransportRow,
} from './transport-config';
import { openPayrollPreviewTab } from '../bang-luong/utils/open-payroll-preview';
import { openPayrollPeriodMatrixTab } from '../bang-luong/utils/open-payroll-period-matrix';
import { isPendingTripApproval, normalizeTripApprovalStatus } from './trip-approval-sync';
import {
  canDriverReportCt,
  formatTripCtCompletionStats,
  getTripCtCompletionStats,
  isCtEligibleForPayroll,
  normalizeExecutionStatus,
} from './trip-execution-sync';
import {
  buildPayrollMatrix,
  formatPayrollMoney,
  getPayrollTripDetails,
} from '../bang-luong/utils/payroll-matrix';
import {
  approveTransportRows,
  rejectTransportRows,
  canApproveTransportRow,
  createTransportRow,
  deleteTransportRows,
  getTransportLookupRows,
  getTransportRows,
  setTransportApprovalStatus,
  updateTransportRow,
  updateTransportStatus,
} from './transport-service';

const LocationTripLabel: React.FC<{
  idDiaDiem: unknown;
  lookups: Partial<TransportLookupRows>;
}> = ({ idDiaDiem, lookups }) => {
  const locationName = resolveTransportValue('id_dia_diem', idDiaDiem, lookups);
  const groupName = resolveLocationGroup(idDiaDiem, lookups);

  return (
    <div className="min-w-0">
      <div className="text-xs font-medium text-primary truncate">{groupName}</div>
      <div className="font-semibold text-foreground truncate">{locationName}</div>
    </div>
  );
};

const getFieldIcon = (key: string) => {
  const k = key.toLowerCase();
  if (k === 'ten') return <Tag size={12} />;
  if (k === 'nhom') return <Layers size={12} />;
  if (k === 'dinh_vi') return <Compass size={12} />;
  if (k === 'bien_so') return <Milestone size={12} />;
  if (k === 'hang') return <Briefcase size={12} />;
  if (k === 'model') return <Wrench size={12} />;
  if (k === 'doi') return <Calendar size={12} />;
  if (k === 'loai_xe') return <Car size={12} />;
  if (k === 'tai_trong') return <Scale size={12} />;
  if (k === 'id_nhan_vien') return <UserCheck size={12} />;
  if (k.includes('ho_ten') || k.includes('tai_xe')) return <User size={12} />;
  if (k.includes('sdt') || k.includes('so_dien_thoai') || k.includes('phone')) return <Phone size={12} />;
  if (k.includes('email') || k.includes('mail')) return <Mail size={12} />;
  if (k.includes('dia_chi') || k.includes('dia_diem') || k.includes('diem_') || k.includes('tuyen_duong') || k.includes('tinh_thanh') || k.includes('quan_huyen')) return <MapPin size={12} />;
  if (k.includes('xe')) return <Car size={12} />;
  if (k.includes('ngay') || k.includes('tg_') || k.includes('nam') || k.includes('thang') || k.includes('han_')) return <Calendar size={12} />;
  if (k.includes('gplx') || k.includes('so_gplx')) return <CreditCard size={12} />;
  // Phân tách chi tiết các biểu tượng tài chính cho bảng lương
  if (k === 'tong_luong_chuyen') return <Banknote size={12} />;
  if (k === 'tong_chi_phi_chuyen') return <Receipt size={12} />;
  if (k === 'tru_tien_khac') return <MinusCircle size={12} />;
  if (k === 'tong_chi_phi_khac') return <CreditCard size={12} />;
  if (k === 'tong_con_lai') return <Wallet size={12} />;
  if (k.includes('tien') || k.includes('phi') || k.includes('luong') || k.includes('con_lai') || k.includes('phu_cap') || k.includes('thuc_linh') || k.includes('tru_')) return <DollarSign size={12} />;
  if (k.includes('ghi_chu') || k.includes('mo_ta') || k.includes('thong_tin_khac') || k.includes('ghi_chu_chi_phi')) return <FileText size={12} />;
  if (k.includes('trang_thai') || k.includes('phe_duyet')) return <Activity size={12} />;
  return <Hash size={12} />;
};

const getCompanyPrintInfo = () => {
  const info = useUIStore.getState().companyInfo;
  return {
    companyName: info.companyName || 'CÔNG TY CỔ PHẦN VẬN TẢI TAH',
    companyPhone: info.phone || '090 000 0000',
    companyEmail: info.email || 'admin@gmail.com',
    companyAddress: info.address || 'Số 12, Đường số 5, KDC Trung Sơn, Bình Hưng, Bình Chánh, TP.HCM',
  };
};

interface DetailSectionData {
  title: string;
  icon: React.ReactNode;
  fields: string[];
}

const getDetailSections = (moduleId: string, fields: TransportField[]): DetailSectionData[] => {
  const allFieldKeys = fields.map((f) => f.key);
  switch (moduleId) {
    case 'tai-xe':
      return [
        {
          title: 'Thông tin cá nhân',
          icon: <User size={14} />,
          fields: ['ho_ten', 'ngay_sinh', 'so_dien_thoai', 'email', 'dia_chi', 'trang_thai'],
        },
        {
          title: 'Giấy phép & Phương tiện',
          icon: <CreditCard size={14} />,
          fields: ['so_gplx', 'hang_bang', 'ngay_het_han_bang', 'id_xe_mac_dinh'],
        },
        {
          title: 'Thông tin bổ sung',
          icon: <FileText size={14} />,
          fields: ['thong_tin_khac', 'ghi_chu'],
        },
      ];
    case 'dia-diem':
      return [
        {
          title: 'Thông tin chính',
          icon: <MapPin size={14} />,
          fields: ['ten', 'nhom', 'trang_thai'],
        },
        {
          title: 'Vị trí & Định mức tài chính',
          icon: <DollarSign size={14} />,
          fields: ['tien_luong', 'chi_phi', 'dia_chi', 'dinh_vi'],
        },
        {
          title: 'Thông tin bổ sung',
          icon: <FileText size={14} />,
          fields: ['mo_ta', 'ghi_chu'],
        },
      ];
    case 'danh-sach-xe':
      return [
        {
          title: 'Thông tin xe',
          icon: <Car size={14} />,
          fields: ['bien_so', 'hang', 'model', 'doi', 'loai_xe', 'tai_trong', 'trang_thai'],
        },
        {
          title: 'Kiểm định & Bảo hiểm',
          icon: <Calendar size={14} />,
          fields: ['han_dang_kiem', 'han_bao_hiem'],
        },
        {
          title: 'Thông tin bổ sung',
          icon: <FileText size={14} />,
          fields: ['thong_tin_khac'],
        },
      ];
    case 'chuyen-xe':
      return [
        {
          title: 'Thông tin chuyến xe',
          icon: <Calendar size={14} />,
          fields: ['ngay', 'id_tai_xe', 'id_xe', 'trang_thai'],
        },
        {
          title: 'Thông số tổng hợp',
          icon: <DollarSign size={14} />,
          fields: ['so_chuyen', 'tong_tien_luong', 'tong_phi'],
        },
        {
          title: 'Thông tin bổ sung',
          icon: <FileText size={14} />,
          fields: ['ghi_chu'],
        },
      ];
    case 'bang-luong':
      return [
        {
          title: 'Kỳ lương & Tài xế',
          icon: <Calendar size={14} />,
          fields: ['thang', 'nam', 'id_tai_xe', 'trang_thai'],
        },
        {
          title: 'Chi tiết tài chính',
          icon: <DollarSign size={14} />,
          fields: ['tong_luong_chuyen', 'tong_chi_phi_chuyen', 'tru_tien_khac', 'tong_chi_phi_khac', 'tong_con_lai'],
        },
        {
          title: 'Thông tin bổ sung',
          icon: <FileText size={14} />,
          fields: ['ghi_chu_khoan_tru', 'ghi_chu_chi_phi', 'ghi_chu'],
        },
      ];
    default:
      return [
        {
          title: 'Thông tin nghiệp vụ',
          icon: <Hash size={14} />,
          fields: allFieldKeys,
        },
      ];
  }
};

interface TransportModulePageProps {
  config: TransportModuleConfig;
  showBack?: boolean;
}

const statusBadgeConfig = {
  ...APPROVAL_STATUS_BADGE_CONFIG,
  ...EXECUTION_STATUS_BADGE_CONFIG,
  ...HOAT_DONG_STATUS_BADGE_CONFIG,
};

const executionBadgeConfig = EXECUTION_STATUS_BADGE_CONFIG;
const approvalBadgeConfig = APPROVAL_STATUS_BADGE_CONFIG;

const numericCenterCellClass = 'flex w-full items-center justify-center';

function defaultValueFor(field: TransportField, lookups: TransportLookupRows): unknown {
  if (field.type === 'number' || field.type === 'currency') return 0;
  if (field.type === 'date') return field.required ? new Date().toISOString().slice(0, 10) : '';
  if (field.type === 'select') {
    const options = field.options ?? getRelationOptions(field.relation, lookups);
    return options[0]?.value ?? '';
  }
  return '';
}

function buildInitialValues(
  config: TransportModuleConfig,
  lookups: TransportLookupRows,
  row?: TransportRow | null,
): Record<string, unknown> {
  return Object.fromEntries(
    config.fields.map((field) => [field.key, row?.[field.key] ?? defaultValueFor(field, lookups)]),
  );
}

function normalizeFormValues(config: TransportModuleConfig, values: Record<string, unknown>): Record<string, unknown> {
  const normalized = Object.fromEntries(
    config.fields.map((field) => {
      const value = values[field.key];
      if (field.type === 'number' || field.type === 'currency') {
        return [field.key, Number(value) || 0];
      }
      return [field.key, typeof value === 'string' ? value.trim() : value];
    }),
  );
  if (values.id) {
    normalized.id = values.id;
  }
  return normalized;
}

function matchesRow(config: TransportModuleConfig, row: TransportRow, term: string, lookups: TransportLookupRows): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return config.searchKeys.some((key) => {
    const direct = row[key];
    const resolved = resolveTransportValue(key, direct, lookups);
    return `${direct ?? ''} ${resolved}`.toLowerCase().includes(needle);
  });
}

function compareRows(a: TransportRow, b: TransportRow, sort: SortState): number {
  if (!sort.column || !sort.direction) return 0;
  const aValue = a[sort.column];
  const bValue = b[sort.column];
  const sign = sort.direction === 'desc' ? -1 : 1;
  if (typeof aValue === 'number' && typeof bValue === 'number') return sign * (aValue - bValue);
  return sign * String(aValue ?? '').localeCompare(String(bValue ?? ''), 'vi');
}

function toCsv(config: TransportModuleConfig, rows: TransportRow[], lookups: TransportLookupRows) {
  const columns = config.columns.filter((column) => column.id !== 'actions');
  const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`;
  return [
    columns.map((column) => escape(column.label)).join(','),
    ...rows.map((row) =>
      columns.map((column) => escape(resolveTransportValue(column.id, row[column.id], lookups))).join(','),
    ),
  ].join('\n');
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

const formatMoney = (value: unknown): string => formatPayrollMoney(value);

interface StatusSelectorProps {
  initialStatus: string;
  options: { label: string; value: string }[];
  titleVal: string;
  onChange: (status: string) => void;
}

const StatusSelector: React.FC<StatusSelectorProps> = ({
  initialStatus,
  options,
  titleVal,
  onChange,
}) => {
  const [status, setStatus] = useState(initialStatus);

  React.useEffect(() => {
    onChange(status);
  }, [status, onChange]);

  return (
    <div className="space-y-4 text-left py-2 w-full">
      <p className="text-sm">Chọn trạng thái mới cho <strong>{titleVal}</strong>:</p>
      <Combobox
        value={status}
        options={options}
        onChange={(v) => setStatus(String(v))}
        searchable={false}
        dropdownInPortal
      />
    </div>
  );
};

interface ApprovalFormDialogProps {
  subtitle: string;
  initialStatus: string;
  initialNote: string;
  onValuesChange: (status: string, note: string) => void;
}

const ApprovalFormDialog: React.FC<ApprovalFormDialogProps> = ({
  initialStatus,
  initialNote,
  onValuesChange,
}) => {
  const [status, setStatus] = useState(initialStatus || 'Đã duyệt');
  const [note, setNote] = useState(initialNote || '');

  React.useEffect(() => {
    onValuesChange(status, note);
  }, [status, note, onValuesChange]);

  return (
    <div className="space-y-4 text-left py-1 w-full min-w-[320px] sm:min-w-[400px]">
      <StatusChoiceForm
        sectionLabel="HÀNH ĐỘNG"
        options={[
          { value: 'Đã duyệt', label: 'Duyệt', tone: 'success' },
          { value: 'Không duyệt', label: 'Không duyệt', tone: 'danger' },
        ]}
        value={status}
        onChange={setStatus}
      />

      <div className="space-y-1.5 mt-4">
        <label className="text-xs font-semibold text-muted-foreground font-medium">Ghi chú (tùy chọn)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ghi chú hoặc lý do..."
          className={confirmNoteFieldClass}
        />
      </div>
    </div>
  );
};

interface TempChildFormDialogProps {
  initialValues: any;
  lookups: TransportLookupRows;
  onValuesChange: (values: any) => void;
}

const TempChildFormDialog: React.FC<TempChildFormDialogProps & { driverReportOnly?: boolean }> = ({
  initialValues,
  lookups,
  onValuesChange,
  driverReportOnly = false,
}) => {
  const initialLocation = (lookups.locations || []).find((l) => String(l.id) === String(initialValues.id_dia_diem));
  const [nhom, setNhom] = useState(String(initialLocation?.nhom ?? ''));
  const [diaDiem, setDiaDiem] = useState(initialValues.id_dia_diem);
  const [tienLuong, setTienLuong] = useState(initialValues.tien_luong);
  const [chiPhi, setChiPhi] = useState(initialValues.chi_phi);
  const [ghiChu, setGhiChu] = useState(initialValues.ghi_chu ?? '');

  const locationGroupOptions = Array.from(new Set((lookups.locations || []).map((loc) => String(loc.nhom ?? '')).filter(Boolean)))
    .map((value) => ({ label: value, value }));

  const locationOptions = getRelationOptions('locations', lookups)
    .filter((opt) => {
      if (!nhom) return false;
      const loc = (lookups.locations || []).find((item) => String(item.id) === String(opt.value));
      return String(loc?.nhom ?? '') === nhom;
    })
    .map((opt) => ({
      label: opt.label,
      value: opt.value,
    }));

  React.useEffect(() => {
    onValuesChange({
      id_dia_diem: diaDiem,
      tien_luong: tienLuong,
      chi_phi: chiPhi,
      ghi_chu: ghiChu,
    });
  }, [diaDiem, tienLuong, chiPhi, ghiChu, onValuesChange]);

  const handleLocationChange = (val: string) => {
    setDiaDiem(val);
    const loc = (lookups.locations || []).find((l) => String(l.id) === val);
    if (loc) {
      setTienLuong(loc.tien_luong ?? 0);
      setChiPhi(loc.chi_phi ?? 0);
    }
  };

  if (driverReportOnly) {
    const locationLabel = resolveTransportValue('id_dia_diem', diaDiem, lookups);
    return (
      <div className="space-y-4 text-left py-2 w-full">
        <div className="rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa điểm</p>
          <p className="mt-1 font-medium text-foreground">{locationLabel || '—'}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Lương chuyến (do quản lý thiết lập):{' '}
            <strong className="text-foreground tabular-nums">{new Intl.NumberFormat('vi-VN').format(tienLuong)} đ</strong>
          </p>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground font-medium">Chi phí phát sinh (tài xế báo cáo)</label>
          <input
            type="text"
            value={new Intl.NumberFormat('vi-VN').format(chiPhi)}
            onChange={(e) => {
              const numeric = e.target.value.replace(/[^0-9]/g, '');
              setChiPhi(Number(numeric) || 0);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground font-medium">Ghi chú tiến độ / chi phí</label>
          <textarea
            value={String(ghiChu)}
            onChange={(e) => setGhiChu(e.target.value)}
            placeholder="Mô tả tiến độ, chi phí phát sinh..."
            className="w-full min-h-24 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 resize-y"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-left py-2 w-full">
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground font-medium">Nhóm</label>
        <Combobox
          value={nhom}
          options={locationGroupOptions}
          onChange={(v) => {
            setNhom(String(v));
            setDiaDiem('');
            setTienLuong(0);
            setChiPhi(0);
          }}
          placeholder="Chọn nhóm..."
          searchable
          dropdownInPortal
        />
      </div>
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground font-medium">Địa điểm</label>
        <Combobox
          value={diaDiem}
          options={locationOptions}
          onChange={(v) => handleLocationChange(String(v))}
          placeholder={nhom ? 'Chọn địa điểm...' : 'Chọn nhóm trước'}
          searchable
          disabled={!nhom}
          dropdownInPortal
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground font-medium">Tiền lương</label>
          <input
            type="text"
            value={new Intl.NumberFormat('vi-VN').format(tienLuong)}
            onChange={(e) => {
              const numeric = e.target.value.replace(/[^0-9]/g, '');
              setTienLuong(Number(numeric) || 0);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-muted-foreground font-medium">Chi phí chuyến</label>
          <input
            type="text"
            value={new Intl.NumberFormat('vi-VN').format(chiPhi)}
            onChange={(e) => {
              const numeric = e.target.value.replace(/[^0-9]/g, '');
              setChiPhi(Number(numeric) || 0);
            }}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>
    </div>
  );
};

const TempChildFormDrawer: React.FC<{
  initialValues: any;
  lookups: TransportLookupRows;
  onClose: () => void;
  onSubmit: (values: any) => void;
  isEdit?: boolean;
  driverReportOnly?: boolean;
}> = ({ initialValues, lookups, onClose, onSubmit, isEdit = false, driverReportOnly = false }) => {
  const [values, setValues] = useState<any>(initialValues);
  const handleValuesChange = useCallback((next: any) => {
    setValues((current: any) => ({ ...current, ...next }));
  }, []);

  return (
    <GenericDrawer
      title={driverReportOnly ? 'Báo cáo chi phí chuyến' : isEdit ? 'Sửa chi tiết chuyến' : 'Thêm chi tiết chuyến'}
      icon={<ClipboardList size={18} />}
      onClose={onClose}
      variant={driverReportOnly ? 'modal' : 'drawer'}
      maxWidthClass={driverReportOnly ? `${DIALOG_SIZE.MEDIUM} w-full` : DRAWER_WIDTH_FORM}
      stackLevel={driverReportOnly ? 0 : 1}
      footerCompact
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={onClose} className="h-8 px-3 text-xs text-muted-foreground border border-border">
            {BTN_CLOSE()}
          </Button>
          <Button
            type="button"
            onClick={() => {
              if (!driverReportOnly && !values.id_dia_diem) {
                toast.warning('Vui lòng chọn địa điểm');
                return;
              }
              onSubmit(values);
            }}
            className="h-8 px-3 text-xs"
          >
            <Save className="mr-1.5 h-3.5 w-3.5" />
            {driverReportOnly ? 'Lưu báo cáo' : 'Lưu dòng con'}
          </Button>
        </div>
      }
    >
      <TempChildFormDialog
        initialValues={initialValues}
        lookups={lookups}
        onValuesChange={handleValuesChange}
        driverReportOnly={driverReportOnly}
      />
    </GenericDrawer>
  );
};

const TransportForm: React.FC<{
  config: TransportModuleConfig;
  row: TransportRow | null;
  prefillData?: Record<string, unknown> | null;
  lookups: TransportLookupRows;
  onClose: () => void;
  onSubmit: (values: Record<string, unknown>) => void;
  isSaving: boolean;
  onAddChild?: (parentRow: TransportRow) => void;
  onEditChild?: (childRow: TransportRow) => void;
  onDeleteChild?: (childRowId: string) => void;
  onViewChildDetail?: (childRow: TransportRow) => void;
  initialTempChildRows?: any[] | null;
  isCloning?: boolean;
  driverSelfId?: string | null;
  driverReportMode?: boolean;
}> = ({
  config,
  row,
  prefillData,
  lookups,
  onClose,
  onSubmit,
  isSaving,
  onAddChild,
  onEditChild,
  onDeleteChild,
  onViewChildDetail,
  initialTempChildRows,
  isCloning = false,
  driverSelfId,
  driverReportMode = false,
}) => {
  const [values, setValues] = useState(() => {
    const base = buildInitialValues(config, lookups, row);
    // Tài xế tạo chuyến mới: mặc định chọn chính mình (server cũng ép lại để an toàn).
    if (!row && config.id === 'chuyen-xe' && driverSelfId) {
      base.id_tai_xe = String(driverSelfId);
      const driver = (lookups.drivers || []).find((item) => String(item.id) === String(driverSelfId));
      if (driver?.id_xe_mac_dinh) {
        base.id_xe = String(driver.id_xe_mac_dinh);
      }
    }
    return {
      ...base,
      ...prefillData,
    };
  });
  const Icon = config.icon;
  const [tempChildRows, setTempChildRows] = useState<any[]>(() => initialTempChildRows || []);
  const [tempChildEditingRow, setTempChildEditingRow] = useState<any | null>(null);
  const [tempChildDrawerOpen, setTempChildDrawerOpen] = useState(false);
  const [tempChildDriverReport, setTempChildDriverReport] = useState(false);
  const initialLocation = (lookups.locations || []).find((l) => String(l.id) === String(values.id_dia_diem));
  const [selectedLocationGroup, setSelectedLocationGroup] = useState(String(initialLocation?.nhom ?? ''));

  const openTempChildDialog = (childToEdit?: any) => {
    setTempChildEditingRow(childToEdit || {
      id_dia_diem: '',
      tien_luong: 0,
      chi_phi: 0,
      trang_thai: 'Chưa thực hiện',
      phe_duyet: 'Chưa duyệt',
    });
    setTempChildDrawerOpen(true);
  };

  const closeTempChildDrawer = () => {
    setTempChildDrawerOpen(false);
    setTempChildEditingRow(null);
  };

  const saveTempChildRow = (nextValues: any) => {
    if (tempChildEditingRow?.id) {
      setTempChildRows((prev) =>
        prev.map((item) => (item.id === tempChildEditingRow.id ? { ...item, ...nextValues } : item)),
      );
    } else {
      setTempChildRows((prev) => [
        ...prev,
        {
          id: `temp_${Date.now()}_${Math.random()}`,
          trang_thai: 'Chưa thực hiện',
          phe_duyet: 'Chưa duyệt',
          ...nextValues,
        },
      ]);
    }
    closeTempChildDrawer();
  };

  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  const employeeOptions = useMemo(() => {
    if (config.id !== 'tai-xe' || row) return [];
    return (lookups.employees || [])
      .filter((emp) => !emp.la_tai_xe)
      .map((emp) => ({
        value: String(emp.id),
        label: `${emp.ho_va_ten} (${emp.ten_phong_ban || 'Chưa gán'} - ${emp.so_dien_thoai || 'Không có SĐT'})`,
      }));
  }, [config.id, row, lookups.employees]);

  const handleSelectEmployee = (empId: string | number) => {
    const empIdStr = String(empId);
    setSelectedEmployeeId(empIdStr);
    if (!empIdStr) {
      setValues((current) => ({
        ...current,
        id: undefined,
        ho_ten: '',
        so_dien_thoai: '',
        email: '',
        ngay_sinh: '',
        dia_chi: '',
        so_gplx: '',
        hang_bang: '',
        ngay_het_han_bang: '',
        id_xe_mac_dinh: '',
        thong_tin_khac: '',
        ghi_chu: '',
      }));
      return;
    }

    const emp = (lookups.employees || []).find((e) => String(e.id) === empIdStr);
    if (emp) {
      setValues((current) => ({
        ...current,
        id: emp.id,
        ho_ten: emp.ho_va_ten || '',
        so_dien_thoai: emp.so_dien_thoai || '',
        email: emp.email || '',
        ngay_sinh: emp.ngay_sinh || '',
        dia_chi: emp.dia_chi || '',
        so_gplx: emp.so_gplx || '',
        hang_bang: emp.hang_bang || '',
        ngay_het_han_bang: emp.ngay_het_han_bang || '',
        id_xe_mac_dinh: emp.id_xe_mac_dinh ? String(emp.id_xe_mac_dinh) : '',
        thong_tin_khac: emp.thong_tin_khac || '',
        ghi_chu: emp.ghi_chu || '',
      }));
    }
  };

  const setValue = (key: string, value: unknown) => {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (config.id === 'chuyen-xe' && key === 'id_tai_xe') {
        const driver = (lookups.drivers || []).find((item) => String(item.id) === String(value));
        if (driver?.id_xe_mac_dinh) {
          next.id_xe = String(driver.id_xe_mac_dinh);
        }
      }
      if (config.id === 'bang-luong') {
        if (key === 'id_tai_xe') {
          const driver = (lookups.drivers || []).find((item) => String(item.id) === String(value));
          if (driver) {
            next.luong_co_ban = Number(driver.luong_co_ban || 0);
            const tongLuong = Number(current.tong_luong_chuyen || 0);
            const tongChiPhi = Number(current.tong_chi_phi_chuyen || 0);
            const truTien = Number(current.tru_tien_khac || 0);
            next.tong_con_lai = next.luong_co_ban + tongLuong + tongChiPhi - truTien;
          }
        }
        if (key === 'tru_tien_khac' || key === 'luong_co_ban') {
          const luongCoBan = Number(key === 'luong_co_ban' ? value : (current.luong_co_ban || 0));
          const tongLuong = Number(current.tong_luong_chuyen || 0);
          const tongChiPhi = Number(current.tong_chi_phi_chuyen || 0);
          const truTien = Number(key === 'tru_tien_khac' ? value : (current.tru_tien_khac || 0));
          next.tong_con_lai = luongCoBan + tongLuong + tongChiPhi - truTien;
        }
      }
      if (config.id === 'chuyen-xe-ct' && key === 'id_dia_diem') {
        const locId = String(value);
        const loc = (lookups.locations || []).find((l) => String(l.id) === locId);
        if (loc) {
          next.tien_luong = loc.tien_luong ?? 0;
          next.chi_phi = loc.chi_phi ?? 0;
        }
      }
      return next;
    });
  };

  React.useEffect(() => {
    if (config.id === 'chuyen-xe') {
      const soChuyen = tempChildRows.length;
      const tongLuong = tempChildRows.reduce((sum, item) => sum + (Number(item.tien_luong) || 0), 0);
      const tongPhi = tempChildRows.reduce((sum, item) => sum + (Number(item.chi_phi) || 0), 0);
      setValues((prev) => ({
        ...prev,
        so_chuyen: soChuyen,
        tong_tien_luong: tongLuong,
        tong_phi: tongPhi,
      }));
    }
  }, [tempChildRows, config.id]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (driverReportMode && config.id === 'chuyen-xe' && row) {
      toast.warning('Tài xế báo cáo từng dòng CT — dùng nút Báo cáo CT trên danh sách chi tiết.');
      return;
    }
    const missing = config.fields.find((field) => !field.hideInForm && field.required && !String(values[field.key] ?? '').trim());
    if (missing) {
      toast.warning(`Vui lòng nhập ${missing.label.toLowerCase()}`);
      return;
    }
    const finalValues = normalizeFormValues(config, values);
    if (config.id === 'chuyen-xe' && !row) {
      finalValues.tempChildRows = tempChildRows.map((item) => {
        const { id, ...rest } = item;
        return rest;
      });
    }
    onSubmit(finalValues);
  };

  const sections = getDetailSections(config.id, config.fields);

  return (
    <>
    <GenericDrawer
      title={
        driverReportMode && config.id === 'chuyen-xe'
          ? 'Báo cáo chuyến'
          : driverReportMode && config.id === 'chuyen-xe-ct'
            ? 'Báo cáo chi phí chuyến'
            : row
              ? `Sửa ${config.title}`
              : `Thêm ${config.title}`
      }
      subtitle={driverReportMode ? 'Tài xế chỉ báo cáo tiến độ và chi phí — duyệt do cấp trên' : undefined}
      icon={<Icon size={18} />}
      onClose={onClose}
      variant={driverReportMode ? 'modal' : 'drawer'}
      maxWidthClass={driverReportMode ? `${DIALOG_SIZE.MEDIUM} w-full` : DRAWER_WIDTH_FORM}
      footerCompact
      footer={
        <FormDrawerFooter
          formId={`form-${config.id}`}
          onCancel={onClose}
          isLoading={isSaving}
          isEdit={!!row}
          compact
          createIcon={<Plus className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
          saveLabel={driverReportMode ? 'Lưu báo cáo' : undefined}
        />
      }
    >
      <form id={`form-${config.id}`} onSubmit={handleSubmit} className="space-y-4">
        {driverReportMode && config.id === 'chuyen-xe' && row ? (
          <div className="rounded-xl border border-sky-200 bg-sky-50/90 p-4 text-sm space-y-2.5">
            <p className="leading-relaxed">
              <span className="text-muted-foreground">Ngày:</span>{' '}
              <strong className="text-foreground">{resolveTransportValue('ngay', row.ngay, lookups)}</strong>
            </p>
            <p className="leading-relaxed">
              <span className="text-muted-foreground">Tài xế:</span>{' '}
              <strong className="text-foreground">{resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups)}</strong>
            </p>
            <p className="leading-relaxed">
              <span className="text-muted-foreground">Xe:</span>{' '}
              <strong className="text-foreground">{resolveTransportValue('id_xe', row.id_xe, lookups)}</strong>
            </p>
          </div>
        ) : null}
        {driverReportMode && config.id === 'chuyen-xe-ct' && row ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Địa điểm (chỉ đọc)</p>
            <p className="mt-1 font-medium">{resolveTransportValue('id_dia_diem', row.id_dia_diem, lookups)}</p>
            <p className="mt-2 text-xs text-muted-foreground">
              Lương chuyến: <strong className="text-foreground tabular-nums">{formatMoney(row.tien_luong)}</strong>
            </p>
          </div>
        ) : null}
        {config.id === 'tai-xe' && !row && employeeOptions.length > 0 && (
          <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-6 space-y-3">
            <div className="flex items-center gap-2 text-primary">
              <UserCheck size={16} />
              <h4 className="text-xs font-semibold uppercase tracking-wider">
                Liên kết Nhân sự hệ thống
              </h4>
            </div>
            <p className="text-xs text-muted-foreground">
              Nếu tài xế này đã có hồ sơ nhân sự trong hệ thống, hãy chọn dưới đây để tự động lấy thông tin cá nhân và liên kết tài khoản.
            </p>
            <Combobox
              label="Chọn Nhân viên có sẵn"
              options={employeeOptions}
              value={selectedEmployeeId}
              onChange={handleSelectEmployee}
              placeholder="Tìm kiếm và chọn nhân sự..."
              searchable
              dropdownInPortal
            />
          </div>
        )}
        {sections.map((sec) => {
          const sectionFields = config.fields.filter((f) => {
            if (!sec.fields.includes(f.key) || f.hideInForm) return false;
            if (driverReportMode && config.id === 'chuyen-xe') {
              return f.key === 'ghi_chu';
            }
            if (driverReportMode && config.id === 'chuyen-xe-ct') {
              return f.key === 'chi_phi' || f.key === 'ghi_chu';
            }
            return true;
          });
          if (sectionFields.length === 0) return null;

          return (
            <FormSection key={sec.title} title={driverReportMode && config.id === 'chuyen-xe' ? 'Ghi chú tiến độ chuyến' : sec.title} icon={sec.icon}>
              <FormGrid cols={2}>
                {sectionFields.map((field) => {
                  const inputId = `${config.id}-${field.key}`;
                  const value = values[field.key] ?? '';
                  const isPrefilled = Boolean(prefillData && field.key in prefillData);
                  const isDisabled =
                    field.readOnly === true ||
                    (isPrefilled && !isCloning) ||
                    (!row && config.id === 'chuyen-xe' && field.key === 'id_tai_xe' && Boolean(driverSelfId));
                  const commonClass =
                    'w-full h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed';
                  const wrapperClass = `${field.type === 'textarea' || field.fullWidth ? 'sm:col-span-2' : ''} space-y-1.5`;
                  const label = (
                    <label htmlFor={inputId} className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                      {getFieldIcon(field.key)}
                      <span>{field.label}</span>
                      {field.required && <span className="text-destructive ml-0.5">*</span>}
                    </label>
                  );
                  const helper = field.helperText ? <p className="text-xs text-muted-foreground">{field.helperText}</p> : null;

                  if (field.type === 'textarea') {
                    return (
                      <div key={field.key} className={wrapperClass}>
                        {label}
                        <textarea
                          id={inputId}
                          value={String(value)}
                          disabled={isDisabled}
                          onChange={(event) => setValue(field.key, event.target.value)}
                          placeholder={field.placeholder}
                          className={`${commonClass} min-h-24 py-2 resize-y`}
                        />
                        {helper}
                      </div>
                    );
                  }

                  if (field.type === 'select') {
                    if (config.id === 'chuyen-xe-ct' && field.key === 'id_dia_diem') {
                      const locationGroupOptions = Array.from(new Set((lookups.locations || []).map((loc) => String(loc.nhom ?? '')).filter(Boolean)))
                        .map((group) => ({ label: group, value: group }));
                      const options = getRelationOptions(field.relation, lookups).filter((opt) => {
                        if (!selectedLocationGroup) return false;
                        const loc = (lookups.locations || []).find((item) => String(item.id) === String(opt.value));
                        return String(loc?.nhom ?? '') === selectedLocationGroup;
                      });
                      return (
                        <div key={field.key} className={wrapperClass}>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <Combobox
                              label="Nhóm"
                              icon={<Layers size={12} />}
                              options={locationGroupOptions}
                              value={selectedLocationGroup}
                              onChange={(nextValue) => {
                                setSelectedLocationGroup(String(nextValue));
                                setValue(field.key, '');
                              }}
                              placeholder="Chọn nhóm"
                              searchable
                              dropdownInPortal
                            />
                            <Combobox
                              label={field.label}
                              icon={getFieldIcon(field.key)}
                              required={field.required}
                              options={options}
                              value={String(value)}
                              onChange={(nextValue) => setValue(field.key, nextValue)}
                              placeholder={selectedLocationGroup ? `Chọn ${field.label.toLowerCase()}` : 'Chọn nhóm trước'}
                              searchable
                              disabled={!selectedLocationGroup || isDisabled}
                              dropdownInPortal
                            />
                          </div>
                          {helper}
                        </div>
                      );
                    }
                    const options = field.options ?? getRelationOptions(field.relation, lookups);
                    return (
                      <div key={field.key} className={wrapperClass}>
                        <Combobox
                          label={field.label}
                          icon={getFieldIcon(field.key)}
                          required={field.required}
                          options={options}
                          value={String(value)}
                          onChange={(nextValue) => setValue(field.key, nextValue)}
                          placeholder={field.placeholder ?? `Chọn ${field.label.toLowerCase()}`}
                          searchable={options.length > 8 || Boolean(field.relation)}
                          disabled={isDisabled}
                          dropdownInPortal
                        />
                        {helper}
                      </div>
                    );
                  }

                  // Default input type (text, number, date, currency)
                  const inputType = field.type === 'currency' ? 'text' : field.type;
                  const formattedValue =
                    field.type === 'currency'
                      ? Number(value).toLocaleString('vi-VN')
                      : String(value);

                  return (
                    <div key={field.key} className={wrapperClass}>
                      {label}
                      <input
                        id={inputId}
                        type={inputType}
                        value={formattedValue}
                        disabled={isDisabled}
                        onChange={(event) => {
                          let rawVal: unknown = event.target.value;
                          if (field.type === 'currency') {
                            const numeric = event.target.value.replace(/[^0-9]/g, '');
                            rawVal = Number(numeric) || 0;
                          } else if (field.type === 'number') {
                            rawVal = Number(event.target.value) || 0;
                          }
                          setValue(field.key, rawVal);
                        }}
                        placeholder={field.placeholder}
                        className={commonClass}
                      />
                      {helper}
                    </div>
                  );
                })}
              </FormGrid>
            </FormSection>
          );
        })}
        {config.id === 'chuyen-xe' && (
          row ? (
            <TripDetailsSection
              parentRow={row}
              lookups={lookups}
              driverReportMode={driverReportMode}
              onAddChild={driverReportMode ? undefined : onAddChild}
              onEditChild={onEditChild}
              onDeleteChild={driverReportMode ? undefined : onDeleteChild}
              onViewChildDetail={onViewChildDetail}
            />
          ) : (
            <DetailSection
              title="Danh sách chi tiết chuyến (Tạm thời)"
              icon={<ClipboardList size={14} />}
              variant="primary"
              headerRight={
                <>
                  <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">
                    {tempChildRows.length} dòng
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openTempChildDialog()}
                    className="h-7 px-2 text-xs"
                  >
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Thêm dòng con
                  </Button>
                </>
              }
            >
              {tempChildRows.length === 0 ? (
                <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
                  Chưa có chi tiết chuyến nào. Click "Thêm dòng con" để bổ sung chi tiết trực tiếp.
                </div>
              ) : (
                <EmbeddedChildDataGrid<any>
                  rows={tempChildRows}
                  getRowKey={(r) => String(r.id)}
                  labelColumn={{
                    header: 'Địa điểm',
                    minWidthClass: 'min-w-[160px]',
                    renderCell: (r) => (
                      <LocationTripLabel idDiaDiem={r.id_dia_diem} lookups={lookups} />
                    ),
                  }}
                  columns={[
                    {
                      id: 'tien_luong',
                      header: 'Tiền lương',
                      renderCell: (r) => (
                        <span className="tabular-nums">
                          {resolveTransportValue('tien_luong', r.tien_luong, lookups)}
                        </span>
                      ),
                    },
                    {
                      id: 'chi_phi',
                      header: 'Chi phí',
                      renderCell: (r) => (
                        <span className="tabular-nums">
                          {resolveTransportValue('chi_phi', r.chi_phi, lookups)}
                        </span>
                      ),
                    },
                    {
                      id: 'trang_thai',
                      header: 'Trạng thái',
                      renderCell: (r) => (
                        <EnumBadge shape="pill" value={String(r.trang_thai ?? '')} config={statusBadgeConfig} />
                      ),
                    },
                  ]}
                  actionsColumn={{
                    header: 'Thao tác',
                    widthClass: 'w-[120px] min-w-[120px]',
                    renderCell: (r) => (
                      <div className="flex items-center gap-1">
                        <TableRowIconButton
                          icon={Edit}
                          label="Sửa"
                          variant="primary"
                          onClick={() => openTempChildDialog(r)}
                        />
                        <TableRowIconButton
                          icon={Trash2}
                          label="Xóa"
                          variant="danger"
                          onClick={() => {
                            setTempChildRows((prev) => prev.filter((item) => item.id !== r.id));
                          }}
                        />
                      </div>
                    ),
                  }}
                />
              )}
            </DetailSection>
          )
        )}
      </form>
    </GenericDrawer>
    <AnimatePresence>
      {tempChildDrawerOpen && tempChildEditingRow && (
        <TempChildFormDrawer
          initialValues={tempChildEditingRow}
          lookups={lookups}
          isEdit={tempChildRows.some((item) => item.id === tempChildEditingRow.id)}
          driverReportOnly={tempChildDriverReport}
          onClose={closeTempChildDrawer}
          onSubmit={saveTempChildRow}
        />
      )}
    </AnimatePresence>
    </>
  );
};

interface RelatedSection {
  title: string;
  emptyText: string;
  rows: TransportRow[];
  columns: Array<{ key: string; label: string }>;
}

function getRelatedSections(
  config: TransportModuleConfig,
  row: TransportRow,
  lookups: Partial<TransportLookupRows> = EMPTY_TRANSPORT_LOOKUPS,
): RelatedSection[] {
  const trips = lookups?.trips || [];
  const payroll = lookups?.payroll || [];
  const tripDetails = lookups?.tripDetails || [];

  if (config.id === 'tai-xe') {
    return [
      {
        title: 'Lịch sử chuyến xe',
        emptyText: 'Chưa có chuyến xe cho tài xế này.',
        rows: trips.filter((trip) => String(trip.id_tai_xe) === row.id),
        columns: [
          { key: 'ngay', label: 'Ngày' },
          { key: 'id_xe', label: 'Xe' },
          { key: 'so_chuyen', label: 'Số chuyến' },
          { key: 'tong_tien_luong', label: 'Tổng lương' },
          { key: 'trang_thai', label: 'Trạng thái' },
        ],
      },
      {
        title: 'Lịch sử lương',
        emptyText: 'Chưa có bảng lương cho tài xế này.',
        rows: payroll.filter((item) => String(item.id_tai_xe) === row.id),
        columns: [
          { key: 'thang', label: 'Tháng' },
          { key: 'nam', label: 'Năm' },
          { key: 'tong_luong_chuyen', label: 'Lương chuyến' },
          { key: 'tru_tien_khac', label: 'Trừ tiền khác' },
          { key: 'tong_chi_phi_khac', label: 'Chi phí khác' },
          { key: 'tong_con_lai', label: 'Còn lại' },
          { key: 'trang_thai', label: 'Trạng thái' },
        ],
      },
    ];
  }
  if (config.id === 'dia-diem') {
    return [
      {
        title: 'Lịch sử chuyến liên quan',
        emptyText: 'Chưa có chuyến chi tiết dùng địa điểm này.',
        rows: tripDetails.filter((detail) => String(detail.id_dia_diem) === row.id),
        columns: [
          { key: 'id_chuyen_xe', label: 'Chuyến xe' },
          { key: 'tien_luong', label: 'Tiền lương' },
          { key: 'chi_phi', label: 'Chi phí' },
          { key: 'phe_duyet', label: 'Phê duyệt' },
        ],
      },
    ];
  }
  if (config.id === 'danh-sach-xe') {
    return [
      {
        title: 'Lịch sử chuyến xe',
        emptyText: 'Chưa có chuyến xe dùng xe này.',
        rows: trips.filter((trip) => String(trip.id_xe) === row.id),
        columns: [
          { key: 'ngay', label: 'Ngày' },
          { key: 'id_tai_xe', label: 'Tài xế' },
          { key: 'so_chuyen', label: 'Số chuyến' },
          { key: 'tong_tien_luong', label: 'Tổng lương' },
          { key: 'trang_thai', label: 'Trạng thái' },
        ],
      },
    ];
  }
  if (config.id === 'chuyen-xe') {
    return [
      {
        title: 'Danh sách chi tiết chuyến',
        emptyText: 'Chưa có dòng chi tiết cho chuyến này.',
        rows: tripDetails.filter((detail) => String(detail.id_chuyen_xe) === row.id),
        columns: [
          { key: 'id_dia_diem', label: 'Địa điểm' },
          { key: 'tien_luong', label: 'Tiền lương' },
          { key: 'chi_phi', label: 'Chi phí' },
          { key: 'phe_duyet', label: 'Phê duyệt' },
        ],
      },
    ];
  }
  return [];
}

const RelatedRowsTable: React.FC<{ section: RelatedSection; lookups: Partial<TransportLookupRows> }> = ({ section, lookups }) => (
  <DetailSection title={section.title}>
    {section.rows.length === 0 ? (
      <p className="text-sm text-muted-foreground">{section.emptyText}</p>
    ) : (
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="min-w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground">
            <tr>
              {section.columns.map((column) => (
                <th key={column.key} className="px-3 py-2 whitespace-nowrap">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {section.rows.map((item) => (
              <tr key={item.id} className="border-t border-border/70">
                {section.columns.map((column) => (
                  <td key={column.key} className="px-3 py-2 whitespace-nowrap">
                    {column.key === 'trang_thai' || column.key === 'phe_duyet' ? (
                      <EnumBadge shape="pill" value={String(item[column.key] ?? '')} config={statusBadgeConfig} />
                    ) : (
                      resolveTransportValue(column.key, item[column.key], lookups)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </DetailSection>
);

const PayrollTripMatrixSection: React.FC<{ row: TransportRow; lookups: Partial<TransportLookupRows> }> = ({ row, lookups }) => {
  // Ma trận chuyến trong kỳ = số tiền lương thực trả → chỉ tính chuyến đã duyệt.
  const tripDetails = getPayrollTripDetails(row, lookups, true);
  const matrixRows = buildPayrollMatrix(tripDetails, row);
  const maxTripSlots = Math.max(6, ...matrixRows.map((item) => item.rows.length));
  const visibleSalaryTotal = tripDetails.reduce((sum, item) => sum + (Number(item.tien_luong) || 0), 0);
  const periodSalaryTotal = visibleSalaryTotal || Number(row.tong_luong_chuyen) || 0;

  return (
    <DetailSection
      title="Bảng chi tiết chuyến trong kỳ"
      icon={<ClipboardList size={14} />}
      variant="primary"
      headerRight={
        <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
          {tripDetails.length} chuyến trong kỳ
        </span>
      }
    >
      {tripDetails.length === 0 ? (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
          Chưa có chuyến nào trong kỳ lương này.
        </div>
      ) : (
        <>
          <div className="space-y-2 sm:hidden">
            {tripDetails.map((detail) => (
              <div key={detail.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-primary">{resolveTransportValue('ngay', detail.trip?.ngay, lookups)}</div>
                    <div className="font-semibold text-foreground truncate">{resolveTransportValue('id_dia_diem', detail.id_dia_diem, lookups)}</div>
                  </div>
                  <EnumBadge shape="pill" value={String(detail.phe_duyet ?? '')} config={statusBadgeConfig} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Lương: <strong className="text-foreground">{formatMoney(detail.tien_luong)}</strong></span>
                  <span>Chi phí: <strong className="text-foreground">{formatMoney(detail.chi_phi)}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-xl border border-border bg-card sm:block">
            <table className="w-max max-w-full border-collapse text-sm mx-auto" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr className="bg-[#fee06a] text-foreground">
                  <th className="border border-slate-300 bg-[#00ff00] px-2 py-1.5 text-center font-bold whitespace-nowrap">Ngày</th>
                  <th className="border border-slate-300 px-2 py-1.5 text-center font-bold whitespace-nowrap">Lương</th>
                  {Array.from({ length: maxTripSlots }).map((_, index) => (
                    <th key={index} className="border border-slate-300 px-2 py-1.5 text-center font-bold whitespace-nowrap">Chuyến {index + 1}</th>
                  ))}
                  <th className="border border-slate-300 px-2 py-1.5 text-center font-bold whitespace-nowrap">Tổng</th>
                  <th className="border border-slate-300 bg-[#ff6a1a] px-2 py-1.5 text-center font-bold text-white whitespace-nowrap">TỔNG CỘNG</th>
                </tr>
              </thead>
              <tbody>
                {matrixRows.map(({ date, dayLabel, rows: items }) => {
                  const totalSalary = items.reduce((sum, item) => sum + (Number(item.tien_luong) || 0), 0);
                  const totalCost = items.reduce((sum, item) => sum + (Number(item.chi_phi) || 0), 0);
                  const displayDay = dayLabel ?? resolveTransportValue('ngay', date, lookups);
                  const periodTotalCell = periodSalaryTotal > 0 ? formatMoney(periodSalaryTotal) : '';
                  if (items.length === 0) {
                    return (
                      <tr key={date}>
                        <td className="border border-slate-300 px-3 py-2 text-center text-base font-semibold">
                          {displayDay}
                        </td>
                        <td className="border border-slate-300 px-3 py-2 text-center font-semibold" />
                        {Array.from({ length: maxTripSlots }).map((_, index) => (
                          <td key={index} className="border border-slate-300 px-3 py-2 text-center" />
                        ))}
                        <td className="border border-slate-300 px-3 py-2 text-center font-semibold" />
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{periodTotalCell}</td>
                      </tr>
                    );
                  }
                  return (
                    <React.Fragment key={date}>
                      <tr>
                        <td rowSpan={3} className="border border-slate-300 px-3 py-2 text-center text-base font-semibold">
                          {displayDay}
                        </td>
                        <td className="border border-slate-300 bg-[#fee06a] px-3 py-2 text-center font-bold">Vị trí</td>
                        {Array.from({ length: maxTripSlots }).map((_, index) => (
                          <td key={index} className="border border-slate-300 px-2 py-1.5 text-center align-middle" style={{ minWidth: 'max-content', whiteSpace: 'normal' }}>
                            {items[index] ? resolveTransportValue('id_dia_diem', items[index].id_dia_diem, lookups) : ''}
                          </td>
                        ))}
                        <td className="border border-slate-300 px-3 py-2 text-center font-semibold">{items.length}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{periodTotalCell}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 px-3 py-2 text-center font-semibold">Lương</td>
                        {Array.from({ length: maxTripSlots }).map((_, index) => (
                          <td key={index} className="border border-slate-300 px-2 py-1.5 text-right tabular-nums whitespace-nowrap">
                            {items[index] ? formatMoney(items[index].tien_luong) : ''}
                          </td>
                        ))}
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{formatMoney(totalSalary)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{periodTotalCell}</td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 bg-[#fee06a] px-3 py-2 text-center font-bold">Chi phí</td>
                        {Array.from({ length: maxTripSlots }).map((_, index) => (
                          <td key={index} className="border border-slate-300 px-2 py-1.5 text-right tabular-nums whitespace-nowrap">
                            {items[index] ? formatMoney(items[index].chi_phi) : ''}
                          </td>
                        ))}
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{formatMoney(totalCost)}</td>
                        <td className="border border-slate-300 px-3 py-2 text-right font-semibold">{periodTotalCell}</td>
                      </tr>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DetailSection>
  );
};

const PayrollTripHistorySection: React.FC<{ row: TransportRow; lookups: Partial<TransportLookupRows> }> = ({ row, lookups }) => {
  const historyRows = getPayrollTripDetails(row, lookups, false);

  return (
    <DetailSection
      title="Lịch sử chuyến CT"
      icon={<ClipboardList size={14} />}
      headerRight={
        <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          {historyRows.length} dòng
        </span>
      }
    >
      {historyRows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Chưa có dòng chuyến CT trong kỳ lương này.</p>
      ) : (
        <>
          <div className="space-y-2 sm:hidden">
            {historyRows.map((detail) => (
              <div key={detail.id} className="rounded-xl border border-border bg-card p-3 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-primary">{resolveTransportValue('ngay', detail.trip?.ngay, lookups)}</div>
                    <div className="font-semibold text-foreground truncate">{resolveTransportValue('id_dia_diem', detail.id_dia_diem, lookups)}</div>
                  </div>
                  <EnumBadge shape="pill" value={String(detail.phe_duyet ?? '')} config={statusBadgeConfig} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Lương: <strong className="text-foreground">{formatMoney(detail.tien_luong)}</strong></span>
                  <span>Chi phí: <strong className="text-foreground">{formatMoney(detail.chi_phi)}</strong></span>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground">
                <tr>
                  <th className="px-3 py-2 whitespace-nowrap">Ngày</th>
                  <th className="px-3 py-2 whitespace-nowrap">Địa điểm</th>
                  <th className="px-3 py-2 whitespace-nowrap text-right">Lương</th>
                  <th className="px-3 py-2 whitespace-nowrap text-right">Chi phí</th>
                  <th className="px-3 py-2 whitespace-nowrap">Duyệt</th>
                </tr>
              </thead>
              <tbody>
                {historyRows.map((detail) => (
                  <tr key={detail.id} className="border-t border-border/70">
                    <td className="px-3 py-2 whitespace-nowrap">{resolveTransportValue('ngay', detail.trip?.ngay, lookups)}</td>
                    <td className="px-3 py-2 whitespace-nowrap font-medium text-foreground">{resolveTransportValue('id_dia_diem', detail.id_dia_diem, lookups)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums">{formatMoney(detail.tien_luong)}</td>
                    <td className="px-3 py-2 whitespace-nowrap text-right tabular-nums">{formatMoney(detail.chi_phi)}</td>
                    <td className="px-3 py-2 whitespace-nowrap"><EnumBadge shape="pill" value={String(detail.phe_duyet ?? '')} config={statusBadgeConfig} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </DetailSection>
  );
};

const TripDetailsSection: React.FC<{
  parentRow: TransportRow;
  lookups: Partial<TransportLookupRows>;
  driverReportMode?: boolean;
  onAddChild?: (parentRow: TransportRow) => void;
  onEditChild?: (childRow: TransportRow) => void;
  onDeleteChild?: (childRowId: string) => void;
  onViewChildDetail?: (childRow: TransportRow) => void;
}> = ({
  parentRow,
  lookups,
  driverReportMode = false,
  onAddChild,
  onEditChild,
  onDeleteChild,
  onViewChildDetail,
}) => {
  const user = useAuthStore((s) => s.user);
  const capBac = usePermissionGrantStore((s) => s.capBac);

  const employeeRecord = useMemo(() => {
    if (!user || !lookups.employees) return null;
    return lookups.employees.find(
      (emp) =>
        (emp as any).ten_dang_nhap?.toLowerCase() === (user as any).ten_dang_nhap?.toLowerCase() ||
        (emp as any).email?.toLowerCase() === (user as any).email?.toLowerCase()
    ) || null;
  }, [user, lookups.employees]);

  const childRows = useMemo(() => {
    return (lookups?.tripDetails || []).filter((detail) => String(detail.id_chuyen_xe) === String(parentRow.id));
  }, [lookups?.tripDetails, parentRow.id]);

  const isDriverForParentTrip = useMemo(() => {
    if (!employeeRecord?.id || user?.role === 'admin') return false;
    return String(parentRow.id_tai_xe) === String(employeeRecord.id);
  }, [employeeRecord?.id, parentRow.id_tai_xe, user?.role]);

  const renderChildActions = (row: TransportRow) => {
    const canEditChild = canEditRow(row, 'chuyen-xe-ct', user, capBac, employeeRecord, lookups);
    const canDeleteChild = canDeleteRow(row, 'chuyen-xe-ct', user, capBac, employeeRecord, lookups);
    const childReportable = (driverReportMode || isDriverForParentTrip) && canDriverReportCt(row);
    return (
      <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
        {onEditChild && (driverReportMode ? childReportable : canEditChild) && (
          <button
            type="button"
            title={driverReportMode ? 'Báo cáo CT' : 'Sửa'}
            onClick={() => onEditChild(row)}
            className="p-1 rounded-md text-primary hover:bg-primary/5 transition-colors"
          >
            {driverReportMode ? <ClipboardList className="w-3.5 h-3.5" /> : <Edit className="w-3.5 h-3.5" />}
          </button>
        )}
        {onDeleteChild && canDeleteChild && (
          <button
            type="button"
            title="Xóa"
            onClick={() => onDeleteChild(row.id)}
            className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  return (
    <DetailSection
      title="Danh sách chi tiết chuyến"
      icon={<ClipboardList size={14} />}
      variant="primary"
      headerRight={
        <>
          <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">
            {childRows.length} dòng
          </span>
          {onAddChild && canAddChildRow(parentRow, 'chuyen-xe-ct', user, capBac, employeeRecord, lookups) && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onAddChild(parentRow)}
              className="h-7 px-2 text-xs"
            >
              <Plus className="mr-1 h-3.5 w-3.5" />
              Thêm dòng con
            </Button>
          )}
        </>
      }
    >
      {childRows.length === 0 ? (
        <div className="flex h-20 items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 text-xs text-muted-foreground">
          Chưa có chi tiết chuyến nào
        </div>
      ) : (
        <>
        <div className="space-y-2 sm:hidden">
          {childRows.map((row) => (
            <button
              type="button"
              key={row.id}
              onClick={() => onViewChildDetail?.(row)}
              className="w-full rounded-xl border border-border bg-card p-3 text-left shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <LocationTripLabel idDiaDiem={row.id_dia_diem} lookups={lookups} />
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <span>Lương: <strong className="text-foreground">{formatMoney(row.tien_luong)}</strong></span>
                    <span>Chi phí: <strong className="text-foreground">{formatMoney(row.chi_phi)}</strong></span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <EnumBadge shape="pill" value={String(row.trang_thai ?? '')} config={executionBadgeConfig} />
                  <EnumBadge shape="pill" value={String(row.phe_duyet ?? '')} config={approvalBadgeConfig} />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 border-t border-border/60 pt-2">
                <span className="text-xs font-medium text-muted-foreground">
                  {driverReportMode ? 'Báo cáo' : 'Thao tác'}
                </span>
                {renderChildActions(row)}
              </div>
            </button>
          ))}
        </div>
        <div className="hidden sm:block">
        <EmbeddedChildDataGrid<TransportRow>
          rows={childRows}
          getRowKey={(row) => String(row.id)}
          labelColumn={{
            header: 'Địa điểm',
            minWidthClass: 'min-w-[160px]',
            renderCell: (row) => (
              <LocationTripLabel idDiaDiem={row.id_dia_diem} lookups={lookups} />
            ),
          }}
          columns={[
            {
              id: 'tien_luong',
              header: 'Tiền lương',
              renderCell: (row) => (
                <span className="tabular-nums">
                  {resolveTransportValue('tien_luong', row.tien_luong, lookups)}
                </span>
              ),
            },
            {
              id: 'chi_phi',
              header: 'Chi phí',
              renderCell: (row) => (
                <span className="tabular-nums">
                  {resolveTransportValue('chi_phi', row.chi_phi, lookups)}
                </span>
              ),
            },
            {
              id: 'trang_thai',
              header: 'Thực hiện',
              renderCell: (row) => (
                <EnumBadge shape="pill" value={String(row.trang_thai ?? '')} config={executionBadgeConfig} />
              ),
            },
            {
              id: 'phe_duyet',
              header: 'Phê duyệt',
              renderCell: (row) => (
                <EnumBadge shape="pill" value={String(row.phe_duyet ?? '')} config={approvalBadgeConfig} />
              ),
            },
          ]}
          actionsColumn={{
            header: 'Thao tác',
            widthClass: 'w-[120px] min-w-[120px]',
            renderCell: renderChildActions,
          }}
          onRowClick={onViewChildDetail}
        />
        </div>
        </>
      )}
    </DetailSection>
  );
};

interface TransportDetailProps {
  config: TransportModuleConfig;
  row: TransportRow;
  lookups: Partial<TransportLookupRows>;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onApprove?: () => void;
  canApprove?: boolean;
  onStatusChange?: (status: string, note?: string, extraFields?: Record<string, unknown>) => Promise<void>;
  onPrintSingle?: () => void;
  onAddChild?: (parentRow: TransportRow) => void;
  onEditChild?: (childRow: TransportRow) => void;
  onDeleteChild?: (childRowId: string) => void;
  onViewChildDetail?: (childRow: TransportRow) => void;
  parentViewingRow?: TransportRow;
  onClone?: (row: TransportRow) => void;
  driverReportMode?: boolean;
}

const TransportDetail: React.FC<TransportDetailProps> = ({
  config,
  row,
  lookups,
  onClose,
  onEdit,
  onDelete,
  onApprove,
  canApprove: canApproveProp,
  onStatusChange,
  onPrintSingle,
  onAddChild,
  onEditChild,
  onDeleteChild,
  onViewChildDetail,
  parentViewingRow,
  onClone,
  driverReportMode = false,
}) => {
  const Icon = config.icon;
  const user = useAuthStore((s) => s.user);
  const capBac = usePermissionGrantStore((s) => s.capBac);

  const onStatusChangeRef = React.useRef(onStatusChange);
  React.useEffect(() => {
    onStatusChangeRef.current = onStatusChange;
  }, [onStatusChange]);

  const employeeRecord = useMemo(() => {
    if (!user || !lookups.employees) return null;
    return lookups.employees.find(
      (emp) =>
        (emp as any).ten_dang_nhap?.toLowerCase() === (user as any).ten_dang_nhap?.toLowerCase() ||
        (emp as any).email?.toLowerCase() === (user as any).email?.toLowerCase()
    ) || null;
  }, [user, lookups.employees]);

  const canEdit = canEditRow(row, config.id, user, capBac, employeeRecord, lookups);
  const canDelete = canDeleteRow(row, config.id, user, capBac, employeeRecord, lookups);
  const canApprove = canApproveRow(row, config.id, user, capBac, employeeRecord, lookups) && canApproveProp;
  const canCreate = can(user, 'create', config.id as AppResource);
  const isDriver = (lookups?.drivers || []).some((d: any) => String(d.id) === String(employeeRecord?.id)) && user?.role !== 'admin';

  const locked = isRowLockedForUser(row, config.id, user, capBac, lookups);
  const relatedSections = getRelatedSections(config, row, lookups);
  const sections = getDetailSections(config.id, config.fields);
  const confirm = useConfirmStore((state) => state.confirm);
  const rowStatusKey = getTransportStatusKey(row[config.statusKey ?? 'trang_thai']);
  const isApproved = rowStatusKey === 'da duyet';
  const isRejected = rowStatusKey === 'khong duyet';

  const titleVal = resolveTransportValue(config.nameKey, row[config.nameKey], lookups);

  const subtitleVal = useMemo(() => {
    if (config.id === 'tai-xe') {
      return String(row.so_dien_thoai || 'Chưa có số điện thoại');
    }
    if (config.id === 'danh-sach-xe') {
      return `${row.loai_xe || ''} ${row.tai_trong ? '- ' + row.tai_trong + ' tấn' : ''}`.trim() || 'Chưa phân loại xe';
    }
    if (config.id === 'dia-diem') {
      return String(row.nhom || 'Chưa phân nhóm địa điểm');
    }
    if (config.id === 'chuyen-xe') {
      return row.ngay ? `Ngày: ${resolveTransportValue('ngay', row.ngay, lookups)}` : '';
    }
    if (config.id === 'chuyen-xe-ct') {
      return resolveLocationGroup(row.id_dia_diem, lookups);
    }
    if (config.id === 'bang-luong') {
      return `Kỳ lương: Tháng ${row.thang}/${row.nam}`;
    }
    return '';
  }, [config.id, row, lookups]);

  const handleUpdateStatus = useCallback(() => {
    if (!config.statusKey || !onStatusChangeRef.current) return;
    const initialStatus = String(row[config.statusKey] ?? '');
    const currentValues = { status: initialStatus };
    
    let options = STATUS_OPTIONS;
    if (config.id === 'chuyen-xe') options = APPROVAL_OPTIONS;
    if (config.id === 'bang-luong') options = PAYROLL_STATUS_OPTIONS;

    const optionItems = options.map((o) => ({ label: o.label, value: o.value }));

    confirm({
      title: `Đổi trạng thái ${config.title.toLowerCase()}`,
      message: (
        <StatusSelector
          initialStatus={initialStatus}
          options={optionItems}
          titleVal={titleVal}
          onChange={(v) => { currentValues.status = v; }}
        />
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        if (onStatusChangeRef.current) {
          await onStatusChangeRef.current(currentValues.status);
        }
      },
    });
  }, [row, config, titleVal, confirm]);

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    const actions: DetailToolbarAction[] = [];

    const showStatusChange = config.statusKey && config.id !== 'bang-luong' && config.id !== 'chuyen-xe' && config.id !== 'chuyen-xe-ct' && onStatusChange && canEdit;
    if (showStatusChange) {
      actions.push({
        label: 'Đổi trạng thái',
        icon: <RefreshCw size={14} />,
        onClick: handleUpdateStatus,
        variant: 'info',
      });
    }

    if (config.id === 'chuyen-xe' && canApprove && onApprove) {
      actions.push({
        label: 'Quản lý duyệt',
        icon: <CheckCircle2 size={14} />,
        onClick: onApprove,
        variant: 'success',
      });
    }

    if (config.id === 'chuyen-xe' && isDriver && driverReportMode && !locked) {
      actions.push({
        label: 'Báo cáo từng CT',
        icon: <ClipboardList size={14} />,
        onClick: onEdit,
        variant: 'primary',
      });
    }

    if ((config.id === 'chuyen-xe' || config.id === 'tai-xe' || config.id === 'danh-sach-xe' || config.id === 'dia-diem') && onClone && canCreate) {
      actions.push({
        label: 'Sao chép',
        icon: <Copy size={14} />,
        onClick: () => onClone(row),
        variant: 'violet',
      });
    }

    if (config.id === 'tai-xe') {
      const email = String(row.email ?? '');
      const phone = String(row.so_dien_thoai ?? '');
      if (email) {
        actions.push({
          label: 'Gửi email',
          icon: <Mail size={14} />,
          onClick: () => { window.location.href = `mailto:${email}`; },
          variant: 'primary',
        });
      }
      if (phone) {
        actions.push({
          label: 'Gọi điện',
          icon: <Phone size={14} />,
          onClick: () => { window.location.href = `tel:${phone}`; },
          variant: 'success',
        });
      }
    }

    if (config.id === 'bang-luong') {
      const isAdmin = user?.role === 'admin' || capBac === 1;
      const isPending = row.trang_thai === 'Chưa duyệt' || !row.trang_thai;

      if (onApprove && canApprove && (isPending || isAdmin)) {
        actions.push({
          label: 'Quản lý duyệt',
          icon: <CheckCircle2 size={14} />,
          onClick: onApprove,
          variant: 'success',
        });
      }

      if (isAdmin && (isApproved || isRejected) && onStatusChangeRef.current) {
        actions.push({
          label: 'Đặt lại Chưa duyệt',
          icon: <RefreshCw size={14} />,
          onClick: () => {
            confirm({
              title: 'Đặt lại Chưa duyệt',
              message: 'Bạn có chắc chắn muốn chuyển trạng thái bảng lương này về "Chưa duyệt"?',
              variant: 'warning',
              confirmText: 'Đồng ý',
              onConfirm: async () => {
                if (onStatusChangeRef.current) {
                  await onStatusChangeRef.current('Chưa duyệt');
                }
              },
            });
          },
          variant: 'warning',
        });
      }

      actions.push({
        label: 'Chi tiết trong kỳ',
        icon: <ClipboardList size={14} />,
        href: `/bang-luong-ky-chi-tiet/${encodeURIComponent(row.id)}`,
        variant: 'primary',
      });

      if (onPrintSingle) {
        actions.push({
          label: 'In bảng lương',
          icon: <Printer size={14} />,
          href: `/bang-luong-preview/${encodeURIComponent(row.id)}`,
          variant: 'primary',
        });
      }
    }

    return actions;
  }, [handleUpdateStatus, row.email, row.so_dien_thoai, row.id, row.trang_thai, config, canApprove, onApprove, onStatusChange, onPrintSingle, canEdit, user, capBac, lookups, isApproved, isRejected]);

  return (
    <GenericDrawer
      title={`${config.title}`}
      subtitle={locked ? config.lockedReason : undefined}
      icon={<Icon size={18} />}
      onClose={onClose}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      footer={
        <div className="w-full flex items-center justify-between">
          <Button type="button" variant="ghost" onClick={onClose} className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border">
            {BTN_CLOSE()}
          </Button>
          <div className="flex items-center gap-2">
            {canEdit && !(config.id === 'chuyen-xe' && isDriver && driverReportMode) && (
              <Button type="button" onClick={onEdit} className="h-8 px-3 text-xs bg-primary text-white shadow-sm hover:bg-primary/90">
                <Edit className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {BTN_EDIT()}
              </Button>
            )}
            {config.id === 'chuyen-xe' && isDriver && driverReportMode && (
              <Button type="button" onClick={onEdit} className="h-8 px-3 text-xs bg-primary text-white shadow-sm hover:bg-primary/90">
                <ClipboardList className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                Báo cáo từng CT
              </Button>
            )}
            {canDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={onDelete}
                className="h-8 px-3 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 dark:hover:text-rose-400 border border-rose-200 hover:border-rose-300 dark:border-rose-800 dark:hover:border-rose-700"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                {BTN_DELETE()}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            {config.id === 'tai-xe' ? (
              <img
                src={String(row.avatar || getAvatarUrl(String(row.ho_ten ?? '')))}
                alt={String(row.ho_ten ?? '')}
                className="w-14 h-14 rounded-xl border-2 border-card shadow-md object-cover bg-card"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl border border-border bg-muted flex items-center justify-center text-muted-foreground shadow-sm">
                <Icon size={24} />
              </div>
            )}
            {config.statusKey && (
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm',
                  row[config.statusKey] === 'Đang hoạt động' || row[config.statusKey] === 'Đã duyệt'
                    ? 'bg-emerald-500'
                    : 'bg-muted-foreground/30',
                )}
              />
            )}
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate flex-1 min-w-0">{titleVal}</h2>
              {config.statusKey && (
                <div className="shrink-0">
                  <EnumBadge shape="pill" value={String(row[config.statusKey] ?? '')} config={statusBadgeConfig} />
                </div>
              )}
            </div>
            <p className="text-body-sm text-primary font-medium">{subtitleVal}</p>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        {sections.map((sec) => {
          const sectionFields = config.fields.filter((f) => sec.fields.includes(f.key));
          if (sectionFields.length === 0) return null;
          return (
            <DetailSection key={sec.title} title={sec.title} icon={sec.icon}>
              <DetailFieldGrid>
                {sectionFields.map((field) => (
                  <DetailField
                    key={field.key}
                    label={field.label}
                    icon={getFieldIcon(field.key)}
                    className={field.type === 'textarea' || field.fullWidth ? 'sm:col-span-2' : undefined}
                    value={
                      field.key === 'trang_thai' && config.id === 'chuyen-xe-ct' ? (
                        <EnumBadge shape="pill" value={String(row[field.key] ?? '')} config={executionBadgeConfig} />
                      ) : field.key === config.statusKey || field.key === 'phe_duyet' ? (
                        <EnumBadge shape="pill" value={String(row[field.key] ?? '')} config={approvalBadgeConfig} />
                      ) : (
                        resolveTransportValue(field.key, row[field.key], lookups)
                      )
                    }
                  />
                ))}
              </DetailFieldGrid>
            </DetailSection>
          );
        })}

        {config.id === 'chuyen-xe' ? (
          <TripDetailsSection
            parentRow={row}
            lookups={lookups}
            driverReportMode={driverReportMode}
            onAddChild={driverReportMode ? undefined : onAddChild}
            onEditChild={onEditChild}
            onDeleteChild={driverReportMode ? undefined : onDeleteChild}
            onViewChildDetail={onViewChildDetail}
          />
        ) : (
          relatedSections.map((section) => (
            <RelatedRowsTable key={section.title} section={section} lookups={lookups} />
          ))
        )}
      </div>
    </GenericDrawer>
  );
};

function numberToVietnameseWords(num: number): string {
  if (num === 0) return 'Không đồng';
  const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ', 'triệu tỷ'];
  const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

  const readGroup3 = (n: number, showZeroHundred: boolean): string => {
    const hundred = Math.floor(n / 100);
    const ten = Math.floor((n % 100) / 10);
    const unit = n % 10;
    let res = '';

    if (hundred > 0 || showZeroHundred) {
      res += digits[hundred] + ' trăm ';
    }
    if (ten > 0) {
      if (ten === 1) res += 'mười ';
      else res += digits[ten] + ' mươi ';
    } else if (hundred > 0 && unit > 0) {
      res += 'lẻ ';
    }

    if (unit > 0) {
      if (unit === 1 && ten > 1) res += 'mốt';
      else if (unit === 5 && ten > 0) res += 'lăm';
      else res += digits[unit];
    }
    return res.trim();
  };

  let words = '';
  let temp = Math.floor(Math.abs(num));
  let groupIdx = 0;

  while (temp > 0) {
    const group = temp % 1000;
    if (group > 0) {
      const showZero = temp >= 1000;
      const groupWords = readGroup3(group, showZero);
      words = groupWords + ' ' + units[groupIdx] + ' ' + words;
    } else if (groupIdx === 3 && temp > 0) {
      words = units[groupIdx] + ' ' + words;
    }
    temp = Math.floor(temp / 1000);
    groupIdx++;
  }

  let finalResult = words.trim().replace(/\s+/g, ' ');
  if (!finalResult) return 'Không đồng';
  
  finalResult = finalResult.charAt(0).toUpperCase() + finalResult.slice(1);
  return (num < 0 ? 'Âm ' : '') + finalResult + ' đồng';
}

const TransportModulePage: React.FC<TransportModulePageProps> = ({ config, showBack = true }) => {
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const capBac = usePermissionGrantStore((s) => s.capBac);
  const confirm = useConfirmStore((state) => state.confirm);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [columnSearch, setColumnSearch] = useState<Record<string, string>>(() => {
    const initialIdDiaDiem = searchParams.get('id_dia_diem');
    const init: Record<string, string> = {};
    if (initialIdDiaDiem) init.id_dia_diem = initialIdDiaDiem;
    return init;
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [sort, setSort] = useState<SortState>({ column: null, direction: null });
  const [columns, setColumns] = useState<ColumnConfig[]>(config.columns);
  const [editingRow, setEditingRow] = useState<TransportRow | null>(null);
  const [viewingRow, setViewingRow] = useState<TransportRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [driverReportMode, setDriverReportMode] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [nestedFormConfig, setNestedFormConfig] = useState<TransportModuleConfig | null>(null);
  const [nestedEditingRow, setNestedEditingRow] = useState<TransportRow | null>(null);
  const [nestedDriverReport, setNestedDriverReport] = useState(false);
  const [nestedPrefillData, setNestedPrefillData] = useState<Record<string, unknown> | null>(null);
  const [nestedViewingRow, setNestedViewingRow] = useState<TransportRow | null>(null);
  const [nestedViewingConfig, setNestedViewingConfig] = useState<TransportModuleConfig | null>(null);
  const [cloningPrefillData, setCloningPrefillData] = useState<Record<string, unknown> | null>(null);
  const [cloningTempChildRows, setCloningTempChildRows] = useState<any[] | null>(null);
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Record<string, string[]>>(() => {
    const initialIdDriver = searchParams.get('id_tai_xe');
    const initialIdVehicle = searchParams.get('id_xe');
    const initialTrangThai = config.id === 'chuyen-xe-ct' ? null : searchParams.get('trang_thai');
    return {
      hang_bang: [],
      trang_thai: initialTrangThai ? [initialTrangThai] : [],
      nhom: [],
      loai_xe: [],
      id_tai_xe: initialIdDriver ? [initialIdDriver] : [],
      id_xe: initialIdVehicle ? [initialIdVehicle] : [],
      id_dia_diem: [],
      phe_duyet: [],
    };
  });
  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilters({
      hang_bang: [],
      trang_thai: [],
      nhom: [],
      loai_xe: [],
      id_tai_xe: [],
      id_xe: [],
      id_dia_diem: [],
      phe_duyet: [],
    });
    setColumnSearch({});
    setPage(1);
  };
  const queryKey = useMemo(() => ['transport', config.id], [config.id]);
  const lookupQueryKey = ['transport', 'lookups'];
  const Icon = config.icon;

  const { data: rows = [], isLoading } = useQuery({
    queryKey,
    queryFn: () => getTransportRows(config),
  });

  const { data: lookups = EMPTY_TRANSPORT_LOOKUPS } = useQuery({
    queryKey: lookupQueryKey,
    queryFn: getTransportLookupRows,
  });

  const employeeRecord = useMemo(() => {
    if (!user || !lookups.employees) return null;
    return lookups.employees.find(
      (emp) =>
        (emp as any).ten_dang_nhap?.toLowerCase() === (user as any).ten_dang_nhap?.toLowerCase() ||
        (emp as any).email?.toLowerCase() === (user as any).email?.toLowerCase()
    ) || null;
  }, [user, lookups.employees]);

  const tripDetailsForCompletion = useMemo(
    () => (config.id === 'chuyen-xe' ? ((lookups.tripDetails || []) as TransportRow[]) : []),
    [config.id, lookups.tripDetails],
  );

  const currentViewingRow = useMemo(() => {
    if (!viewingRow) return null;
    return rows.find((r) => String(r.id) === String(viewingRow.id)) || viewingRow;
  }, [viewingRow, rows]);

  const currentNestedViewingRow = useMemo(() => {
    if (!nestedViewingRow || !nestedViewingConfig) return null;
    const lookupKey = nestedViewingConfig.id === 'chuyen-xe-ct' ? 'tripDetails' : null;
    if (!lookupKey || !lookups[lookupKey]) return nestedViewingRow;
    const list = lookups[lookupKey] as TransportRow[];
    return list.find((r) => String(r.id) === String(nestedViewingRow.id)) || nestedViewingRow;
  }, [nestedViewingRow, nestedViewingConfig, lookups]);

  const saveMutation = useMutation({
    mutationFn: (values: Record<string, unknown>) =>
      editingRow ? updateTransportRow(config, editingRow.id, values) : createTransportRow(config, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['transport'] });
      if (config.id === 'tai-xe') {
        void queryClient.invalidateQueries({ queryKey: ['employees'] });
        void queryClient.invalidateQueries({ queryKey: ['employee'] });
      }
      toast.success(
        driverReportMode && config.id === 'chuyen-xe'
          ? 'Đã lưu báo cáo chuyến'
          : editingRow
            ? `Đã cập nhật ${config.title}`
            : `Đã thêm ${config.title}`,
      );
      setShowForm(false);
      setDriverReportMode(false);
      setEditingRow(null);
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteTransportRows(config, ids),
    onSuccess: (_, ids) => {
      void queryClient.invalidateQueries({ queryKey: ['transport'] });
      setSelectedIds((current) => new Set([...current].filter((id) => !ids.includes(id))));
      if (viewingRow && ids.includes(viewingRow.id)) setViewingRow(null);
      toast.success(`Đã xóa ${ids.length} dòng`);
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });

  const statusMutation = useMutation({
    mutationFn: ({ ids, status, note, extraFields }: { ids: string[]; status: string; note?: string; extraFields?: Record<string, unknown> }) =>
      updateTransportStatus(config, ids, status, note, extraFields),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['transport'] });
      setSelectedIds(new Set());
      if (viewingRow && vars.ids.includes(viewingRow.id)) {
        setViewingRow((current) =>
          current
            ? {
                ...current,
                [config.statusKey ?? 'trang_thai']: vars.status,
                ...(vars.note !== undefined ? { ghi_chu: vars.note } : {}),
                ...(vars.extraFields ?? {}),
              }
            : null,
        );
      }
      toast.success(vars.note ? `Đã báo cáo & cập nhật trạng thái` : `Đã cập nhật trạng thái ${vars.ids.length} dòng`);
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });

  const approveMutation = useMutation({
    mutationFn: ({ ids, note, targetConfig = config }: { ids: string[]; note?: string; targetConfig?: TransportModuleConfig }) => approveTransportRows(targetConfig, ids, note),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['transport'] });
      setSelectedIds(new Set());
      toast.success(`Đã duyệt ${vars.ids.length} dòng`);
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ ids, note, targetConfig = config }: { ids: string[]; note?: string; targetConfig?: TransportModuleConfig }) => rejectTransportRows(targetConfig, ids, note),
    onSuccess: (_, vars) => {
      void queryClient.invalidateQueries({ queryKey: ['transport'] });
      setSelectedIds(new Set());
      toast.success(`Đã từ chối ${vars.ids.length} dòng`);
    },
    onError: (error: unknown) => toast.error(getErrorMessage(error)),
  });

  const askApprove = (ids: string[], targetConfig = config) => {
    const sourceRows = targetConfig.id === config.id
      ? rows
      : targetConfig.id === 'chuyen-xe-ct'
        ? ((lookups.tripDetails || []) as TransportRow[])
        : targetConfig.id === 'bang-luong'
          ? ((lookups.payroll || []) as TransportRow[])
          : targetConfig.id === 'chuyen-xe'
            ? ((lookups.trips || []) as TransportRow[])
            : rows;
    const approvableIds = ids.filter((id) => {
      const row = sourceRows.find((item) => String(item.id) === String(id));
      return row ? (canApproveRow(row, targetConfig.id, user, capBac, employeeRecord, lookups) && canApproveTransportRow(targetConfig, row)) : false;
    });
    if (approvableIds.length === 0) {
      toast.warning('Không có dòng cần duyệt');
      return;
    }

    if (targetConfig.id === 'chuyen-xe-ct') {
      const parentIds = [
        ...new Set(
          approvableIds
            .map((id) => sourceRows.find((item) => String(item.id) === String(id))?.id_chuyen_xe)
            .filter(Boolean)
            .map(String),
        ),
      ];
      if (parentIds.length === 0) {
        toast.warning('Không xác định được chuyến cha để duyệt');
        return;
      }
      askApprove(parentIds, TRANSPORT_MODULES.trips);
      return;
    }

    if (targetConfig.id === 'chuyen-xe') {
      const parentRows = approvableIds
        .map((id) => sourceRows.find((item) => String(item.id) === String(id)))
        .filter(Boolean) as TransportRow[];
      const childRows = ((lookups.tripDetails || []) as TransportRow[]).filter((child) =>
        approvableIds.includes(String(child.id_chuyen_xe)),
      );
      if (childRows.length === 0) {
        toast.warning('Chuyến xe chưa có dòng CT để duyệt');
        return;
      }

      let subtitle = `${parentRows.length} chuyến xe · cascade ${childRows.length} dòng CT`;
      let initialStatus = 'Đã duyệt';
      let initialNote = String(parentRows[0]?.ghi_chu || '');
      if (parentRows.length === 1) {
        const row = parentRows[0];
        subtitle = `Chuyến xe ngày ${resolveTransportValue('ngay', row.ngay, lookups)}`;
        initialStatus = String(row.trang_thai || 'Đã duyệt');
        initialNote = String(row.ghi_chu || '');
      }
      const currentValues = { status: initialStatus, note: initialNote };
      confirm({
        title: 'Quản lý duyệt chuyến',
        subtitle,
        variant: 'success',
        size: 'MEDIUM',
        confirmText: 'Cập nhật duyệt',
        cancelText: 'Đóng',
        message: (
          <ApprovalFormDialog
            subtitle={subtitle}
            initialStatus={currentValues.status}
            initialNote={currentValues.note}
            onValuesChange={(status, note) => {
              currentValues.status = status;
              currentValues.note = note;
            }}
          />
        ),
        onConfirm: async () => {
          const note = currentValues.note.trim() || undefined;
          const status = currentValues.status;
          try {
            await Promise.all(
              parentRows.map((parent) =>
                status === 'Đã duyệt'
                  ? approveTransportRows(TRANSPORT_MODULES.trips, [String(parent.id)], note)
                  : rejectTransportRows(TRANSPORT_MODULES.trips, [String(parent.id)], note),
              ),
            );
            setSelectedIds(new Set());
            void queryClient.invalidateQueries({ queryKey: ['transport'] });
            toast.success(`Đã cập nhật duyệt ${parentRows.length} chuyến · ${childRows.length} dòng CT`);
          } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
          }
        },
      });
      return;
    }

    let subtitle = targetConfig.title;
    let initialStatus = 'Đã duyệt';
    let initialNote = '';
    if (approvableIds.length === 1) {
      const row = sourceRows.find((item) => String(item.id) === String(approvableIds[0]));
      if (row) {
        initialStatus = String(targetConfig.id === 'chuyen-xe-ct' ? (row.phe_duyet || 'Đã duyệt') : (row.trang_thai || 'Đã duyệt'));

        initialNote = String(row.ghi_chu || '');
        if (targetConfig.id === 'chuyen-xe') {
          subtitle = `Chuyến xe ngày ${resolveTransportValue('ngay', row.ngay, lookups)}`;
        } else if (targetConfig.id === 'bang-luong') {
          const driverName = resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
          subtitle = `Bảng lương tháng ${row.thang}/${row.nam} - ${driverName}`;
        } else if (targetConfig.id === 'chuyen-xe-ct') {
          const locationName = resolveTransportValue('id_dia_diem', row.id_dia_diem, lookups);
          const groupName = resolveLocationGroup(row.id_dia_diem, lookups);
          subtitle = `Nhóm: ${groupName} · ${locationName}`;
        } else {
          subtitle = `${targetConfig.title}`;
        }
      }
    }
    const currentValues = { status: initialStatus, note: initialNote };
    confirm({
      title: 'Quản lý duyệt',
      subtitle: subtitle,
      variant: 'success',
      confirmText: 'Xác nhận',
      cancelText: 'Đóng',
      message: (
        <ApprovalFormDialog
          subtitle={subtitle}
          initialStatus={initialStatus}
          initialNote={initialNote}
          onValuesChange={(status, note) => {
            currentValues.status = status;
            currentValues.note = note;
          }}
        />
      ),
      onConfirm: async () => {
        if (currentValues.status === 'Đã duyệt') {
          await approveMutation.mutateAsync({ ids: approvableIds, note: currentValues.note, targetConfig });
        } else {
          await rejectMutation.mutateAsync({ ids: approvableIds, note: currentValues.note, targetConfig });
        }
      },
    });
  };

  const askStatusChange = (ids: string[], status: string) => {
    let title = 'Thay đổi trạng thái';
    let message = `Bạn chắc chắn muốn cập nhật trạng thái cho ${ids.length} dòng đã chọn?`;
    let variant: 'info' | 'danger' = 'info';

    if (status === 'Hủy') {
      title = 'Hủy chuyến xe';
      message = `Bạn chắc chắn muốn hủy ${ids.length} chuyến xe đã chọn?`;
      variant = 'danger';
    } else if (status === 'Đang hoạt động') {
      title = 'Kích hoạt hoạt động';
      message = `Bạn chắc chắn muốn kích hoạt hoạt động cho ${ids.length} dòng đã chọn?`;
    } else if (status === 'Ngừng hoạt động') {
      title = 'Ngừng hoạt động';
      message = `Bạn chắc chắn muốn ngừng hoạt động ${ids.length} dòng đã chọn?`;
      variant = 'danger';
    }

    confirm({
      title,
      message,
      variant,
      confirmText: 'Đồng ý',
      onConfirm: async () => statusMutation.mutate({ ids, status }),
    });
  };

  // Tài xế đăng nhập: id nhân viên của chính mình, để prefill form thêm chuyến.
  const driverSelfId = useMemo(
    () =>
      user?.la_tai_xe && user?.role !== 'admin' && (employeeRecord as any)?.id != null
        ? String((employeeRecord as any).id)
        : null,
    [user?.la_tai_xe, user?.role, employeeRecord],
  );

  const permittedRows = useMemo(() => {
    return filterRowsByPermissions(rows, config, user, capBac, employeeRecord, lookups);
  }, [rows, config, user, capBac, employeeRecord, lookups]);

  const filteredRows = useMemo(() => {
    return permittedRows.filter((row) => {
      if (!matchesRow(config, row, searchTerm, lookups)) return false;
      for (const [key, selectedVals] of Object.entries(filters)) {
        if (selectedVals.length > 0) {
          const cellVal = String(row[key] ?? '');
          if (!selectedVals.includes(cellVal)) {
            return false;
          }
        }
      }
      for (const [colId, searchVal] of Object.entries(columnSearch)) {
        if (searchVal) {
          const cellVal = String(row[colId] ?? '');
          const resolved = resolveTransportValue(colId, row[colId], lookups);
          const matchNeedle = searchVal.trim().toLowerCase();
          if (!`${cellVal} ${resolved}`.toLowerCase().includes(matchNeedle)) {
            return false;
          }
        }
      }
      return true;
    }).sort((a, b) => compareRows(a, b, sort));
  }, [permittedRows, config, searchTerm, sort, lookups, filters, columnSearch]);

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((acc, current) => acc + (current.length > 0 ? 1 : 0), 0);
  }, [filters]);

  const filterItems = useMemo(() => {
    const items = [];
    if (config.id === 'tai-xe') {
      const hangBangOptions = Array.from(new Set(rows.map(r => String(r.hang_bang ?? '')).filter(Boolean))).map(val => ({
        label: val,
        value: val,
        count: rows.filter(r => String(r.hang_bang) === val).length,
      }));
      items.push({
        id: 'hang_bang',
        active: filters.hang_bang.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Hạng bằng"
            options={hangBangOptions}
            value={filters.hang_bang}
            onChange={(val) => setFilters(prev => ({ ...prev, hang_bang: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const statusOptions = STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      items.push({
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Trạng thái"
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilters(prev => ({ ...prev, trang_thai: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
    } else if (config.id === 'dia-diem') {
      const nhomOptions = Array.from(new Set(rows.map(r => String(r.nhom ?? '')).filter(Boolean))).map(val => ({
        label: val,
        value: val,
        count: rows.filter(r => String(r.nhom) === val).length,
      }));
      items.push({
        id: 'nhom',
        active: filters.nhom.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Nhóm tuyến"
            options={nhomOptions}
            value={filters.nhom}
            onChange={(val) => setFilters(prev => ({ ...prev, nhom: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const statusOptions = STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      items.push({
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Trạng thái"
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilters(prev => ({ ...prev, trang_thai: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
    } else if (config.id === 'danh-sach-xe') {
      const loaiXeOptions = Array.from(new Set(rows.map(r => String(r.loai_xe ?? '')).filter(Boolean))).map(val => ({
        label: val,
        value: val,
        count: rows.filter(r => String(r.loai_xe) === val).length,
      }));
      items.push({
        id: 'loai_xe',
        active: filters.loai_xe.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Loại xe"
            options={loaiXeOptions}
            value={filters.loai_xe}
            onChange={(val) => setFilters(prev => ({ ...prev, loai_xe: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const statusOptions = STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      items.push({
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Trạng thái"
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilters(prev => ({ ...prev, trang_thai: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
    } else if (config.id === 'chuyen-xe') {
      const driverOpts = getRelationOptions('drivers', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_tai_xe) === opt.value).length,
      }));
      items.push({
        id: 'id_tai_xe',
        active: filters.id_tai_xe.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Tài xế"
            options={driverOpts}
            value={filters.id_tai_xe}
            onChange={(val) => setFilters(prev => ({ ...prev, id_tai_xe: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const vehicleOpts = getRelationOptions('vehicles', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_xe) === opt.value).length,
      }));
      items.push({
        id: 'id_xe',
        active: filters.id_xe.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Xe"
            options={vehicleOpts}
            value={filters.id_xe}
            onChange={(val) => setFilters(prev => ({ ...prev, id_xe: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const tripStatusOpts = APPROVAL_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      items.push({
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Trạng thái"
            options={tripStatusOpts}
            value={filters.trang_thai}
            onChange={(val) => setFilters(prev => ({ ...prev, trang_thai: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
    } else if (config.id === 'bang-luong') {
      const driverOpts = getRelationOptions('drivers', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_tai_xe) === opt.value).length,
      }));
      items.push({
        id: 'id_tai_xe',
        active: filters.id_tai_xe.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Tài xế"
            options={driverOpts}
            value={filters.id_tai_xe}
            onChange={(val) => setFilters(prev => ({ ...prev, id_tai_xe: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const payrollStatusOpts = PAYROLL_STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      items.push({
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Trạng thái"
            options={payrollStatusOpts}
            value={filters.trang_thai}
            onChange={(val) => setFilters(prev => ({ ...prev, trang_thai: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
    } else if (config.id === 'chuyen-xe-ct') {
      const locationOpts = getRelationOptions('locations', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_dia_diem) === opt.value).length,
      }));
      items.push({
        id: 'id_dia_diem',
        active: filters.id_dia_diem.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Địa điểm"
            options={locationOpts}
            value={filters.id_dia_diem}
            onChange={(val) => setFilters(prev => ({ ...prev, id_dia_diem: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const executionOpts = EXECUTION_STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      items.push({
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Thực hiện"
            options={executionOpts}
            value={filters.trang_thai}
            onChange={(val) => setFilters(prev => ({ ...prev, trang_thai: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
      const approvalOpts = APPROVAL_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.phe_duyet) === opt.value).length,
      }));
      items.push({
        id: 'phe_duyet',
        active: filters.phe_duyet.length > 0,
        renderChip: (layout: 'inline' | 'menu') => (
          <FilterChipMultiSelect
            placeholder="Phê duyệt"
            options={approvalOpts}
            value={filters.phe_duyet}
            onChange={(val) => setFilters(prev => ({ ...prev, phe_duyet: val }))}
            className={layout === 'inline' ? 'w-[148px]' : 'w-full'}
          />
        )
      });
    }
    return items;
  }, [config.id, rows, filters, lookups]);

  const filterGroups = useMemo(() => {
    const groups = [];
    if (config.id === 'tai-xe') {
      const hangBangOptions = Array.from(new Set(rows.map(r => String(r.hang_bang ?? '')).filter(Boolean))).map(val => ({
        label: val,
        value: val,
        count: rows.filter(r => String(r.hang_bang) === val).length,
      }));
      groups.push({
        key: 'hang_bang',
        label: 'Hạng bằng',
        icon: CreditCard,
        options: hangBangOptions,
        value: filters.hang_bang,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, hang_bang: val })),
      });
      const statusOptions = STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      groups.push({
        key: 'trang_thai',
        label: 'Trạng thái',
        icon: Tag,
        options: statusOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, trang_thai: val })),
      });
    } else if (config.id === 'dia-diem') {
      const nhomOptions = Array.from(new Set(rows.map(r => String(r.nhom ?? '')).filter(Boolean))).map(val => ({
        label: val,
        value: val,
        count: rows.filter(r => String(r.nhom) === val).length,
      }));
      groups.push({
        key: 'nhom',
        label: 'Nhóm tuyến',
        icon: Layers,
        options: nhomOptions,
        value: filters.nhom,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, nhom: val })),
      });
      const statusOptions = STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      groups.push({
        key: 'trang_thai',
        label: 'Trạng thái',
        icon: Tag,
        options: statusOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, trang_thai: val })),
      });
    } else if (config.id === 'danh-sach-xe') {
      const loaiXeOptions = Array.from(new Set(rows.map(r => String(r.loai_xe ?? '')).filter(Boolean))).map(val => ({
        label: val,
        value: val,
        count: rows.filter(r => String(r.loai_xe) === val).length,
      }));
      groups.push({
        key: 'loai_xe',
        label: 'Loại xe',
        icon: Car,
        options: loaiXeOptions,
        value: filters.loai_xe,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, loai_xe: val })),
      });
      const statusOptions = STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      groups.push({
        key: 'trang_thai',
        label: 'Trạng thái',
        icon: Tag,
        options: statusOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, trang_thai: val })),
      });
    } else if (config.id === 'chuyen-xe') {
      const driverOpts = getRelationOptions('drivers', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_tai_xe) === opt.value).length,
      }));
      groups.push({
        key: 'id_tai_xe',
        label: 'Tài xế',
        icon: User,
        options: driverOpts,
        value: filters.id_tai_xe,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, id_tai_xe: val })),
      });
      const vehicleOpts = getRelationOptions('vehicles', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_xe) === opt.value).length,
      }));
      groups.push({
        key: 'id_xe',
        label: 'Xe',
        icon: Car,
        options: vehicleOpts,
        value: filters.id_xe,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, id_xe: val })),
      });
      const tripStatusOpts = APPROVAL_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      groups.push({
        key: 'trang_thai',
        label: 'Phê duyệt',
        icon: Tag,
        options: tripStatusOpts,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, trang_thai: val })),
      });
    } else if (config.id === 'bang-luong') {
      const driverOpts = getRelationOptions('drivers', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_tai_xe) === opt.value).length,
      }));
      groups.push({
        key: 'id_tai_xe',
        label: 'Tài xế',
        icon: User,
        options: driverOpts,
        value: filters.id_tai_xe,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, id_tai_xe: val })),
      });
      const payrollStatusOpts = PAYROLL_STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      groups.push({
        key: 'trang_thai',
        label: 'Phê duyệt',
        icon: Tag,
        options: payrollStatusOpts,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, trang_thai: val })),
      });
    } else if (config.id === 'chuyen-xe-ct') {
      const locationOpts = getRelationOptions('locations', lookups).map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.id_dia_diem) === opt.value).length,
      }));
      groups.push({
        key: 'id_dia_diem',
        label: 'Địa điểm',
        icon: MapPin,
        options: locationOpts,
        value: filters.id_dia_diem,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, id_dia_diem: val })),
      });
      const executionOpts = EXECUTION_STATUS_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.trang_thai) === opt.value).length,
      }));
      groups.push({
        key: 'trang_thai',
        label: 'Thực hiện',
        icon: Activity,
        options: executionOpts,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, trang_thai: val })),
      });
      const approvalOpts = APPROVAL_OPTIONS.map(opt => ({
        label: opt.label,
        value: opt.value,
        count: rows.filter(r => String(r.phe_duyet) === opt.value).length,
      }));
      groups.push({
        key: 'phe_duyet',
        label: 'Phê duyệt',
        icon: Scale,
        options: approvalOpts,
        value: filters.phe_duyet,
        onChange: (val: string[]) => setFilters(prev => ({ ...prev, phe_duyet: val })),
      });
    }
    return groups;
  }, [config.id, rows, filters, lookups]);

  const exportColumns = useMemo(
    () => columns.filter((c) => c.id !== 'actions').map((c) => ({ key: c.id, label: c.label })),
    [columns]
  );

  const exportMapFn = useCallback(
    (row: TransportRow) => {
      const activeCols = columns.filter((c) => c.id !== 'actions');
      return Object.fromEntries(
        activeCols.map((c) => {
          if (c.id === 'ct_hoan_thanh') {
            return [
              c.id,
              formatTripCtCompletionStats(getTripCtCompletionStats(String(row.id), tripDetailsForCompletion)),
            ];
          }
          return [c.id, resolveTransportValue(c.id, row[c.id], lookups)];
        }),
      );
    },
    [columns, lookups, tripDetailsForCompletion],
  );

  const { exportData, paginatedData: paginatedExportData, selectedData: selectedExportData } =
    useExportData({
      data: filteredRows,
      isOpen: showExport,
      mapFn: exportMapFn,
      pagination: { page, pageSize },
      selectedIds,
      keyExtractor: (row) => row.id,
    });

  const visibleColumnKeys = useMemo(
    () => columns.filter((c) => c.visible).map((c) => c.id),
    [columns]
  );

  const selectedCount = selectedIds.size;

  const selectedSingleRow = useMemo(() => {
    if (selectedCount !== 1) return null;
    return rows.find((r) => selectedIds.has(String(r.id))) ?? null;
  }, [selectedCount, selectedIds, rows]);

  const canEditSelected = useMemo(() => {
    if (selectedCount !== 1) return false;
    const singleId = [...selectedIds][0];
    const row = rows.find((r) => String(r.id) === String(singleId));
    return row ? canEditRow(row, config.id, user, capBac, employeeRecord, lookups) : false;
  }, [selectedCount, selectedIds, rows, config.id, user, capBac, employeeRecord, lookups]);

  const canStatusSelected = useMemo(() => {
    if (selectedIds.size === 0) return false;
    const list = Array.from(selectedIds);
    const rowsToChange = rows.filter((r) => list.map(String).includes(String(r.id)));
    return rowsToChange.every((row) => canEditRow(row, config.id, user, capBac, employeeRecord, lookups));
  }, [selectedIds, rows, config.id, user, capBac, employeeRecord, lookups]);

  const canApproveSelected = useMemo(() => {
    if (selectedIds.size === 0) return false;
    const list = Array.from(selectedIds);
    const rowsToApprove = rows.filter((r) => list.map(String).includes(String(r.id)));
    return rowsToApprove.every((row) => canApproveRow(row, config.id, user, capBac, employeeRecord, lookups) && canApproveTransportRow(config, row));
  }, [selectedIds, rows, config.id, user, capBac, employeeRecord, lookups]);

  const canDeleteSelected = useMemo(() => {
    if (selectedIds.size === 0) return false;
    const list = Array.from(selectedIds);
    const rowsToDelete = rows.filter((r) => list.map(String).includes(String(r.id)));
    return rowsToDelete.every((row) => canDeleteRow(row, config.id, user, capBac, employeeRecord, lookups));
  }, [selectedIds, rows, config.id, user, capBac, employeeRecord, lookups]);

  const isDriverAccount =
    (config.id === 'chuyen-xe' || config.id === 'chuyen-xe-ct') &&
    (lookups?.drivers || []).some((d: { id: unknown }) => String(d.id) === String(employeeRecord?.id)) &&
    user?.role !== 'admin';

  const driverOwnsTrip = useCallback(
    (tripId: unknown) => {
      const trip = (lookups.trips || []).find((item) => String(item.id) === String(tripId));
      return trip ? String(trip.id_tai_xe) === String(employeeRecord?.id) : false;
    },
    [lookups.trips, employeeRecord?.id],
  );

  const canDriverReportTrip = useCallback(
    (tripRow: TransportRow) => {
      if (!isDriverAccount || config.id !== 'chuyen-xe') return false;
      if (String(tripRow.id_tai_xe) !== String(employeeRecord?.id)) return false;
      const children = tripDetailsForCompletion.filter((d) => String(d.id_chuyen_xe) === String(tripRow.id));
      return children.some((child) => canDriverReportCt(child));
    },
    [isDriverAccount, config.id, employeeRecord?.id, tripDetailsForCompletion],
  );

  const canDriverReportCtRow = useCallback(
    (ctRow: TransportRow) => {
      if (!isDriverAccount || config.id !== 'chuyen-xe-ct') return false;
      return driverOwnsTrip(ctRow.id_chuyen_xe) && canDriverReportCt(ctRow);
    },
    [isDriverAccount, config.id, driverOwnsTrip],
  );

  const askDriverCtReport = useCallback(
    (ctRow: TransportRow) => {
      if (!canDriverReportCt(ctRow)) {
        toast.warning('Dòng CT đã khóa duyệt, không thể báo cáo');
        return;
      }
      const locationLabel = resolveCtLocationLabel(ctRow, lookups);
      const currentValues: DriverCtReportValues = {
        trang_thai:
          normalizeExecutionStatus(ctRow.trang_thai) === 'Chưa thực hiện'
            ? 'Đã thực hiện'
            : normalizeExecutionStatus(ctRow.trang_thai),
        chi_phi: Number(ctRow.chi_phi) || 0,
        ghi_chu: String(ctRow.ghi_chu ?? ''),
      };

      confirm({
        title: 'Báo cáo chi tiết chuyến (CT)',
        subtitle: locationLabel,
        variant: 'info',
        size: 'MEDIUM',
        confirmText: 'Lưu báo cáo',
        cancelText: 'Đóng',
        message: (
          <DriverCtReportDialog
            locationLabel={locationLabel}
            tienLuong={Number(ctRow.tien_luong) || 0}
            initialValues={currentValues}
            onValuesChange={(values) => {
              currentValues.trang_thai = values.trang_thai;
              currentValues.chi_phi = values.chi_phi;
              currentValues.ghi_chu = values.ghi_chu;
            }}
          />
        ),
        onConfirm: async () => {
          try {
            await updateTransportRow(TRANSPORT_MODULES.tripDetails, String(ctRow.id), currentValues);
            void queryClient.invalidateQueries({ queryKey: ['transport'] });
            toast.success('Đã lưu báo cáo chi tiết chuyến');
          } catch (error) {
            toast.error(getErrorMessage(error));
            throw error;
          }
        },
      });
    },
    [confirm, lookups, queryClient],
  );

  const askDriverCtReportPicker = useCallback(
    (tripRow: TransportRow, reportable: TransportRow[]) => {
      const selection = { ctId: String(reportable[0]?.id ?? '') };
      const tripDate = resolveTransportValue('ngay', tripRow.ngay, lookups);
      const driverName = resolveTransportValue('id_tai_xe', tripRow.id_tai_xe, lookups);

      confirm({
        title: 'Chọn chi tiết chuyến (CT)',
        subtitle: `${tripDate} · ${driverName}`,
        variant: 'info',
        size: 'MEDIUM',
        confirmText: 'Tiếp tục',
        cancelText: 'Đóng',
        message: (
          <DriverCtPickerDialog
            reportableRows={reportable}
            lookups={lookups}
            selectedCtId={selection.ctId}
            onSelectedCtIdChange={(ctId) => {
              selection.ctId = ctId;
            }}
          />
        ),
        onConfirm: async () => {
          const ctRow = reportable.find((row) => String(row.id) === selection.ctId);
          if (!ctRow) {
            toast.error('Vui lòng chọn dòng CT cần báo cáo');
            throw new Error('missing_ct_selection');
          }
          queueMicrotask(() => askDriverCtReport(ctRow));
        },
      });
    },
    [confirm, lookups, askDriverCtReport],
  );

  /** Báo cáo theo từng CT (R3): chọn CT trước khi popup TH+chi phí. */
  const openDriverTripCtReport = useCallback(
    (tripRow: TransportRow) => {
      if (!canDriverReportTrip(tripRow)) {
        toast.warning('Không còn dòng CT nào cần báo cáo trên chuyến này');
        return;
      }
      const reportable = getReportableCtRowsForTrip(tripRow.id, tripDetailsForCompletion);
      if (reportable.length === 0) {
        toast.warning('Không còn dòng CT nào cần báo cáo trên chuyến này');
        return;
      }
      if (!shouldPickCtBeforeReport(reportable.length)) {
        askDriverCtReport(reportable[0]);
        return;
      }
      askDriverCtReportPicker(tripRow, reportable);
    },
    [canDriverReportTrip, tripDetailsForCompletion, askDriverCtReport, askDriverCtReportPicker],
  );

  /** Mọi điểm vào báo cáo tài xế (toolbar, dòng, drawer) dùng chung luồng này. */
  const handleDriverReportEntry = useCallback(
    (row: TransportRow) => {
      const isCtRow = row.id_chuyen_xe != null && String(row.id_chuyen_xe) !== '';
      if (isCtRow && isDriverAccount && driverOwnsTrip(row.id_chuyen_xe) && canDriverReportCt(row)) {
        askDriverCtReport(row);
        return;
      }
      if (config.id === 'chuyen-xe' && canDriverReportTrip(row)) {
        openDriverTripCtReport(row);
        return;
      }
      toast.warning('Không thể báo cáo dòng này');
    },
    [
      isDriverAccount,
      driverOwnsTrip,
      config.id,
      canDriverReportTrip,
      askDriverCtReport,
      openDriverTripCtReport,
    ],
  );

  const driverReportSelectedRow = useMemo(() => {
    if (!selectedSingleRow || !isDriverAccount) return false;
    if (config.id === 'chuyen-xe') return canDriverReportTrip(selectedSingleRow);
    if (config.id === 'chuyen-xe-ct') return canDriverReportCtRow(selectedSingleRow);
    return false;
  }, [selectedSingleRow, isDriverAccount, config.id, canDriverReportTrip, canDriverReportCtRow]);

  const handleBulkEdit = useCallback(() => {
    if (!selectedSingleRow) return;
    if (driverReportSelectedRow) {
      handleDriverReportEntry(selectedSingleRow);
      return;
    }
    if (isRowLockedForUser(selectedSingleRow, config.id, user, capBac, lookups)) {
      toast.warning(config.lockedReason ?? 'Dòng đang bị khóa');
      return;
    }
    setDriverReportMode(false);
    setCloningPrefillData(null);
    setCloningTempChildRows(null);
    setEditingRow(selectedSingleRow);
    setShowForm(true);
  }, [
    selectedSingleRow,
    driverReportSelectedRow,
    handleDriverReportEntry,
    config,
    user,
    capBac,
    lookups,
  ]);

  const bulkStatusActions = useMemo(() => {
    if (selectedCount === 0) return null;

    return (
      <>
        {canEditSelected && !driverReportSelectedRow && (
          <button
            type="button"
            onClick={handleBulkEdit}
            className="h-8 px-3 flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg border border-primary/20 active:scale-95 transition-all"
            aria-label="Chỉnh sửa dòng"
          >
            <Edit size={14} className="stroke-[2.5px] shrink-0" />
            <span className="text-xs font-medium">Sửa 1 dòng</span>
          </button>
        )}
        {config.statusKey && config.id !== 'bang-luong' && config.id !== 'chuyen-xe' && config.id !== 'chuyen-xe-ct' && canStatusSelected && (
          <>
            <button
              type="button"
              onClick={() => askStatusChange([...selectedIds], 'Đang hoạt động')}
              className="h-8 px-3 flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg border border-primary/20 active:scale-95 transition-all"
            >
              <Check size={14} className="stroke-[2.5px] shrink-0" />
              <span className="text-xs font-medium">Kích hoạt</span>
            </button>
            <button
              type="button"
              onClick={() => askStatusChange([...selectedIds], 'Ngừng hoạt động')}
              className="h-8 px-3 flex items-center gap-1.5 text-muted-foreground bg-muted/50 hover:bg-muted rounded-lg border border-border active:scale-95 transition-all"
            >
              <Power size={14} className="stroke-[2.5px] shrink-0" />
              <span className="text-xs font-medium">Ngừng hoạt động</span>
            </button>
          </>
        )}
        {(config.id === 'bang-luong' || config.id === 'chuyen-xe') && canApproveSelected && (
          <button
            type="button"
            onClick={() => askApprove([...selectedIds])}
            className="h-8 px-3 flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg border border-primary/20 active:scale-95 transition-all"
          >
            <CheckCircle2 size={14} className="stroke-[2.5px] shrink-0" />
            <span className="text-xs font-medium">Quản lý duyệt</span>
          </button>
        )}
        {driverReportSelectedRow && selectedSingleRow && (
          <button
            type="button"
            onClick={() => handleDriverReportEntry(selectedSingleRow)}
            className="h-8 px-3 flex items-center gap-1.5 text-primary bg-primary/10 hover:bg-primary/15 rounded-lg border border-primary/20 active:scale-95 transition-all"
          >
            <ClipboardList size={14} className="stroke-[2.5px] shrink-0" />
            <span className="text-xs font-medium">Báo cáo CT</span>
          </button>
        )}
      </>
    );
  }, [
    selectedCount,
    selectedIds,
    rows,
    config,
    askStatusChange,
    askApprove,
    handleBulkEdit,
    canEditSelected,
    canStatusSelected,
    canApproveSelected,
    driverReportSelectedRow,
    selectedSingleRow,
    handleDriverReportEntry,
  ]);

  const handlePrintSinglePayroll = useCallback(async (row: TransportRow) => {
    const { companyName, companyPhone, companyEmail, companyAddress } = getCompanyPrintInfo();

    const driver = (lookups?.drivers || []).find((d) => String(d.id) === String(row.id_tai_xe));
    const driverName = driver?.ho_ten || driver?.ho_va_ten || resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
    const driverPhone = driver?.so_dien_thoai || '—';
    const driverEmail = driver?.email || '—';
    const driverGplx = driver?.so_gplx || '—';
    const driverHang = driver?.hang_bang || '—';
    const driverVehicleId = driver?.id_xe_mac_dinh;
    const driverVehicle = driverVehicleId
      ? resolveTransportValue('id_xe_mac_dinh', driverVehicleId, lookups)
      : '—';

    const year = Number(row.nam);
    const month = Number(row.thang);
    const driverTrips = (lookups?.trips || []).filter((trip) => {
      const date = String(trip.ngay ?? '');
      if (!date) return false;
      const parts = date.split(/[-T]/);
      if (parts.length < 2) return false;
      const tripYear = Number(parts[0]);
      const tripMonth = Number(parts[1]);
      return (
        String(trip.id_tai_xe) === String(row.id_tai_xe) &&
        tripYear === year &&
        tripMonth === month &&
        trip.trang_thai === 'Đã duyệt'
      );
    });

    const getVehicleLicense = (idXe: unknown) => {
      const v = (lookups?.vehicles || []).find((veh) => String(veh.id) === String(idXe));
      return v ? `${v.bien_so}` : '—';
    };

    let tripsHtml = '';
    if (driverTrips.length === 0) {
      tripsHtml = `
        <tr>
          <td colspan="6" class="text-center" style="color: #64748b; padding: 12px; font-style: italic;">Không có chuyến xe nào được ghi nhận trong kỳ lương này.</td>
        </tr>
      `;
    } else {
      driverTrips.forEach((trip) => {
        const dateObj = trip.ngay ? new Date(trip.ngay as any) : null;
        const ngayDinhDang = dateObj ? dateObj.toLocaleDateString('vi-VN') : '—';
        const xeDinhDang = getVehicleLicense(trip.id_xe);
        
        // Chỉ tính tổng chi tiết chuyến xe đã duyệt
        const tripDetails = (lookups?.tripDetails || []).filter(
          (d) => String(d.id_chuyen_xe) === String(trip.id) && isCtEligibleForPayroll(d),
        );
        const soChuyen = tripDetails.length;
        const tongTienLuong = tripDetails.reduce((sum, d) => sum + (Number(d.tien_luong) || 0), 0);
        const tongPhi = tripDetails.reduce((sum, d) => sum + (Number(d.chi_phi) || 0), 0);

        const luongChuyen = new Intl.NumberFormat('vi-VN').format(tongTienLuong) + ' đ';
        const chiPhi = new Intl.NumberFormat('vi-VN').format(tongPhi) + ' đ';
        const ghiChu = escapeHtml(trip.ghi_chu || '—');
        
        tripsHtml += `
          <tr>
            <td class="text-center">${ngayDinhDang}</td>
            <td class="text-center font-semibold" style="color: #1e3a8a;">${xeDinhDang}</td>
            <td class="text-center font-semibold">${soChuyen}</td>
            <td class="text-right font-semibold">${luongChuyen}</td>
            <td class="text-right">${chiPhi}</td>
            <td style="color: #475569;">${ghiChu}</td>
          </tr>
        `;
      });
    }

    const tongLuongChuyen = Number(row.tong_luong_chuyen) || 0;
    const tongChiPhiChuyen = Number(row.tong_chi_phi_chuyen) || 0;
    const tongChiPhiKhac = Number(row.tong_chi_phi_khac) || 0;
    const truTienKhac = Number(row.tru_tien_khac) || 0;
    const thucLinh = Number(row.tong_con_lai) || 0;
    const tongThanhToan = thucLinh + tongChiPhiChuyen + tongChiPhiKhac;
    const thucLinhBangChu = numberToVietnameseWords(tongThanhToan);

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      toast.error('Không mở được cửa sổ in');
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Phiếu lương tài xế - ${escapeHtml(driverName)} - Tháng ${month}/${year}</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; background: #fff; }
              .no-print { display: none !important; }
            }
            @page {
              size: A4 portrait;
              margin: 15mm 15mm 15mm 15mm;
            }
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              line-height: 1.4;
              padding: 24px;
              margin: 0;
              background-color: #f8fafc;
            }
            .print-container {
              max-width: 800px;
              margin: 0 auto;
              background: #fff;
              padding: 30px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 8px;
            }
            @media print {
              .print-container {
                box-shadow: none;
                border-radius: 0;
                padding: 0;
                max-width: 100%;
              }
              body {
                background-color: #fff;
                padding: 0;
              }
            }
            .toolbar {
              max-width: 800px;
              margin: 0 auto 20px;
              display: flex;
              justify-content: flex-end;
              gap: 12px;
              background: #fff;
              padding: 12px 24px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 6px 16px;
              font-size: 13px;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
              border: 1px solid transparent;
              transition: all 0.15s ease;
              text-decoration: none;
            }
            .btn-primary {
              background-color: #0f172a;
              color: #fff;
            }
            .btn-primary:hover {
              background-color: #1e293b;
            }
            .btn-secondary {
              background-color: #fff;
              border-color: #cbd5e1;
              color: #334155;
            }
            .btn-secondary:hover {
              background-color: #f8fafc;
            }
            .header-grid {
              display: grid;
              grid-template-columns: 2fr 1fr;
              border-bottom: 2px solid #0f172a;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .company-name {
              font-size: 15px;
              font-weight: 700;
              color: #0f172a;
              text-transform: uppercase;
              margin-bottom: 4px;
            }
            .company-info {
              font-size: 11px;
              color: #475569;
            }
            .doc-meta {
              text-align: right;
              font-size: 11px;
              color: #64748b;
              align-self: end;
            }
            .title-section {
              text-align: center;
              margin-bottom: 24px;
            }
            .doc-title {
              font-size: 20px;
              font-weight: 800;
              color: #0f172a;
              margin: 0 0 4px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .doc-subtitle {
              font-size: 13px;
              color: #475569;
              font-weight: 600;
            }
            .info-section {
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              padding: 12px 16px;
              margin-bottom: 24px;
            }
            .info-title {
              font-size: 12px;
              font-weight: 700;
              color: #334155;
              margin-top: 0;
              margin-bottom: 8px;
              text-transform: uppercase;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 4px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 8px 24px;
              font-size: 12px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              border-bottom: 1px dashed #f1f5f9;
              padding-bottom: 2px;
            }
            .info-label {
              color: #64748b;
            }
            .info-value {
              color: #0f172a;
              font-weight: 600;
            }
            .table-title {
              font-size: 12px;
              font-weight: 700;
              color: #334155;
              margin-bottom: 8px;
              text-transform: uppercase;
              letter-spacing: 0.3px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              font-size: 11px;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: left;
            }
            th {
              background-color: #f8fafc;
              color: #334155;
              font-weight: 700;
              text-transform: uppercase;
              font-size: 10px;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .font-semibold {
              font-weight: 600;
            }
            .font-bold {
              font-weight: 700;
            }
            .breakdown-table {
              margin-bottom: 16px;
            }
            .breakdown-table th {
              background-color: #0f172a;
              color: #fff;
              font-size: 11px;
            }
            .subtotal-row {
              background-color: #f8fafc;
            }
            .note-row td {
              border-top: none;
              padding-top: 2px;
              padding-bottom: 6px;
            }
            .net-pay-row {
              background-color: #f0fdf4;
              border-top: 2px solid #16a34a;
              border-bottom: 2px double #16a34a;
              font-size: 13px;
              color: #15803d;
            }
            .amount-words {
              font-style: italic;
              font-size: 12px;
              color: #334155;
              margin-bottom: 24px;
              background-color: #f0fdf4;
              padding: 10px 14px;
              border-radius: 6px;
              border-left: 4px solid #16a34a;
            }
            .signature-section {
              display: grid;
              grid-template-columns: 1fr 1fr 1.2fr;
              gap: 16px;
              text-align: center;
              margin-top: 30px;
              page-break-inside: avoid;
            }
            .signature-box {
              font-size: 12px;
            }
            .signature-title {
              font-weight: 700;
              color: #334155;
              margin-bottom: 64px;
            }
            .signature-name {
              font-weight: 700;
              color: #0f172a;
            }
            .signature-sub {
              font-size: 10px;
              color: #64748b;
              font-style: italic;
              margin-top: 4px;
              font-weight: normal;
            }
          </style>
        </head>
        <body>
          <div class="toolbar no-print">
            <button class="btn btn-secondary" onclick="window.close()">Đóng cửa sổ</button>
            <button class="btn btn-primary" onclick="window.print()">In phiếu lương</button>
          </div>
          
          <div class="print-container">
            <div class="header-grid" style="display: flex; justify-content: space-between; align-items: flex-start; gap: 24px;">
              <div class="company-block">
                <div class="company-name">${escapeHtml(companyName)}</div>
                <div class="company-info">${escapeHtml(companyAddress)}</div>
                <div class="company-info">SĐT: ${escapeHtml(companyPhone)} · Email: ${escapeHtml(companyEmail)}</div>
              </div>
              <div class="doc-meta" style="text-align: right;">
                <div>Mã phiếu: PL-${row.id}-${month}${year}</div>
                <div>Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}</div>
                <div>Trạng thái: <strong>${escapeHtml(row.trang_thai)}</strong></div>
              </div>
            </div>
            
            <div class="title-section">
              <h1 class="doc-title">Phiếu thanh toán lương tài xế</h1>
              <div class="doc-subtitle">Kỳ lương: Tháng ${month} năm ${year}</div>
            </div>
            
            <div class="info-section">
              <div class="info-title">Thông tin tài xế nhận lương</div>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Họ và tên:</span>
                  <span class="info-value">${escapeHtml(driverName)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Số điện thoại:</span>
                  <span class="info-value">${escapeHtml(driverPhone)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Số GPLX / Hạng:</span>
                  <span class="info-value">${escapeHtml(driverGplx)} (${escapeHtml(driverHang)})</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Xe thường chạy:</span>
                  <span class="info-value">${escapeHtml(driverVehicle)}</span>
                </div>
                <div class="info-item" style="grid-column: span 2;">
                  <span class="info-label">Email liên hệ:</span>
                  <span class="info-value">${escapeHtml(driverEmail)}</span>
                </div>
              </div>
            </div>
            
            <div class="table-title">I. Bảng kê chi tiết chuyến xe trong kỳ</div>
            <table>
              <thead>
                <tr>
                  <th class="text-center" style="width: 15%;">Ngày</th>
                  <th class="text-center" style="width: 15%;">Biển số xe</th>
                  <th class="text-center" style="width: 10%;">Số chuyến</th>
                  <th class="text-right" style="width: 18%;">Lương chuyến</th>
                  <th class="text-right" style="width: 18%;">Chi phí phụ</th>
                  <th style="width: 24%;">Ghi chú hành trình</th>
                </tr>
              </thead>
              <tbody>
                ${tripsHtml}
              </tbody>
            </table>
            
            <div class="table-title">II. Tổng hợp lương & Các khoản thanh toán</div>
            <table class="breakdown-table">
              <thead>
                <tr>
                  <th style="width: 70%;">Nội dung thanh toán</th>
                  <th class="text-right" style="width: 30%;">Số tiền (VND)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1. Tổng tiền lương theo chuyến (Cộng dồn mục I)</td>
                  <td class="text-right font-semibold">${new Intl.NumberFormat('vi-VN').format(tongLuongChuyen)} đ</td>
                </tr>
                <tr>
                  <td style="color: #dc2626; padding-left: 20px;">- Khấu trừ khác (Tạm ứng, phạt vi phạm,...)</td>
                  <td class="text-right font-semibold" style="color: #dc2626;">- ${new Intl.NumberFormat('vi-VN').format(truTienKhac)} đ</td>
                </tr>
                ${row.ghi_chu_khoan_tru ? `
                <tr class="note-row">
                  <td colspan="2" style="padding-left: 30px; color: #64748b; font-style: italic;">Ghi chú khoản trừ: ${escapeHtml(row.ghi_chu_khoan_tru)}</td>
                </tr>` : ''}
                <tr class="subtotal-row">
                  <td class="font-semibold" style="padding-left: 20px; color: #1e3a8a;">= Còn lại thực lĩnh lương chuyến</td>
                  <td class="text-right font-bold" style="color: #1e3a8a;">${new Intl.NumberFormat('vi-VN').format(thucLinh)} đ</td>
                </tr>
                <tr>
                  <td>2. Tổng phụ cấp chi phí chuyến đi (Cộng dồn mục I)</td>
                  <td class="text-right font-semibold">${new Intl.NumberFormat('vi-VN').format(tongChiPhiChuyen)} đ</td>
                </tr>
                <tr>
                  <td>3. Tổng chi phí khác được thanh toán (Ngoài chuyến đi)</td>
                  <td class="text-right font-semibold">${new Intl.NumberFormat('vi-VN').format(tongChiPhiKhac)} đ</td>
                </tr>
                ${row.ghi_chu_chi_phi ? `
                <tr class="note-row">
                  <td colspan="2" style="padding-left: 30px; color: #64748b; font-style: italic;">Ghi chú chi phí khác: ${escapeHtml(row.ghi_chu_chi_phi)}</td>
                </tr>` : ''}
                <tr class="net-pay-row">
                  <td class="font-bold" style="text-transform: uppercase;">Tổng cộng thực nhận chuyển khoản (1 + 2 + 3)</td>
                  <td class="text-right font-bold">${new Intl.NumberFormat('vi-VN').format(tongThanhToan)} đ</td>
                </tr>
              </tbody>
            </table>
            
            <div class="amount-words">
              <strong>Số tiền viết bằng chữ:</strong> <em>${thucLinhBangChu}</em>.
            </div>

          </div>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 300);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }, [lookups]);

  const getFilterOptions = useCallback((columnId: string) => {
    if (columnId === 'phe_duyet') {
      return APPROVAL_OPTIONS.map(o => ({ label: o.label, value: o.value }));
    }
    if (columnId === 'trang_thai') {
      if (config.id === 'chuyen-xe') {
        return APPROVAL_OPTIONS.map(o => ({ label: o.label, value: o.value }));
      }
      if (config.id === 'bang-luong') {
        return PAYROLL_STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value }));
      }
      return STATUS_OPTIONS.map(o => ({ label: o.label, value: o.value }));
    }
    if (columnId === 'id_tai_xe') {
      return (lookups?.drivers || []).map(d => ({ label: String(d.ho_ten ?? ''), value: d.id }));
    }
    if (columnId === 'id_xe' || columnId === 'id_xe_mac_dinh') {
      return (lookups?.vehicles || []).map(v => ({ label: String(v.bien_so ?? ''), value: v.id }));
    }
    const uniqueValues = Array.from(new Set(rows.map(r => String(r[columnId] ?? '')).filter(Boolean)));
    return uniqueValues.map(val => ({ label: val, value: val }));
  }, [config.id, lookups, rows]);

  const getFilterOptionsWithCounts = useCallback((columnId: string) => {
    const rawOptions = getFilterOptions(columnId);
    return rawOptions.map(opt => {
      const count = rows.filter(row => String(row[columnId] ?? '') === opt.value).length;
      return { ...opt, count };
    });
  }, [getFilterOptions, rows]);

  const renderColumnHeaderAccessory = useCallback(
    (col: ColumnConfig) => {
      const colSearchActive = Boolean(columnSearch[col.id]?.trim());
      const columnSearchEl = (
        <ColumnHeaderSearch
          variant="inDropdown"
          value={columnSearch[col.id] ?? ''}
          onChange={(v) => setColumnSearch((prev) => ({ ...prev, [col.id]: v }))}
          ariaLabel={`${col.label} - tìm kiếm`}
        />
      );

      const filterableCols = ['trang_thai', 'phe_duyet', 'hang_bang', 'nhom', 'loai_xe', 'id_tai_xe', 'id_xe', 'id_xe_mac_dinh'];
      if (filterableCols.includes(col.id)) {
        const options = getFilterOptionsWithCounts(col.id);
        const filterVal = filters[col.id] ?? [];
        return (
          <ColumnHeaderFilter
            options={options}
            value={filterVal}
            onChange={(v) => {
              setFilters((prev) => ({ ...prev, [col.id]: v }));
              setPage(1);
            }}
            ariaLabel={col.label}
            sortColumnId={col.id}
            sort={sort}
            setSort={(colId, dir) => setSort({ column: colId, direction: dir })}
          />
        );
      }

      return (
        <ColumnHeaderSortMenu
          ariaLabel={col.label}
          sortColumnId={col.id}
          sort={sort}
          setSort={(colId, dir) => setSort({ column: colId, direction: dir })}
          columnSearch={columnSearchEl}
          columnSearchActive={colSearchActive}
        />
      );
    },
    [columnSearch, filters, sort, getFilterOptionsWithCounts],
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = (ids: string[]) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected = ids.every((id) => next.has(id));
      ids.forEach((id) => {
        if (allSelected) next.delete(id);
        else next.add(id);
      });
      return next;
    });
  };

  const askDelete = (ids: string[]) => {
    const lockedIds = ids.filter((id) => {
      const row = rows.find((item) => String(item.id) === String(id));
      return row ? isRowLockedForUser(row, config.id, user, capBac, lookups) : false;
    });
    if (lockedIds.length > 0) {
      toast.warning(config.lockedReason ?? 'Một số dòng đang bị khóa');
      return;
    }
    confirm({
      title: `Xóa ${config.title}`,
      message: `Bạn chắc chắn muốn xóa ${ids.length} dòng đã chọn?`,
      variant: 'danger',
      confirmText: 'Xóa',
      onConfirm: async () => deleteMutation.mutate(ids),
    });
  };

  const handleOpenAddForm = useCallback(() => {
    setEditingRow(null);
    setCloningTempChildRows(null);
    setCloningPrefillData(null);
    setShowForm(true);
  }, []);

  const handleExport = () => {
    if (filteredRows.length === 0) {
      toast.warning('Không có dữ liệu để xuất');
      return;
    }
    setShowExport(true);
  };

  const handlePrintPayroll = async () => {
    if (config.id !== 'bang-luong') return;
    if (filteredRows.length === 0) {
      toast.warning('Không có dữ liệu để in');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=1024,height=768');
    if (!printWindow) {
      toast.error('Không mở được cửa sổ in. Vui lòng cho phép hiển thị cửa sổ bật lên (popup) trong cài đặt trình duyệt.');
      return;
    }

    const { companyName, companyPhone, companyEmail, companyAddress } = getCompanyPrintInfo();

    const ngayIn = new Date();
    const formattedNgayIn = `Ngày ${ngayIn.getDate()} tháng ${ngayIn.getMonth() + 1} năm ${ngayIn.getFullYear()}`;

    let totalLuongChuyen = 0;
    let totalTruTienKhac = 0;
    let totalChiPhiKhac = 0;
    let totalConLai = 0;

    const uniquePeriods = Array.from(new Set(filteredRows.map(r => {
      const thang = r.thang ?? '';
      const nam = r.nam ?? '';
      return thang && nam ? `${thang}/${nam}` : '';
    }).filter(Boolean)));
    const periodText = uniquePeriods.length === 1 ? `Tháng ${uniquePeriods[0]}` : `Tổng hợp (${uniquePeriods.join(', ')})`;

    const rowsHtml = filteredRows.map((row) => {
      const luongChuyen = Number(row.tong_luong_chuyen) || 0;
      const truTien = Number(row.tru_tien_khac) || 0;
      const chiPhi = Number(row.tong_chi_phi_khac) || 0;
      const conLai = Number(row.tong_con_lai) || 0;

      totalLuongChuyen += luongChuyen;
      totalTruTienKhac += truTien;
      totalChiPhiKhac += chiPhi;
      totalConLai += conLai;

      const driverName = resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
      const kyLuong = row.thang && row.nam ? `${row.thang}/${row.nam}` : '—';
      const statusStr = String(row.trang_thai ?? 'Chưa duyệt');

      let statusBadge = '';
      if (statusStr === 'Đã duyệt' || statusStr === 'Da duyet') {
        statusBadge = `<span class="badge badge-success">✔ Đã duyệt</span>`;
      } else if (statusStr === 'Không duyệt' || statusStr === 'Khong duyet') {
        statusBadge = `<span class="badge badge-danger">✘ Không duyệt</span>`;
      } else if (statusStr === 'Chờ duyệt' || statusStr === 'Chua duyet' || statusStr === 'Chưa duyệt') {
        statusBadge = `<span class="badge badge-warning">Chưa duyệt</span>`;
      } else {
        statusBadge = `<span class="badge badge-secondary">${escapeHtml(statusStr)}</span>`;
      }

      return `
        <tr>
          <td class="text-center font-semibold">${escapeHtml(kyLuong)}</td>
          <td class="text-left font-semibold" style="color: #1e3a8a;">${escapeHtml(driverName)}</td>
          <td class="text-right font-semibold">${new Intl.NumberFormat('vi-VN').format(luongChuyen)} đ</td>
          <td class="text-right ${truTien > 0 ? 'text-danger font-semibold' : ''}">${truTien > 0 ? '-' : ''}${new Intl.NumberFormat('vi-VN').format(truTien)} đ</td>
          <td class="text-right">${new Intl.NumberFormat('vi-VN').format(chiPhi)} đ</td>
          <td class="text-right font-bold text-success">${new Intl.NumberFormat('vi-VN').format(conLai)} đ</td>
          <td class="text-center">${statusBadge}</td>
        </tr>
      `;
    }).join('');

    const totalConLaiBangChu = numberToVietnameseWords(totalConLai);

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Bảng tổng hợp lương tài xế</title>
          <style>
            @media print {
              body { margin: 0; padding: 0; background: #fff; }
              .no-print { display: none !important; }
            }
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            body {
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              color: #1e293b;
              line-height: 1.4;
              padding: 24px;
              margin: 0;
              background-color: #f8fafc;
            }
            .print-container {
              max-width: 900px;
              margin: 0 auto;
              background: #fff;
              padding: 30px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              border-radius: 8px;
            }
            @media print {
              .print-container {
                box-shadow: none;
                border-radius: 0;
                padding: 0;
                max-width: 100%;
              }
              body {
                background-color: #fff;
                padding: 0;
              }
            }
            .toolbar {
              max-width: 900px;
              margin: 0 auto 20px;
              display: flex;
              justify-content: flex-end;
              gap: 12px;
              background: #fff;
              padding: 12px 24px;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .btn {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 8px 16px;
              font-size: 13px;
              font-weight: 600;
              border-radius: 6px;
              cursor: pointer;
              border: 1px solid transparent;
              transition: all 0.15s ease;
              text-decoration: none;
            }
            .btn-primary {
              background-color: #1e3a8a;
              color: #fff;
            }
            .btn-primary:hover {
              background-color: #172554;
            }
            .btn-secondary {
              background-color: #f1f5f9;
              color: #334155;
              border: 1px solid #cbd5e1;
            }
            .btn-secondary:hover {
              background-color: #e2e8f0;
            }
            .company-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              border-bottom: 2px solid #1e3a8a;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .company-name {
              font-weight: bold;
              font-size: 15px;
              text-transform: uppercase;
              color: #1e3a8a;
            }
            .company-info {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .document-meta {
              text-align: right;
            }
            .meta-code {
              font-weight: bold;
              font-size: 11px;
              color: #475569;
            }
            .meta-date {
              font-size: 11px;
              color: #64748b;
              margin-top: 2px;
            }
            .document-title-block {
              text-align: center;
              margin: 25px 0 20px;
            }
            .document-title {
              font-size: 20px;
              font-weight: bold;
              text-transform: uppercase;
              color: #1e3a8a;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .document-subtitle {
              font-size: 13px;
              color: #475569;
              font-weight: 500;
              margin-top: 6px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
              font-size: 12px;
              border: 1px solid #cbd5e1;
            }
            th, td {
              border: 1px solid #cbd5e1;
              padding: 10px 8px;
            }
            th {
              background-color: #1e3a8a;
              color: #ffffff;
              font-weight: 600;
              text-transform: uppercase;
              font-size: 11px;
              letter-spacing: 0.3px;
            }
            tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .total-row {
              background-color: #f1f5f9 !important;
              font-weight: bold;
              border-top: 2px solid #94a3b8;
            }
            .text-center { text-align: center; }
            .text-left { text-align: left; }
            .text-right { text-align: right; }
            .text-primary { color: #1e3a8a; }
            .text-danger { color: #dc2626; }
            .text-success { color: #16a34a; }
            .font-semibold { font-weight: 600; }
            .font-bold { font-weight: 700; }
            .amount-words {
              margin-top: 15px;
              font-style: italic;
              font-size: 12px;
              color: #334155;
              padding: 10px;
              background-color: #f8fafc;
              border-radius: 6px;
              border-left: 3px solid #1e3a8a;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              font-size: 10px;
              font-weight: 600;
              border-radius: 4px;
            }
            .badge-success {
              color: #16a34a;
              background-color: #dcfce7;
              border: 1px solid #bbf7d0;
            }
            .badge-warning {
              color: #d97706;
              background-color: #fef3c7;
              border: 1px solid #fde68a;
            }
            .badge-secondary {
              color: #475569;
              background-color: #f1f5f9;
              border: 1px solid #e2e8f0;
            }
            .badge-danger {
              color: #dc2626;
              background-color: #fef2f2;
              border: 1px solid #fecaca;
            }
            .signature-block {
              margin-top: 40px;
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              text-align: center;
              font-size: 12px;
              page-break-inside: avoid;
            }
            .signature-title {
              font-weight: bold;
              text-transform: uppercase;
              color: #1e293b;
            }
            .signature-subtitle {
              font-size: 10px;
              color: #64748b;
              margin-top: 2px;
            }
            .signature-space {
              height: 60px;
            }
            .signature-name {
              font-weight: 600;
              color: #475569;
            }
          </style>
        </head>
        <body>
          <div class="toolbar no-print">
            <button class="btn btn-primary" onclick="window.print()">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;"><path d="M6 9V2h12v7"></path><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
              In ngay
            </button>
            <button class="btn btn-secondary" onclick="window.close()">Đóng</button>
          </div>

          <div class="print-container">
            <div class="document-header">
              <div>
                <div class="company-name">${escapeHtml(companyName)}</div>
                <div class="company-info">${escapeHtml(companyAddress)}</div>
                <div class="company-info">SĐT: ${escapeHtml(companyPhone)} · Email: ${escapeHtml(companyEmail)}</div>
              </div>
              <div class="document-meta">
                <div class="meta-code">Bảng tổng hợp lương</div>
                <div class="meta-date">${escapeHtml(formattedNgayIn)}</div>
              </div>
            </div>

            <div class="document-title-block">
              <h1 class="document-title">BẢNG TỔNG HỢP THANH TOÁN LƯƠNG TÀI XẾ</h1>
              <div class="document-subtitle">Kỳ lương: ${escapeHtml(periodText)}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th style="width: 12%; text-align: center;">Kỳ lương</th>
                  <th style="width: 25%; text-align: left;">Tài xế</th>
                  <th style="width: 15%; text-align: right;">Lương chuyến</th>
                  <th style="width: 15%; text-align: right;">Trừ tiền khác</th>
                  <th style="width: 15%; text-align: right;">Chi phí khác</th>
                  <th style="width: 18%; text-align: right;">Thực nhận</th>
                  <th style="width: 15%; text-align: center;">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="2" class="text-center">TỔNG CỘNG</td>
                  <td class="text-right text-primary">${new Intl.NumberFormat('vi-VN').format(totalLuongChuyen)} đ</td>
                  <td class="text-right text-danger">-${new Intl.NumberFormat('vi-VN').format(totalTruTienKhac)} đ</td>
                  <td class="text-right text-primary">${new Intl.NumberFormat('vi-VN').format(totalChiPhiKhac)} đ</td>
                  <td class="text-right text-success">${new Intl.NumberFormat('vi-VN').format(totalConLai)} đ</td>
                  <td class="text-center">—</td>
                </tr>
              </tfoot>
            </table>

            <div class="amount-words">
              <strong>Tổng cộng thực nhận bằng chữ:</strong>
              <span>${totalConLaiBangChu}</span>
            </div>


          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const renderCell = (colId: string, row: TransportRow) => {
    if (colId === 'actions') {
      const canEdit = canEditRow(row, config.id, user, capBac, employeeRecord, lookups);
      const canDelete = canDeleteRow(row, config.id, user, capBac, employeeRecord, lookups);
      const canApprove = canApproveRow(row, config.id, user, capBac, employeeRecord, lookups) && canApproveTransportRow(config, row);

      const overflowItems: RowOverflowMenuItem[] = [];

      if (canApprove) {
        overflowItems.push({
          key: 'approve',
          label: 'Quản lý duyệt',
          icon: <CheckCircle2 size={14} />,
          onClick: () => {
            askApprove([row.id], config);
            setRowMenuOpenId(null);
          },
        });
      }

      if (config.id === 'bang-luong') {
        overflowItems.push({
          key: 'period-matrix',
          label: 'Chi tiết trong kỳ',
          icon: <ClipboardList size={14} />,
          onClick: () => {
            openPayrollPeriodMatrixTab(String(row.id));
            setRowMenuOpenId(null);
          },
        });
        overflowItems.push({
          key: 'print-payroll',
          label: 'In bảng lương',
          icon: <Printer size={14} />,
          onClick: () => {
            openPayrollPreviewTab(String(row.id));
            setRowMenuOpenId(null);
          },
        });
      }

      if (canDelete) {
        overflowItems.push({
          key: 'delete',
          label: 'Xóa',
          icon: <Trash2 size={14} />,
          variant: 'destructive',
          onClick: () => {
            askDelete([row.id]);
            setRowMenuOpenId(null);
          },
        });
      }

      const rowDriverReport =
        (config.id === 'chuyen-xe-ct' && canDriverReportCtRow(row)) ||
        (config.id === 'chuyen-xe' && canDriverReportTrip(row));
      const primary =
        rowDriverReport ? (
          <TableRowIconButton
            icon={ClipboardList}
            label="Báo cáo CT"
            variant="primary"
            onClick={() => handleDriverReportEntry(row)}
          />
        ) : canEdit ? (
          <TableRowIconButton
            icon={Edit}
            label="Sửa"
            variant="primary"
            onClick={() => openRowEditForm(row)}
          />
        ) : undefined;

      return (
        <div
          role="group"
          className="flex items-center justify-center"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DataTableRowActions
            rowId={row.id}
            menuOpenId={rowMenuOpenId}
            onMenuOpenChange={setRowMenuOpenId}
            primary={primary}
            overflowItems={overflowItems}
            overflowTriggerLabel="Thao tác thêm"
          />
        </div>
      );
    }
    if (colId === 'ct_hoan_thanh') {
      const stats = getTripCtCompletionStats(String(row.id), tripDetailsForCompletion);
      return (
        <div className={numericCenterCellClass}>
          <span className="text-sm font-semibold tabular-nums text-foreground" title="CT đã thực hiện / tổng CT">
            {formatTripCtCompletionStats(stats)}
          </span>
        </div>
      );
    }
    if (colId === 'trang_thai' && config.id === 'chuyen-xe-ct') {
      return (
        <EnumBadge shape="pill" truncate value={String(row.trang_thai ?? '')} config={executionBadgeConfig} />
      );
    }
    if (colId === config.statusKey || colId === 'phe_duyet') {
      return (
        <EnumBadge
          shape="pill"
          truncate
          value={String(row[colId] ?? '')}
          config={approvalBadgeConfig}
        />
      );
    }
    
    const val = resolveTransportValue(colId, row[colId], lookups);
    if (!val || val === '--') {
      return <span className="text-xs text-muted-foreground italic">--</span>;
    }

    const isNumeric = colId.includes('tien') || colId.includes('phi') || colId.includes('luong') || colId.includes('con_lai') || colId.includes('phu_cap') || colId.includes('thuc_linh') || colId.includes('so_chuyen') || colId.includes('doanh_thu');
    const icon = getFieldIcon(colId);

    return (
      <div className={cn(
        "flex items-center gap-1.5 text-sm min-w-0 text-foreground",
        isNumeric && "font-semibold tabular-nums"
      )}>
        {icon && <span className="text-primary/60 shrink-0">{icon}</span>}
        <span className="truncate">{val}</span>
      </div>
    );
  };

  const renderMobileCard = (row: TransportRow, isSelected: boolean) => (
    <MobileListCard
      selected={isSelected}
      onBodyClick={() => setViewingRow(row)}
      onBodyKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setViewingRow(row);
        }
      }}
      leading={
        <div className="h-11 w-11 rounded-lg border border-primary/20 bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Icon size={21} />
        </div>
      }
      titleRow={
        <div className="flex items-center justify-between gap-2 min-w-0">
          <h4 className="truncate text-sm font-semibold text-foreground">
            {resolveTransportValue(config.nameKey, row[config.nameKey], lookups)}
          </h4>
          <div className="flex items-center gap-2 shrink-0">
            {config.id === 'chuyen-xe' && (
              <span
                className="text-xs font-semibold tabular-nums text-muted-foreground"
                title="CT đã thực hiện / tổng CT"
              >
                {formatTripCtCompletionStats(getTripCtCompletionStats(String(row.id), tripDetailsForCompletion))}
              </span>
            )}
            {config.statusKey && (
              <EnumBadge shape="pill" value={String(row[config.statusKey] ?? '')} config={statusBadgeConfig} />
            )}
          </div>
        </div>
      }
      subheader={(() => {
        if (config.id === 'bang-luong') {
          return <p className="truncate text-xs font-medium text-primary">Kỳ lương: Tháng {String(row.thang)}/{String(row.nam)}</p>;
        }
        if (config.id === 'chuyen-xe') {
          const driverName = resolveTransportValue('id_tai_xe', row.id_tai_xe, lookups);
          const vehiclePlate = resolveTransportValue('id_xe', row.id_xe, lookups);
          return <p className="truncate text-xs font-medium text-primary">{driverName} · {vehiclePlate}</p>;
        }
        if (config.id === 'chuyen-xe-ct') {
          const tripInfo = resolveTransportValue('id_chuyen_xe', row.id_chuyen_xe, lookups);
          const groupName = resolveLocationGroup(row.id_dia_diem, lookups);
          return <p className="truncate text-xs font-medium text-primary">{groupName} · {tripInfo}</p>;
        }
        const firstCol = config.columns.find(c => c.id !== 'actions' && c.id !== config.nameKey && c.id !== 'id');
        return firstCol ? (
          <p className="truncate text-xs font-medium text-primary">
            {firstCol.label}: {resolveTransportValue(firstCol.id, row[firstCol.id], lookups)}
          </p>
        ) : null;
      })()}
      metaLine={(() => {
        const metaParts = config.columns
          .filter(c => {
            if (c.id === 'actions' || c.id === config.nameKey || c.id === 'id' || c.id === config.statusKey || c.id === 'trang_thai' || c.id === 'phe_duyet' || c.id === 'thang' || c.id === 'nam') {
              return false;
            }
            if (config.id === 'chuyen-xe' && (c.id === 'id_tai_xe' || c.id === 'id_xe')) {
              return false;
            }
            return true;
          })
          .slice(0, 3)
          .map(c => {
            const val = resolveTransportValue(c.id, row[c.id], lookups);
            return val && val !== '—' ? `${c.label}: ${val}` : '';
          })
          .filter(Boolean);
        
        return metaParts.length > 0 ? (
          <p className="text-xs text-muted-foreground truncate">
            {metaParts.join(' · ')}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground font-mono">Mã: {row.id}</p>
        );
      })()}
      footerStart={
        <label className="inline-flex h-7 w-7 items-center justify-center rounded">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelection(row.id)}
            onClick={(event) => event.stopPropagation()}
            className="h-3 w-3 rounded border-border accent-primary"
            aria-label="Chọn dòng"
          />
        </label>
      }
      footerEnd={
        <div
          role="group"
          className="flex items-center justify-end"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          <DataTableRowActions
            rowId={row.id}
            compact
            menuOpenId={rowMenuOpenId}
            onMenuOpenChange={setRowMenuOpenId}
            primary={
              (config.id === 'chuyen-xe-ct' && canDriverReportCtRow(row)) ||
              (config.id === 'chuyen-xe' && canDriverReportTrip(row)) ? (
                <TableRowIconButton
                  icon={ClipboardList}
                  label="Báo cáo CT"
                  size="compact"
                  variant="primary"
                  onClick={() => handleDriverReportEntry(row)}
                />
              ) : canEditRow(row, config.id, user, capBac, employeeRecord, lookups) ? (
                <TableRowIconButton
                  icon={Edit}
                  label="Sửa"
                  size="compact"
                  variant="primary"
                  onClick={() => openRowEditForm(row)}
                />
              ) : undefined
            }
            overflowItems={[
              ...(canApproveRow(row, config.id, user, capBac, employeeRecord, lookups) && canApproveTransportRow(config, row)
                ? [
                    {
                      key: 'approve',
                      label: 'Quản lý duyệt',
                      icon: <CheckCircle2 size={14} />,
                      onClick: () => {
                        askApprove([row.id], config);
                        setRowMenuOpenId(null);
                      },
                    },
                  ]
                : []),
              ...(canDeleteRow(row, config.id, user, capBac, employeeRecord, lookups)
                ? [
                    {
                      key: 'delete',
                      label: 'Xóa',
                      icon: <Trash2 size={14} />,
                      variant: 'destructive' as const,
                      onClick: () => {
                        askDelete([row.id]);
                        setRowMenuOpenId(null);
                      },
                    },
                  ]
                : []),
            ]}
            overflowTriggerLabel="Thao tác thêm"
          />
        </div>
      }
    />
  );

  const canCreate = can(user, 'create', config.id as AppResource);
  const grantsByModule = usePermissionGrantStore((s) => s.grantsByModule);
  const showKiemTraScopeHint = useMemo(() => {
    if (user?.role === 'admin' || capBac === 1) return false;
    const moduleId = APP_RESOURCE_TO_MODULE[config.id as AppResource] || config.id;
    const grants = grantsByModule[moduleId] ?? [];
    return grants.includes('check') && (capBac ?? 0) >= 2;
  }, [user?.role, capBac, grantsByModule, config.id]);

  const openRowEditForm = useCallback((row: TransportRow) => {
    setDriverReportMode(false);
    setCloningPrefillData(null);
    setCloningTempChildRows(null);
    setEditingRow(row);
    setShowForm(true);
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col">
      {showKiemTraScopeHint && (config.id === 'chuyen-xe' || config.id === 'bang-luong') ? (
        <p className="mb-2 rounded-lg border border-amber-200/80 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          Quyền kiểm tra: bạn <strong>xem toàn bộ</strong> danh sách; <strong>duyệt/sửa/xóa</strong> chỉ trong phạm vi cấp bậc của bạn (phòng ban hoặc phiếu liên quan trực tiếp).
        </p>
      ) : null}
      <div className="flex-1 min-h-0 flex flex-col rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <GenericToolbar
          showBack={showBack}
          selectedCount={selectedCount}
          searchTerm={searchTerm}
          onSearchChange={(term) => {
            setSearchTerm(term);
            setPage(1);
          }}
          onClearSelection={() => setSelectedIds(new Set())}
          onDeleteMany={selectedCount > 0 && canDeleteSelected ? () => askDelete([...selectedIds]) : undefined}
          bulkActions={bulkStatusActions}
          searchPlaceholder={`Tìm ${config.title.toLowerCase()}...`}
          filters={<ToolbarFilterChipGroup items={filterItems} />}
          filterGroups={filterGroups}
          activeFilterCount={activeFilterCount}
          onClearAllFilters={handleClearAllFilters}
          columns={columns}
          onToggleColumn={(id) => setColumns((current) => current.map((col) => (col.id === id ? { ...col, visible: !col.visible } : col)))}
          onReorderColumns={(fromIndex, toIndex) =>
            setColumns((current) => {
              const sorted = [...current].sort((a, b) => a.order - b.order);
              const [moved] = sorted.splice(fromIndex, 1);
              sorted.splice(toIndex, 0, moved);
              return sorted.map((column, index) => ({ ...column, order: index }));
            })
          }
          onResetColumns={() => setColumns(config.columns)}
          onAdd={canCreate ? handleOpenAddForm : undefined}
          mobileActions={[
            ...(can(user, 'export', config.id as AppResource) ? [
              {
                key: 'export',
                label: 'Xuất CSV',
                icon: Download,
                onClick: handleExport,
              }
            ] : []),
          ]}
          actions={
            <div className="flex items-center gap-1">
              {config.id === 'bang-luong' && (
                <Button type="button" size="sm" variant="outline" onClick={handlePrintPayroll}>
                  <Printer size={15} className="mr-2" />
                  In
                </Button>
              )}
              {can(user, 'export', config.id as AppResource) && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  onClick={handleExport}
                  aria-label="Xuất CSV"
                  title="Xuất CSV"
                >
                  <Download size={15} />
                </Button>
              )}
              {canCreate && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenAddForm}
                  className="bg-primary text-primary-foreground shadow-sm h-8 px-3"
                >
                  <Plus size={15} className="mr-2" />
                  <span className="text-xs">{BTN_ADD()}</span>
                </Button>
              )}
            </div>
          }
        />

        <div className="flex-1 min-h-0">
          <GenericTable
            data={filteredRows}
            columns={columns}
            isLoading={isLoading}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAll={toggleAll}
            page={page}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
            sort={sort}
            onSort={(column, direction) => setSort({ column, direction })}
            renderCell={renderCell}
            renderMobileCard={renderMobileCard}
            onRowClick={setViewingRow}
            keyExtractor={(row) => row.id}
            loadingText={`Đang tải ${config.title.toLowerCase()}`}
            emptyTitle={`Chưa có ${config.title.toLowerCase()}`}
            emptyDescription="Thêm dòng mới để bắt đầu nhập dữ liệu."
            onResizeColumn={(id, width) =>
              setColumns((current) => current.map((column) => (column.id === id ? { ...column, width } : column)))
            }
            renderColumnHeaderAccessory={renderColumnHeaderAccessory}
          />
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <TransportForm
            config={config}
            row={editingRow}
            prefillData={cloningPrefillData}
            isCloning={!!cloningPrefillData}
            initialTempChildRows={cloningTempChildRows}
            driverSelfId={driverSelfId}
            driverReportMode={driverReportMode}
            lookups={lookups}
            onClose={() => {
              setShowForm(false);
              setDriverReportMode(false);
              setEditingRow(null);
              setCloningPrefillData(null);
              setCloningTempChildRows(null);
            }}
            onSubmit={(values) => saveMutation.mutate(values)}
            isSaving={saveMutation.isPending}
            onAddChild={(parentRow) => {
              setNestedFormConfig(TRANSPORT_MODULES.tripDetails);
              setNestedPrefillData({ id_chuyen_xe: parentRow.id });
            }}
            onEditChild={(childRow) => {
              if (config.id === 'chuyen-xe' && isDriverAccount && canDriverReportCt(childRow)) {
                handleDriverReportEntry(childRow as TransportRow);
                return;
              }
              setNestedFormConfig(TRANSPORT_MODULES.tripDetails);
              setNestedEditingRow(childRow);
              setNestedDriverReport(false);
            }}
            onDeleteChild={async (childRowId) => {
              confirm({
                title: 'Xóa dòng chi tiết',
                message: 'Bạn có chắc chắn muốn xóa dòng chi tiết này?',
                variant: 'danger',
                confirmText: 'Xóa',
                onConfirm: async () => {
                  try {
                    await deleteTransportRows(TRANSPORT_MODULES.tripDetails, [childRowId]);
                    toast.success('Đã xóa dòng chi tiết');
                    void queryClient.invalidateQueries({ queryKey: ['transport'] });
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                },
              });
            }}
            onViewChildDetail={(childRow) => {
              setNestedViewingConfig(TRANSPORT_MODULES.tripDetails);
              setNestedViewingRow(childRow);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentViewingRow && !showForm && (
          <TransportDetail
            config={config}
            row={currentViewingRow}
            lookups={lookups}
            driverReportMode={config.id === 'chuyen-xe' && canDriverReportTrip(currentViewingRow)}
            onClose={() => setViewingRow(null)}
            onClone={(rowToClone) => {
              const { id, tg_tao, tg_cap_nhat, trang_thai, ...cloneData } = rowToClone;
              let childRows: any[] = [];
              if (config.id === 'chuyen-xe') {
                childRows = (lookups?.tripDetails || [])
                  .filter((d) => String(d.id_chuyen_xe) === String(rowToClone.id))
                  .map(({ id: cid, id_chuyen_xe, tg_tao: c_tao, tg_cap_nhat: c_cap, trang_thai: c_trang_thai, phe_duyet: c_phe_duyet, ...rest }) => ({
                    ...rest,
                    trang_thai: 'Chưa thực hiện',
                    phe_duyet: 'Chưa duyệt',
                  }));
              }
              setEditingRow(null);
              setCloningPrefillData(cloneData);
              setCloningTempChildRows(childRows.length > 0 ? childRows : null);
              setViewingRow(null);
              setShowForm(true);
            }}
            onEdit={() => {
              if (config.id === 'chuyen-xe' && canDriverReportTrip(currentViewingRow)) {
                handleDriverReportEntry(currentViewingRow);
                return;
              }
              if (isRowLockedForUser(currentViewingRow, config.id, user, capBac, lookups)) {
                toast.warning(config.lockedReason ?? 'Dòng đang bị khóa');
                return;
              }
              setCloningPrefillData(null);
              setCloningTempChildRows(null);
              setEditingRow(currentViewingRow);
              setShowForm(true);
            }}
            onDelete={() => askDelete([currentViewingRow.id])}
            canApprove={canApproveTransportRow(config, currentViewingRow)}
            onApprove={() => askApprove([currentViewingRow.id])}
            onStatusChange={async (status, note, extraFields) => {
              await statusMutation.mutateAsync({ ids: [currentViewingRow.id], status, note, extraFields });
            }}
            onPrintSingle={() => openPayrollPreviewTab(currentViewingRow.id)}
            onAddChild={(parentRow) => {
              setNestedFormConfig(TRANSPORT_MODULES.tripDetails);
              setNestedPrefillData({ id_chuyen_xe: parentRow.id });
            }}
            onEditChild={(childRow) => {
              if (config.id === 'chuyen-xe' && isDriverAccount && canDriverReportCt(childRow)) {
                handleDriverReportEntry(childRow as TransportRow);
                return;
              }
              if (
                config.id === 'chuyen-xe' &&
                isRowLockedForUser(childRow, 'chuyen-xe-ct', user, capBac, lookups)
              ) {
                toast.warning(TRANSPORT_MODULES.tripDetails.lockedReason ?? 'Dòng đang bị khóa');
                return;
              }
              setNestedFormConfig(TRANSPORT_MODULES.tripDetails);
              setNestedEditingRow(childRow);
              setNestedDriverReport(false);
            }}
            onDeleteChild={async (childRowId) => {
              confirm({
                title: 'Xóa dòng chi tiết',
                message: 'Bạn có chắc chắn muốn xóa dòng chi tiết này?',
                variant: 'danger',
                confirmText: 'Xóa',
                onConfirm: async () => {
                  try {
                    await deleteTransportRows(TRANSPORT_MODULES.tripDetails, [childRowId]);
                    toast.success('Đã xóa dòng chi tiết');
                    void queryClient.invalidateQueries({ queryKey: ['transport'] });
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                },
              });
            }}
            onViewChildDetail={(childRow) => {
              setNestedViewingConfig(TRANSPORT_MODULES.tripDetails);
              setNestedViewingRow(childRow);
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showExport && (
          <ExportDialog
            open={showExport}
            onClose={() => setShowExport(false)}
            columns={exportColumns}
            data={exportData}
            paginatedData={paginatedExportData}
            selectedData={selectedExportData}
            fileName={config.title}
            visibleColumnKeys={visibleColumnKeys}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nestedFormConfig && (
          <TransportForm
            config={nestedFormConfig}
            row={nestedEditingRow}
            prefillData={nestedPrefillData}
            driverReportMode={nestedDriverReport}
            lookups={lookups}
            onClose={() => {
              setNestedFormConfig(null);
              setNestedEditingRow(null);
              setNestedPrefillData(null);
              setNestedDriverReport(false);
            }}
            onSubmit={async (values) => {
              confirm({
                title: nestedEditingRow ? 'Xác nhận lưu thay đổi' : 'Xác nhận thêm mới',
                message: nestedEditingRow ? 'Bạn có chắc chắn muốn lưu các thay đổi này?' : 'Bạn có chắc chắn muốn thêm dòng chi tiết mới?',
                variant: 'info',
                confirmText: nestedEditingRow ? 'Lưu' : 'Thêm',
                onConfirm: async () => {
                  try {
                    if (nestedEditingRow) {
                      await updateTransportRow(nestedFormConfig, nestedEditingRow.id, values);
                      toast.success(`Đã cập nhật chi tiết`);
                    } else {
                      await createTransportRow(nestedFormConfig, values);
                      toast.success(`Đã thêm chi tiết`);
                    }
                    void queryClient.invalidateQueries({ queryKey: ['transport'] });
                    setNestedFormConfig(null);
                    setNestedEditingRow(null);
                    setNestedPrefillData(null);
                    setNestedViewingRow(null);
                    setNestedViewingConfig(null);
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                },
              });
            }}
            isSaving={false}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {currentNestedViewingRow && nestedViewingConfig && !nestedFormConfig && (
          <TransportDetail
            config={nestedViewingConfig}
            row={currentNestedViewingRow}
            lookups={lookups}
            onClose={() => {
              setNestedViewingRow(null);
              setNestedViewingConfig(null);
            }}
            onEdit={() => {
              if (nestedViewingConfig.id === 'chuyen-xe-ct' && canDriverReportCtRow(currentNestedViewingRow)) {
                handleDriverReportEntry(currentNestedViewingRow);
                return;
              }
              setNestedEditingRow(currentNestedViewingRow);
              setNestedFormConfig(nestedViewingConfig);
            }}
            canApprove={canApproveTransportRow(nestedViewingConfig, currentNestedViewingRow)}
            onApprove={() => askApprove([currentNestedViewingRow.id], nestedViewingConfig)}
            onDelete={() => {
              confirm({
                title: 'Xóa dòng chi tiết',
                message: 'Bạn có chắc chắn muốn xóa dòng chi tiết này?',
                variant: 'danger',
                confirmText: 'Xóa',
                onConfirm: async () => {
                  try {
                    await deleteTransportRows(nestedViewingConfig, [currentNestedViewingRow.id]);
                    toast.success('Đã xóa dòng chi tiết');
                    void queryClient.invalidateQueries({ queryKey: ['transport'] });
                    setNestedViewingRow(null);
                    setNestedViewingConfig(null);
                  } catch (error) {
                    toast.error(getErrorMessage(error));
                  }
                },
              });
            }}
            parentViewingRow={viewingRow || undefined}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default TransportModulePage;
