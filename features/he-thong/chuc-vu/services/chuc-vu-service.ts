import { Position } from '../core/types';
import { PositionFormValues, positionSchema } from '../core/schema';
import { parseTrangThaiHoatDongImport, type TrangThaiHoatDong } from '@/lib/constants/trang-thai';
import { getDepartments } from '../../phong-ban/services/phong-ban-service';
import { createRepository } from '@/lib/data/create-repository';
import { isSupabase } from '@/lib/data/config';
import { MOCK_POSITIONS } from '@/mocks';
import {
  POSITION_RETURNING_FULL,
  POSITION_RETURNING_STATUS_ONLY,
  POSITION_SELECT_FULL,
} from '../core/supabase-select';
import { txt } from '../../../../lib/text';
import { assertAllBatchSucceeded, runInBatchesSettled } from '@/lib/async-utils';

const repo = createRepository<Position>({
  tableName: 'var_chuc_vu',
  mockData: MOCK_POSITIONS,
  select: POSITION_SELECT_FULL,
  delay: 600,
});

function flattenSupabaseRow(row: Record<string, unknown>): Position {
  const phongBan = row.var_phong_ban as { ten_phong_ban?: string } | null | undefined;
  const rest = { ...row };
  delete rest.var_phong_ban;
  return {
    ...rest,
    thu_tu: (row.thu_tu ?? row.tt ?? 0) as number,
    ten_phong_ban: phongBan?.ten_phong_ban,
  } as Position;
}

async function enrichPosition(raw: Position): Promise<Position> {
  if (isSupabase()) return raw;
  const depts = await getDepartments();
  return {
    ...raw,
    ten_phong_ban: depts.find((d) => d.id === raw.phong_ban_id)?.ten_phong_ban,
  };
}

export const getPositions = async (): Promise<Position[]> => {
  const list = await repo.getAll({ orderBy: 'tt', ascending: true });
  const flattened = isSupabase() ? (list as unknown as Record<string, unknown>[]).map(flattenSupabaseRow) : list;
  return Promise.all(flattened.map(enrichPosition));
};

function resolveCapBacForDb(value: number | null | undefined): number {
  if (value == null || value < 1 || value > 4) return 4;
  return value;
}

export const createPosition = async (data: PositionFormValues): Promise<Position> => {
  const now = new Date().toISOString();
  const inserted = await repo.insert(
    {
    ma_chuc_vu: data.ma_chuc_vu,
    ten_chuc_vu: data.ten_chuc_vu,
    cap_bac: resolveCapBacForDb(data.cap_bac),
    id_phong_ban: data.phong_ban_id ?? null,
    mo_ta: data.mo_ta ?? null,
    tt: data.thu_tu ?? 0,
    trang_thai: data.trang_thai,
    tg_tao: now,
    tg_cap_nhat: now,
  } as unknown as Omit<Position, 'id'>,
    { returningSelect: POSITION_RETURNING_FULL },
  );
  const flat = isSupabase() ? flattenSupabaseRow(inserted as unknown as Record<string, unknown>) : inserted;
  return enrichPosition(flat);
};

export const updatePosition = async (id: string, data: PositionFormValues): Promise<Position> => {
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('position.service.notFound'));
  const updated = await repo.update(
    id,
    {
    ma_chuc_vu: data.ma_chuc_vu,
    ten_chuc_vu: data.ten_chuc_vu,
    cap_bac: resolveCapBacForDb(data.cap_bac ?? existing.cap_bac),
    id_phong_ban: data.phong_ban_id ?? null,
    mo_ta: data.mo_ta ?? null,
    tt: data.thu_tu ?? existing.thu_tu,
    trang_thai: data.trang_thai,
    tg_cap_nhat: new Date().toISOString(),
    } as unknown as Partial<Position>,
    { returningSelect: POSITION_RETURNING_FULL },
  );
  const flat = isSupabase() ? flattenSupabaseRow(updated as unknown as Record<string, unknown>) : updated;
  return enrichPosition(flat);
};

