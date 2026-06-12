import axiosInstance from './axiosInstance';

const reviewApi = {
  getReviews: async () => {
    const res = await axiosInstance.get('/reviews');
    return res.data;
  },

  getMyReview: async () => {
    const res = await axiosInstance.get('/reviews/mine');
    return res.data;
  },

  createReview: async ({ rating, message }) => {
    const res = await axiosInstance.post('/reviews', { rating, message });
    return res.data;
  },

  deleteReview: async (id) => {
    const res = await axiosInstance.delete(`/reviews/${id}`);
    return res.data;
  },
};

export default reviewApi;
