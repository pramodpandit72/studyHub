import Meeting from '../models/Meeting.js';
import meetingService from '../services/meeting.service.js';
import attendanceService from '../services/attendance.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const createMeeting = async (req, res) => {
  try {
    const { title, description, meetingType, startTime, endTime, maxParticipants, waitingRoom, participantPermissions } = req.body;

    if (!title || !title.trim()) {
      return sendError(res, 400, 'Meeting title is required.');
    }

    let parsedStartTime = new Date();
    let parsedEndTime = null;

    if (meetingType === 'scheduled') {
      if (!startTime) {
        return sendError(res, 400, 'Start time is required for scheduled meetings.');
      }
      parsedStartTime = new Date(startTime);
      if (isNaN(parsedStartTime.getTime())) {
        return sendError(res, 400, 'Invalid start date/time format.');
      }

      if (endTime) {
        parsedEndTime = new Date(endTime);
        if (isNaN(parsedEndTime.getTime()) || parsedEndTime <= parsedStartTime) {
          return sendError(res, 400, 'End time must be after start time.');
        }
      }
    }

    const meetingCode = await meetingService.generateUniqueMeetingCode();

    const meeting = await Meeting.create({
      title: title.trim(),
      description: description ? description.trim() : '',
      host: req.user._id,
      meetingCode,
      meetingType: meetingType || 'instant',
      startTime: parsedStartTime,
      endTime: parsedEndTime,
      status: meetingType === 'scheduled' ? 'scheduled' : 'live',
      maxParticipants: maxParticipants ? Math.min(100, Math.max(2, parseInt(maxParticipants, 10))) : 50,
      waitingRoom: !!waitingRoom,
      participantPermissions: participantPermissions || {},
      participants: [{ user: req.user._id, role: 'host', joinedAt: new Date() }],
    });

    if (meetingType !== 'scheduled') {
      meeting.actualStartTime = new Date();
      await meeting.save();
    }

    await meeting.populate('host', 'name email role');

    return sendSuccess(res, 201, 'Meeting created successfully.', { meeting });
  } catch (error) {
    console.error('Create meeting error:', error);
    return sendError(res, 500, 'Failed to create meeting.');
  }
};

export const getMeetings = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      $or: [
        { host: req.user._id },
        { 'participants.user': req.user._id },
      ],
    };

    if (status) query.status = status;

    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .populate('host', 'name role')
        .sort({ startTime: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Meeting.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'Meetings fetched.', {
      meetings,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get meetings error:', error);
    return sendError(res, 500, 'Failed to fetch meetings.');
  }
};

export const getMeetingById = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id)
      .populate('host', 'name email role')
      .populate('participants.user', 'name role');

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    return sendSuccess(res, 200, 'Meeting fetched.', { meeting });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch meeting.');
  }
};

export const getMeetingByCode = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingCode: req.params.code.toUpperCase() })
      .populate('host', 'name role');

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    return sendSuccess(res, 200, 'Meeting fetched.', { meeting });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch meeting.');
  }
};

export const updateMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    if (!meeting.isHost(req.user._id)) {
      return sendError(res, 403, 'Only the host can update this meeting.');
    }

    if (meeting.status === 'completed' || meeting.status === 'cancelled') {
      return sendError(res, 400, `Cannot update a ${meeting.status} meeting.`);
    }

    const allowedUpdates = ['title', 'description', 'startTime', 'endTime', 'maxParticipants', 'waitingRoom', 'participantPermissions', 'status'];

    if (req.body.status && req.body.status !== 'cancelled') {
      return sendError(res, 400, 'Use start or end meeting endpoints for lifecycle transitions.');
    }

    if (req.body.startTime && req.body.endTime) {
      const start = new Date(req.body.startTime);
      const end = new Date(req.body.endTime);
      if (end <= start) {
        return sendError(res, 400, 'End time must be after start time.');
      }
    }

    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        meeting[field] = req.body[field];
      }
    }

    await meeting.save();
    await meeting.populate('host', 'name role');

    return sendSuccess(res, 200, 'Meeting updated successfully.', { meeting });
  } catch (error) {
    console.error('Update meeting error:', error);
    return sendError(res, 500, 'Failed to update meeting.');
  }
};

export const deleteMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    if (!meeting.isHost(req.user._id)) {
      return sendError(res, 403, 'Only the host can delete this meeting.');
    }

    if (meeting.status === 'live') {
      return sendError(res, 400, 'Cannot delete a live meeting. End it first.');
    }

    await Meeting.findByIdAndDelete(req.params.id);

    return sendSuccess(res, 200, 'Meeting deleted successfully.');
  } catch (error) {
    return sendError(res, 500, 'Failed to delete meeting.');
  }
};

