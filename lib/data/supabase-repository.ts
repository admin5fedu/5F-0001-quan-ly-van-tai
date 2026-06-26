import { getSupabase } from '@/lib/supabase/client';
import { handleSupabaseError } from '@/lib/supabase/errors';
import type {
  IRepository,
  RepositoryGetByIdOptions,
  RepositoryListResult,
  RepositoryMutationOptions,
  RepositoryQueryOptions,
} from './repository';

/** Giới hạn mặc định mỗi lần getAll — tránh tải bảng lớn một lượt (PostgREST/Supabase). Tăng limit trong RepositoryQueryOptions nếu cần. */
export const SUPABASE_DEFAULT_MAX_ROWS = 5_000;

function ensureClient() {
  const client = getSupabase();
  if (!client) throw new Error('Supabase client is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
  return client;
}

function normalizeIds<T>(row: unknown): T {
  if (!row || typeof row !== 'object' || Array.isArray(row)) return row as T;
  const out = { ...(row as Record<string, unknown>) };
  for (const [key, value] of Object.entries(out)) {
    if (typeof value !== 'number') continue;
    if (key === 'id' || key.startsWith('id_') || key.endsWith('_id')) {
      out[key] = String(value);
    }
  }
  return out as T;
}

function normalizeRows<T>(rows: unknown[] | null): T[] {
  return (rows ?? []).map((row) => normalizeIds<T>(row));
}

function cleanPayload(payload: Record<string, unknown>): Record<string, unknown> {
  const result = { ...payload };
  for (const [key, value] of Object.entries(result)) {
    if (value === '') {
      // 1. Khóa ngoại và ID
      const isIdField = key === 'id' || key.startsWith('id_') || key.endsWith('_id');
      // 2. Các trường ngày tháng và thời gian
      const isDateField = key === 'ngay' || key.startsWith('ngay_') || key.startsWith('han_') || key.startsWith('tg_');
      // 3. Các trường kiểu số (integer, numeric)
      const isNumericField = [
        'tt', 'so_chuyen', 'nam', 'thang',
        'tien_luong', 'chi_phi',
        'tong_phi', 'tong_tien_luong',
        'tong_chi_phi_chuyen', 'tong_chi_phi_khac', 'tong_con_lai', 'tong_luong_chuyen', 'tru_tien_khac',
        'luong_co_ban'
      ].includes(key);
      
      if (isIdField || isDateField || isNumericField) {
        result[key] = null;
      }
    }
  }
  return result;
}


/**
 * Supabase-backed repository implementing IRepository.
 * Supports optional select string for relation queries (e.g. '*, phong_ban(ten_phong_ban)').
 */
export class SupabaseRepository<T extends { id: string }> implements IRepository<T> {
  constructor(
    private readonly tableName: string,
    private readonly options?: { select?: string },
  ) {}

  private get select() {
    return this.options?.select ?? '*';
  }

  private mutationSelect(opts?: RepositoryMutationOptions): string {
    return opts?.returningSelect ?? this.select;
  }

  async count(): Promise<number> {
    const supabase = ensureClient();
    const { count, error } = await supabase
      .from(this.tableName)
      .select('*', { count: 'exact', head: true });
    if (error) handleSupabaseError(error);
    return count ?? 0;
  }

  async getPage(options?: RepositoryQueryOptions): Promise<RepositoryListResult<T>> {
    const supabase = ensureClient();
    const select = options?.select ?? this.select;
    let query = supabase.from(this.tableName).select(select, { count: 'exact' });
    if (options?.orderBy) {
      query = query.order(options.orderBy, { ascending: options.ascending !== false });
    }
    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? SUPABASE_DEFAULT_MAX_ROWS;
    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    if (error) handleSupabaseError(error);
    return { items: normalizeRows<T>(data), total: count ?? 0 };
  }

  async getAll(options?: RepositoryQueryOptions): Promise<T[]> {
    const { items } = await this.getPage(options);
    return items;
  }

  async getById(id: string, options?: RepositoryGetByIdOptions): Promise<T | null> {
    const supabase = ensureClient();
    const select = options?.select ?? this.select;
    const { data, error } = await supabase
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .maybeSingle();
    if (error) handleSupabaseError(error);
    return data ? normalizeIds<T>(data) : null;
  }

  async insert(row: Omit<T, 'id'> & { id?: string }, opts?: RepositoryMutationOptions): Promise<T> {
    const supabase = ensureClient();
    const payload = cleanPayload({ ...row } as Record<string, unknown>);
    if (payload.id === undefined) delete payload.id;
    const { data, error } = await (supabase.from(this.tableName) as any)
      .insert(payload)
      .select(this.mutationSelect(opts))
      .single();
    if (error) handleSupabaseError(error);
    return normalizeIds<T>(data);
  }

  async update(id: string, partial: Partial<T>, opts?: RepositoryMutationOptions): Promise<T> {
    const supabase = ensureClient();
    const payload = cleanPayload({ ...partial } as Record<string, unknown>);
    delete payload.id;
    const { data, error } = await (supabase.from(this.tableName) as any)
      .update(payload)
      .eq('id', id)
      .select(this.mutationSelect(opts))
      .single();
    if (error) handleSupabaseError(error);
    return normalizeIds<T>(data);
  }

  async remove(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    const supabase = ensureClient();
    const { error } = await supabase.from(this.tableName).delete().in('id', ids);
    if (error) handleSupabaseError(error);
  }

  async upsert(rows: (Omit<T, 'id'> & { id?: string }) | ((Omit<T, 'id'> & { id?: string })[])): Promise<T[]> {
    const supabase = ensureClient();
    const arr = Array.isArray(rows) ? rows : [rows];
    const payload = arr.map((r) => cleanPayload({ ...r } as Record<string, unknown>));
    const { data, error } = await (supabase.from(this.tableName) as any)
      .upsert(payload, { onConflict: 'id' })
      .select(this.select);
    if (error) handleSupabaseError(error);
    return normalizeRows<T>(data);
  }
}
