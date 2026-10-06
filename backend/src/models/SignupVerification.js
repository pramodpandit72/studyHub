import mongoose from 'mongoose';

const signupVerificationSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
  },
  signupData: {
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    age: { type: Number, required: true },
    role: { type: String, required: true },
    studyOrPreparation: { type: String, default: '' },
    institution: { type: String, default: '' },
    experienceLevel: { type: String, default: '' },
    password: { type: String, required: true },
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 },
  },
  attempts: {
    type: Number,
    default: 0,
  },
  lastResendAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const SignupVerification = mongoose.model('SignupVerification', signupVerificationSchema);
export default SignupVerification;
