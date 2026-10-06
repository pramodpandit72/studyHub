import crypto from 'crypto';
import User from '../models/User.js';
import emailService from '../services/email.service.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import env from '../config/env.js';

/**
 * Register a new user
 * Payload: { name, email, mobile, age, role, studyOrPreparation, institution, experienceLevel, password }
 */
export const signup = async (req, res) => {
  try {
    const { name, email, mobile, age, role, studyOrPreparation, institution, experienceLevel, password } = req.body;

    if (!name || !email || !mobile || !age || !role || !password) {
      return sendError(res, 400, 'Please fill all required fields.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please enter a valid email address.');
    }

    if (!/^\d{10}$/.test(mobile)) {
      return sendError(res, 400, 'Please enter a valid 10-digit mobile number.');
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      return sendError(res, 400, 'Age must be between 10 and 120.');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered
    const existingEmailUser = await User.findOne({ email: normalizedEmail });
    if (existingEmailUser) {
      return sendError(res, 400, 'An account with this email address already exists.');
    }

    // Check if mobile number already registered
    const existingMobileUser = await User.findOne({ mobile: mobile.trim() });
    if (existingMobileUser) {
      return sendError(res, 400, 'An account with this mobile number already exists.');
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      mobile: mobile.trim(),
      age: ageNum,
      role,
      studyOrPreparation: studyOrPreparation ? studyOrPreparation.trim() : '',
      institution: institution ? institution.trim() : '',
      experienceLevel: experienceLevel ? experienceLevel.trim() : '',
      password,
    });

    const token = generateToken(user._id);

    return sendSuccess(res, 201, 'Account created successfully.', {
      token,
      user: user.toProfile(),
    });
  } catch (error) {
    console.error('Signup error:', error);
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'Email or Mobile';
      return sendError(res, 400, `An account with this ${field} already exists.`);
    }
    return sendError(res, 500, 'Registration failed. Please try again.');
  }
};

/**
 * Login with Email and Password
 * Payload: { email, password }
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email and password are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return sendError(res, 401, 'Invalid email or password.');
    }

    const token = generateToken(user._id);

    return sendSuccess(res, 200, 'Login successful.', {
      token,
      user: user.toProfile(),
    });
  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Login failed. Please try again.');
  }
};

/**
 * Forgot Password - Send Reset Code to Email
 * Payload: { email }
 */
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Please enter your email address.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please enter a valid email address.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return sendError(res, 404, 'No account found with this email address.');
    }

    // Generate secure 6-digit numeric reset code
    const resetCode = crypto.randomInt(100000, 1000000).toString();

    // Hash the code for secure database storage
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    const expiryMinutes = env.RESET_TOKEN_EXPIRY_MINUTES || 15;
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = new Date(Date.now() + expiryMinutes * 60 * 1000);
    user.resetPasswordAttempts = 0;
    await user.save();

    // Send reset email via EmailJS
    await emailService.sendPasswordResetEmail({
      toEmail: user.email,
      toName: user.name,
      resetCode,
    });

    const responseData = { sent: true, email: user.email };
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      responseData.devCode = resetCode;
    }

    return sendSuccess(res, 200, 'A password reset code has been sent to your email address.', responseData);
  } catch (error) {
    console.error('Forgot password error:', error);
    return sendError(res, 500, 'Failed to process password reset request. Please try again.');
  }
};

/**
 * Verify Reset Code
 * Payload: { email, code }
 */
export const verifyResetCode = async (req, res) => {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      return sendError(res, 400, 'Email and reset code are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+resetPasswordToken +resetPasswordExpires +resetPasswordAttempts');

    if (!user) {
      return sendError(res, 404, 'No account found with this email address.');
    }

    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      return sendError(res, 400, 'No active password reset request found. Please request a new code.');
    }

    if (user.resetPasswordExpires < new Date()) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return sendError(res, 400, 'The reset code has expired. Please request a new one.');
    }

    if (user.resetPasswordAttempts >= 5) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return sendError(res, 429, 'Too many incorrect attempts. Please request a new reset code.');
    }

    const candidateHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    if (candidateHash !== user.resetPasswordToken) {
      user.resetPasswordAttempts += 1;
      await user.save();
      return sendError(res, 400, 'Invalid reset code. Please check your email and try again.');
    }

    return sendSuccess(res, 200, 'Reset code verified successfully.');
  } catch (error) {
    console.error('Verify reset code error:', error);
    return sendError(res, 500, 'Failed to verify reset code. Please try again.');
  }
};

/**
 * Reset Password
 * Payload: { email, code, newPassword }
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return sendError(res, 400, 'Email, reset code, and new password are required.');
    }

    if (newPassword.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password +resetPasswordToken +resetPasswordExpires +resetPasswordAttempts');

    if (!user) {
      return sendError(res, 404, 'No account found with this email address.');
    }

    if (!user.resetPasswordToken || !user.resetPasswordExpires) {
      return sendError(res, 400, 'No active password reset request found. Please request a new code.');
    }

    if (user.resetPasswordExpires < new Date()) {
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();
      return sendError(res, 400, 'The reset code has expired. Please request a new one.');
    }

    const candidateHash = crypto.createHash('sha256').update(code.trim()).digest('hex');
    if (candidateHash !== user.resetPasswordToken) {
      user.resetPasswordAttempts += 1;
      await user.save();
      return sendError(res, 400, 'Invalid reset code. Please check your email and try again.');
    }

    // Set new password (will be hashed in User pre-save hook)
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
    await user.save();

    return sendSuccess(res, 200, 'Password updated successfully. You can now log in with your new password.');
  } catch (error) {
    console.error('Reset password error:', error);
    return sendError(res, 500, 'Failed to reset password. Please try again.');
  }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, 200, 'Logged out successfully.');
};

/**
 * Get current authenticated user
 */
export const getMe = async (req, res) => {
  try {
    return sendSuccess(res, 200, 'User fetched.', { user: req.user.toProfile() });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch user.');
  }
};
