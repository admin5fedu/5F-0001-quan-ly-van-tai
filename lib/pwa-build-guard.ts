const STORAGE_KEY = 'tah-app-build-id';

/**
 * Khi deploy mới: so khớp build id, xóa cache SW cũ và reload một lần
 * để tránh chạy bundle JS lỗi thời (TDZ/minify) sau khi PWA đã precache.
 */
export async function enforceFreshBuildGuard(): Promise<void> {
  const buildId =
    typeof __APP_BUILD_ID__ !== 'undefined' && __APP_BUILD_ID__
      ? String(__APP_BUILD_ID__)
      : 'unknown';

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && stored !== buildId) {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));
    }
    localStorage.setItem(STORAGE_KEY, buildId);
    window.location.reload();
    return;
  }

  if (!stored) {
    localStorage.setItem(STORAGE_KEY, buildId);
  }
}