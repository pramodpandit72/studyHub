import jwt from 'jsonwebtoken';
import env from '../config/env.js';
import User from '../models/User.js';
import Meeting from '../models/Meeting.js';
import attendanceService from '../services/attendance.service.js';

const activeRooms = new Map(); // roomId -> { roomId, meetingId, hostUserId, participants: Map, permissions, activeScreenSharer }
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

    const verifyHost = (roomId) => {
      const room = activeRooms.get(roomId);
      if (!room) return false;
      return Boolean(room.hostUserId && room.hostUserId === socket.user._id.toString());
    };

    socket.on('join-room', async ({ meetingId, meetingCode, initialAudio = false, initialVideo = false }) => {
      const roomId = meetingCode || meetingId;
      if (!roomId) return;

      socket.join(roomId);
      socket.currentRoomId = roomId;
      socket.currentMeetingId = meetingId;

      // Look up meeting in DB to identify the host and default permissions
      let meeting = null;
      try {
        if (meetingId) {
          meeting = await Meeting.findById(meetingId).select('host participantPermissions').lean();
        }
        if (!meeting && meetingCode) {
          meeting = await Meeting.findOne({ meetingCode: meetingCode.toUpperCase() }).select('host participantPermissions').lean();
        }
      } catch (err) {
        console.warn('Error fetching meeting info in socket:', err.message);
      }

      const hostUserId = meeting?.host?.toString() || '';
      const isHost = Boolean(hostUserId && hostUserId === socket.user._id.toString());

      if (!activeRooms.has(roomId)) {
        activeRooms.set(roomId, {
          roomId,
          meetingId: meeting?._id?.toString() || meetingId,
          hostUserId,
          participants: new Map(),
          permissions: {
            canShareScreen: meeting?.participantPermissions?.canShareScreen ?? true,
          },
          activeScreenSharer: null,
        });
      }

      const room = activeRooms.get(roomId);
      if (hostUserId && !room.hostUserId) {
        room.hostUserId = hostUserId;
      }

      // Cleanup any previous socket connection for the same user (handles refreshes / reconnects without ghosts)
      for (const [prevSocketId, p] of room.participants) {
        if (p.userId === socket.user._id.toString() && prevSocketId !== socket.id) {
          const prevSocket = io.sockets.sockets.get(prevSocketId);
          if (!prevSocket || !prevSocket.connected) {
            room.participants.delete(prevSocketId);
            socket.to(roomId).emit('participant-left', { socketId: prevSocketId });
          }
        }
      }

      const canShareScreen = isHost ? true : Boolean(room.permissions.canShareScreen);

      const participant = {
        userId: socket.user._id.toString(),
        name: socket.user.name,
        role: isHost ? 'host' : socket.user.role,
        socketId: socket.id,
        audio: Boolean(initialAudio),
        video: Boolean(initialVideo),
        isHost,
        canShareScreen,
      };

      room.participants.set(socket.id, participant);

      if (meetingId) {
        try {
          await attendanceService.recordJoin(meetingId, socket.user._id);
        } catch (e) {
          console.warn('Record join error:', e.message);
        }
      }

      // Notify existing users of new join
      socket.to(roomId).emit('user-joined', {
        socketId: socket.id,
        user: participant,
      });

      // Send participant list and room state to newly joined user
      const participantsList = Array.from(room.participants.values());
      socket.emit('room-participants', participantsList);
      socket.emit('room-permissions', {
        permissions: room.permissions,
        activeScreenSharer: room.activeScreenSharer,
        isHost,
      });

      if (activePolls.has(roomId)) {
        socket.emit('active-poll', activePolls.get(roomId));
      }
    });

    // WebRTC Signaling (General & Dedicated Audio matching reference implementation)
    socket.on('offer', ({ to, offer }) => {
      io.to(to).emit('offer', { from: socket.id, offer });
    });

    socket.on('answer', ({ to, answer }) => {
      io.to(to).emit('answer', { from: socket.id, answer });
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      io.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });

    socket.on('audio-offer', (data) => {
      const { roomId, offer, targetUserId, to } = data;
      const targetId = to || targetUserId;
      if (targetId) {
        const targetSocket = io.sockets.sockets.get(targetId) || [...io.sockets.sockets.values()].find(
          (s) => s.user?._id?.toString() === targetId || s.id === targetId
        );
        if (targetSocket) {
          targetSocket.emit('audio-offer', {
            offer,
            from: socket.id,
            fromUserId: socket.user?._id?.toString(),
            fromUsername: socket.user?.name,
          });
        }
      } else if (roomId) {
        socket.to(roomId).emit('audio-offer', {
          offer,
          from: socket.id,
          fromUserId: socket.user?._id?.toString(),
          fromUsername: socket.user?.name,
        });
      }
    });

    socket.on('audio-answer', (data) => {
      const { roomId, answer, targetUserId, to } = data;
      const targetId = to || targetUserId;
      if (targetId) {
        const targetSocket = io.sockets.sockets.get(targetId) || [...io.sockets.sockets.values()].find(
          (s) => s.user?._id?.toString() === targetId || s.id === targetId
        );
        if (targetSocket) {
          targetSocket.emit('audio-answer', {
            answer,
            from: socket.id,
            fromUserId: socket.user?._id?.toString(),
          });
        }
      } else if (roomId) {
        socket.to(roomId).emit('audio-answer', {
          answer,
          from: socket.id,
          fromUserId: socket.user?._id?.toString(),
        });
      }
    });

    socket.on('audio-ice-candidate', (data) => {
      const { roomId, candidate, targetUserId, to } = data;
      const targetId = to || targetUserId;
      if (targetId) {
        const targetSocket = io.sockets.sockets.get(targetId) || [...io.sockets.sockets.values()].find(
          (s) => s.user?._id?.toString() === targetId || s.id === targetId
        );
        if (targetSocket) {
          targetSocket.emit('audio-ice-candidate', {
            candidate,
            from: socket.id,
            fromUserId: socket.user?._id?.toString(),
          });
        }
      } else if (roomId) {
        socket.to(roomId).emit('audio-ice-candidate', {
          candidate,
          from: socket.id,
          fromUserId: socket.user?._id?.toString(),
        });
      }
    });

    // Participant Media Toggles
    socket.on('toggle-audio', ({ roomId, enabled }) => {
      const room = activeRooms.get(roomId);
      if (room?.participants?.has(socket.id)) {
        room.participants.get(socket.id).audio = Boolean(enabled);
        socket.to(roomId).emit('participant-audio-toggle', { socketId: socket.id, enabled: Boolean(enabled) });
      }
    });

    socket.on('toggle-video', ({ roomId, enabled }) => {
      const room = activeRooms.get(roomId);
      if (room?.participants?.has(socket.id)) {
        room.participants.get(socket.id).video = Boolean(enabled);
        socket.to(roomId).emit('participant-video-toggle', { socketId: socket.id, enabled: Boolean(enabled) });
      }
    });

    // Screen Share Events
    socket.on('screen-share-started', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (!room) return;

      const participant = room.participants.get(socket.id);
      if (!participant) return;

      // Check permission
      if (!participant.isHost && !participant.canShareScreen) {
        socket.emit('screen-share-denied', { message: 'Screen sharing is not permitted by host.' });
        return;
      }

      room.activeScreenSharer = {
        socketId: socket.id,
        userId: socket.user._id.toString(),
        name: socket.user.name,
        isHost: participant.isHost,
        user: {
          _id: socket.user._id.toString(),
          name: socket.user.name,
          role: socket.user.role,
        },
      };

      io.to(roomId).emit('screen-share-started', {
        socketId: socket.id,
        userId: socket.user._id.toString(),
        name: socket.user.name,
        user: {
          _id: socket.user._id.toString(),
          name: socket.user.name,
          role: socket.user.role,
        },
      });
    });

    socket.on('screen-share-stopped', ({ roomId }) => {
      const room = activeRooms.get(roomId);
      if (room?.activeScreenSharer?.socketId === socket.id) {
        room.activeScreenSharer = null;
      }
      io.to(roomId).emit('screen-share-stopped', { socketId: socket.id });
    });

    // Screen share frame relay
    socket.on('screen-share-frame', ({ roomId, frame }) => {
      if (!roomId || !frame) return;
      socket.to(roomId).emit('screen-share-frame', {
        socketId: socket.id,
        userId: socket.user?._id?.toString(),
        name: socket.user?.name,
        frame,
      });
    });

    // Camera frame relay
    socket.on('camera-frame', ({ roomId, frame }) => {
      if (!roomId || !frame) return;
      socket.to(roomId).emit('camera-frame', {
        socketId: socket.id,
        userId: socket.user?._id?.toString(),
        name: socket.user?.name,
        frame,
      });
    });

    // Host Controls: Mute Participant
    socket.on('mute-participant', ({ roomId, targetSocketId }) => {
      if (!verifyHost(roomId)) {
        socket.emit('error-message', { message: 'Host permission required to mute participants.' });
        return;
      }

      const room = activeRooms.get(roomId);
      if (room?.participants?.has(targetSocketId)) {
        room.participants.get(targetSocketId).audio = false;
      }

      io.to(targetSocketId).emit('force-mute');
      io.to(roomId).emit('participant-audio-toggle', { socketId: targetSocketId, enabled: false });
    });

    // Host Controls: Request Participant to Unmute
    socket.on('request-unmute', ({ roomId, targetSocketId }) => {
      if (!verifyHost(roomId)) {
        socket.emit('error-message', { message: 'Host permission required to request unmute.' });
        return;
      }

      io.to(targetSocketId).emit('unmute-requested', {
        hostName: socket.user.name,
      });
    });

    // Host Controls: Screen Sharing Permissions
    socket.on('set-screen-share-permission', ({ roomId, targetSocketId, allowed }) => {
      if (!verifyHost(roomId)) {
        socket.emit('error-message', { message: 'Host permission required to manage screen sharing.' });
        return;
      }

      const room = activeRooms.get(roomId);
      if (!room) return;

      const isAllowed = Boolean(allowed);

      if (targetSocketId) {
        // Per-participant permission
        const participant = room.participants.get(targetSocketId);
        if (participant) {
          participant.canShareScreen = isAllowed;
          io.to(roomId).emit('participant-permission-updated', {
            socketId: targetSocketId,
            canShareScreen: isAllowed,
          });

          // If active screen sharer was revoked, stop their share immediately
          if (!isAllowed && room.activeScreenSharer?.socketId === targetSocketId) {
            io.to(targetSocketId).emit('force-stop-screen-share');
            room.activeScreenSharer = null;
            io.to(roomId).emit('screen-share-stopped', { socketId: targetSocketId });
          }
        }
      } else {
        // Room-wide permission
        room.permissions.canShareScreen = isAllowed;
        for (const p of room.participants.values()) {
          if (!p.isHost) {
            p.canShareScreen = isAllowed;
          }
        }

        io.to(roomId).emit('room-permissions-updated', {
          permissions: room.permissions,
          participants: Array.from(room.participants.values()),
        });

        // Revoke active share if participant is sharing and no longer allowed
        if (!isAllowed && room.activeScreenSharer && !room.activeScreenSharer.isHost) {
          const target = room.activeScreenSharer.socketId;
          io.to(target).emit('force-stop-screen-share');
          room.activeScreenSharer = null;
          io.to(roomId).emit('screen-share-stopped', { socketId: target });
        }
      }
    });

    // Host Controls: Stop active participant's screen share directly
    socket.on('host-stop-screen-share', ({ roomId, targetSocketId }) => {
      if (!verifyHost(roomId)) {
        socket.emit('error-message', { message: 'Host permission required to stop screen sharing.' });
        return;
      }

      const room = activeRooms.get(roomId);
      if (!room) return;

      io.to(targetSocketId).emit('force-stop-screen-share');
      if (room.activeScreenSharer?.socketId === targetSocketId) {
        room.activeScreenSharer = null;
      }
      io.to(roomId).emit('screen-share-stopped', { socketId: targetSocketId });
    });

    // Host Controls: Remove Participant
    socket.on('remove-participant', ({ roomId, targetSocketId }) => {
      if (!verifyHost(roomId)) {
        socket.emit('error-message', { message: 'Host permission required to remove participants.' });
        return;
      }

      io.to(targetSocketId).emit('removed-from-meeting');
      const targetSocket = io.sockets.sockets.get(targetSocketId);
      if (targetSocket) {
        targetSocket.leave(roomId);
      }

      const room = activeRooms.get(roomId);
      if (room) {
        if (room.activeScreenSharer?.socketId === targetSocketId) {
          room.activeScreenSharer = null;
          io.to(roomId).emit('screen-share-stopped', { socketId: targetSocketId });
        }
        room.participants.delete(targetSocketId);
        io.to(roomId).emit('participant-left', { socketId: targetSocketId });
      }
    });

    // Chat
    socket.on('send-message', ({ roomId, message }) => {
      io.to(roomId).emit('new-message', {
        id: Date.now().toString(),
        sender: { _id: socket.user._id, name: socket.user.name },
        message,
        timestamp: new Date().toISOString(),
      });
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
        voters: {},
        totalVotes: 0,
        isActive: true,
        isResultPublished: false,
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

    socket.on('publish-poll-result', ({ roomId, pollId }) => {
      if (!verifyHost(roomId)) {
        socket.emit('error-message', { message: 'Host permission required to publish poll results.' });
        return;
      }
      const poll = activePolls.get(roomId);
      if (!poll || poll.id !== pollId) return;

      poll.isResultPublished = true;
      io.to(roomId).emit('poll-result-published', poll);
    });

    // Host End Meeting
    socket.on('end-meeting', async ({ roomId, meetingId }) => {
      if (!verifyHost(roomId)) {
        socket.emit('error-message', { message: 'Only host can end the meeting.' });
        return;
      }

      io.to(roomId).emit('meeting-ended');
      activeRooms.delete(roomId);
      activePolls.delete(roomId);

      const mId = meetingId || socket.currentMeetingId;
      if (mId) {
        try {
          await attendanceService.finalizeMeetingAttendance(mId);
        } catch (e) {
          console.warn('Finalize attendance error:', e.message);
        }
      }
    });

    // Leave Room
    socket.on('leave-room', async ({ roomId, meetingId }) => {
      const room = activeRooms.get(roomId);
      if (room) {
        if (room.activeScreenSharer?.socketId === socket.id) {
          room.activeScreenSharer = null;
          io.to(roomId).emit('screen-share-stopped', { socketId: socket.id });
        }
        room.participants.delete(socket.id);
        io.to(roomId).emit('participant-left', { socketId: socket.id });
        if (room.participants.size === 0) {
          activeRooms.delete(roomId);
          activePolls.delete(roomId);
        }
      }
      socket.leave(roomId);

      const mId = meetingId || socket.currentMeetingId;
      if (mId) {
        try {
          await attendanceService.recordLeave(mId, socket.user._id);
        } catch (e) {
          console.warn('Record leave error:', e.message);
        }
      }
      socket.currentRoomId = null;
      socket.currentMeetingId = null;
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.name} (${socket.id})`);
      if (socket.currentMeetingId) {
        try {
          await attendanceService.recordLeave(socket.currentMeetingId, socket.user._id);
        } catch (e) {
          // ignore
        }
      }

      for (const [roomId, room] of activeRooms) {
        if (room.participants.has(socket.id)) {
          if (room.activeScreenSharer?.socketId === socket.id) {
            room.activeScreenSharer = null;
            io.to(roomId).emit('screen-share-stopped', { socketId: socket.id });
          }
          room.participants.delete(socket.id);
          io.to(roomId).emit('participant-left', { socketId: socket.id });
          if (room.participants.size === 0) {
            activeRooms.delete(roomId);
            activePolls.delete(roomId);
          }
        }
      }
    });



  });
};


