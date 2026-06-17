import axiosInstance from './axiosInstance';

const itemApi = {
  getItems: async (params = {}) => {
    // Remove empty values so we don't send ?status= (empty)
    const cleaned = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    );
    const response = await axiosInstance.get('/items', { params: cleaned });
    return response.data;
  },

  getItem: async (id) => {
    const response = await axiosInstance.get(`/items/${id}`);
    return response.data;
  },

  createItem: async (itemData) => {
    const response = await axiosInstance.post('/items', itemData);
    return response.data;
  },

  updateItem: async (id, itemData) => {
    const response = await axiosInstance.put(`/items/${id}`, itemData);
    return response.data;
  },

  deleteItem: async (id) => {
    const response = await axiosInstance.delete(`/items/${id}`);
    return response.data;
  },

  contactItem: async (id) => {
    const response = await axiosInstance.post(`/items/${id}/contact`);
    return response.data;
  },
};

export default itemApi;
