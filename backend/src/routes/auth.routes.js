import { Router } from 'express';
import {
  signup,
  resendSignupOtp,
  verifySignupOtp,
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

// Signup with Email OTP Verification
router.post('/signup', authLimiter, signup);
router.post('/signup/resend-otp', authLimiter, resendSignupOtp);
router.post('/signup/verify', authLimiter, verifySignupOtp);

// Login (Email + Password only)
router.post('/login', authLimiter, login);

// Password recovery via EmailJS
router.post('/forgot-password', passwordResetLimiter, forgotPassword);
router.post('/verify-reset-code', passwordResetLimiter, verifyResetCode);
router.post('/reset-password', passwordResetLimiter, resetPassword);

// Session
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);

export default router;
