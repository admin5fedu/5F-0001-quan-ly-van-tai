import type { LucideIcon } from 'lucide-react';
import {
  CircleDollarSign,
  ClipboardList,
  MapPin,
  Route,
  Truck,
  UserRoundCheck,
} from 'lucide-react';
import type { ColumnConfig } from '@/store/createGenericStore';
import { formatDate, formatDateTime } from '@/lib/utils';
import { isSupabase } from '@/lib/data/config';
import { isPendingTripApproval } from './trip-approval-sync';
import { MOCK_EMPLOYEES } from '@/mocks';
import {
  DRIVER_ROWS,
  LOCATION_ROWS,
  VEHICLE_ROWS,
  TRIP_ROWS,
  TRIP_DETAIL_ROWS,
  PAYROLL_ROWS,
} from '@/mocks/van-tai';

export {
  DRIVER_ROWS,
  LOCATION_ROWS,
  VEHICLE_ROWS,
  TRIP_ROWS,
  TRIP_DETAIL_ROWS,
  PAYROLL_ROWS,
} from '@/mocks/van-tai';

export type TransportFieldType = 'text' | 'textarea' | 'number' | 'currency' | 'date' | 'select';

export interface TransportOption {
  value: string;
  label: string;
}

export interface TransportField {
  key: string;
  label: string;
  type: TransportFieldType;
  required?: boolean;
  options?: TransportOption[];
  relation?: 'drivers' | 'locations' | 'vehicles' | 'trips' | 'employees';
  placeholder?: string;
  readOnly?: boolean;
  hideInForm?: boolean;
  fullWidth?: boolean;
  helperText?: string;
}

export interface TransportRow {
  id: string;
  [key: string]: unknown;
}

export interface TransportModuleConfig {
  id: string;
  title: string;
  description: string;
  route: string;
  tableName: string;
  icon: LucideIcon;
  color: string;
  fields: TransportField[];
  columns: ColumnConfig[];
  seedRows: TransportRow[];
  searchKeys: string[];
  nameKey: string;
  statusKey?: string;
  lockedWhen?: (row: TransportRow) => boolean;
  lockedReason?: string;
}

export const STATUS_OPTIONS: TransportOption[] = [
  { value: 'Đang hoạt động', label: 'Đang hoạt động' },
  { value: 'Ngừng hoạt động', label: 'Ngừng hoạt động' },
];

export const TRIP_STATUS_OPTIONS: TransportOption[] = [
  { value: 'Chưa duyệt', label: 'Chưa duyệt' },
  { value: 'Đã duyệt', label: 'Đã duyệt' },
  { value: 'Không duyệt', label: 'Không duyệt' },
];

export const APPROVAL_OPTIONS: TransportOption[] = [
  { value: 'Chưa duyệt', label: 'Chưa duyệt' },
  { value: 'Đã duyệt', label: 'Đã duyệt' },
  { value: 'Không duyệt', label: 'Không duyệt' },
];

export const PAYROLL_STATUS_OPTIONS = APPROVAL_OPTIONS;

export const EXECUTION_STATUS_OPTIONS: TransportOption[] = [
  { value: 'Chưa thực hiện', label: 'Chưa thực hiện' },
  { value: 'Đang thực hiện', label: 'Đang thực hiện' },
  { value: 'Đã thực hiện', label: 'Đã thực hiện' },
  { value: 'Hủy', label: 'Hủy' },
];

const auditFields: TransportField[] = [
  { key: 'ghi_chu', label: 'Ghi chú', type: 'textarea' },
];

const auditColumns = (startOrder: number): ColumnConfig[] => [
  { id: 'ghi_chu', label: 'Ghi chú', visible: true, minWidth: 180, maxWidth: 320, order: startOrder },
  { id: 'tg_cap_nhat', label: 'Cập nhật', visible: true, minWidth: 140, maxWidth: 180, order: startOrder + 1 },
  { id: 'actions', label: 'Thao tác', visible: true, minWidth: 92, maxWidth: 92, order: startOrder + 2 },
];

