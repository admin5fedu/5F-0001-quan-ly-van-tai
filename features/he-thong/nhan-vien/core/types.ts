import type { TrangThaiNhanVien } from './constants';

export type Gender = 'Nam' | 'Nữ' | 'Khác';

export interface Employee {
  id: string;
  ho_va_ten: string;
  avatar?: string | null;
  trang_thai: TrangThaiNhanVien;
  id_phong_ban: string | null;
  id_chuc_vu: string | null;
  so_dien_thoai?: string | null;
  email?: string | null;
  ten_dang_nhap?: string | null;
  id_nguoi_tao?: string | null;
  tg_tao?: string;
  tg_cap_nhat?: string;

  ten_phong_ban?: string;
  ten_bo_phan?: string;
  ten_chuc_vu?: string;

  la_tai_xe?: boolean;
  ngay_sinh?: string | null;
  dia_chi?: string | null;
  so_gplx?: string | null;
  hang_bang?: string | null;
  ngay_het_han_bang?: string | null;
  id_xe_mac_dinh?: string | number | null;
  thong_tin_khac?: string | null;
  ghi_chu?: string | null;
  luong_co_ban?: number | null;
}

export interface EmployeeFilters {
  columnSearch: Record<string, string>;
  trang_thai: string[];
  id_phong_ban: string[];
  id_chuc_vu: string[];
}
