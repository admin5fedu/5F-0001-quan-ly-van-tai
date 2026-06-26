import { getDepartments } from '../../phong-ban/services/phong-ban-service';
import type { ActionType, PhanQuyenRow, PositionPermission } from '../core/types';
import { createRepository } from '@/lib/data/create-repository';
import { isSupabase } from '@/lib/data/config';
import { getPositions } from '../../chuc-vu/services/chuc-vu-service';
import {
  normalizePhanQuyenRow,
  phanQuyenRowsToGrants,
  positionToMatrixRow,
} from '../core/map-matrix';
import { PHAN_QUYEN_RETURNING_FULL, PHAN_QUYEN_SELECT_FULL } from '../core/supabase-select';
import {
  PERMISSION_FUNCTIONS,
  PERMISSION_ACTIONS,
  getAllPermissionModules,
} from '../core/permission-modules-config';
import { getSupabase } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/lib/supabase/errors';

export const SYSTEM_MODULES_CONFIG = getAllPermissionModules().map((m) => ({
  id: m.id,
  nameKey: m.nameKey,
  allowedActions: [...PERMISSION_ACTIONS] as ActionType[],
}));

export function getModuleName(moduleId: string): string {
  const m = SYSTEM_MODULES_CONFIG.find((x) => x.id === moduleId);
  return m?.nameKey ?? moduleId;
}

function buildMockPhanQuyen(): PhanQuyenRow[] {
  const fullActions = [...PERMISSION_ACTIONS] as ActionType[];
  const now = new Date().toISOString();
  let seq = 1;
  const rows: PhanQuyenRow[] = [];
  for (const vaiTro of ['pos-1', 'pos-3']) {
    for (const m of SYSTEM_MODULES_CONFIG) {
      rows.push({
        id: String(seq++),
        vai_tro: vaiTro,
        module_key: m.id,
        phan_quyen: fullActions,
        tg_cap_nhat: now,
      });
    }
  }
  return rows;
}

const phanQuyenRepo = createRepository<PhanQuyenRow>({
  tableName: 'var_phan_quyen',
  mockData: buildMockPhanQuyen(),
  select: PHAN_QUYEN_SELECT_FULL,
  delay: 500,
});

async function getAllPhanQuyenRows(): Promise<PhanQuyenRow[]> {
  const rows = await phanQuyenRepo.getAll();
  if (!isSupabase()) return rows.map(normalizePhanQuyenRow);
  return aggregatePermissionRows(rows as unknown as DbPermissionRow[]);
}

type DbPermission = 'xem' | 'them' | 'sua' | 'xoa' | 'kiem_tra' | 'quan_tri';
type DbPermissionRow = {
  id: string;
  vai_tro: string;
  module_key: string;
  quyen?: DbPermission;
  tg_cap_nhat?: string;
};

const ACTION_TO_DB: Partial<Record<ActionType, DbPermission>> = {
  view: 'xem',
  create: 'them',
  update: 'sua',
  delete: 'xoa',
  check: 'kiem_tra',
  admin: 'quan_tri',
};

const DB_TO_ACTION: Record<DbPermission, ActionType> = {
  xem: 'view',
  them: 'create',
  sua: 'update',
  xoa: 'delete',
  kiem_tra: 'check',
  quan_tri: 'admin',
};

function aggregatePermissionRows(rows: DbPermissionRow[]): PhanQuyenRow[] {
  const map = new Map<string, PhanQuyenRow>();
  for (const row of rows) {
    const key = `${row.vai_tro}::${row.module_key}`;
    const current = map.get(key) ?? {
      id: row.id,
      vai_tro: String(row.vai_tro),
      module_key: String(row.module_key),
      phan_quyen: [],
      tg_cap_nhat: row.tg_cap_nhat ?? new Date().toISOString(),
    };
    if (row.quyen) {
      const action = DB_TO_ACTION[row.quyen];
      if (!current.phan_quyen.includes(action)) current.phan_quyen.push(action);
    }
    map.set(key, current);
  }
  return Array.from(map.values()).map((r) => normalizePhanQuyenRow(r));
}