export const TRANSPORT_MODULES = {
  drivers: {
    id: 'tai-xe',
    title: 'Tài xế',
    description: 'Danh sách tài xế và liên kết nhân viên đăng nhập.',
    route: '/quan-ly-van-tai/tai-xe',
    tableName: 'var_nhan_vien',
    icon: UserRoundCheck,
    color: 'bg-emerald-500',
    nameKey: 'ho_ten',
    statusKey: 'trang_thai',
    fields: [
      { key: 'ho_ten', label: 'Họ tên', type: 'text', required: true },
      { key: 'so_dien_thoai', label: 'Số điện thoại', type: 'text', placeholder: '0900000000' },
      { key: 'email', label: 'Email', type: 'text', placeholder: 'taixe@example.com' },
      { key: 'ngay_sinh', label: 'Ngày sinh', type: 'date' },
      { key: 'dia_chi', label: 'Địa chỉ', type: 'textarea', fullWidth: true },
      { key: 'so_gplx', label: 'Số GPLX', type: 'text' },
      { key: 'hang_bang', label: 'Hạng bằng', type: 'text' },
      { key: 'ngay_het_han_bang', label: 'Ngày hết hạn bằng', type: 'date' },
      { key: 'id_xe_mac_dinh', label: 'Xe thường chạy', type: 'select', relation: 'vehicles' },
      { key: 'luong_co_ban', label: 'Lương cơ bản', type: 'currency' },
      { key: 'trang_thai', label: 'Trạng thái', type: 'select', options: STATUS_OPTIONS, required: true },
      { key: 'thong_tin_khac', label: 'Thông tin khác (tuổi,...)', type: 'textarea', fullWidth: true },
      ...auditFields,
    ],
    columns: [
      { id: 'ho_ten', label: 'Họ tên', visible: true, minWidth: 180, maxWidth: 260, order: 0 },
      { id: 'so_dien_thoai', label: 'SĐT', visible: true, minWidth: 130, maxWidth: 170, order: 1 },
      { id: 'so_gplx', label: 'GPLX', visible: true, minWidth: 130, maxWidth: 180, order: 2 },
      { id: 'id_xe_mac_dinh', label: 'Xe thường chạy', visible: true, minWidth: 150, maxWidth: 220, order: 3 },
      { id: 'luong_co_ban', label: 'Lương cơ bản', visible: true, minWidth: 140, maxWidth: 180, order: 4, type: 'currency' },
      { id: 'trang_thai', label: 'Trạng thái', visible: true, minWidth: 140, maxWidth: 180, order: 5 },
      ...auditColumns(6),
    ],
    seedRows: DRIVER_ROWS,
    searchKeys: ['ho_ten', 'so_dien_thoai', 'email', 'so_gplx', 'hang_bang', 'id_xe_mac_dinh', 'luong_co_ban', 'trang_thai', 'thong_tin_khac', 'ghi_chu'],
  },
  locations: {
    id: 'dia-diem',
    title: 'Địa điểm',
    description: 'Địa điểm giao nhận, nhóm tuyến, lương ban đầu và định vị.',
    route: '/quan-ly-van-tai/dia-diem',
    tableName: 'vt_dia_diem',
    icon: MapPin,
    color: 'bg-rose-500',
    nameKey: 'ten',
    statusKey: 'trang_thai',
    fields: [
      { key: 'nhom', label: 'Nhóm', type: 'text' },
      { key: 'ten', label: 'Tên', type: 'text', required: true },
      { key: 'mo_ta', label: 'Mô tả', type: 'textarea' },
      { key: 'tien_luong', label: 'Tiền lương', type: 'currency' },
      { key: 'chi_phi', label: 'Chi phí mặc định', type: 'currency' },
      { key: 'dia_chi', label: 'Địa chỉ', type: 'textarea', fullWidth: true },
      { key: 'dinh_vi', label: 'Định vị', type: 'text' },
      { key: 'trang_thai', label: 'Trạng thái', type: 'select', options: STATUS_OPTIONS, required: true },
      ...auditFields,
    ],
    columns: [
      { id: 'ten', label: 'Tên', visible: true, minWidth: 180, maxWidth: 260, order: 0 },
      { id: 'nhom', label: 'Nhóm', visible: true, minWidth: 120, maxWidth: 180, order: 1 },
      { id: 'tien_luong', label: 'Tiền lương', visible: true, minWidth: 140, maxWidth: 180, order: 2 },
      { id: 'chi_phi', label: 'Chi phí', visible: true, minWidth: 130, maxWidth: 170, order: 3 },
      { id: 'dinh_vi', label: 'Định vị', visible: true, minWidth: 140, maxWidth: 220, order: 4 },
      { id: 'trang_thai', label: 'Trạng thái', visible: true, minWidth: 140, maxWidth: 180, order: 5 },
      ...auditColumns(6),
    ],
    seedRows: LOCATION_ROWS,
    searchKeys: ['ten', 'nhom', 'mo_ta', 'dia_chi', 'dinh_vi', 'trang_thai', 'ghi_chu'],
  },
  vehicles: {
    id: 'danh-sach-xe',
    title: 'Danh sách xe',
    description: 'Thông tin xe, biển số và ghi chú bảo hiểm/bảo trì.',
    route: '/quan-ly-van-tai/danh-sach-xe',
    tableName: 'vt_xe',
    icon: Truck,
    color: 'bg-blue-500',
    nameKey: 'bien_so',
    statusKey: 'trang_thai',
    fields: [
      { key: 'hang', label: 'Hãng', type: 'text', required: true },
      { key: 'model', label: 'Model', type: 'text', required: true },
      { key: 'doi', label: 'Đời', type: 'text' },
      { key: 'bien_so', label: 'Biển số', type: 'text', required: true },
      { key: 'loai_xe', label: 'Loại xe', type: 'text' },
      { key: 'tai_trong', label: 'Tải trọng', type: 'text' },
      { key: 'han_dang_kiem', label: 'Hạn đăng kiểm', type: 'date' },
      { key: 'han_bao_hiem', label: 'Hạn bảo hiểm', type: 'date' },
      { key: 'thong_tin_khac', label: 'Thông tin khác', type: 'textarea' },
      { key: 'trang_thai', label: 'Trạng thái', type: 'select', options: STATUS_OPTIONS, required: true },
    ],
    columns: [
      { id: 'bien_so', label: 'Biển số', visible: true, minWidth: 140, maxWidth: 180, order: 0 },
      { id: 'hang', label: 'Hãng', visible: true, minWidth: 120, maxWidth: 180, order: 1 },
      { id: 'model', label: 'Model', visible: true, minWidth: 120, maxWidth: 180, order: 2 },
      { id: 'doi', label: 'Đời', visible: true, minWidth: 100, maxWidth: 140, order: 3 },
      { id: 'loai_xe', label: 'Loại xe', visible: true, minWidth: 130, maxWidth: 180, order: 4 },
      { id: 'tai_trong', label: 'Tải trọng', visible: true, minWidth: 120, maxWidth: 160, order: 5 },
      { id: 'trang_thai', label: 'Trạng thái', visible: true, minWidth: 140, maxWidth: 180, order: 6 },
      { id: 'thong_tin_khac', label: 'Thông tin', visible: false, minWidth: 180, maxWidth: 320, order: 7 },
      { id: 'tg_cap_nhat', label: 'Cập nhật', visible: true, minWidth: 140, maxWidth: 180, order: 8 },
      { id: 'actions', label: 'Thao tác', visible: true, minWidth: 92, maxWidth: 92, order: 9 },
    ],
    seedRows: VEHICLE_ROWS,
    searchKeys: ['bien_so', 'hang', 'model', 'doi', 'loai_xe', 'tai_trong', 'thong_tin_khac', 'trang_thai'],
  },
  trips: {
    id: 'chuyen-xe',
    title: 'Chuyến xe',
    description: 'Bảng cha theo ngày, tài xế, xe, tổng lương và tổng phí.',
    route: '/quan-ly-van-tai/chuyen-xe',
    tableName: 'vt_chuyen_xe',
    icon: Route,
    color: 'bg-cyan-500',
    nameKey: 'ngay',
    statusKey: 'trang_thai',
    fields: [
      { key: 'ngay', label: 'Ngày', type: 'date', required: true },
      { key: 'id_tai_xe', label: 'Tài xế', type: 'select', relation: 'drivers', required: true },
      { key: 'id_xe', label: 'Xe', type: 'select', relation: 'vehicles' },
      { key: 'so_chuyen', label: 'Số chuyến', type: 'number', readOnly: true, helperText: 'Tự động tính từ danh sách chi tiết chuyến.' },
      { key: 'tong_tien_luong', label: 'Tổng tiền lương', type: 'currency', readOnly: true, helperText: 'Tự động cộng tiền lương từ dòng chi tiết.' },
      { key: 'tong_phi', label: 'Tổng phí', type: 'currency', readOnly: true, helperText: 'Tự động cộng chi phí từ dòng chi tiết.' },
      { key: 'trang_thai', label: 'Phê duyệt', type: 'select', options: TRIP_STATUS_OPTIONS, required: true, hideInForm: true },
      ...auditFields,
    ],
    columns: [
      { id: 'ngay', label: 'Ngày', visible: true, minWidth: 120, maxWidth: 160, order: 0 },
      { id: 'id_tai_xe', label: 'Tài xế', visible: true, minWidth: 140, maxWidth: 220, order: 1 },
      { id: 'id_xe', label: 'Xe', visible: true, minWidth: 140, maxWidth: 220, order: 2 },
      { id: 'so_chuyen', label: 'Số chuyến', visible: true, minWidth: 110, maxWidth: 140, order: 3 },
      { id: 'tong_tien_luong', label: 'Tổng lương', visible: true, minWidth: 150, maxWidth: 180, order: 4 },
      { id: 'tong_phi', label: 'Tổng phí', visible: true, minWidth: 140, maxWidth: 180, order: 5 },
      { id: 'trang_thai', label: 'Phê duyệt', visible: true, minWidth: 130, maxWidth: 160, order: 6 },
      { id: 'ct_hoan_thanh', label: 'TH CT', visible: true, minWidth: 100, maxWidth: 120, order: 7 },
      ...auditColumns(8),
    ],
    seedRows: TRIP_ROWS,
    searchKeys: ['ngay', 'id_tai_xe', 'id_xe', 'so_chuyen', 'tong_tien_luong', 'tong_phi', 'trang_thai', 'ghi_chu'],
    lockedWhen: (row) => !isPendingTripApproval(row.trang_thai),
    lockedReason: 'Chỉ chỉnh sửa khi chuyến còn Chưa duyệt',
  },
  tripDetails: {
    id: 'chuyen-xe-ct',
    title: 'Danh sách CT',
    description: 'Dòng con: trạng thái thực hiện (tài xế) và phê duyệt (cấp trên từ chuyến cha).',
    route: '/quan-ly-van-tai/chuyen-xe?tab=danh-sach-ct',
    tableName: 'vt_chuyen_xe_ct',
    icon: ClipboardList,
    color: 'bg-indigo-500',
    nameKey: 'id_dia_diem',
    statusKey: 'phe_duyet',
    lockedWhen: (row) => !isPendingTripApproval(row.phe_duyet),
    lockedReason: 'Chỉ chỉnh sửa hoặc báo cáo khi dòng CT còn Chưa duyệt (duyệt)',
    fields: [
      { key: 'id_chuyen_xe', label: 'Chuyến xe', type: 'select', relation: 'trips', required: true },
      { key: 'id_dia_diem', label: 'Địa điểm', type: 'select', relation: 'locations', required: true },
      { key: 'tien_luong', label: 'Tiền lương', type: 'currency' },
      { key: 'chi_phi', label: 'Chi phí chuyến', type: 'currency' },
      { key: 'trang_thai', label: 'Thực hiện', type: 'select', options: EXECUTION_STATUS_OPTIONS },
      { key: 'phe_duyet', label: 'Phê duyệt', type: 'select', options: APPROVAL_OPTIONS, hideInForm: true },
      ...auditFields,
    ],
    columns: [
      { id: 'id_chuyen_xe', label: 'Chuyến xe', visible: true, minWidth: 160, maxWidth: 220, order: 0 },
      { id: 'id_dia_diem', label: 'Địa điểm', visible: true, minWidth: 160, maxWidth: 220, order: 1 },
      { id: 'tien_luong', label: 'Tiền lương', visible: true, minWidth: 140, maxWidth: 180, order: 2 },
      { id: 'chi_phi', label: 'Chi phí', visible: true, minWidth: 130, maxWidth: 170, order: 3 },
      { id: 'trang_thai', label: 'Thực hiện', visible: true, minWidth: 140, maxWidth: 170, order: 4 },
      { id: 'phe_duyet', label: 'Phê duyệt', visible: true, minWidth: 150, maxWidth: 190, order: 5 },
      ...auditColumns(6),
    ],
    seedRows: TRIP_DETAIL_ROWS,
    searchKeys: ['id_chuyen_xe', 'id_dia_diem', 'tien_luong', 'chi_phi', 'trang_thai', 'phe_duyet', 'ghi_chu'],
  },
  payroll: {
    id: 'bang-luong',
    title: 'Bảng lương',
    description: 'Tổng hợp lương chuyến, chi phí chuyến và chi phí khác theo tháng.',
    route: '/quan-ly-van-tai/bang-luong',
    tableName: 'vt_luong',
    icon: CircleDollarSign,
    color: 'bg-amber-500',
    nameKey: 'id_tai_xe',
    statusKey: 'trang_thai',
    fields: [
      { key: 'nam', label: 'Năm', type: 'number', required: true },
      { key: 'thang', label: 'Tháng', type: 'number', required: true },
      { key: 'id_tai_xe', label: 'Tài xế', type: 'select', relation: 'drivers', required: true },
      { key: 'luong_co_ban', label: 'Lương cơ bản', type: 'currency', readOnly: true, helperText: 'Tự động lấy từ Lương cơ bản của tài xế.' },
      { key: 'tong_luong_chuyen', label: 'Tổng lương chuyến', type: 'currency', readOnly: true, helperText: 'Tự động tính từ chuyến đi thực tế trong tháng.' },
      { key: 'tong_chi_phi_chuyen', label: 'Tổng chi phí chuyến', type: 'currency', readOnly: true, helperText: 'Tự động tính từ chi phí chuyến đi thực tế.' },
      { key: 'tru_tien_khac', label: 'Trừ tiền khác', type: 'currency', helperText: 'Ví dụ: tiền ứng, khoản trừ ngoài chuyến.' },
      { key: 'tong_chi_phi_khac', label: 'Chi phí khác', type: 'currency', helperText: 'Chi phí phát sinh ngoài chuyến.' },
      { key: 'tong_con_lai', label: 'Tổng tiền còn lại', type: 'currency', readOnly: true, helperText: 'Tự động tính bằng Lương cơ bản + Lương chuyến + Chi phí chuyến - Khoản trừ khác.' },
      { key: 'ghi_chu_khoan_tru', label: 'Ghi chú khoản trừ', type: 'textarea' },
      { key: 'ghi_chu_chi_phi', label: 'Ghi chú chi phí', type: 'textarea' },
      { key: 'trang_thai', label: 'Phê duyệt', type: 'select', options: PAYROLL_STATUS_OPTIONS, hideInForm: true },
    ],
    columns: [
      { id: 'nam', label: 'Năm', visible: true, minWidth: 100, maxWidth: 120, order: 0 },
      { id: 'thang', label: 'Tháng', visible: true, minWidth: 100, maxWidth: 120, order: 1 },
      { id: 'id_tai_xe', label: 'Tài xế', visible: true, minWidth: 140, maxWidth: 220, order: 2 },
      { id: 'luong_co_ban', label: 'Lương cơ bản', visible: true, minWidth: 140, maxWidth: 180, order: 3 },
      { id: 'tong_luong_chuyen', label: 'Lương chuyến', visible: true, minWidth: 150, maxWidth: 190, order: 4 },
      { id: 'tong_chi_phi_chuyen', label: 'Chi phí chuyến', visible: true, minWidth: 150, maxWidth: 190, order: 5 },
      { id: 'tru_tien_khac', label: 'Trừ tiền khác', visible: true, minWidth: 140, maxWidth: 180, order: 6 },
      { id: 'tong_chi_phi_khac', label: 'Chi phí khác', visible: true, minWidth: 140, maxWidth: 180, order: 7 },
      { id: 'tong_con_lai', label: 'Còn lại', visible: true, minWidth: 140, maxWidth: 180, order: 8 },
      { id: 'trang_thai', label: 'Phê duyệt', visible: true, minWidth: 140, maxWidth: 180, order: 9 },
      { id: 'actions', label: 'Thao tác', visible: true, minWidth: 120, maxWidth: 140, order: 10 },
    ],
    seedRows: PAYROLL_ROWS,
    searchKeys: ['nam', 'thang', 'id_tai_xe', 'luong_co_ban', 'tong_luong_chuyen', 'tong_chi_phi_chuyen', 'tru_tien_khac', 'tong_chi_phi_khac', 'tong_con_lai', 'trang_thai', 'ghi_chu_chi_phi', 'ghi_chu_khoan_tru'],
  },
} satisfies Record<string, TransportModuleConfig>;

