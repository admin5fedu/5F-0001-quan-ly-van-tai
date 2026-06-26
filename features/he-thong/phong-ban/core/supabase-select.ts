export const HE_THONG_PHONG_BAN_ROW_COLUMNS = [
  'id',
  'tt',
  'ma_phong_ban',
  'ten_phong_ban',
  'mo_ta',
  'cha_id:id_phong_ban_quan_ly',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
].join(',');

export const DEPARTMENT_SELECT_FULL = HE_THONG_PHONG_BAN_ROW_COLUMNS;

export const DEPARTMENT_RETURNING_FULL = DEPARTMENT_SELECT_FULL;

export const DEPARTMENT_RETURNING_STATUS_ONLY = 'id,trang_thai,tg_cap_nhat';
