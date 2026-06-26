import type { TrangThaiNhanVien } from '../core/constants';
import type { Employee } from '../core/types';
import type { Position } from '../../chuc-vu/core/types';
import type { Department } from '../../phong-ban/core/types';
import type { EmployeeFormValues } from '../core/schema';
import { getPositions } from '../../chuc-vu/services/chuc-vu-service';
import { getDepartments } from '../../phong-ban/services/phong-ban-service';
import { createRepository } from '@/lib/data/create-repository';
import { isSupabase } from '@/lib/data/config';
import { MOCK_EMPLOYEES } from '@/mocks';
import { EMPLOYEES_LIST_QUERY_PARAMS } from '@/lib/query-keys';
import { txt } from '../../../../lib/text';
import { getAvatarUrl } from '../../../../lib/utils';
import { resolveEmployeeDepartmentLabels } from '../utils/employee-department';
import {
  EMPLOYEE_RETURNING_FULL,
  EMPLOYEE_RETURNING_STATUS_ONLY,
  EMPLOYEE_SELECT_FULL,
  EMPLOYEE_SELECT_LIST,
} from '../core/supabase-select';
import { assertAllBatchSucceeded, runInBatchesSettled } from '@/lib/async-utils';

const CURRENT_USER_ID = 'emp-000';

const repo = createRepository<Employee>({
  tableName: 'var_nhan_vien',
  mockData: MOCK_EMPLOYEES,
  select: EMPLOYEE_SELECT_LIST,
  delay: 600,
});

export type GetEmployeesParams = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  ascending?: boolean;
};

function flattenSupabaseRow(row: Record<string, unknown>): Employee {
  const phongBan = row.var_phong_ban as { ten_phong_ban?: string } | null | undefined;
  const chucVu = row.var_chuc_vu as { ten_chuc_vu?: string } | null | undefined;
  const { var_phong_ban: _var_phong_ban, var_chuc_vu: _var_chuc_vu, ...rest } = row;
  return {
    ...rest,
    ten_phong_ban: phongBan?.ten_phong_ban,
    ten_chuc_vu: chucVu?.ten_chuc_vu,
  } as Employee;
}

function enrichEmployee(raw: Employee, positions: Position[], depts: Department[]): Employee {
  const positionId = String(raw.id_chuc_vu ?? '');
  const departmentLabels = resolveEmployeeDepartmentLabels(raw.id_phong_ban, depts, raw.ten_phong_ban);
  return {
    ...raw,
    ...departmentLabels,
    ten_chuc_vu:
      raw.ten_chuc_vu ??
      positions.find((p) => String(p.id) === positionId || String(p.id) === `pos-${positionId}`)?.ten_chuc_vu,
  };
}

async function mapEmployeeRows(list: Employee[]): Promise<Employee[]> {
  const flattened = isSupabase()
    ? (list as unknown as Record<string, unknown>[]).map(flattenSupabaseRow)
    : list;
  const [positions, depts] = await Promise.all([getPositions(), getDepartments()]);
  return flattened.map((item) => enrichEmployee(item, positions, depts));
}

async function syncEmployeeAuth(payload: {
  operation: 'create' | 'update' | 'delete' | 'setPassword';
  username?: string | null;
  oldUsername?: string | null;
  newUsername?: string | null;
  password?: string | null;
  newPassword?: string | null;
  full_name?: string | null;
  id_chuc_vu?: number | string | null;
  id_phong_ban?: number | string | null;
}) {
  const hasUsername = payload.username || payload.oldUsername || payload.newUsername;
  if (!isSupabase() || !hasUsername) return;
  try {
    const response = await fetch('/api/employee-auth-sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errMsg = typeof data.error === 'string' ? data.error : 'Không đồng bộ được Supabase Auth';
      console.warn('Auth sync status warning:', errMsg);
      if (payload.operation === 'delete' || errMsg.toLowerCase().includes('env is missing')) {
        return;
      }
      throw new Error(errMsg);
    }
  } catch (error) {
    console.error('Auth sync network/execution error:', error);
    if (payload.operation === 'delete') {
      return;
    }
    throw error;
  }
}

