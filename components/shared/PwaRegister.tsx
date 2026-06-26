import React, { useEffect } from 'react';
import { registerSW } from 'virtual:pwa-register';
import { toast } from 'sonner';

const UPDATE_INTERVAL_MS = 15 * 60 * 1000;

/**
 * Đăng ký Service Worker (PWA) sau khi React mount.
 * - skipWaiting + clientsClaim (vite workbox): SW mới chiếm tab ngay.
 * - controllerchange: reload khi SW active đổi (tránh chunk cũ trong memory).
 * - Poll update định kỳ để nhận deploy mới sớm hơn.
 */
const PwaRegister: React.FC = () => {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    let updateTimer: ReturnType<typeof setInterval> | undefined;

    const updateSW = registerSW({
      immediate: true,
      onRegistered(registration) {
        if (!registration) return;
        void registration.update();
        updateTimer = setInterval(() => {
          void registration.update();
        }, UPDATE_INTERVAL_MS);
      },
      onNeedRefresh() {
        toast.info('Đã có bản cập nhật mới — đang tải lại...', { duration: 4000 });
        void updateSW(true);
      },
      onOfflineReady() {
        toast.success('Ứng dụng sẵn sàng dùng offline.');
      },
      onRegisterError(error) {
        console.warn('[PWA] register failed', error);
      },
    });

    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      if (updateTimer) clearInterval(updateTimer);
    };
  }, []);

  return null;
};

export default PwaRegister;