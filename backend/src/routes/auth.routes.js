import { Router } from 'express';
import {
  signup,
  login,
  forgotPassword,
  verifyResetCode,
  resetPassword,
  logout,
  getMe,
} from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { authLimiter, passwordResetLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Authentication
router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);

// Password recovery via EmailJS
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-reset-code', passwordResetLimiter, verifyResetCode);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Session
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
