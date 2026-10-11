import mongoose from 'mongoose';

const activityEventSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: [
      'test_started',
      'tab_hidden',
      'tab_visible',
      'window_blur',
      'window_focus',
      'fullscreen_exit',
      'fullscreen_enter',
      'session_interrupted',
      'test_resumed',
      'answer_saved',
      'test_submitted',
      'test_expired',
    ],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  returnedAt: {
    type: Date,
  },
  durationSeconds: {
    type: Number,
    default: 0,
  },
  details: {
    type: String,
    default: '',
  },
}, { _id: false });

const resumeRecordSchema = new mongoose.Schema({
  resumedAt: {
    type: Date,
    default: Date.now,
  },
  durationAwaySeconds: {
    type: Number,
    default: 0,
  },
  details: {
    type: String,
    default: '',
  },
}, { _id: false });

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
  status: {
    type: String,
    enum: ['in_progress', 'interrupted', 'submitted', 'expired'],
    default: 'in_progress',
    index: true,
  },
  startedAt: {
    type: Date,
    default: Date.now,
  },
  deadline: {
    type: Date,
  },
  submittedAt: {
    type: Date,
  },
  durationMinutes: {
    type: Number,
    default: 15,
  },
  savedAnswers: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  currentQuestionIndex: {
    type: Number,
    default: 0,
  },
  resumeCount: {
    type: Number,
    default: 0,
  },
  maxResumesAllowed: {
    type: Number,
    default: 4,
  },
  resumes: [resumeRecordSchema],
  activityEvents: [activityEventSchema],
  tabSwitchCount: {
    type: Number,
    default: 0,
  },
  totalTimeAwaySeconds: {
    type: Number,
    default: 0,
  },
  fullscreenExitCount: {
    type: Number,
    default: 0,
  },
  score: {
    type: Number,
    default: 0,
  },
  totalMarks: {
    type: Number,
    default: 0,
  },
  percentage: {
    type: Number,
    default: 0,
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
mockTestAttemptSchema.index({ user: 1, mockTest: 1, status: 1 });

export default mongoose.model('MockTestAttempt', mockTestAttemptSchema);
