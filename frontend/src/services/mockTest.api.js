import api from './api';

export const mockTestApi = {
  getAll: (params) => api.get('/mock-tests', { params }),
  getById: (id) => api.get(`/mock-tests/${id}`),
  create: (data) => api.post('/mock-tests', data),
  delete: (id) => api.delete(`/mock-tests/${id}`),
  submit: (id, data) => api.post(`/mock-tests/${id}/submit`, data),
  getAttemptResult: (attemptId) => api.get(`/mock-tests/attempt/${attemptId}`),
  getMyAttempts: () => api.get('/mock-tests/my-attempts'),

  // Session Security & Resume APIs
  getSessionStatus: (id) => api.get(`/mock-tests/${id}/session/status`),
  startSession: (id, data = {}) => api.post(`/mock-tests/${id}/session/start`, data),
  saveSessionAnswer: (id, data) => api.post(`/mock-tests/${id}/session/save-answer`, data),
  recordSessionActivity: (id, data) => api.post(`/mock-tests/${id}/session/activity`, data),
  resumeSession: (id, data = {}) => api.post(`/mock-tests/${id}/session/resume`, data),
};
