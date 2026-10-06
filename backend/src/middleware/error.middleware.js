import { sendError } from '../utils/response.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(e => e.message);
    return sendError(res, 400, messages.join('. '));
  }

  if (err.code === 11000) {
    const field = err.keyPattern ? Object.keys(err.keyPattern)[0] : (err.keyValue ? Object.keys(err.keyValue)[0] : 'Record');
    return sendError(res, 400, `${field} already exists.`);
  }

  if (err.name === 'CastError') {
    return sendError(res, 400, 'Invalid ID format.');
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error.';

  return sendError(res, statusCode, message);
};

export const notFound = (req, res) => {
  sendError(res, 404, `Route not found: ${req.originalUrl}`);
};
