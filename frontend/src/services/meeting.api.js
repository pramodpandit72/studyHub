import api from './api';

export const meetingApi = {
  create: (data) => api.post('/meetings', data),
  getAll: (params) => api.get('/meetings', { params }),
  getById: (id) => api.get(`/meetings/${id}`),
  getByCode: (code) => api.get(`/meetings/code/${code}`),
  update: (id, data) => api.put(`/meetings/${id}`, data),
  delete: (id) => api.delete(`/meetings/${id}`),
  join: (code) => api.post(`/meetings/join/${code}`),
  leave: (id) => api.post(`/meetings/${id}/leave`),
  start: (id) => api.post(`/meetings/${id}/start`),
  end: (id) => api.post(`/meetings/${id}/end`),
  upcoming: () => api.get('/meetings/upcoming'),
  history: (params) => api.get('/meetings/history', { params }),
  admit: (id, userId) => api.post(`/meetings/${id}/admit`, { userId }),
  remove: (id, userId) => api.post(`/meetings/${id}/remove`, { userId }),
};

export const attendanceApi = {
  getMeetingAttendance: (meetingId) => api.get(`/attendance/meeting/${meetingId}`),
  getMyAttendance: () => api.get('/attendance/my'),
};
