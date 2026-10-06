import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId, meetingId, currentUser, callbacks = {}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [peers, setPeers] = useState({}); // { socketId: RTCPeerConnection }
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected
  const [mediaError, setMediaError] = useState(null);

  const localStreamRef = useRef(null);
  const peersRef = useRef({});
  const screenTrackRef = useRef(null);
  const socketRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Initialize Local Media Stream
  const initLocalStream = useCallback(async (withVideo = false, withAudio = false) => {
    try {
      setMediaError(null);
      // If requested devices
      if (!withVideo && !withAudio) {
        // Dummy/empty stream if user hasn't enabled yet or permissions pending
        setLocalStream(null);
        localStreamRef.current = null;
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: withAudio,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsAudioEnabled(withAudio);
      setIsVideoEnabled(withVideo);

      // Add tracks to any existing peer connections
      Object.values(peersRef.current).forEach((peer) => {
        stream.getTracks().forEach((track) => {
          peer.addTrack(track, stream);
        });
      });

      return stream;
    } catch (err) {
      console.warn('getUserMedia error:', err);
      setMediaError(err.message || 'Could not access camera/microphone');
      return null;
    }
  }, []);

  // Create Peer Connection
  const createPeerConnection = useCallback((remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[remoteSocketId] = peer;
    setPeers((prev) => ({ ...prev, [remoteSocketId]: peer }));

    // Send local tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        peer.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidate
    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Remote Track received
    peer.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        setRemoteStreams((prev) => ({
          ...prev,
          [remoteSocketId]: stream,
        }));
      }
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed' || peer.connectionState === 'closed') {
        closePeer(remoteSocketId);
      }
    };

    return peer;
  }, []);

  const closePeer = useCallback((remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      peersRef.current[remoteSocketId].close();
      delete peersRef.current[remoteSocketId];
      setPeers((prev) => {
        const next = { ...prev };
        delete next[remoteSocketId];
        return next;
      });
      setRemoteStreams((prev) => {
        const next = { ...prev };
        delete next[remoteSocketId];
        return next;
      });
    }
  }, []);

  // Main Socket & WebRTC setup
  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('join-room', { meetingId, meetingCode: roomId });
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    socket.on('room-participants', (currentParticipants) => {
      setParticipants(currentParticipants);
      setConnectionStatus('connected');
    });

    // When someone joins, create offer
    socket.on('user-joined', async ({ socketId, user }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === socketId)) return prev;
        return [...prev, { ...user, socketId, audio: false, video: false }];
      });

      const peer = createPeerConnection(socketId);
      try {
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        socket.emit('offer', { to: socketId, offer });
      } catch (err) {
        console.error('Failed to create offer:', err);
      }
    });

    // Handle Offer
    socket.on('offer', async ({ from, offer }) => {
      const peer = createPeerConnection(from);
      try {
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        socket.emit('answer', { to: from, answer });
      } catch (err) {
        console.error('Failed to handle offer:', err);
      }
    });

    // Handle Answer
    socket.on('answer', async ({ from, answer }) => {
      const peer = peersRef.current[from];
      if (peer) {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Failed to set remote answer:', err);
        }
      }
    });

    // Handle ICE Candidate
    socket.on('ice-candidate', async ({ from, candidate }) => {
      const peer = peersRef.current[from];
      if (peer && candidate) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add ice candidate:', err);
        }
      }
    });

    // Participant state updates
    socket.on('participant-audio-toggle', ({ socketId, enabled }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, audio: enabled } : p))
      );
    });

    socket.on('participant-video-toggle', ({ socketId, enabled }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, video: enabled } : p))
      );
    });

    socket.on('participant-left', ({ socketId }) => {
      closePeer(socketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
    });

    // Chat message
    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Poll events
    socket.on('active-poll', (poll) => {
      setActivePoll(poll);
    });

    socket.on('poll-published', (poll) => {
      setActivePoll(poll);
    });

    socket.on('poll-updated', (poll) => {
      setActivePoll(poll);
    });

    socket.on('poll-closed', (poll) => {
      setActivePoll(poll);
    });

    // Force Mute
    socket.on('force-mute', () => {
      if (localStreamRef.current) {
        const audioTracks = localStreamRef.current.getAudioTracks();
        audioTracks.forEach((t) => (t.enabled = false));
      }
      setIsAudioEnabled(false);
      if (socketRef.current) {
        socketRef.current.emit('toggle-audio', { roomId, enabled: false });
      }
    });

    // Meeting ended by host
    socket.on('meeting-ended', () => {
      callbacksRef.current?.onMeetingEnded?.();
    });

    // Participant removed by host
    socket.on('removed-from-meeting', () => {
      callbacksRef.current?.onRemovedFromMeeting?.();
    });

    // Join room if already connected
    if (socket.connected) {
      setConnectionStatus('connected');
      socket.emit('join-room', { meetingId, meetingCode: roomId });
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId, meetingId });
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('room-participants');
        socketRef.current.off('user-joined');
        socketRef.current.off('offer');
        socketRef.current.off('answer');
        socketRef.current.off('ice-candidate');
        socketRef.current.off('participant-audio-toggle');
        socketRef.current.off('participant-video-toggle');
        socketRef.current.off('participant-left');
        socketRef.current.off('new-message');
        socketRef.current.off('active-poll');
        socketRef.current.off('poll-published');
        socketRef.current.off('poll-updated');
        socketRef.current.off('poll-closed');
        socketRef.current.off('force-mute');
        socketRef.current.off('meeting-ended');
        socketRef.current.off('removed-from-meeting');
      }

      // Cleanup local tracks
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
      }

      // Close all peer connections
      Object.keys(peersRef.current).forEach((id) => closePeer(id));
    };
  }, [roomId, meetingId, createPeerConnection, closePeer]);

  // Toggle Microphone
  const toggleAudio = useCallback(async () => {
    try {
      if (!localStreamRef.current || localStreamRef.current.getAudioTracks().length === 0) {
        // Need to request audio
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = audioStream.getAudioTracks()[0];

        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream([newTrack]);
        } else {
          localStreamRef.current.addTrack(newTrack);
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        Object.values(peersRef.current).forEach((peer) => {
          peer.addTrack(newTrack, localStreamRef.current);
        });

        setIsAudioEnabled(true);
        socketRef.current?.emit('toggle-audio', { roomId, enabled: true });
        return;
      }

      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      const newState = !audioTrack.enabled;
      audioTrack.enabled = newState;
      setIsAudioEnabled(newState);
      socketRef.current?.emit('toggle-audio', { roomId, enabled: newState });
    } catch (err) {
      console.warn('Microphone toggle failed:', err);
      setMediaError('Microphone permission denied or unavailable');
    }
  }, [roomId]);

  // Toggle Camera
  const toggleVideo = useCallback(async () => {
    try {
      if (!localStreamRef.current || localStreamRef.current.getVideoTracks().length === 0) {
        const videoStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 480 } },
        });
        const newTrack = videoStream.getVideoTracks()[0];

        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream([newTrack]);
        } else {
          localStreamRef.current.addTrack(newTrack);
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        Object.values(peersRef.current).forEach((peer) => {
          peer.addTrack(newTrack, localStreamRef.current);
        });

        setIsVideoEnabled(true);
        socketRef.current?.emit('toggle-video', { roomId, enabled: true });
        return;
      }

      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const newState = !videoTrack.enabled;
      videoTrack.enabled = newState;
      setIsVideoEnabled(newState);
      socketRef.current?.emit('toggle-video', { roomId, enabled: newState });
    } catch (err) {
      console.warn('Camera toggle failed:', err);
      setMediaError('Camera permission denied or unavailable');
    }
  }, [roomId]);

  // Toggle Screen Share
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      // Stop screen share
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current = null;
      }
      setIsScreenSharing(false);
      socketRef.current?.emit('screen-share-stopped', { roomId });
      return;
    }

    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = displayStream.getVideoTracks()[0];
      screenTrackRef.current = screenTrack;

      screenTrack.onended = () => {
        setIsScreenSharing(false);
        socketRef.current?.emit('screen-share-stopped', { roomId });
      };

      // Replace or add track to peers
      Object.values(peersRef.current).forEach((peer) => {
        const senders = peer.getSenders();
        const videoSender = senders.find((s) => s.track && s.track.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(screenTrack);
        } else {
          peer.addTrack(screenTrack, displayStream);
        }
      });

      setIsScreenSharing(true);
      socketRef.current?.emit('screen-share-started', { roomId });
    } catch (err) {
      console.warn('Screen share error:', err);
      if (err.name !== 'NotAllowedError') {
        setMediaError('Screen sharing not supported or canceled');
      }
    }
  }, [isScreenSharing, roomId]);

  // Send Chat Message
  const sendMessage = useCallback((text) => {
    if (!text.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', {
      roomId,
      message: text.trim(),
    });
  }, [roomId]);

  // Host Mute Participant
  const muteParticipant = useCallback((targetSocketId) => {
    socketRef.current?.emit('mute-participant', { roomId, targetSocketId });
  }, [roomId]);

  // Host Remove Participant
  const removeParticipant = useCallback((targetSocketId) => {
    socketRef.current?.emit('remove-participant', { roomId, targetSocketId });
  }, [roomId]);

  // Host End Meeting
  const endMeetingForAll = useCallback(() => {
    socketRef.current?.emit('end-meeting', { roomId });
  }, [roomId]);

  // Polling actions
  const createPoll = useCallback(({ question, options }) => {
    socketRef.current?.emit('create-poll', { roomId, question, options });
  }, [roomId]);

  const votePoll = useCallback(({ pollId, optionId }) => {
    socketRef.current?.emit('vote-poll', { roomId, pollId, optionId });
  }, [roomId]);

  const endPoll = useCallback((pollId) => {
    socketRef.current?.emit('end-poll', { roomId, pollId });
  }, [roomId]);

  return {
    localStream,
    remoteStreams,
    participants,
    messages,
    activePoll,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    connectionStatus,
    mediaError,
    initLocalStream,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    sendMessage,
    muteParticipant,
    removeParticipant,
    endMeetingForAll,
    createPoll,
    votePoll,
    endPoll,
  };
};