async function resolveDepartmentIdFromPosition(positionId: string | null | undefined): Promise<string | null> {
  if (!positionId) return null;
  const positions = await getPositions();
  const position = positions.find((item) => String(item.id) === String(positionId));
  return position?.phong_ban_id ? String(position.phong_ban_id) : null;
}

async function toDbPayload(data: EmployeeFormValues): Promise<Omit<Employee, 'id'>> {
  const departmentId =
    data.id_phong_ban && data.id_phong_ban !== ''
      ? String(data.id_phong_ban)
      : await resolveDepartmentIdFromPosition(data.id_chuc_vu || null);
  return {
    ho_va_ten: data.ho_va_ten.trim(),
    avatar: data.avatar || getAvatarUrl(data.ho_va_ten),
    trang_thai: data.trang_thai,
    id_phong_ban: departmentId,
    id_chuc_vu: data.id_chuc_vu || null,
    so_dien_thoai: data.so_dien_thoai || null,
    email: data.email || null,
    ten_dang_nhap: data.ten_dang_nhap?.trim() || null,
    id_nguoi_tao: CURRENT_USER_ID,
    tg_cap_nhat: new Date().toISOString(),
    la_tai_xe: data.la_tai_xe,
    ngay_sinh: data.ngay_sinh || null,
    dia_chi: data.dia_chi || null,
    so_gplx: data.so_gplx || null,
    hang_bang: data.hang_bang || null,
    ngay_het_han_bang: data.ngay_het_han_bang || null,
    id_xe_mac_dinh: data.id_xe_mac_dinh ? Number(data.id_xe_mac_dinh) : null,
    thong_tin_khac: data.thong_tin_khac || null,
    ghi_chu: data.ghi_chu || null,
    luong_co_ban: data.luong_co_ban != null ? Number(data.luong_co_ban) : 0,
  };
}

export const getEmployeeCount = async (): Promise<number> => repo.count();

export type EmployeesListResult = {
  items: Employee[];
  total: number;
};

export const getEmployeesPage = async (params: GetEmployeesParams = {}): Promise<EmployeesListResult> => {
  const limit = params.limit ?? EMPLOYEES_LIST_QUERY_PARAMS.limit;
  const offset = params.offset ?? EMPLOYEES_LIST_QUERY_PARAMS.offset;
  const orderBy = params.orderBy ?? EMPLOYEES_LIST_QUERY_PARAMS.orderBy;
  const ascending = params.ascending ?? EMPLOYEES_LIST_QUERY_PARAMS.ascending;
  const { items, total } = await repo.getPage({ limit, offset, orderBy, ascending, select: EMPLOYEE_SELECT_LIST });
  return { items: await mapEmployeeRows(items), total };
};

export const getEmployees = async (params: GetEmployeesParams = {}): Promise<Employee[]> => {
  const { items } = await getEmployeesPage({
    ...params,
    limit: params.limit ?? EMPLOYEES_LIST_QUERY_PARAMS.limit,
    offset: params.offset ?? EMPLOYEES_LIST_QUERY_PARAMS.offset,
  });
  return items;
};

export const getEmployeeById = async (id: string): Promise<Employee | undefined> => {
  const row = await repo.getById(id, { select: EMPLOYEE_SELECT_FULL });
  if (!row) return undefined;
  const flat = isSupabase() ? flattenSupabaseRow(row as unknown as Record<string, unknown>) : row;
  const [positions, depts] = await Promise.all([getPositions(), getDepartments()]);
  return enrichEmployee(flat, positions, depts);
};

export const createEmployee = async (data: EmployeeFormValues): Promise<Employee> => {
  const inserted = await repo.insert(await toDbPayload(data), { returningSelect: EMPLOYEE_RETURNING_FULL });
  const flat = isSupabase() ? flattenSupabaseRow(inserted as unknown as Record<string, unknown>) : inserted;
  const [positions, depts] = await Promise.all([getPositions(), getDepartments()]);
  const enriched = enrichEmployee(flat, positions, depts);
  if (data.ten_dang_nhap?.trim()) {
    await syncEmployeeAuth({
      operation: 'create',
      username: data.ten_dang_nhap,
      password: data.mat_khau || '123456',
      full_name: data.ho_va_ten,
      id_chuc_vu: data.id_chuc_vu,
      id_phong_ban: data.id_phong_ban,
    });
  }
  return enriched;
};

