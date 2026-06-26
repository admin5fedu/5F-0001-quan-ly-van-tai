/** Bảng `var_phan_quyen` — liệt kê cột thay vì `*`. */
export const PHAN_QUYEN_ROW_COLUMNS = [
  'id',
  'vai_tro:id_chuc_vu',
  'module_key:id_module',
  'quyen',
  'tg_cap_nhat',
].join(',');

export const PHAN_QUYEN_SELECT_FULL = PHAN_QUYEN_ROW_COLUMNS;

export const PHAN_QUYEN_RETURNING_FULL = PHAN_QUYEN_ROW_COLUMNS;
