import axiosInstance from './axiosInstance';

const uploadApi = {
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    const response = await axiosInstance.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data; // { success: true, url: '...' }
  }
};

export default uploadApi;
