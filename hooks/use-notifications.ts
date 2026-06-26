import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Notification } from '@/types';
import { getNotifications } from '@/features/he-thong/thong-bao/services/thong-bao-service';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useNotifications() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: getNotifications,
    staleTime: 60_000,
  });

  const notifications = query.data ?? [];

  const setNotifications = (updater: (prev: Notification[]) => Notification[]) => {
    queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, (prev) =>
      updater(prev ?? [])
    );
  };

  const add = (n: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setNotifications((prev) => [
      { ...n, id, read: false, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  };

  const remove = (id: string) => {
    setNotifications((prev) => prev.filter((x) => x.id !== id));
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((x) => (x.id === id ? { ...x, read: true } : x))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((x) => ({ ...x, read: true })));
  };

  const clearAll = () => {
    queryClient.setQueryData<Notification[]>(NOTIFICATIONS_QUERY_KEY, []);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return {
    notifications,
    isLoading: query.isLoading,
    add,
    remove,
    markAsRead,
    markAllAsRead,
    clearAll,
    unreadCount,
  };
}