export type TransportModuleKey = keyof typeof TRANSPORT_MODULES;

export interface TransportLookupRows {
  drivers: TransportRow[];
  locations: TransportRow[];
  vehicles: TransportRow[];
  trips: TransportRow[];
  tripDetails: TransportRow[];
  payroll: TransportRow[];
  employees: TransportRow[];
}

export const EMPTY_TRANSPORT_LOOKUPS: TransportLookupRows = {
  drivers: [],
  locations: [],
  vehicles: [],
  trips: [],
  tripDetails: [],
  payroll: [],
  employees: [],
};

export function getTransportModuleList(): TransportModuleConfig[] {
  return [
    TRANSPORT_MODULES.trips,
    TRANSPORT_MODULES.payroll,
    TRANSPORT_MODULES.drivers,
    TRANSPORT_MODULES.locations,
    TRANSPORT_MODULES.vehicles,
  ];
}

export function getRelationOptions(
  relation: TransportField['relation'],
  lookups: Partial<TransportLookupRows> = EMPTY_TRANSPORT_LOOKUPS,
): TransportOption[] {
  const safeLookups = lookups || EMPTY_TRANSPORT_LOOKUPS;
  const isSupa = isSupabase();
  const mockDrivers = MOCK_EMPLOYEES.filter((e) => e.la_tai_xe).map((e) => ({
    id: e.id,
    ho_ten: e.ho_va_ten,
  }));
  const drivers = safeLookups.drivers?.length ? safeLookups.drivers : (isSupa ? [] : mockDrivers);
  const locations = safeLookups.locations?.length ? safeLookups.locations : (isSupa ? [] : LOCATION_ROWS);
  const vehicles = safeLookups.vehicles?.length ? safeLookups.vehicles : (isSupa ? [] : VEHICLE_ROWS);
  const trips = safeLookups.trips?.length ? safeLookups.trips : (isSupa ? [] : TRIP_ROWS);
  const employees = safeLookups.employees?.length
    ? safeLookups.employees.map((row) => ({ value: row.id, label: String(row.ho_va_ten ?? row.ho_ten ?? row.ten ?? row.id) }))
    : (isSupa
        ? []
        : MOCK_EMPLOYEES.map((e) => ({ value: e.id, label: e.ho_va_ten })));
  switch (relation) {
    case 'drivers':
      return drivers.map((row) => ({ value: row.id, label: String(row.ho_ten) }));
    case 'locations':
      return locations.map((row) => ({ value: row.id, label: String(row.ten) }));
    case 'vehicles':
      return vehicles.map((row) => ({ value: row.id, label: `${row.bien_so} - ${row.hang}` }));
    case 'trips':
      return trips.map((row) => ({
        value: row.id,
        label: `${row.ngay} - ${resolveTransportValue('id_tai_xe', row.id_tai_xe, safeLookups)}`,
      }));
    case 'employees':
      return employees;
    default:
      return [];
  }
}

