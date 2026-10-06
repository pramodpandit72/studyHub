import api from './api';

export const authApi = {
  signup: (data) => api.post('/auth/signup', data),
  resendSignupOtp: (email) => api.post('/auth/signup/resend-otp', { email }),
  verifySignupOtp: (email, otp) => api.post('/auth/signup/verify', { email, otp }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),
  logout: () => api.post('/auth/logout'),
  getMe: () => api.get('/auth/me'),
};

export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
};
