/**
 * Data source configuration for switching between mock and Supabase.
 * 5fedu projects default to Supabase so missing env fails visibly instead of
 * silently falling back to mock data.
 */
export type DataSource = 'mock' | 'supabase';

const DATA_SOURCE = (import.meta.env.VITE_DATA_SOURCE as string | undefined) ?? 'supabase';

export function getDataSource(): DataSource {
  return DATA_SOURCE === 'supabase' ? 'supabase' : 'mock';
}

export function isSupabase(): boolean {
  return getDataSource() === 'supabase';
}

export function isMock(): boolean {
  return getDataSource() === 'mock';
}
