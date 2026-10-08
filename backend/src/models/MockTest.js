import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },
  options: [{
    type: String,
    required: true,
  }],
  correctOptionIndex: {
    type: Number,
    required: true,
    min: 0,
    max: 3,
  },
  marks: {
    type: Number,
    default: 2,
  },
  negativeMarks: {
    type: Number,
    default: 0.5,
  },
  explanation: {
    type: String,
    default: '',
  },
});

const mockTestSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200,
  },
  category: {
    type: String,
    required: true,
    enum: ['SSC', 'Banking', 'UPSC', 'Railway', 'GATE', 'State Government Exams'],
    index: true,
  },
  description: {
    type: String,
    default: '',
  },
  durationMinutes: {
    type: Number,
    required: true,
    default: 15,
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 20,
  },
  passingPercentage: {
    type: Number,
    default: 40,
  },
  questions: [questionSchema],
}, {
  timestamps: true,
});

mockTestSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model('MockTest', mockTestSchema);
