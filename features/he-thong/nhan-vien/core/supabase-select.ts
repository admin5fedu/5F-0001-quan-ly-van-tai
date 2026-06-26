/**
 * PostgREST `.select()` cho bảng `var_nhan_vien`.
 * Danh sách cột bám sát sheet Fix app: không thêm hồ sơ HR mở rộng.
 */
export const VAR_NHAN_VIEN_ROW_COLUMNS = [
  'id',
  'ho_va_ten',
  'avatar',
  'trang_thai',
  'id_phong_ban',
  'id_chuc_vu',
  'so_dien_thoai',
  'email',
  'ten_dang_nhap',
  'id_nguoi_tao',
  'tg_tao',
  'tg_cap_nhat',
  'la_tai_xe',
  'ngay_sinh',
  'dia_chi',
  'so_gplx',
  'hang_bang',
  'ngay_het_han_bang',
  'id_xe_mac_dinh',
  'thong_tin_khac',
  'ghi_chu',
  'luong_co_ban',
].join(',');

export const EMPLOYEE_SELECT_LIST = `${VAR_NHAN_VIEN_ROW_COLUMNS},var_phong_ban(ten_phong_ban),var_chuc_vu(ten_chuc_vu)`;
export const EMPLOYEE_SELECT_FULL = EMPLOYEE_SELECT_LIST;
export const EMPLOYEE_RETURNING_FULL = EMPLOYEE_SELECT_FULL;
export const EMPLOYEE_RETURNING_STATUS_ONLY = `id,trang_thai,tg_cap_nhat,var_phong_ban(ten_phong_ban),var_chuc_vu(ten_chuc_vu)`;
