import type { Position } from '../../chuc-vu/core/types';
import type { ActionType, ModulePermission, PhanQuyenRow, PositionPermission } from './types';

export function normalizePhanQuyenRow(row: PhanQuyenRow & { id: string | number }): PhanQuyenRow {
  return {
    ...row,
    id: String(row.id),
    phan_quyen: Array.isArray(row.phan_quyen) ? row.phan_quyen : [],
  };
}

export function rowsToQuyenHan(
  rows: PhanQuyenRow[],
  getModuleName: (moduleKey: string) => string,
): ModulePermission[] {
  return rows.map((r) => ({
    module_id: r.module_key,
    module_name: getModuleName(r.module_key),
    actions: [...r.phan_quyen],
  }));
}

export function positionToMatrixRow(
  position: Position,
  rows: PhanQuyenRow[],
  getModuleName: (moduleKey: string) => string,
  deptOrder?: number,
): PositionPermission {
  const forPosition = rows.filter((r) => r.vai_tro === position.id);
  const latestRowTs = forPosition.reduce(
    (max, r) => (r.tg_cap_nhat > max ? r.tg_cap_nhat : max),
    '',
  );
  return {
    id: position.id,
    id_chuc_vu: position.id,
    ma_chuc_vu: position.ma_chuc_vu,
    ten_chuc_vu: position.ten_chuc_vu,
    ten_phong_ban: position.ten_phong_ban ?? '',
    thu_tu_phong_ban: deptOrder,
    thu_tu_chuc_vu: position.thu_tu,
    mo_ta: position.mo_ta,
    so_nhan_vien: 0,
    quyen_han: rowsToQuyenHan(forPosition, getModuleName),
    trang_thai: position.trang_thai,
    tg_cap_nhat: latestRowTs || position.tg_cap_nhat,
  };
}

export function phanQuyenRowsToGrants(rows: PhanQuyenRow[]): Record<string, ActionType[]> {
  const out: Record<string, ActionType[]> = {};
  for (const r of rows) {
    if (r.phan_quyen.length > 0) {
      out[r.module_key] = [...r.phan_quyen];
    }
  }
  return out;
}