export const updatePositionStatus = async (ids: string[], status: TrangThaiHoatDong): Promise<Position | undefined> => {
  const timestamp = new Date().toISOString();
  const results = await runInBatchesSettled(ids, 5, (id) =>
    repo.update(
      id,
      { trang_thai: status, tg_cap_nhat: timestamp },
      { returningSelect: POSITION_RETURNING_STATUS_ONLY },
    ),
  );
  assertAllBatchSucceeded(results);
  if (ids.length !== 1) return undefined;
  const only = results[0];
  if (!only?.ok) return undefined;
  let result = only.value;
  if (isSupabase()) result = flattenSupabaseRow(result as unknown as Record<string, unknown>);
  return enrichPosition(result);
};

export const deletePositions = async (ids: string[]): Promise<void> => {
  await repo.remove(ids);
};

/** Import nhiều chức vụ (chỉ thêm mới). Cột gợi ý: ma_chuc_vu, ten_chuc_vu, cap_bac, ma_phong_ban|phong_ban_id, mo_ta, thu_tu, trang_thai */
export const importPositions = async (
  rows: Record<string, unknown>[]
): Promise<{ created: number; errors: string[] }> => {
  const depts = await getDepartments();
  const errors: string[] = [];
  let created = 0;

  const parseCapBac = (raw: unknown): number | null | undefined => {
    if (raw == null || String(raw).trim() === '') return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < 0 || n > 32767) return undefined;
    return n;
  };

  const resolveDeptId = (raw: unknown): string | null => {
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    const byId = depts.find((d) => d.id === s);
    if (byId) return byId.id;
    const up = s.toUpperCase();
    const byMa = depts.find((d) => d.ma_phong_ban?.toUpperCase() === up);
    return byMa?.id ?? null;
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const ma_chuc_vu = String(row.ma_chuc_vu ?? '').trim().toUpperCase();
    const ten_chuc_vu = String(row.ten_chuc_vu ?? '').trim();
    if (!ma_chuc_vu || !ten_chuc_vu) {
      errors.push(`Dòng ${i + 2}: Thiếu mã hoặc tên chức vụ`);
      continue;
    }

    const capRaw = row.cap_bac;
    const pbRaw = row.phong_ban_id ?? row.ma_phong_ban;
    const cap_bac = parseCapBac(capRaw);
    const phong_ban_id = resolveDeptId(pbRaw);
    if (capRaw != null && String(capRaw).trim() !== '' && cap_bac === undefined) {
      errors.push(`Dòng ${i + 2}: Cấp bậc không hợp lệ (số nguyên 0–32767)`);
      continue;
    }
    if (pbRaw != null && String(pbRaw).trim() !== '' && !phong_ban_id) {
      errors.push(`Dòng ${i + 2}: Không tìm thấy phòng ban (mã hoặc id)`);
      continue;
    }

    const parsed = positionSchema.safeParse({
      ma_chuc_vu,
      ten_chuc_vu,
      cap_bac: cap_bac ?? null,
      phong_ban_id: phong_ban_id ?? '',
      mo_ta: row.mo_ta != null ? String(row.mo_ta) : '',
      thu_tu: row.thu_tu != null && String(row.thu_tu).trim() !== '' ? Number(row.thu_tu) : 0,
      trang_thai: parseTrangThaiHoatDongImport(row.trang_thai),
    });
    if (!parsed.success) {
      const msg = parsed.error.flatten().formErrors[0] ?? parsed.error.message;
      errors.push(`Dòng ${i + 2}: ${msg}`);
      continue;
    }

    try {
      await createPosition({
        ...parsed.data,
        cap_bac: cap_bac ?? null,
        phong_ban_id: phong_ban_id ?? null,
        mo_ta: parsed.data.mo_ta?.trim() || null,
      });
      created++;
    } catch (e: unknown) {
      errors.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message : 'Lỗi'}`);
    }
  }

  return { created, errors };
};