export const joinMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findOne({ meetingCode: req.params.code.toUpperCase() });

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    if (meeting.status === 'completed') {
      return sendError(res, 400, 'This meeting has already ended.');
    }

    if (meeting.status === 'cancelled') {
      return sendError(res, 400, 'This meeting has been cancelled.');
    }

    const isUserHost = meeting.isHost(req.user._id);

    // If host is joining a scheduled meeting, transition it to live
    if (isUserHost && meeting.status === 'scheduled') {
      meeting.status = 'live';
      meeting.actualStartTime = meeting.actualStartTime || new Date();
      await meeting.save();
    }

    if (meeting.isParticipant(req.user._id)) {
      await meeting.populate('host', 'name role');
      await meeting.populate('participants.user', 'name role');
      await attendanceService.recordJoin(meeting._id, req.user._id);
      return sendSuccess(res, 200, 'Already in meeting.', { meeting });
    }

    if (meeting.getParticipantCount() >= meeting.maxParticipants) {
      return sendError(res, 400, 'Meeting is full.');
    }

    if (meeting.waitingRoom && !isUserHost) {
      if (!meeting.waitingList.some(w => w.user.toString() === req.user._id.toString())) {
        meeting.waitingList.push({ user: req.user._id });
        await meeting.save();
      }
      return sendSuccess(res, 200, 'Added to waiting room.', { waiting: true });
    }

    meeting.participants.push({
      user: req.user._id,
      role: isUserHost ? 'host' : 'participant',
    });

    if (meeting.status === 'scheduled') {
      meeting.status = 'live';
      meeting.actualStartTime = meeting.actualStartTime || new Date();
    }

    await meeting.save();
    await meeting.populate('host', 'name role');
    await meeting.populate('participants.user', 'name role');
    await attendanceService.recordJoin(meeting._id, req.user._id);

    return sendSuccess(res, 200, 'Joined meeting successfully.', { meeting });
  } catch (error) {
    console.error('Join meeting error:', error);
    return sendError(res, 500, 'Failed to join meeting.');
  }
};

export const leaveMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    meeting.participants = meeting.participants.filter(
      p => {
        const pId = p.user?._id || p.user;
        return pId && pId.toString() !== req.user._id.toString();
      }
    );

    await meeting.save();
    await attendanceService.recordLeave(meeting._id, req.user._id);

    return sendSuccess(res, 200, 'Left meeting successfully.');
  } catch (error) {
    return sendError(res, 500, 'Failed to leave meeting.');
  }
};

export const startMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    if (!meeting.isHost(req.user._id)) {
      return sendError(res, 403, 'Only the host can start this meeting.');
    }

    if (meeting.status === 'live') {
      return sendError(res, 400, 'Meeting is already live.');
    }

    if (meeting.status === 'completed') {
      return sendError(res, 400, 'Cannot start a completed meeting.');
    }

    if (meeting.status === 'cancelled') {
      return sendError(res, 400, 'Cannot start a cancelled meeting.');
    }

    meeting.status = 'live';
    meeting.actualStartTime = new Date();
    await meeting.save();

    return sendSuccess(res, 200, 'Meeting started.', { meeting });
  } catch (error) {
    return sendError(res, 500, 'Failed to start meeting.');
  }
};

export const endMeeting = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) {
      return sendError(res, 404, 'Meeting not found.');
    }

    if (!meeting.isHost(req.user._id)) {
      return sendError(res, 403, 'Only the host can end this meeting.');
    }

    meeting.status = 'completed';
    meeting.actualEndTime = new Date();
    await meeting.save();

    await attendanceService.finalizeMeetingAttendance(meeting._id);

    return sendSuccess(res, 200, 'Meeting ended.', { meeting });
  } catch (error) {
    return sendError(res, 500, 'Failed to end meeting.');
  }
};

export const getUpcoming = async (req, res) => {
  try {
    const meetings = await Meeting.find({
      $or: [{ host: req.user._id }, { 'participants.user': req.user._id }],
      status: { $in: ['scheduled', 'live'] },
      startTime: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    })
      .populate('host', 'name role')
      .sort({ startTime: 1 })
      .limit(10)
      .lean();

    return sendSuccess(res, 200, 'Upcoming meetings fetched.', { meetings });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch upcoming meetings.');
  }
};

export const getHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = {
      $or: [{ host: req.user._id }, { 'participants.user': req.user._id }],
      status: 'completed',
    };

    const [meetings, total] = await Promise.all([
      Meeting.find(query)
        .populate('host', 'name role')
        .sort({ actualEndTime: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Meeting.countDocuments(query),
    ]);

    return sendSuccess(res, 200, 'Meeting history fetched.', {
      meetings,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    return sendError(res, 500, 'Failed to fetch meeting history.');
  }
};

export const admitParticipant = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) return sendError(res, 404, 'Meeting not found.');
    if (!meeting.isHost(req.user._id)) return sendError(res, 403, 'Only the host can admit participants.');

    const { userId } = req.body;
    const waitingIdx = meeting.waitingList.findIndex(w => w.user.toString() === userId);

    if (waitingIdx === -1) return sendError(res, 404, 'User not in waiting room.');

    meeting.waitingList.splice(waitingIdx, 1);
    meeting.participants.push({ user: userId, role: 'participant' });
    await meeting.save();

    return sendSuccess(res, 200, 'Participant admitted.');
  } catch (error) {
    return sendError(res, 500, 'Failed to admit participant.');
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const meeting = await Meeting.findById(req.params.id);

    if (!meeting) return sendError(res, 404, 'Meeting not found.');
    if (!meeting.isHost(req.user._id)) return sendError(res, 403, 'Only the host can remove participants.');

    const { userId } = req.body;

    if (userId === req.user._id.toString()) {
      return sendError(res, 400, 'You cannot remove yourself. Use end meeting instead.');
    }

    meeting.participants = meeting.participants.filter(p => p.user.toString() !== userId);
    await meeting.save();

    return sendSuccess(res, 200, 'Participant removed.');
  } catch (error) {
    return sendError(res, 500, 'Failed to remove participant.');
  }
};
