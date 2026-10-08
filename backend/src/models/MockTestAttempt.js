import mongoose from 'mongoose';

const mockTestAttemptSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  mockTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MockTest',
    required: true,
    index: true,
  },
  score: {
    type: Number,
    required: true,
  },
  totalMarks: {
    type: Number,
    required: true,
  },
  percentage: {
    type: Number,
    required: true,
  },
  isPassed: {
    type: Boolean,
    default: false,
  },
  correctCount: {
    type: Number,
    default: 0,
  },
  incorrectCount: {
    type: Number,
    default: 0,
  },
  unattemptedCount: {
    type: Number,
    default: 0,
  },
  timeSpentSeconds: {
    type: Number,
    default: 0,
  },
  answers: [{
    questionIndex: Number,
    questionText: String,
    options: [String],
    selectedOption: {
      type: Number,
      default: -1,
    },
    correctOption: Number,
    isCorrect: Boolean,
    marksAwarded: Number,
    explanation: String,
  }],
}, {
  timestamps: true,
});

mockTestAttemptSchema.index({ user: 1, createdAt: -1 });

export default mongoose.model('MockTestAttempt', mockTestAttemptSchema);
