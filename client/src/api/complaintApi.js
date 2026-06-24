import axiosInstance from './axiosInstance';

const complaintApi = {
  submitComplaint: async (itemId, claimId, message) => {
    const res = await axiosInstance.post('/complaints', { item: itemId, claim: claimId || null, message });
    return res.data;
  },

  getComplaints: async (status = '') => {
    const res = await axiosInstance.get(`/complaints${status ? `?status=${status}` : ''}`);
    return res.data;
  },

  reviewComplaint: async (complaintId, action, adminNote = '') => {
    const res = await axiosInstance.put(`/complaints/${complaintId}`, { action, adminNote });
    return res.data;
  },
};

export default complaintApi;
