import { create } from 'zustand';
import notificationApi from '../api/notificationApi';

const useNotificationStore = create((set, get) => ({
  notifications: [],
  loading: false,
  error: null,
  unreadCount: 0,

  fetchNotifications: async () => {
    set({ loading: true, error: null });
    try {
      const res = await notificationApi.getNotifications();
      const notifs = res.data || [];
      const unreadCount = notifs.filter(n => !n.read).length;
      set({ notifications: notifs, unreadCount, loading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch notifications', 
        loading: false 
      });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationApi.markAsRead(id);
      const updatedNotifs = get().notifications.map(n => 
        n._id === id ? { ...n, read: true } : n
      );
      const unreadCount = updatedNotifs.filter(n => !n.read).length;
      set({ notifications: updatedNotifs, unreadCount });
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  },

  clearAll: async () => {
    try {
      await notificationApi.clearNotifications();
      set({ notifications: [], unreadCount: 0 });
    } catch (err) {
      console.error('Failed to clear notifications', err);
    }
  },

  startPolling: () => {
    const interval = setInterval(() => {
      get().fetchNotifications();
    }, 60000);
    set({ _pollInterval: interval });
  },

  stopPolling: () => {
    const interval = get()._pollInterval;
    if (interval) clearInterval(interval);
    set({ _pollInterval: null });
  },
}));

export default useNotificationStore;
