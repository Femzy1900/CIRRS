import axiosInstance from './axiosInstance';

const adminApi = {
  fetchUsers: async () => {
    const response = await axiosInstance.get('/admin/users');
    return response.data;
  },

  updateUserRole: async (userId, role) => {
    const response = await axiosInstance.put(`/admin/users/${userId}/role`, { role });
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await axiosInstance.delete(`/admin/users/${userId}`);
    return response.data;
  },

  fetchStats: async () => {
    const response = await axiosInstance.get('/admin/stats');
    return response.data;
  },
};

export default adminApi;
