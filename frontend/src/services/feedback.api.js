import api from './api.js';

export const submitFeedback = async (feedbackData) => {
  const response = await api.post('/feedback', feedbackData);
  return response.data;
};

export const getMyFeedback = async () => {
  const response = await api.get('/feedback/my');
  return response.data;
};
