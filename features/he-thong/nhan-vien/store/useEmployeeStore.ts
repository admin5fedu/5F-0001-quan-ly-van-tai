import { createGenericStore, type ColumnConfig } from '../../../../store/createGenericStore';
import { TABLE_COLUMN_PRESETS } from '../../../../lib/table-column-presets';
import type { EmployeeFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ho_va_ten', label: 'Họ và tên', visible: true, ...P.personName, order: 0 },
  { id: 'ten_dang_nhap', label: 'Tên đăng nhập', visible: true, ...P.code, order: 1 },
  { id: 'so_dien_thoai', label: 'Số điện thoại', visible: true, ...P.phone, order: 2 },
  { id: 'email', label: 'Email thực tế', visible: true, ...P.email, order: 3 },
  { id: 'ten_chuc_vu', label: 'Chức vụ', visible: true, ...P.titleShort, order: 4 },
  { id: 'ten_phong_ban', label: 'Phòng ban', visible: true, ...P.branch, order: 5 },
  { id: 'ten_bo_phan', label: 'Bộ phận', visible: true, ...P.branch, order: 6 },
  { id: 'luong_co_ban', label: 'Lương cơ bản', visible: true, ...P.money, order: 7 },
  { id: 'la_tai_xe', label: 'Tài xế', visible: true, ...P.enumBadgeShort, order: 8 },
  { id: 'trang_thai', label: 'Trạng thái', visible: true, ...P.enumBadge, order: 9 },
  { id: 'tg_tao', label: 'Ngày tạo', visible: false, ...P.date, order: 10 },
];

const initialFilters: EmployeeFilters = {
  columnSearch: {},
  trang_thai: [],
  id_phong_ban: [],
  id_chuc_vu: [],
};

export const useEmployeeStore = createGenericStore<EmployeeFilters>(initialFilters, DEFAULT_COLUMNS);
