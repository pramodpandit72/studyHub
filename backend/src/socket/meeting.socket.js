import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import attendanceService from '../services/attendance.service.js';

const activeRooms = new Map();
const activePolls = new Map();

export const setupMeetingSocket = (io) => {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));

      const decoded = jwt.verify(token, env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password').lean();
      if (!user) return next(new Error('User not found'));

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.name} (${socket.id})`);

    socket.on('join-room', async ({ meetingId, meetingCode }) => {
      const roomId = meetingCode || meetingId;
      socket.join(roomId);
      socket.currentRoomId = roomId;
      socket.currentMeetingId = meetingId;

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, new Map());
      }

      const room = activeRooms.get(roomId);
      room.set(socket.id, {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        role: socket.user.role,
        socketId: socket.id,
        audio: false,
        video: false,
      });

      if (meetingId) {
        await attendanceService.recordJoin(meetingId, socket.user._id);
      }

      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        user: { _id: socket.user._id, name: socket.user.name, role: socket.user.role },
      });

      const participants = Array.from(room.values());
      socket.emit('room-participants', participants);

      if (activePolls.has(roomId)) {
        socket.emit('active-poll', activePolls.get(roomId));
      }
    });

    socket.on('offer', ({ to, offer }) => {
      socket.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      socket.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('toggle-audio', ({ roomId, enabled }) => {
      const room = activeRooms.get(roomId);
      if (room?.has(socket.id)) {
        room.get(socket.id).audio = enabled;
        socket.to(roomId).emit('participant-audio-toggle', { socketId: socket.id, enabled });
      }
    });

    socket.on('toggle-video', ({ roomId, enabled }) => {
      const room = activeRooms.get(roomId);
      if (room?.has(socket.id)) {
        room.get(socket.id).video = enabled;
        socket.to(roomId).emit('participant-video-toggle', { socketId: socket.id, enabled });
      }
    });

    socket.on('screen-share-started', ({ roomId }) => {
      socket.to(roomId).emit('screen-share-started', { socketId: socket.id, user: socket.user });
    });

    socket.on('screen-share-stopped', ({ roomId }) => {
      socket.to(roomId).emit('screen-share-stopped', { socketId: socket.id });
    });

    socket.on('send-message', ({ roomId, message }) => {
      io.to(roomId).emit('new-message', {
        id: Date.now().toString(),
        sender: { _id: socket.user._id, name: socket.user.name },
        message,
        timestamp: new Date().toISOString(),
      });
    });

    socket.on('mute-participant', ({ roomId, targetSocketId }) => {
      socket.to(targetSocketId).emit('force-mute');
      socket.to(roomId).emit('participant-audio-toggle', { socketId: targetSocketId, enabled: false });
    });

    socket.on('remove-participant', ({ roomId, targetSocketId }) => {
      io.to(targetSocketId).emit('removed-from-meeting');
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.leave(roomId);
      }
      const room = activeRooms.get(roomId);
      if (room) {
        room.delete(targetSocketId);
        io.to(roomId).emit('participant-left', { socketId: targetSocketId });
      }
    });

    // Polling Socket Events
    socket.on('create-poll', ({ roomId, question, options }) => {
      if (!roomId || !question?.trim() || !Array.isArray(options)) return;
      const validOptions = options
        .map((opt) => (typeof opt === 'string' ? opt.trim() : ''))
        .filter(Boolean);

      if (validOptions.length < 2) return;

      const poll = {
        id: Date.now().toString(),
        roomId,
        question: question.trim(),
        options: validOptions.map((text, idx) => ({ id: idx, text, votes: 0 })),
        createdBy: {
          id: socket.user._id.toString(),
          name: socket.user.name,
        },
        voters: {}, // userId -> optionId
        totalVotes: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      activePolls.set(roomId, poll);
      io.to(roomId).emit('poll-published', poll);
    });

    socket.on('vote-poll', ({ roomId, pollId, optionId }) => {
      const poll = activePolls.get(roomId);
      if (!poll || poll.id !== pollId || !poll.isActive) return;

      const userId = socket.user._id.toString();
      if (poll.voters[userId] !== undefined) return;

      const optionIndex = poll.options.findIndex((opt) => opt.id === optionId);
      if (optionIndex === -1) return;

      poll.options[optionIndex].votes += 1;
      poll.totalVotes += 1;
      poll.voters[userId] = optionId;

      io.to(roomId).emit('poll-updated', poll);
    });

    socket.on('end-poll', ({ roomId, pollId }) => {
      const poll = activePolls.get(roomId);
      if (!poll || poll.id !== pollId) return;

      poll.isActive = false;
      io.to(roomId).emit('poll-closed', poll);
    });

    socket.on('end-meeting', async ({ roomId, meetingId }) => {
      io.to(roomId).emit('meeting-ended');
      const room = activeRooms.get(roomId);
      if (room) {
        activeRooms.delete(roomId);
      }
      activePolls.delete(roomId);
      const mId = meetingId || socket.currentMeetingId;
      if (mId) {
        await attendanceService.finalizeMeetingAttendance(mId);
      }
    });

    socket.on('leave-room', async ({ roomId, meetingId }) => {
      socket.leave(roomId);
      const room = activeRooms.get(roomId);
      if (room) {
        room.delete(socket.id);
        socket.to(roomId).emit('participant-left', { socketId: socket.id });
        if (room.size === 0) {
          activeRooms.delete(roomId);
          activePolls.delete(roomId);
        }
      }
      const mId = meetingId || socket.currentMeetingId;
      if (mId) {
        await attendanceService.recordLeave(mId, socket.user._id);
      }
      socket.currentRoomId = null;
      socket.currentMeetingId = null;
    });

    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
      if (socket.currentMeetingId) {
        await attendanceService.recordLeave(socket.currentMeetingId, socket.user._id);
      }
      for (const [roomId, room] of activeRooms) {
        if (room.has(socket.id)) {
          room.delete(socket.id);
          socket.to(roomId).emit('participant-left', { socketId: socket.id });
          if (room.size === 0) {
            activeRooms.delete(roomId);
            activePolls.delete(roomId);
          }
        }
      }
    });
  });
};
