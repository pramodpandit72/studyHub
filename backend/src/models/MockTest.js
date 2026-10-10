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
  },
  marks: {
    type: Number,
    default: 2,
    min: 0,
  },
  negativeMarks: {
    type: Number,
    default: 0.5,
    min: 0,
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
    enum: ['SSC', 'Banking', 'UPSC', 'Railway', 'GATE', 'State Government Exams', 'General / Other'],
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
    min: 1,
    max: 300,
  },
  totalMarks: {
    type: Number,
    required: true,
    default: 20,
    min: 0,
  },
  passingPercentage: {
    type: Number,
    default: 40,
    min: 1,
    max: 100,
  },
  difficulty: {
    type: String,
    enum: ['Easy', 'Medium', 'Hard'],
    default: 'Medium',
  },
  hasNegativeMarking: {
    type: Boolean,
    default: true,
  },
  negativeMarks: {
    type: Number,
    default: 0.5,
  },
  marksPerQuestion: {
    type: Number,
    default: 2,
  },
  optionsCount: {
    type: Number,
    default: 4,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
  createdByName: {
    type: String,
    default: '',
  },
  isCustom: {
    type: Boolean,
    default: false,
  },
  questions: [questionSchema],
}, {
  timestamps: true,
});

mockTestSchema.index({ category: 1, createdAt: -1 });

export default mongoose.model('MockTest', mockTestSchema);
