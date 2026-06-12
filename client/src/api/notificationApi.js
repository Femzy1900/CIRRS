import axiosInstance from './axiosInstance';

const notificationApi = {
  getNotifications: async () => {
    const response = await axiosInstance.get('/notifications');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await axiosInstance.put(`/notifications/${id}/read`);
    return response.data;
  },

  clearNotifications: async () => {
    const response = await axiosInstance.delete('/notifications');
    return response.data;
  }
};

export default notificationApi;
