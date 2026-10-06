import Otp from '../models/Otp.js';
import { generateOtpCode } from '../utils/generateCode.js';
import env from '../config/env.js';

const otpService = {
  async generateAndSend(mobile, type) {
    const otp = generateOtpCode();

    await Otp.createOtp(mobile, otp, type);

    if (env.OTP_PROVIDER === 'development') {
      console.log(`[DEV OTP] Mobile: ${mobile}, OTP: ${otp}`);
      return { sent: true, devOtp: env.NODE_ENV === 'development' ? otp : undefined };
    }

    // Production: integrate with SMS provider here
    // await smsProvider.send(mobile, `Your viMeet OTP is: ${otp}`);
    return { sent: true };
  },

  async verify(mobile, otpInput, type) {
    const otpRecord = await Otp.findOne({ mobile, type }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return { valid: false, message: 'OTP not found. Please request a new OTP.' };
    }

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return { valid: false, message: 'OTP has expired. Please request a new OTP.' };
    }

    if (otpRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return { valid: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
    }

    const isValid = await otpRecord.verifyOtp(otpInput);

    if (!isValid) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return { valid: false, message: 'Invalid OTP. Please try again.' };
    }

    await Otp.deleteOne({ _id: otpRecord._id });
    return { valid: true };
  },

  async canResend(mobile, type) {
    const lastOtp = await Otp.findOne({ mobile, type }).sort({ createdAt: -1 });
    if (!lastOtp) return { canResend: true };

    const elapsed = (Date.now() - lastOtp.createdAt.getTime()) / 1000;
    if (elapsed < env.OTP_RESEND_COOLDOWN_SECONDS) {
      const remaining = Math.ceil(env.OTP_RESEND_COOLDOWN_SECONDS - elapsed);
      return { canResend: false, remainingSeconds: remaining };
    }
    return { canResend: true };
  },
};

export default otpService;
