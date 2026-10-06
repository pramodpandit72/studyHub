import dotenv from 'dotenv';
dotenv.config();

const env = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/vimeet',
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_change_in_production',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  OTP_PROVIDER: process.env.OTP_PROVIDER || 'development',
  OTP_API_KEY: process.env.OTP_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development',
  JWT_EXPIRES_IN: '7d',
  OTP_EXPIRY_MINUTES: 5,
  OTP_MAX_ATTEMPTS: 5,
  OTP_RESEND_COOLDOWN_SECONDS: 60,
};

export default env;
