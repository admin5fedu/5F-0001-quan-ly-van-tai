/** PostgREST: không dùng `*` — giảm egress. */
export const HE_THONG_CHUC_VU_ROW_COLUMNS = [
  'id',
  'tt',
  'ma_chuc_vu',
  'ten_chuc_vu',
  'cap_bac',
  'phong_ban_id:id_phong_ban',
  'mo_ta',
  'trang_thai',
  'tg_tao',
  'tg_cap_nhat',
].join(',');

export const POSITION_SELECT_FULL = `${HE_THONG_CHUC_VU_ROW_COLUMNS},var_phong_ban(ten_phong_ban)`;

export const POSITION_RETURNING_FULL = POSITION_SELECT_FULL;

/** Chỉ đổi trạng thái — merge ở hook; payload trả về nhỏ. */
export const POSITION_RETURNING_STATUS_ONLY =
  'id,trang_thai,tg_cap_nhat,cap_bac,var_phong_ban(ten_phong_ban)';
