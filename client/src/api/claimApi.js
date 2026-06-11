import axiosInstance from './axiosInstance';

const claimApi = {
  submitClaim: async (itemId, answers) => {
    const response = await axiosInstance.post(`/claims/${itemId}`, { answers });
    return response.data;
  },

  getItemClaims: async (itemId) => {
    const response = await axiosInstance.get(`/claims/item/${itemId}`);
    return response.data;
  },

  updateClaimStatus: async (claimId, status) => {
    const response = await axiosInstance.put(`/claims/${claimId}`, { status });
    return response.data;
  },

  getMyClaimForItem: async (itemId) => {
    const response = await axiosInstance.get(`/claims/my/${itemId}`);
    return response.data;
  }
};

export default claimApi;