export const updateEmployee = async (id: string, data: EmployeeFormValues): Promise<Employee> => {
  const existing = await repo.getById(id, { select: EMPLOYEE_SELECT_FULL });
  if (!existing) throw new Error(txt('employee.service.notFound'));
  const updated = await repo.update(id, await toDbPayload(data), { returningSelect: EMPLOYEE_RETURNING_FULL });
  const flat = isSupabase() ? flattenSupabaseRow(updated as unknown as Record<string, unknown>) : updated;
  const [positions, depts] = await Promise.all([getPositions(), getDepartments()]);
  const enriched = enrichEmployee(flat, positions, depts);
  
  const oldUsername = existing.ten_dang_nhap?.trim() || '';
  const newUsername = data.ten_dang_nhap?.trim() || '';
  if (oldUsername !== newUsername) {
    await syncEmployeeAuth({
      operation: 'update',
      oldUsername: existing.ten_dang_nhap,
      newUsername: data.ten_dang_nhap,
      full_name: data.ho_va_ten,
      id_chuc_vu: data.id_chuc_vu,
      id_phong_ban: data.id_phong_ban,
    });
  } else if (newUsername) {
    await syncEmployeeAuth({
      operation: 'update',
      oldUsername: newUsername,
      newUsername,
      full_name: data.ho_va_ten,
      id_chuc_vu: data.id_chuc_vu,
      id_phong_ban: data.id_phong_ban,
    });
  }
  return enriched;
};

export const changeEmployeePassword = async (username: string, newPassword: string): Promise<void> => {
  const cleanUsername = username.trim();
  const cleanPassword = newPassword.trim();
  if (!cleanUsername) throw new Error('Nhân viên chưa có tên đăng nhập');
  if (cleanPassword.length < 6) throw new Error('Mật khẩu tối thiểu 6 ký tự');
  await syncEmployeeAuth({ operation: 'setPassword', username: cleanUsername, newPassword: cleanPassword });
};

export const updateEmployeeStatus = async (ids: string[], status: TrangThaiNhanVien): Promise<void> => {
  const timestamp = new Date().toISOString();
  const results = await runInBatchesSettled(ids, 5, (id) =>
    repo.update(id, { trang_thai: status, tg_cap_nhat: timestamp }, { returningSelect: EMPLOYEE_RETURNING_STATUS_ONLY }),
  );
  assertAllBatchSucceeded(results);
};

export const bulkUpdateEmployees = async (ids: string[], fields: Record<string, unknown>): Promise<void> => {
  const timestamp = new Date().toISOString();
  const payload = { ...fields };
  if ('id_chuc_vu' in payload && !('id_phong_ban' in payload)) {
    payload.id_phong_ban = await resolveDepartmentIdFromPosition(payload.id_chuc_vu ? String(payload.id_chuc_vu) : null);
  }
  const results = await runInBatchesSettled(ids, 5, (id) =>
    repo.update(id, { ...payload, tg_cap_nhat: timestamp }, { returningSelect: 'id' }),
  );
  assertAllBatchSucceeded(results);
};

export const deleteEmployee = async (id: string): Promise<void> => {
  const existing = await repo.getById(id, { select: 'id,ten_dang_nhap' });
  await repo.remove([id]);
  if (existing?.ten_dang_nhap) {
    await syncEmployeeAuth({ operation: 'delete', username: existing.ten_dang_nhap });
  }
};

export const deleteEmployees = async (ids: string[]): Promise<void> => {
  const existing = await Promise.all(ids.map((id) => repo.getById(id, { select: 'id,ten_dang_nhap' })));
  await repo.remove(ids);
  for (const employee of existing) {
    if (employee?.ten_dang_nhap) {
      await syncEmployeeAuth({ operation: 'delete', username: employee.ten_dang_nhap });
    }
  }
};

export const restoreEmployees = async (employees: Employee[]): Promise<void> => {
  for (const emp of employees) {
    const { ten_phong_ban: _ten_phong_ban, ten_chuc_vu: _ten_chuc_vu, ...row } = emp;
    await syncEmployeeAuth({ operation: 'create', username: row.ten_dang_nhap });
    await repo.insert(row, { returningSelect: EMPLOYEE_RETURNING_FULL });
  }
};
