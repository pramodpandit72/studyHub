import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema({
  meeting: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Meeting',
    required: true,
    index: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  joinedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  leftAt: {
    type: Date,
  },
  duration: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['Present', 'Late', 'Left Early', 'Absent'],
    default: 'Present',
  },
}, {
  timestamps: true,
});

attendanceSchema.index({ meeting: 1, user: 1 });

attendanceSchema.pre('save', function (next) {
  if (this.leftAt && this.joinedAt) {
    this.duration = Math.round((this.leftAt - this.joinedAt) / 1000 / 60);
  }
  next();
});

const Attendance = mongoose.model('Attendance', attendanceSchema);
export default Attendance;
