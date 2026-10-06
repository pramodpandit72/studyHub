import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  rating: {
    type: String,
    required: [true, 'Please select a rating'],
    enum: ['Very Good', 'Good', 'Okay', 'Poor', 'Very Poor']
  },
  category: {
    type: String,
    enum: ['Website', 'Meeting', 'Login/Signup', 'Video/Audio', 'Other'],
    default: 'Website'
  },
  message: {
    type: String,
    trim: true,
    maxlength: [1000, 'Feedback message cannot exceed 1000 characters'],
    default: ''
  },
  page: {
    type: String,
    trim: true,
    default: ''
  }
}, {
  timestamps: true
});

feedbackSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('Feedback', feedbackSchema);