export function resolveTransportValue(
  key: string,
  value: unknown,
  lookups: Partial<TransportLookupRows> = EMPTY_TRANSPORT_LOOKUPS,
): string {
  if (value == null || value === '') return '—';
  const raw = String(value);
  if (key.startsWith('tg_')) {
    return formatDateTime(raw);
  }
  if (key === 'ngay' || key.startsWith('ngay_') || key.startsWith('han_')) {
    return formatDate(raw);
  }
  const safeLookups = lookups || EMPTY_TRANSPORT_LOOKUPS;
  const isSupa = isSupabase();
  const mockDrivers = MOCK_EMPLOYEES.filter((e) => e.la_tai_xe).map((e) => ({
    id: e.id,
    ho_ten: e.ho_va_ten,
  }));
  const drivers = safeLookups.drivers?.length ? safeLookups.drivers : (isSupa ? [] : mockDrivers);
  const locations = safeLookups.locations?.length ? safeLookups.locations : (isSupa ? [] : LOCATION_ROWS);
  const vehicles = safeLookups.vehicles?.length ? safeLookups.vehicles : (isSupa ? [] : VEHICLE_ROWS);
  const trips = safeLookups.trips?.length ? safeLookups.trips : (isSupa ? [] : TRIP_ROWS);

  if (key === 'id_tai_xe') {
    const driver = drivers.find((row) => String(row.id) === raw);
    if (driver) return driver.ho_ten as string;
    const employee = (safeLookups.employees || []).find((row) => String(row.id) === raw);
    return (employee?.ho_va_ten ?? employee?.ho_ten ?? employee?.ten ?? raw) as string;
  }
  if (key === 'id_dia_diem') return locations.find((row) => String(row.id) === raw)?.ten as string ?? raw;
  if (key === 'nhom_dia_diem') return resolveLocationGroup(raw, safeLookups);
  if (key === 'id_xe' || key === 'id_xe_mac_dinh') {
    const vehicle = vehicles.find((row) => String(row.id) === raw);
    return vehicle ? `${vehicle.bien_so} - ${vehicle.hang}` : raw;
  }
  if (key === 'id_nhan_vien') {
    const employee = (safeLookups.employees || []).find((row) => String(row.id) === raw);
    return employee ? String(employee.ho_va_ten ?? employee.ho_ten ?? employee.ten ?? raw) : raw;
  }
  if (key === 'id_chuyen_xe') {
    const trip = trips.find((row) => String(row.id) === raw);
    return trip ? `${trip.ngay} - ${resolveTransportValue('id_tai_xe', trip.id_tai_xe, safeLookups)}` : raw;
  }
  if (typeof value === 'number' && (key.includes('tien') || key.includes('phi') || key.includes('luong') || key.includes('con_lai'))) {
    return new Intl.NumberFormat('vi-VN').format(value);
  }
  return raw;
}

export function resolveLocationGroup(
  idDiaDiem: unknown,
  lookups: Partial<TransportLookupRows> = EMPTY_TRANSPORT_LOOKUPS,
): string {
  if (idDiaDiem == null || idDiaDiem === '') return '—';
  const raw = String(idDiaDiem);
  const safeLookups = lookups || EMPTY_TRANSPORT_LOOKUPS;
  const isSupa = isSupabase();
  const locations = safeLookups.locations?.length ? safeLookups.locations : (isSupa ? [] : LOCATION_ROWS);
  const location = locations.find((row) => String(row.id) === raw);
  return String(location?.nhom || 'Chưa phân nhóm địa điểm');
}

export function getTransportStatusKey(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/Ä‘|đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function isApprovedTransportStatus(value: unknown): boolean {
  return getTransportStatusKey(value) === 'da duyet';
}
