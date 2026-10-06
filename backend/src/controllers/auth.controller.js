import crypto from 'crypto';
import User from '../models/User.js';
import SignupVerification from '../models/SignupVerification.js';
import emailService from '../services/email.service.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';
import env from '../config/env.js';

/**
 * Initiate signup: Validate details, store pending registration, send 4-digit email OTP via EmailJS
 * Payload: { name, email, age, role, studyOrPreparation, institution, experienceLevel, password }
 */
export const signup = async (req, res) => {
  try {
    const { name, email, age, role, studyOrPreparation, institution, experienceLevel, password } = req.body;

    if (!name || !email || !age || !role || !password) {
      return sendError(res, 400, 'Please fill all required fields.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendError(res, 400, 'Please enter a valid email address.');
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 10 || ageNum > 120) {
      return sendError(res, 400, 'Age must be between 10 and 120.');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already registered in activated User accounts
    const existingEmailUser = await User.findOne({ email: normalizedEmail });
    if (existingEmailUser) {
      return sendError(res, 400, 'An account with this email address already exists.');
    }

    // Generate secure 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');

    // Remove any previous pending registration for this email
    await SignupVerification.deleteMany({ email: normalizedEmail });

    // Store pending signup data (10-minute expiry)
    await SignupVerification.create({
      email: normalizedEmail,
      otpHash,
      signupData: {
        name: name.trim(),
        age: ageNum,
        role,
        studyOrPreparation: studyOrPreparation ? studyOrPreparation.trim() : '',
        institution: institution ? institution.trim() : '',
        experienceLevel: experienceLevel ? experienceLevel.trim() : '',
        password,
      },
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      attempts: 0,
      lastResendAt: new Date(),
    });

    // Send 4-digit OTP to user's email via EmailJS
    await emailService.sendSignupOtpEmail({
      toEmail: normalizedEmail,
      toName: name.trim(),
      otp,
    });

    const responseData = { sent: true, email: normalizedEmail };
    if (process.env.NODE_ENV !== 'production') {
      responseData.devOtp = otp;
    }

    return sendSuccess(res, 200, 'Verification OTP sent to your email. Please verify to complete account creation.', responseData);
  } catch (error) {
    console.error('Signup initiate error:', error);
    return sendError(res, 500, 'Registration initiation failed. Please try again.');
  }
};

/**
 * Resend Signup Email OTP
 * Payload: { email }
 */
export const resendSignupOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return sendError(res, 400, 'Email is required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await SignupVerification.findOne({ email: normalizedEmail });

    if (!record) {
      return sendError(res, 404, 'No pending registration found for this email. Please sign up again.');
    }

    // Enforce 60-second cooldown
    const elapsedSeconds = (Date.now() - new Date(record.lastResendAt).getTime()) / 1000;
    if (elapsedSeconds < 60) {
      const waitSeconds = Math.ceil(60 - elapsedSeconds);
      return sendError(res, 429, `Please wait ${waitSeconds} seconds before requesting a new OTP.`);
    }

    // Generate new 6-digit OTP
    const otp = crypto.randomInt(100000, 1000000).toString();
    record.otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    record.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    record.attempts = 0;
    record.lastResendAt = new Date();
    await record.save();

    await emailService.sendSignupOtpEmail({
      toEmail: normalizedEmail,
      toName: record.signupData.name,
      otp,
    });

    const responseData = { sent: true, email: normalizedEmail };
    if (process.env.NODE_ENV !== 'production') {
      responseData.devOtp = otp;
    }

    return sendSuccess(res, 200, 'A new verification OTP has been sent to your email.', responseData);
  } catch (error) {
    console.error('Resend signup OTP error:', error);
    return sendError(res, 500, 'Failed to resend verification OTP. Please try again.');
  }
};

/**
 * Verify Signup OTP & Create Account
 * Payload: { email, otp }
 */
export const verifySignupOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return sendError(res, 400, 'Email and OTP are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const record = await SignupVerification.findOne({ email: normalizedEmail });

    if (!record) {
      return sendError(res, 400, 'No pending registration found or verification expired. Please sign up again.');
    }

    if (new Date() > record.expiresAt) {
      await SignupVerification.deleteOne({ _id: record._id });
      return sendError(res, 400, 'Verification OTP has expired. Please sign up again.');
    }

    if (record.attempts >= 5) {
      await SignupVerification.deleteOne({ _id: record._id });
      return sendError(res, 429, 'Too many incorrect attempts. Please sign up again.');
    }

    const candidateHash = crypto.createHash('sha256').update(otp.trim()).digest('hex');
    if (candidateHash !== record.otpHash) {
      record.attempts += 1;
      await record.save();
      return sendError(res, 400, 'Invalid verification OTP. Please check your email and try again.');
    }

    // Verify uniqueness again to prevent race condition
    const conflict = await User.findOne({ email: normalizedEmail });
    if (conflict) {
      await SignupVerification.deleteOne({ _id: record._id });
      return sendError(res, 400, 'An account with this email address already exists.');
    }

    // Create the user in the database now that OTP is verified
    const user = await User.create({
      name: record.signupData.name,
      email: normalizedEmail,
      age: record.signupData.age,
      role: record.signupData.role,
      studyOrPreparation: record.signupData.studyOrPreparation,
      institution: record.signupData.institution,
      experienceLevel: record.signupData.experienceLevel,
      password: record.signupData.password,
    });

    // Clean up temporary verification record
    await SignupVerification.deleteOne({ _id: record._id });

    return sendSuccess(res, 201, 'Account created and verified successfully! You can now log in.', {
      user: user.toProfile(),
    });
  } catch (error) {
    console.error('Verify signup OTP error:', error);
    if (error.code === 11000) {
      return sendError(res, 400, 'An account with this email address already exists.');
    }
    return sendError(res, 500, 'Account verification failed. Please try again.');
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
    if (process.env.NODE_ENV !== 'production') {
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
