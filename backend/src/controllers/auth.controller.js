import User from '../models/User.js';
import otpService from '../services/otp.service.js';
import { generateToken } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const signup = async (req, res) => {
  try {
    const { name, mobile, age, role, studyOrPreparation, institution, experienceLevel, password } = req.body;

    if (!name || !mobile || !age || !role || !password) {
      return sendError(res, 400, 'Please fill all required fields.');
    }

    if (!/^\d{10}$/.test(mobile)) {
      return sendError(res, 400, 'Please enter a valid 10-digit mobile number.');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Password must be at least 6 characters.');
    }

    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      if (existingUser.isMobileVerified) {
        return sendError(res, 400, 'An account with this mobile number already exists.');
      }
      // If user registered earlier but never verified OTP, update their details
      existingUser.name = name;
      existingUser.age = age;
      existingUser.role = role;
      existingUser.studyOrPreparation = studyOrPreparation || '';
      existingUser.institution = institution || '';
      existingUser.experienceLevel = experienceLevel || '';
      existingUser.password = password;
      await existingUser.save();

      return sendSuccess(res, 200, 'Account details updated. Please verify your mobile number.', {
        userId: existingUser._id,
        mobile: existingUser.mobile,
      });
    }

    const user = await User.create({
      name,
      mobile,
      age,
      role,
      studyOrPreparation: studyOrPreparation || '',
      institution: institution || '',
      experienceLevel: experienceLevel || '',
      password,
    });

    return sendSuccess(res, 201, 'Account created. Please verify your mobile number.', {
      userId: user._id,
      mobile: user.mobile,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return sendError(res, 500, 'Registration failed. Please try again.');
  }
};

export const sendOtp = async (req, res) => {
  try {
    const { mobile, type } = req.body;

    if (!mobile || !type) {
      return sendError(res, 400, 'Mobile number and OTP type are required.');
    }

    if (!/^\d{10}$/.test(mobile)) {
      return sendError(res, 400, 'Please enter a valid 10-digit mobile number.');
    }

    if (!['signup', 'login'].includes(type)) {
      return sendError(res, 400, 'Invalid OTP type.');
    }

    if (type === 'login') {
      const user = await User.findOne({ mobile }).lean();
      if (!user) {
        return sendError(res, 404, 'No account found with this mobile number.');
      }
    }

    const { canResend, remainingSeconds } = await otpService.canResend(mobile, type);
    if (!canResend) {
      return sendError(res, 429, `Please wait ${remainingSeconds} seconds before requesting a new OTP.`);
    }

    const result = await otpService.generateAndSend(mobile, type);

    const responseData = { sent: true };
    if (result.devOtp) {
      responseData.devOtp = result.devOtp;
    }

    return sendSuccess(res, 200, 'OTP sent successfully.', responseData);
  } catch (error) {
    console.error('Send OTP error:', error);
    return sendError(res, 500, 'Failed to send OTP. Please try again.');
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { mobile, otp, type } = req.body;

    if (!mobile || !otp || !type) {
      return sendError(res, 400, 'Mobile number, OTP, and type are required.');
    }

    const result = await otpService.verify(mobile, otp, type);

    if (!result.valid) {
      return sendError(res, 400, result.message);
    }

    if (type === 'signup') {
      await User.findOneAndUpdate({ mobile }, { isMobileVerified: true });
      const user = await User.findOne({ mobile });
      const token = generateToken(user._id);

      return sendSuccess(res, 200, 'Mobile verified successfully.', {
        token,
        user: user.toProfile(),
      });
    }

    return sendSuccess(res, 200, 'OTP verified successfully.');
  } catch (error) {
    console.error('Verify OTP error:', error);
    return sendError(res, 500, 'OTP verification failed. Please try again.');
  }
};

export const login = async (req, res) => {
  try {
    const { mobile, otp } = req.body;

    if (!mobile || !otp) {
      return sendError(res, 400, 'Mobile number and OTP are required.');
    }

    if (!/^\d{10}$/.test(mobile)) {
      return sendError(res, 400, 'Please enter a valid 10-digit mobile number.');
    }

    const user = await User.findOne({ mobile });
    if (!user) {
      return sendError(res, 404, 'No account found with this mobile number.');
    }

    const result = await otpService.verify(mobile, otp, 'login');
    if (!result.valid) {
      return sendError(res, 400, result.message);
    }

    if (!user.isMobileVerified) {
      user.isMobileVerified = true;
      await user.save();
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

export const logout = async (req, res) => {
  res.clearCookie('token');
  return sendSuccess(res, 200, 'Logged out successfully.');
};

export const getMe = async (req, res) => {
  try {
    return sendSuccess(res, 200, 'User fetched.', { user: req.user.toProfile() });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch user.');
  }
};
