import axiosInstance from './axiosInstance';

const authApi = {
  register: async (userData) => {
    const response = await axiosInstance.post('/auth/register', userData);
    return response.data;
  },

  login: async (credentials) => {
    const response = await axiosInstance.post('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await axiosInstance.get('/auth/logout');
    return response.data;
  },

  getMe: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await axiosInstance.post('/auth/forgotpassword', { email });
    return response.data;
  },

  resetPassword: async (token, password) => {
    const response = await axiosInstance.put(`/auth/resetpassword/${token}`, { password });
    return response.data;
  },
};

export default authApi;
