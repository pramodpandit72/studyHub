import Attendance from '../models/Attendance.js';

const attendanceService = {
  async recordJoin(meetingId, userId) {
    const existing = await Attendance.findOne({
      meeting: meetingId,
      user: userId,
      leftAt: null,
    });

    if (existing) return existing;

    return Attendance.create({
      meeting: meetingId,
      user: userId,
      joinedAt: new Date(),
      status: 'Present',
    });
  },

  async recordLeave(meetingId, userId) {
    const record = await Attendance.findOne({
      meeting: meetingId,
      user: userId,
      leftAt: null,
    });

    if (!record) return null;

    record.leftAt = new Date();
    record.duration = Math.max(1, Math.round((record.leftAt - record.joinedAt) / 1000 / 60));
    await record.save();
    return record;
  },

  async finalizeMeetingAttendance(meetingId) {
    const openRecords = await Attendance.find({
      meeting: meetingId,
      leftAt: null,
    });

    const now = new Date();
    for (const record of openRecords) {
      record.leftAt = now;
      record.duration = Math.max(1, Math.round((now - record.joinedAt) / 1000 / 60));
      await record.save();
    }
  },

  async getMeetingAttendance(meetingId) {
    return Attendance.find({ meeting: meetingId })
      .populate('user', 'name mobile role')
      .sort({ joinedAt: 1 })
      .lean();
  },

  async getUserAttendance(userId) {
    return Attendance.find({ user: userId })
      .populate('meeting', 'title meetingCode startTime status')
      .sort({ joinedAt: -1 })
      .lean();
  },
};

export default attendanceService;
