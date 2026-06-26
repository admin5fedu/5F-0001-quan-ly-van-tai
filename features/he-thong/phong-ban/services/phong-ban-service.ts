import { Department } from '../core/types';
import { DepartmentFormValues } from '../core/schema';
import { MOCK_DEPARTMENTS } from '@/mocks/he-thong';
import { createRepository } from '@/lib/data/create-repository';
import type { TrangThaiHoatDong } from '@/lib/constants/trang-thai';
import {
  DEPARTMENT_RETURNING_FULL,
  DEPARTMENT_RETURNING_STATUS_ONLY,
  DEPARTMENT_SELECT_FULL,
} from '../core/supabase-select';
import { txt } from '../../../../lib/text';

const repo = createRepository<Department>({
  tableName: 'var_phong_ban',
  mockData: MOCK_DEPARTMENTS,
  select: DEPARTMENT_SELECT_FULL,
  delay: 600,
});

function normalizeDepartment(item: Department): Department {
  return {
    ...item,
    id: String(item.id),
    cha_id: item.cha_id ? String(item.cha_id) : null,
    thu_tu: item.thu_tu ?? (item as any).tt ?? 0,
    cap_do: item.cap_do ?? 1,
    duong_dan: item.duong_dan ?? `/${item.id}`,
  };
}

function normalizeDepartmentTree(items: Department[]): Department[] {
  const normalizedItems = items.map((item) => ({
    ...item,
    id: String(item.id),
    cha_id: item.cha_id ? String(item.cha_id) : null,
    thu_tu: item.thu_tu ?? (item as any).tt ?? 0,
  }));


  const build = (item: Department): Department => {
    let duong_dan = `/${item.id}`;
    let cap_do = 1;
    if (item.cha_id) {
      const parent = normalizedItems.find((d) => d.id === item.cha_id);
      if (parent) {
        const normalizedParent = build(parent);
        duong_dan = `${normalizedParent.duong_dan}/${item.id}`;
        cap_do = normalizedParent.cap_do + 1;
      }
    }
    return { ...item, duong_dan, cap_do };
  };

  return normalizedItems.map(build);
}

export const getDepartments = async (): Promise<Department[]> => {
  const list = await repo.getAll({ orderBy: 'tt', ascending: true });
  return normalizeDepartmentTree(list);
};

export const createDepartment = async (data: DepartmentFormValues): Promise<Department> => {
  const chaId = data.cha_id === '' || data.cha_id == null ? null : data.cha_id;
  const now = new Date().toISOString();
  const newDep = await repo.insert(
    {
    ma_phong_ban: data.ma_phong_ban,
    ten_phong_ban: data.ten_phong_ban,
    mo_ta: data.mo_ta,
    id_phong_ban_quan_ly: chaId,
    trang_thai: data.trang_thai,
    tt: data.thu_tu ?? 0,
    tg_tao: now,
    tg_cap_nhat: now,
  } as unknown as Omit<Department, 'id'>,
    { returningSelect: DEPARTMENT_RETURNING_FULL },
  );
  return normalizeDepartment(newDep);
};

export const updateDepartment = async (id: string, data: DepartmentFormValues): Promise<Department> => {
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('department.service.notFound'));

  const chaId = data.cha_id === '' || data.cha_id == null ? null : data.cha_id;
  const updated = await repo.update(
    id,
    {
      ma_phong_ban: data.ma_phong_ban,
      ten_phong_ban: data.ten_phong_ban,
      mo_ta: data.mo_ta,
      id_phong_ban_quan_ly: chaId,
      trang_thai: data.trang_thai,
      tt: data.thu_tu ?? 0,
      tg_cap_nhat: new Date().toISOString(),
    } as unknown as Partial<Department>,
    { returningSelect: DEPARTMENT_RETURNING_FULL },
  );
  return normalizeDepartment(updated);
};

export const updateDepartmentStatus = async (id: string, status: TrangThaiHoatDong): Promise<Department> => {
  const existing = await repo.getById(id);
  if (!existing) throw new Error(txt('department.service.notFound'));
  const updated = await repo.update(
    id,
    { trang_thai: status, tg_cap_nhat: new Date().toISOString() },
    { returningSelect: DEPARTMENT_RETURNING_STATUS_ONLY },
  );
  return normalizeDepartment(updated);
};

export const deleteDepartment = async (id: string): Promise<void> => {
  const all = await repo.getAll();
  const hasChildren = all.some((d) => d.cha_id === id);
  if (hasChildren) throw new Error(txt('department.service.hasChildren'));
  await repo.remove([id]);
};

/** Import nhiều phòng ban (chỉ thêm mới, cha_id = null hoặc id có sẵn) */
export const importDepartments = async (
  rows: DepartmentFormValues[]
): Promise<{ created: number; errors: string[] }> => {
  const errors: string[] = [];
  let created = 0;
  for (let i = 0; i < rows.length; i++) {
    try {
      const data = rows[i];
      const idCha = data.cha_id === '' || data.cha_id == null ? null : data.cha_id;
      if (idCha) {
        const all = await repo.getAll();
        const parent = all.find((d) => d.id === idCha);
        if (!parent) {
          errors.push(`Dòng ${i + 2}: Phòng cha không tồn tại`);
          continue;
        }
        if (parent.cha_id) {
          errors.push(`Dòng ${i + 2}: Phòng cha phải là phòng ban cấp 1 (hệ thống chỉ hỗ trợ tối đa 2 cấp)`);
          continue;
        }
      }
      await createDepartment({ ...data, cha_id: idCha ?? undefined });
      created++;
    } catch (e: unknown) {
      errors.push(`Dòng ${i + 2}: ${e instanceof Error ? e.message : 'Lỗi'}`);
    }
  }
  return { created, errors };
};
