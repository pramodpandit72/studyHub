import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address'],
  },
  mobile: {
    type: String,
    default: '',
    trim: true,
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [10, 'Age must be at least 10'],
    max: [120, 'Age must be less than 120'],
  },
  role: {
    type: String,
    required: [true, 'Role is required'],
    enum: ['Student', 'Teacher', 'Trainer', 'Mentor', 'Working Professional', 'Other'],
  },
  studyOrPreparation: {
    type: String,
    default: '',
    trim: true,
  },
  institution: {
    type: String,
    default: '',
    trim: true,
  },
  experienceLevel: {
    type: String,
    default: '',
    trim: true,
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
  },
  resetPasswordToken: {
    type: String,
    select: false,
  },
  resetPasswordExpires: {
    type: Date,
    select: false,
  },
  resetPasswordAttempts: {
    type: Number,
    default: 0,
    select: false,
  },
  avatar: {
    type: String,
    default: '',
  },
  themePreference: {
    type: String,
    enum: ['light', 'dark'],
    default: 'light',
  },
}, {
  timestamps: true,
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    mobile: this.mobile,
    age: this.age,
    role: this.role,
    studyOrPreparation: this.studyOrPreparation,
    institution: this.institution,
    experienceLevel: this.experienceLevel,
    avatar: this.avatar,
    themePreference: this.themePreference,
    createdAt: this.createdAt,
  };
};

const User = mongoose.model('User', userSchema);
export default User;
