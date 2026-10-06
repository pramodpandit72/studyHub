import crypto from 'crypto';

export const generateMeetingCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
};

export const generateOtpCode = () => {
  const otp = crypto.randomInt(1000, 10000).toString();
  return otp;
};
