import axiosInstance from './axiosInstance';

const authApi = {
  // Sync Firebase user → MongoDB (called after login/register)
  syncUser: async (userData = {}) => {
    const response = await axiosInstance.post('/auth/sync', userData);
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  updateProfile: async (profileData) => {
    const response = await axiosInstance.put('/auth/updateprofile', profileData);
    return response.data;
  },

  deleteAccount: async () => {
    const response = await axiosInstance.delete('/auth/deleteaccount');
    return response.data;
  },
};

export default authApi;
