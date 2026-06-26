import { getSupabase } from '@/lib/supabase/client';
import { isSupabase } from '@/lib/data/config';
import { enrichUserFromEmployee } from '@/lib/enrich-user-from-employee';
import { findMockAuthUser } from '@/mocks/auth-users';
import { findMockEmployeeById } from '@/mocks/he-thong';
import type { User } from '@/types';

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  fullName?: string;
}

export interface AuthSession {
  user: User;
}

export interface AuthService {
  signIn(credentials: SignInCredentials): Promise<{ user: User } | { error: string }>;
  signUp(credentials: SignUpCredentials): Promise<{ user?: User; error?: string }>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
  updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }>;
}

function normalizeChucVuFromMeta(value: unknown): string[] | undefined {
  if (value == null || value === '') return undefined;
  if (Array.isArray(value)) {
    const ids = value.map((v) => String(v)).filter(Boolean);
    return ids.length ? ids : undefined;
  }
  return [String(value)];
}

function mapSupabaseUserToAppUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): User {
  const meta = supabaseUser.user_metadata ?? {};
  const email = supabaseUser.email ?? '';
  const tenDangNhap = (meta.ten_dang_nhap as string) ?? email.split('@')[0] ?? undefined;
  return {
    id: supabaseUser.id,
    email,
    full_name: ((meta.full_name ?? meta.ho_va_ten) as string) ?? undefined,
    avatar_url: (meta.avatar_url as string) ?? undefined,
    role: (meta.role as 'admin' | 'user') ?? (email.toLowerCase() === 'admin@gmail.com' ? 'admin' : 'user'),
    created_at: new Date().toISOString(),
    id_phong_ban: meta.id_phong_ban != null ? String(meta.id_phong_ban) : undefined,
    id_chuc_vu: normalizeChucVuFromMeta(meta.id_chuc_vu),
    ten_dang_nhap: tenDangNhap,
  };
}

async function mapAndEnrichUser(supabaseUser: { id: string; email?: string; user_metadata?: Record<string, unknown> }): Promise<User> {
  return enrichUserFromEmployee(mapSupabaseUserToAppUser(supabaseUser));
}

function buildMockUserFromEmployee(employeeId: string, role: 'admin' | 'user'): User | null {
  const employee = findMockEmployeeById(employeeId);
  if (!employee) return null;
  return {
    id: employee.id,
    email: employee.email ?? `${employee.ten_dang_nhap}@5fedu.com`,
    full_name: employee.ho_va_ten,
    avatar_url: employee.avatar ?? undefined,
    role,
    created_at: employee.tg_tao ?? new Date().toISOString(),
    id_phong_ban: employee.id_phong_ban ?? undefined,
    id_chuc_vu: employee.id_chuc_vu ? [employee.id_chuc_vu] : undefined,
    ten_dang_nhap: employee.ten_dang_nhap ?? undefined,
    la_tai_xe: employee.la_tai_xe ?? false,
  };
}

const mockAuthService: AuthService = {
  async signIn({ email, password }) {
    await new Promise((r) => setTimeout(r, 800));
    const loginName = email.includes('@') ? email.split('@')[0]! : email;
    const authUser = findMockAuthUser(loginName, password);
    if (!authUser) return { error: 'Tên đăng nhập hoặc mật khẩu không đúng' };
    const user = buildMockUserFromEmployee(authUser.employeeId, authUser.role);
    if (!user) return { error: 'Không tìm thấy hồ sơ nhân viên' };
    return { user };
  },

  async signUp() {
    return { error: 'Tính năng đăng ký đã được tắt theo quy tắc 5fedu' };
  },

  async signOut() {
    await new Promise((r) => setTimeout(r, 200));
  },

  async getSession() {
    return null; // Mock: no persistent session, caller uses store
  },

  onAuthStateChange() {
    return () => {};
  },

  async updatePassword(newPassword: string) {
    await new Promise((r) => setTimeout(r, 500));
    if (newPassword.length < 6) return { success: false, error: 'Mật khẩu phải từ 6 ký tự trở lên' };
    return { success: true };
  },
};

const supabaseAuthService: AuthService = {
  async signIn(credentials) {
    const supabase = getSupabase();
    if (!supabase) return { error: 'Supabase chưa được cấu hình' };
    const { data, error } = await supabase.auth.signInWithPassword(credentials);
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Đăng nhập thất bại' };
    return { user: await mapAndEnrichUser(data.user) };
  },

  async signUp({ email, password, fullName }) {
    void email;
    void password;
    void fullName;
    return { error: 'Tính năng đăng ký đã được tắt theo quy tắc 5fedu' };
  },

  async signOut() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
  },

  async getSession() {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return { user: await mapAndEnrichUser(session.user) };
  },

  onAuthStateChange(callback) {
    const supabase = getSupabase();
    if (!supabase) return () => {};
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) callback({ user: await mapAndEnrichUser(session.user) });
      else callback(null);
    });
    return () => subscription.unsubscribe();
  },

  async updatePassword(newPassword: string) {
    const supabase = getSupabase();
    if (!supabase) return { success: false, error: 'Supabase chưa được cấu hình' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
};

export function getAuthService(): AuthService {
  return isSupabase() ? supabaseAuthService : mockAuthService;
}
