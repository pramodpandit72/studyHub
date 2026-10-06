import mongoose from 'mongoose';

const meetingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    default: '',
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters'],
  },
  host: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  meetingCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    index: true,
  },
  meetingType: {
    type: String,
    enum: ['instant', 'scheduled'],
    default: 'instant',
  },
  startTime: {
    type: Date,
    required: true,
    index: true,
  },
  endTime: {
    type: Date,
  },
  actualStartTime: {
    type: Date,
  },
  actualEndTime: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['scheduled', 'live', 'completed', 'cancelled'],
    default: 'scheduled',
    index: true,
  },
  maxParticipants: {
    type: Number,
    default: 50,
    min: 2,
    max: 100,
  },
  waitingRoom: {
    type: Boolean,
    default: false,
  },
  participantPermissions: {
    canShareScreen: { type: Boolean, default: true },
    canChat: { type: Boolean, default: true },
    canUnmute: { type: Boolean, default: true },
    canEnableCamera: { type: Boolean, default: true },
  },
  participants: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
    role: { type: String, enum: ['host', 'participant'], default: 'participant' },
  }],
  waitingList: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    requestedAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

meetingSchema.index({ host: 1, status: 1 });
meetingSchema.index({ startTime: 1, status: 1 });

meetingSchema.methods.isHost = function (userId) {
  if (!userId || !this.host) return false;
  const hostId = this.host._id || this.host;
  return hostId.toString() === userId.toString();
};

meetingSchema.methods.isParticipant = function (userId) {
  if (!userId || !this.participants) return false;
  return this.participants.some(p => {
    const pId = p.user?._id || p.user;
    return pId && pId.toString() === userId.toString();
  });
};

meetingSchema.methods.getParticipantCount = function () {
  return this.participants.length;
};

const Meeting = mongoose.model('Meeting', meetingSchema);
export default Meeting;
