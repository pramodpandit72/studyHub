import api from './api';

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  sendOtp: (mobile, type) => api.post('/auth/send-otp', { mobile, type }),
  verifyOtp: (mobile, otp, type) => api.post('/auth/verify-otp', { mobile, otp, type }),
  login: (mobile, otp) => api.post('/auth/login', { mobile, otp }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};
