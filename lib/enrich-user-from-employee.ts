import { getSupabase } from '@/lib/supabase/client';
import { isSupabase, isMock } from '@/lib/data/config';
import { loginNameToSupabaseEmail } from '@/lib/auth-email';
import { findMockEmployeeByLogin } from '@/mocks/he-thong';
import type { User } from '@/types';

type EmployeeRow = {
  id: number | string;
  ho_va_ten?: string | null;
  ten_dang_nhap?: string | null;
  email?: string | null;
  id_chuc_vu?: number | string | null;
  id_phong_ban?: number | string | null;
  avatar?: string | null;
  la_tai_xe?: boolean | null;
};

function resolveLoginName(user: User): string {
  const fromMeta = user.ten_dang_nhap?.trim();
  if (fromMeta) return fromMeta;
  const email = user.email?.trim();
  if (!email) return '';
  const local = email.split('@')[0]?.trim();
  return local || '';
}

function normalizeChucVuId(value: unknown): string | undefined {
  if (value == null || value === '') return undefined;
  if (Array.isArray(value)) {
    const first = value[0];
    return first != null && first !== '' ? String(first) : undefined;
  }
  return String(value);
}

function mapMockEmployeeToUser(user: User, employee: EmployeeRow): User {
  const loginName = resolveLoginName(user);
  const chucVu = normalizeChucVuId(employee.id_chuc_vu ?? user.id_chuc_vu);
  const phongBan = employee.id_phong_ban != null ? String(employee.id_phong_ban) : user.id_phong_ban;

  return {
    ...user,
    full_name: employee.ho_va_ten?.trim() || user.full_name,
    ten_dang_nhap: employee.ten_dang_nhap?.trim() || loginName || user.ten_dang_nhap,
    id_chuc_vu: chucVu ? [chucVu] : user.id_chuc_vu,
    id_phong_ban: phongBan ?? user.id_phong_ban,
    avatar_url: employee.avatar?.trim() || user.avatar_url,
    la_tai_xe: employee.la_tai_xe ?? false,
    role: user.role === 'admin' ? 'admin' : user.role,
  };
}

export async function enrichUserFromEmployee(user: User): Promise<User> {
  const loginName = resolveLoginName(user);

  if (isMock()) {
    const employee = loginName ? findMockEmployeeByLogin(loginName) : undefined;
    if (!employee) return user;
    return mapMockEmployeeToUser(user, employee);
  }

  if (!isSupabase()) return user;

  const supabase = getSupabase();
  if (!supabase) return user;

  let employee: EmployeeRow | null = null;

  if (loginName) {
    const { data } = await supabase
      .from('var_nhan_vien')
      .select('id, ho_va_ten, ten_dang_nhap, email, id_chuc_vu, id_phong_ban, avatar, la_tai_xe')
      .eq('ten_dang_nhap', loginName)
      .maybeSingle();
    employee = (data as EmployeeRow | null) ?? null;
  }

  if (!employee && user.email) {
    const fakeEmail = loginName ? loginNameToSupabaseEmail(loginName) : user.email;
    const { data } = await supabase
      .from('var_nhan_vien')
      .select('id, ho_va_ten, ten_dang_nhap, email, id_chuc_vu, id_phong_ban, avatar, la_tai_xe')
      .or(`email.eq.${user.email},email.eq.${fakeEmail}`)
      .maybeSingle();
    employee = (data as EmployeeRow | null) ?? null;
  }

  if (!employee) return user;

  return mapMockEmployeeToUser(user, employee);
}
