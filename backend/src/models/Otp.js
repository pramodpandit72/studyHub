import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  mobile: {
    type: String,
    required: true,
    index: true,
  },
  otpHash: {
    type: String,
    required: true,
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
  type: {
    type: String,
    enum: ['signup', 'login'],
    required: true,
  },
}, {
  timestamps: true,
});

otpSchema.statics.createOtp = async function (mobile, otp, type) {
  await this.deleteMany({ mobile, type });

  const salt = await bcrypt.genSalt(10);
  const otpHash = await bcrypt.hash(otp, salt);

  return this.create({
    mobile,
    otpHash,
    type,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
  });
};

otpSchema.methods.verifyOtp = async function (candidateOtp) {
  return bcrypt.compare(candidateOtp, this.otpHash);
};

const Otp = mongoose.model('Otp', otpSchema);
export default Otp;
