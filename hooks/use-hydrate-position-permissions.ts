import { useEffect } from 'react';
import { useAuthStore } from '@/store/useStore';
import { usePermissionGrantStore } from '@/store/usePermissionGrantStore';
import { isPermissionMatrixEnabled } from '@/lib/permission-matrix-env';
import { fetchPositionPermissionGrants } from '@/lib/fetch-position-permission-grants';
import { getSupabase } from '@/lib/supabase/client';
import { isMock } from '@/lib/data/config';
import { findMockEmployeeByLogin } from '@/mocks/he-thong';
import { findMockPositionById } from '@/mocks/positions';

function resolveChucVuKey(user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>): string {
  if (Array.isArray(user.id_chuc_vu)) return user.id_chuc_vu[0] ?? '';
  if (user.id_chuc_vu) return String(user.id_chuc_vu);
  return '';
}

/**
 * Sau đăng nhập / đổi user: hydrate `grantsByModule` theo chức vụ (khi `VITE_USE_PERMISSION_MATRIX=true`).
 */
export function useHydratePositionPermissions(): void {
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const matrixEnabled = isPermissionMatrixEnabled();

  const chucVuKey = user && user.role !== 'admin' ? resolveChucVuKey(user) : '';
  const loginNameFallback = user?.ten_dang_nhap?.trim() || (user?.email ? user.email.split('@')[0] : '');

  useEffect(() => {
    if (!hasHydrated) return;

    if (!matrixEnabled || !user || user.role === 'admin') {
      usePermissionGrantStore.getState().clearMatrix();
      return;
    }

    const uid = user.id;
    let cancelled = false;

    const loadGrants = async () => {
      try {
        if (isMock()) {
          const employeeRecord = loginNameFallback
            ? findMockEmployeeByLogin(loginNameFallback) ?? null
            : null;

          if (cancelled || useAuthStore.getState().user?.id !== uid) return;

          const resolvedChucVu =
            chucVuKey || (employeeRecord?.id_chuc_vu != null ? String(employeeRecord.id_chuc_vu) : '');

          if (!resolvedChucVu) {
            usePermissionGrantStore.getState().clearMatrix();
            return;
          }

          const [grants, position] = await Promise.all([
            fetchPositionPermissionGrants(resolvedChucVu),
            Promise.resolve(findMockPositionById(resolvedChucVu)),
          ]);

          if (cancelled || useAuthStore.getState().user?.id !== uid) return;

          const capBac = position?.cap_bac != null ? Number(position.cap_bac) : null;
          usePermissionGrantStore.getState().setMatrixGrants(grants, capBac, employeeRecord);
          return;
        }

        const supabase = getSupabase();
        if (!supabase) {
          usePermissionGrantStore.getState().clearMatrix();
          return;
        }

        const nvResult = loginNameFallback
          ? await supabase.from('var_nhan_vien').select('*').eq('ten_dang_nhap', loginNameFallback).maybeSingle()
          : { data: null, error: null };

        if (cancelled || useAuthStore.getState().user?.id !== uid) return;

        const employeeRecord = nvResult.data || null;
        const resolvedChucVu = chucVuKey || (employeeRecord?.id_chuc_vu != null ? String(employeeRecord.id_chuc_vu) : '');

        if (!resolvedChucVu) {
          usePermissionGrantStore.getState().clearMatrix();
          return;
        }

        const [grants, cvResult] = await Promise.all([
          fetchPositionPermissionGrants(resolvedChucVu),
          supabase.from('var_chuc_vu').select('cap_bac').eq('id', resolvedChucVu).maybeSingle(),
        ]);

        if (cancelled || useAuthStore.getState().user?.id !== uid) return;

        const capBac = cvResult.data ? Number(cvResult.data.cap_bac) : null;
        usePermissionGrantStore.getState().setMatrixGrants(grants, capBac, employeeRecord);
      } catch {
        if (cancelled || useAuthStore.getState().user?.id !== uid) return;
        usePermissionGrantStore.getState().clearMatrix();
      }
    };

    loadGrants();

    if (isMock()) {
      return () => {
        cancelled = true;
      };
    }

    const supabase = getSupabase();
    if (!supabase) {
      return () => {
        cancelled = true;
      };
    }

    let channel: ReturnType<typeof supabase.channel> | null = null;
    const watchChucVu = chucVuKey || '';
    if (watchChucVu) {
      channel = supabase
        .channel(`realtime_phan_quyen_${watchChucVu}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'var_phan_quyen',
            filter: `id_chuc_vu=eq.${watchChucVu}`,
          },
          () => {
            if (!cancelled) loadGrants();
          },
        )
        .subscribe();
    }

    return () => {
      cancelled = true;
      if (channel && supabase) supabase.removeChannel(channel);
    };
  }, [hasHydrated, matrixEnabled, user?.id, user?.role, chucVuKey, loginNameFallback]);
}
