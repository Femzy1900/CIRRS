import { create } from 'zustand';
import adminApi from '../api/adminApi';

const useAdminStore = create((set, get) => ({
  users: [],
  stats: null,
  loading: false,
  error: null,

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const data = await adminApi.fetchStats();
      set({ stats: data.data, loading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch admin stats', 
        loading: false 
      });
    }
  },

  fetchUsers: async () => {
    set({ loading: true, error: null });
    try {
      const data = await adminApi.fetchUsers();
      set({ users: data.data, loading: false });
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to fetch users list', 
        loading: false 
      });
    }
  },

  updateUserRole: async (userId, role) => {
    set({ loading: true, error: null });
    try {
      const data = await adminApi.updateUserRole(userId, role);
      // Update local state
      const updatedUsers = get().users.map((user) => 
        user._id === userId ? { ...user, role: data.data.role } : user
      );
      set({ users: updatedUsers, loading: false });
      
      // Refresh stats if roles have changed
      await get().fetchStats();
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to update user role', 
        loading: false 
      });
      throw err;
    }
  },

  deleteUser: async (userId) => {
    set({ loading: true, error: null });
    try {
      await adminApi.deleteUser(userId);
      // Remove from local users list
      const updatedUsers = get().users.filter((user) => user._id !== userId);
      set({ users: updatedUsers, loading: false });
      
      // Refresh stats
      await get().fetchStats();
    } catch (err) {
      set({ 
        error: err.response?.data?.message || 'Failed to delete user', 
        loading: false 
      });
      throw err;
    }
  },

  setError: (message) => set({ error: message }),
  clearError: () => set({ error: null })
}));

export default useAdminStore;