export const getPhanQuyenByVaiTro = async (vaiTro: string): Promise<PhanQuyenRow[]> => {
  if (isSupabase()) {
    const supabase = getSupabase();
    if (!supabase) return [];
    const { data, error } = await supabase
      .from('var_phan_quyen')
      .select(PHAN_QUYEN_SELECT_FULL)
      .eq('id_chuc_vu', vaiTro);
    if (error) handleSupabaseError(error);
    return aggregatePermissionRows((data ?? []) as unknown as DbPermissionRow[]);
  }
  const all = await getAllPhanQuyenRows();
  return all.filter((r) => r.vai_tro === vaiTro);
};

export const getPhanQuyenGrantsByVaiTro = async (
  vaiTro: string,
): Promise<Record<string, ActionType[]>> => {
  const rows = await getPhanQuyenByVaiTro(vaiTro);
  return phanQuyenRowsToGrants(rows);
};

export const getRoles = async (): Promise<PositionPermission[]> => {
  const [positions, rows, depts] = await Promise.all([
    getPositions(),
    getAllPhanQuyenRows(),
    getDepartments(),
  ]);
  const active = positions.filter((p) => p.trang_thai === 'Đang hoạt động');
  return active.map((p) => {
    const dept = depts.find((d) => d.id === p.phong_ban_id);
    return positionToMatrixRow(p, rows, getModuleName, dept?.thu_tu);
  });
};

async function upsertMockPhanQuyen(
  vaiTro: string,
  moduleKey: string,
  actions: ActionType[],
): Promise<void> {
  const all = await getAllPhanQuyenRows();
  const existing = all.find((r) => r.vai_tro === vaiTro && r.module_key === moduleKey);
  const now = new Date().toISOString();

  if (actions.length === 0) {
    if (existing) await phanQuyenRepo.remove([existing.id]);
    return;
  }

  if (existing) {
    await phanQuyenRepo.update(existing.id, { phan_quyen: actions, tg_cap_nhat: now });
  } else {
    await phanQuyenRepo.insert({
      vai_tro: vaiTro,
      module_key: moduleKey,
      phan_quyen: actions,
      tg_cap_nhat: now,
    });
  }
}

async function upsertSupabasePhanQuyen(
  moduleId: string,
  updates: { roleId: string; actions: ActionType[] }[],
): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase client is not configured.');

  const now = new Date().toISOString();

  for (const { roleId, actions } of updates) {
    // 1. Delete all existing permissions for this role and module
    const { error: deleteError } = await supabase
      .from('var_phan_quyen')
      .delete()
      .eq('id_chuc_vu', roleId)
      .eq('id_module', moduleId);
    if (deleteError) {
      handleSupabaseError(deleteError);
    }

    // 2. Insert new checked permissions if any
    if (actions.length > 0) {
      const toInsert = actions
        .map((action) => {
          const quyen = ACTION_TO_DB[action];
          if (!quyen) return null;
          return {
            id_chuc_vu: roleId,
            id_module: moduleId,
            quyen,
            tg_cap_nhat: now,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (toInsert.length > 0) {
        const { error: insertError } = await (supabase.from('var_phan_quyen') as any)
          .insert(toInsert);
        if (insertError) {
          handleSupabaseError(insertError);
        }
      }
    }
  }
}

export const updateModulePermissions = async (
  moduleId: string,
  updates: { roleId: string; actions: ActionType[] }[],
): Promise<void> => {
  if (isSupabase()) {
    await upsertSupabasePhanQuyen(moduleId, updates);
    return;
  }
  for (const { roleId, actions } of updates) {
    await upsertMockPhanQuyen(roleId, moduleId, actions);
  }
};

export { PERMISSION_FUNCTIONS, PERMISSION_ACTIONS, getAllPermissionModules };
export type { PermissionFunction } from '../core/permission-modules-config';
