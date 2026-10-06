import attendanceService from '../services/attendance.service.js';
import Meeting from '../models/Meeting.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMeetingAttendance = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id).lean();

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    if (meeting.host.toString() !== req.user._id.toString()) {
      return sendError(res, 403, 'Only the host can view attendance.');
    }

    const attendance = await attendanceService.getMeetingAttendance(req.params.id);

    const summary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      late: attendance.filter(a => a.status === 'Late').length,
      leftEarly: attendance.filter(a => a.status === 'Left Early').length,
      averageDuration: attendance.length > 0
        ? Math.round(attendance.reduce((sum, a) => sum + (a.duration || 0), 0) / attendance.length)
        : 0,
    };

    return sendSuccess(res, 200, 'Attendance fetched.', { attendance, summary });
  } catch (error) {
    console.error('Get attendance error:', error);
    return sendError(res, 500, 'Failed to fetch attendance.');
  }
};

export const getMyAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.getUserAttendance(req.user._id);
    return sendSuccess(res, 200, 'Your attendance fetched.', { attendance });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch attendance.');
  }
};
