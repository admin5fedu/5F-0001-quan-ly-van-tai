import { useEffect } from 'react';
import { isSupabase } from '@/lib/data/config';
import { enrichUserFromEmployee } from '@/lib/enrich-user-from-employee';
import { useAuthStore } from '@/store/useStore';

/** Sau khi session hydrate: bổ sung full_name / id_chuc_vu từ var_nhan_vien (fix Guest User + quyền). */
export function UserEnrichSynchronizer(): null {
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !user || !isSupabase()) return;

    const needsEnrich =
      !user.full_name?.trim() ||
      !user.ten_dang_nhap?.trim() ||
      !user.id_chuc_vu?.length ||
      user.la_tai_xe === undefined;

    if (!needsEnrich) return;

    let cancelled = false;
    enrichUserFromEmployee(user).then((enriched) => {
      if (cancelled) return;
      if (
        enriched.full_name !== user.full_name ||
        enriched.ten_dang_nhap !== user.ten_dang_nhap ||
        enriched.id_phong_ban !== user.id_phong_ban ||
        enriched.la_tai_xe !== user.la_tai_xe ||
        JSON.stringify(enriched.id_chuc_vu) !== JSON.stringify(user.id_chuc_vu)
      ) {
        useAuthStore.getState().login(enriched);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [hasHydrated, isAuthenticated, user?.id, user?.full_name, user?.ten_dang_nhap, user?.id_chuc_vu, user?.la_tai_xe]);

  return null;
}