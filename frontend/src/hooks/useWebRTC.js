import { useState, useEffect, useRef, useCallback } from 'react';
import { getSocket } from '../services/socket';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export const useWebRTC = (roomId, meetingId, currentUser, callbacks = {}) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({}); // { socketId: MediaStream }
  const [peers, setPeers] = useState({}); // { socketId: RTCPeerConnection }
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [screenStream, setScreenStream] = useState(null); // Local display MediaStream
  const [screenShareAllowed, setScreenShareAllowed] = useState(true);
  const [activeScreenShare, setActiveScreenShare] = useState(null); // { socketId, user }
  const [unmuteRequest, setUnmuteRequest] = useState(null); // { hostName }
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [activePoll, setActivePoll] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected, error
  const [mediaError, setMediaError] = useState(null);

  const localStreamRef = useRef(null);
  const cameraTrackRef = useRef(null);
  const audioTrackRef = useRef(null);
  const screenTrackRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peersRef = useRef({});
  const remoteStreamsRef = useRef({}); // Persistent MediaStreams: { socketId: MediaStream }
  const iceCandidatesQueueRef = useRef({}); // { socketId: RTCIceCandidateInit[] }
  const isScreenSharingRef = useRef(false);
  const isVideoEnabledRef = useRef(false);
  const isAudioEnabledRef = useRef(false);
  const socketRef = useRef(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  isScreenSharingRef.current = isScreenSharing;
  isVideoEnabledRef.current = isVideoEnabled;
  isAudioEnabledRef.current = isAudioEnabled;
  screenStreamRef.current = screenStream;

  // Reliable Sender finders using Transceivers (handles null track states)
  const getVideoSender = (peer) => {
    if (!peer) return null;
    const transceivers = peer.getTransceivers ? peer.getTransceivers() : [];
    const vt = transceivers.find(
      (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
    );
    if (vt?.sender) return vt.sender;
    return peer.getSenders?.().find((s) => s.track && s.track.kind === 'video') || null;
  };

  const getAudioSender = (peer) => {
    if (!peer) return null;
    const transceivers = peer.getTransceivers ? peer.getTransceivers() : [];
    const at = transceivers.find(
      (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
    );
    if (at?.sender) return at.sender;
    return peer.getSenders?.().find((s) => s.track && s.track.kind === 'audio') || null;
  };

  // Flush queued ICE candidates after remote description is set
  const flushQueuedIceCandidates = useCallback(async (remoteSocketId, peer) => {
    const queue = iceCandidatesQueueRef.current[remoteSocketId];
    if (queue && queue.length > 0) {
      while (queue.length > 0) {
        const candidate = queue.shift();
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.warn('Error adding queued ICE candidate:', err);
        }
      }
    }
  }, []);

  // Close and clean up a single peer connection
  const closePeer = useCallback((remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      try {
        peersRef.current[remoteSocketId].close();
      } catch (e) {
        // ignore
      }
      delete peersRef.current[remoteSocketId];
      delete iceCandidatesQueueRef.current[remoteSocketId];
      delete remoteStreamsRef.current[remoteSocketId];
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

  // Create or retrieve Peer Connection with transceivers & listeners
  const createPeerConnection = useCallback((remoteSocketId) => {
    if (peersRef.current[remoteSocketId]) {
      return peersRef.current[remoteSocketId];
    }

    const peer = new RTCPeerConnection(ICE_SERVERS);
    peersRef.current[remoteSocketId] = peer;
    if (!iceCandidatesQueueRef.current[remoteSocketId]) {
      iceCandidatesQueueRef.current[remoteSocketId] = [];
    }
    setPeers((prev) => ({ ...prev, [remoteSocketId]: peer }));

    // Attach existing audio track or add transceiver
    if (audioTrackRef.current) {
      const audioStreamToSend = localStreamRef.current || new MediaStream([audioTrackRef.current]);
      peer.addTrack(audioTrackRef.current, audioStreamToSend);
    } else {
      peer.addTransceiver('audio', { direction: 'sendrecv' });
    }

    // Attach active video track (screen or camera) or add transceiver
    const activeVideoTrack = isScreenSharingRef.current
      ? screenTrackRef.current
      : isVideoEnabledRef.current
      ? cameraTrackRef.current
      : null;

    if (activeVideoTrack) {
      const videoStreamToSend = isScreenSharingRef.current && screenTrackRef.current
        ? (screenStreamRef.current || new MediaStream([activeVideoTrack]))
        : (localStreamRef.current || new MediaStream([activeVideoTrack]));
      peer.addTrack(activeVideoTrack, videoStreamToSend);
    } else {
      peer.addTransceiver('video', { direction: 'sendrecv' });
    }

    // ICE Candidate generation
    peer.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('ice-candidate', {
          to: remoteSocketId,
          candidate: event.candidate,
        });
      }
    };

    // Remote Track received - update persistent MediaStream
    peer.ontrack = (event) => {
      let stream = remoteStreamsRef.current[remoteSocketId];
      if (!stream) {
        stream = event.streams && event.streams[0] ? event.streams[0] : new MediaStream();
        remoteStreamsRef.current[remoteSocketId] = stream;
      }

      if (!stream.getTracks().some((t) => t.id === event.track.id)) {
        stream.getTracks().forEach((oldTrack) => {
          if (oldTrack.kind === event.track.kind && oldTrack.readyState === 'ended') {
            stream.removeTrack(oldTrack);
          }
        });
        stream.addTrack(event.track);
      }

      const freshStream = new MediaStream(stream.getTracks());
      remoteStreamsRef.current[remoteSocketId] = freshStream;
      setRemoteStreams((prev) => ({
        ...prev,
        [remoteSocketId]: freshStream,
      }));

      event.track.onunmute = () => {
        const unmutedStream = new MediaStream(stream.getTracks());
        remoteStreamsRef.current[remoteSocketId] = unmutedStream;
        setRemoteStreams((prev) => ({ ...prev, [remoteSocketId]: unmutedStream }));
      };
      event.track.onended = () => {
        const endedStream = new MediaStream(stream.getTracks().filter((t) => t.readyState !== "ended"));
        remoteStreamsRef.current[remoteSocketId] = endedStream;
        setRemoteStreams((prev) => ({ ...prev, [remoteSocketId]: endedStream }));
      };
    };

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed') {
        console.warn(`Peer connection failed with ${remoteSocketId}`);
        closePeer(remoteSocketId);
      }
    };

    return peer;
  }, [closePeer]);

  // Initialize Local Media Stream
  const initLocalStream = useCallback(async (withVideo = false, withAudio = false) => {
    try {
      setMediaError(null);
      if (!withVideo && !withAudio) {
        return null;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: withVideo ? { width: { ideal: 640 }, height: { ideal: 480 } } : false,
        audio: withAudio,
      });

      localStreamRef.current = stream;
      setLocalStream(stream);

      if (withAudio) {
        const aTrack = stream.getAudioTracks()[0];
        audioTrackRef.current = aTrack || null;
        setIsAudioEnabled(true);
        socketRef.current?.emit('toggle-audio', { roomId, enabled: true });
      }
      if (withVideo) {
        const vTrack = stream.getVideoTracks()[0];
        cameraTrackRef.current = vTrack || null;
        setIsVideoEnabled(true);
        socketRef.current?.emit('toggle-video', { roomId, enabled: true });
      }

      // Add tracks to any existing peer connections
      Object.values(peersRef.current).forEach((peer) => {
        stream.getTracks().forEach((track) => {
          const transceivers = peer.getTransceivers ? peer.getTransceivers() : [];
          const tr = transceivers.find(
            (t) => t.receiver?.track?.kind === track.kind || t.sender?.track?.kind === track.kind
          );
          if (tr) {
            tr.direction = 'sendrecv';
          }
          const sender = track.kind === 'video' ? getVideoSender(peer) : getAudioSender(peer);
          if (sender) {
            sender.replaceTrack(track);
          } else {
            peer.addTrack(track, stream);
          }
        });
      });

      return stream;
    } catch (err) {
      console.warn('getUserMedia error:', err);
      setMediaError(err.message || 'Could not access camera/microphone');
      return null;
    }
  }, [roomId]);

  // Main Socket & WebRTC setup
  useEffect(() => {
    if (!roomId) return;

    const socket = getSocket();
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnectionStatus('connected');
      socket.emit('join-room', {
        meetingId,
        meetingCode: roomId,
        initialAudio: isAudioEnabledRef.current,
        initialVideo: isVideoEnabledRef.current,
      });
      if (isVideoEnabledRef.current) {
        socket.emit('toggle-video', { roomId, enabled: true });
      }
      if (isAudioEnabledRef.current) {
        socket.emit('toggle-audio', { roomId, enabled: true });
      }
    });

    socket.on('connect_error', () => {
      setConnectionStatus('error');
    });

    socket.on('disconnect', () => {
      setConnectionStatus('disconnected');
    });

    // Room state and participants list
    socket.on('room-participants', (currentParticipants) => {
      setParticipants(currentParticipants);
      setConnectionStatus('connected');
    });

    socket.on('room-permissions', ({ permissions, activeScreenSharer, isHost }) => {
      if (isHost) {
        setScreenShareAllowed(true);
      } else if (permissions?.canShareScreen !== undefined) {
        setScreenShareAllowed(Boolean(permissions.canShareScreen));
      }
      if (activeScreenSharer) {
        setActiveScreenShare(activeScreenSharer);
      }
    });

    socket.on('room-permissions-updated', ({ permissions, participants: updatedParticipants }) => {
      if (updatedParticipants) {
        setParticipants(updatedParticipants);
      }
      const myId = currentUser?._id?.toString();
      const me = updatedParticipants?.find((p) => p.userId === myId);
      if (me) {
        setScreenShareAllowed(Boolean(me.canShareScreen));
      } else if (permissions?.canShareScreen !== undefined) {
        setScreenShareAllowed(Boolean(permissions.canShareScreen));
      }
    });

    socket.on('participant-permission-updated', ({ socketId, canShareScreen }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, canShareScreen } : p))
      );
      if (socket.id === socketId) {
        setScreenShareAllowed(Boolean(canShareScreen));
      }
    });

    // When someone joins, existing users create an offer to them
    socket.on('user-joined', async ({ socketId, user }) => {
      setParticipants((prev) => {
        if (prev.some((p) => p.socketId === socketId)) return prev;
        return [...prev, { ...user, socketId }];
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
        if (peer.signalingState === 'have-local-offer') {
          // Glare resolution: rollback local offer to accept incoming offer
          await peer.setLocalDescription({ type: 'rollback' });
        }
        await peer.setRemoteDescription(new RTCSessionDescription(offer));
        await flushQueuedIceCandidates(from, peer);
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
      if (peer && peer.signalingState === 'have-local-offer') {
        try {
          await peer.setRemoteDescription(new RTCSessionDescription(answer));
          await flushQueuedIceCandidates(from, peer);
        } catch (err) {
          console.error('Failed to set remote answer:', err);
        }
      }
    });

    // Handle ICE Candidate
    socket.on('ice-candidate', async ({ from, candidate }) => {
      const peer = peersRef.current[from];
      if (peer && peer.remoteDescription && peer.remoteDescription.type) {
        try {
          await peer.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Failed to add ice candidate:', err);
        }
      } else {
        if (!iceCandidatesQueueRef.current[from]) {
          iceCandidatesQueueRef.current[from] = [];
        }
        iceCandidatesQueueRef.current[from].push(candidate);
      }
    });

    // Participant state updates
    socket.on('participant-audio-toggle', ({ socketId, enabled }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, audio: enabled } : p))
      );
      if (remoteStreamsRef.current[socketId]) {
        const currentStream = remoteStreamsRef.current[socketId];
        const refreshed = new MediaStream(currentStream.getTracks());
        remoteStreamsRef.current[socketId] = refreshed;
        setRemoteStreams((prev) => ({ ...prev, [socketId]: refreshed }));
      }
    });

    socket.on('participant-video-toggle', ({ socketId, enabled }) => {
      setParticipants((prev) =>
        prev.map((p) => (p.socketId === socketId ? { ...p, video: enabled } : p))
      );
      if (remoteStreamsRef.current[socketId]) {
        const currentStream = remoteStreamsRef.current[socketId];
        const refreshed = new MediaStream(currentStream.getTracks());
        remoteStreamsRef.current[socketId] = refreshed;
        setRemoteStreams((prev) => ({ ...prev, [socketId]: refreshed }));
      }
    });

    // Participant Left
    socket.on('participant-left', ({ socketId }) => {
      closePeer(socketId);
      setParticipants((prev) => prev.filter((p) => p.socketId !== socketId));
      setActiveScreenShare((curr) => (curr?.socketId === socketId ? null : curr));
    });

    // Screen Share start / stop notifications
    socket.on('screen-share-started', ({ socketId, user, userId, name }) => {
      setActiveScreenShare({
        socketId,
        userId: userId || user?._id,
        name: name || user?.name,
        user,
      });
      if (remoteStreamsRef.current[socketId]) {
        setRemoteStreams((prev) => ({ ...prev, [socketId]: remoteStreamsRef.current[socketId] }));
      }
    });

    socket.on('screen-share-stopped', ({ socketId }) => {
      setActiveScreenShare((curr) => (curr?.socketId === socketId ? null : curr));
      if (remoteStreamsRef.current[socketId]) {
        setRemoteStreams((prev) => ({ ...prev, [socketId]: remoteStreamsRef.current[socketId] }));
      }
    });

    // Force Stop Screen Share (e.g. host revoked permission)
    socket.on('force-stop-screen-share', async () => {
      if (isScreenSharingRef.current) {
        if (screenTrackRef.current) {
          screenTrackRef.current.stop();
          screenTrackRef.current = null;
        }
        setScreenStream(null);
        setIsScreenSharing(false);

        // Restore camera track to peers
        const restoreTrack = isVideoEnabledRef.current && cameraTrackRef.current ? cameraTrackRef.current : null;
        for (const [remoteSocketId, peer] of Object.entries(peersRef.current)) {
          try {
            const videoSender = getVideoSender(peer);
            if (videoSender) {
              await videoSender.replaceTrack(restoreTrack);
            }
          } catch (e) {
            console.warn('Error restoring camera track:', e);
          }
        }
        socketRef.current?.emit('screen-share-stopped', { roomId });
      }
      callbacksRef.current?.onScreenShareRevoked?.();
    });

    // Screen Share Denied
    socket.on('screen-share-denied', ({ message }) => {
      setMediaError(message || 'Screen sharing denied.');
    });

    // Force Mute from Host
    socket.on('force-mute', () => {
      if (audioTrackRef.current) {
        audioTrackRef.current.enabled = false;
      }
      setIsAudioEnabled(false);
      callbacksRef.current?.onMutedByHost?.();
    });

    // Request Unmute from Host
    socket.on('unmute-requested', ({ hostName }) => {
      setUnmuteRequest({ hostName: hostName || 'The host' });
    });

    // Chat message
    socket.on('new-message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    // Poll events
    socket.on('active-poll', (poll) => setActivePoll(poll));
    socket.on('poll-published', (poll) => setActivePoll(poll));
    socket.on('poll-updated', (poll) => setActivePoll(poll));
    socket.on('poll-closed', (poll) => setActivePoll(poll));
    socket.on('poll-result-published', (poll) => setActivePoll(poll));

    // Meeting lifecycle
    socket.on('meeting-ended', () => {
      callbacksRef.current?.onMeetingEnded?.();
    });

    socket.on('removed-from-meeting', () => {
      callbacksRef.current?.onRemovedFromMeeting?.();
    });

    socket.on('error-message', ({ message }) => {
      setMediaError(message);
    });

    // Join room if already connected
    if (socket.connected) {
      setConnectionStatus('connected');
      socket.emit('join-room', {
        meetingId,
        meetingCode: roomId,
        initialAudio: isAudioEnabledRef.current,
        initialVideo: isVideoEnabledRef.current,
      });
      if (isVideoEnabledRef.current) {
        socket.emit('toggle-video', { roomId, enabled: true });
      }
      if (isAudioEnabledRef.current) {
        socket.emit('toggle-audio', { roomId, enabled: true });
      }
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-room', { roomId, meetingId });
        socketRef.current.off('connect');
        socketRef.current.off('disconnect');
        socketRef.current.off('connect_error');
        socketRef.current.off('room-participants');
        socketRef.current.off('room-permissions');
        socketRef.current.off('room-permissions-updated');
        socketRef.current.off('participant-permission-updated');
        socketRef.current.off('user-joined');
        socketRef.current.off('offer');
        socketRef.current.off('answer');
        socketRef.current.off('ice-candidate');
        socketRef.current.off('participant-audio-toggle');
        socketRef.current.off('participant-video-toggle');
        socketRef.current.off('participant-left');
        socketRef.current.off('screen-share-started');
        socketRef.current.off('screen-share-stopped');
        socketRef.current.off('force-stop-screen-share');
        socketRef.current.off('screen-share-denied');
        socketRef.current.off('force-mute');
        socketRef.current.off('unmute-requested');
        socketRef.current.off('new-message');
        socketRef.current.off('active-poll');
        socketRef.current.off('poll-published');
        socketRef.current.off('poll-updated');
        socketRef.current.off('poll-closed');
        socketRef.current.off('poll-result-published');
        socketRef.current.off('meeting-ended');
        socketRef.current.off('removed-from-meeting');
        socketRef.current.off('error-message');
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
  }, [roomId, meetingId, currentUser, createPeerConnection, closePeer, flushQueuedIceCandidates]);

  // Toggle Microphone
  const toggleAudio = useCallback(async () => {
    try {
      if (!audioTrackRef.current) {
        const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const newTrack = audioStream.getAudioTracks()[0];
        if (!newTrack) return;
        audioTrackRef.current = newTrack;

        if (!localStreamRef.current) {
          localStreamRef.current = new MediaStream([newTrack]);
        } else {
          localStreamRef.current.getAudioTracks().forEach((t) => localStreamRef.current.removeTrack(t));
          localStreamRef.current.addTrack(newTrack);
        }

        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

        // Replace audio track on all peer senders
        for (const [remoteSocketId, peer] of Object.entries(peersRef.current)) {
          try {
            const transceivers = peer.getTransceivers ? peer.getTransceivers() : [];
            const at = transceivers.find(
              (t) => t.receiver?.track?.kind === 'audio' || t.sender?.track?.kind === 'audio'
            );
            if (at) {
              at.direction = 'sendrecv';
            }
            const audioSender = getAudioSender(peer);
            if (audioSender) {
              await audioSender.replaceTrack(newTrack);
            } else {
              peer.addTrack(newTrack, localStreamRef.current);
            }
          } catch (e) {
            console.warn('Error updating audio track on peer:', remoteSocketId, e);
          }
        }

        setIsAudioEnabled(true);
        socketRef.current?.emit('toggle-audio', { roomId, enabled: true });
        return;
      }

      const newState = !audioTrackRef.current.enabled;
      audioTrackRef.current.enabled = newState;
      setIsAudioEnabled(newState);
      socketRef.current?.emit('toggle-audio', { roomId, enabled: newState });
    } catch (err) {
      console.warn('Microphone toggle failed:', err);
      setMediaError('Microphone permission denied or unavailable');
    }
  }, [roomId]);

  // Toggle Camera (Hardware release on turn-off, fresh acquire on turn-on)
  const toggleVideo = useCallback(async () => {
    try {
      if (isVideoEnabled && cameraTrackRef.current) {
        // Stop hardware track completely to turn off camera LED light
        cameraTrackRef.current.stop();
        if (localStreamRef.current) {
          localStreamRef.current.removeTrack(cameraTrackRef.current);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }
        cameraTrackRef.current = null;
        setIsVideoEnabled(false);

        // If not screen sharing, replace video track with null on all peers
        if (!isScreenSharingRef.current) {
          for (const [remoteSocketId, peer] of Object.entries(peersRef.current)) {
            try {
              const videoSender = getVideoSender(peer);
              if (videoSender) {
                await videoSender.replaceTrack(null);
              }
            } catch (e) {
              console.warn('Error clearing video track on peer:', remoteSocketId, e);
            }
          }
        }

        socketRef.current?.emit('toggle-video', { roomId, enabled: false });
        return;
      }

      // Re-acquire camera hardware track
      const videoStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 } },
      });
      const newTrack = videoStream.getVideoTracks()[0];
      if (!newTrack) return;
      cameraTrackRef.current = newTrack;

      if (!localStreamRef.current) {
        localStreamRef.current = new MediaStream([newTrack]);
      } else {
        localStreamRef.current.getVideoTracks().forEach((t) => localStreamRef.current.removeTrack(t));
        localStreamRef.current.addTrack(newTrack);
      }

      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));

      // If not actively screen sharing, send fresh camera track to all peers
      if (!isScreenSharingRef.current) {
        for (const [remoteSocketId, peer] of Object.entries(peersRef.current)) {
          try {
            const transceivers = peer.getTransceivers ? peer.getTransceivers() : [];
            const vt = transceivers.find(
              (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
            );
            if (vt) {
              vt.direction = 'sendrecv';
            }
            const videoSender = getVideoSender(peer);
            if (videoSender) {
              await videoSender.replaceTrack(newTrack);
            } else {
              peer.addTrack(newTrack, localStreamRef.current);
            }
          } catch (e) {
            console.warn('Error updating video track on peer:', remoteSocketId, e);
          }
        }
      }

      setIsVideoEnabled(true);
      socketRef.current?.emit('toggle-video', { roomId, enabled: true });
    } catch (err) {
      console.warn('Camera toggle failed:', err);
      setMediaError('Camera permission denied or unavailable');
    }
  }, [roomId, isVideoEnabled]);

  // Stop Screen Share
  const stopScreenShare = useCallback(async () => {
    if (screenTrackRef.current) {
      screenTrackRef.current.stop();
      screenTrackRef.current = null;
    }
    setScreenStream(null);
    setIsScreenSharing(false);

    // Restore camera track to peers if camera is enabled
    const restoreTrack = isVideoEnabledRef.current && cameraTrackRef.current ? cameraTrackRef.current : null;
    for (const [remoteSocketId, peer] of Object.entries(peersRef.current)) {
      try {
        const videoSender = getVideoSender(peer);
        if (videoSender) {
          await videoSender.replaceTrack(restoreTrack);
        } else if (restoreTrack) {
          peer.addTrack(restoreTrack, localStreamRef.current);
        }
      } catch (e) {
        console.warn('Error restoring camera track to peer:', remoteSocketId, e);
      }
    }

    socketRef.current?.emit('screen-share-stopped', { roomId });
  }, [roomId]);

  // Start Screen Share
  const startScreenShare = useCallback(async () => {
    try {
      setMediaError(null);
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const screenTrack = displayStream.getVideoTracks()[0];
      if (!screenTrack) return;
      screenTrackRef.current = screenTrack;
      setScreenStream(displayStream);

      // Handle browser's native stop sharing banner
      screenTrack.onended = () => {
        stopScreenShare();
      };

      // Replace video sender on all peers with the screen track
      for (const [remoteSocketId, peer] of Object.entries(peersRef.current)) {
        try {
          const transceivers = peer.getTransceivers ? peer.getTransceivers() : [];
          const vt = transceivers.find(
            (t) => t.receiver?.track?.kind === 'video' || t.sender?.track?.kind === 'video'
          );
          if (vt) {
            vt.direction = 'sendrecv';
          }
          const videoSender = getVideoSender(peer);
          if (videoSender) {
            await videoSender.replaceTrack(screenTrack);
          } else {
            peer.addTrack(screenTrack, displayStream);
          }
        } catch (e) {
          console.warn('Error sending screen share track to peer:', remoteSocketId, e);
        }
      }

      setIsScreenSharing(true);
      socketRef.current?.emit('screen-share-started', { roomId });
    } catch (err) {
      if (err.name !== 'NotAllowedError') {
        console.warn('Screen share failed:', err);
        setMediaError('Could not share screen: ' + err.message);
      }
    }
  }, [roomId, stopScreenShare]);

  // Accept Unmute Request
  const acceptUnmuteRequest = useCallback(async () => {
    setUnmuteRequest(null);
    if (!isAudioEnabled) {
      await toggleAudio();
    }
  }, [isAudioEnabled, toggleAudio]);

  const declineUnmuteRequest = useCallback(() => {
    setUnmuteRequest(null);
  }, []);

  // Send Chat Message
  const sendMessage = useCallback((content) => {
    if (!content.trim() || !socketRef.current) return;
    socketRef.current.emit('send-message', {
      roomId,
      message: {
        id: Date.now().toString(),
        sender: currentUser?.name || 'You',
        senderId: currentUser?._id,
        content: content.trim(),
        timestamp: new Date().toISOString(),
      },
    });
  }, [roomId, currentUser]);

  // Host Controls: Mute Participant
  const muteParticipant = useCallback((targetSocketId) => {
    socketRef.current?.emit('mute-participant', { roomId, targetSocketId });
  }, [roomId]);

  // Host Controls: Request Participant to Unmute
  const requestUnmute = useCallback((targetSocketId) => {
    socketRef.current?.emit('request-unmute', { roomId, targetSocketId });
  }, [roomId]);

  // Host Controls: Screen Share Permission Toggle
  const setScreenSharePermission = useCallback((canShareScreen, targetSocketId = null) => {
    socketRef.current?.emit('set-screen-share-permission', {
      roomId,
      canShareScreen,
      targetSocketId,
    });
  }, [roomId]);

  // Host Controls: Stop Participant Screen Share
  const stopParticipantScreenShare = useCallback((targetSocketId) => {
    socketRef.current?.emit('host-stop-participant-screen-share', { roomId, targetSocketId });
  }, [roomId]);

  // Host Controls: Remove Participant
  const removeParticipant = useCallback((targetSocketId) => {
    socketRef.current?.emit('remove-participant', { roomId, targetSocketId });
  }, [roomId]);

  // Host Controls: End Meeting for All
  const endMeetingForAll = useCallback(() => {
    socketRef.current?.emit('end-meeting', { roomId });
  }, [roomId]);

  // Poll Actions
  const createPoll = useCallback((pollData) => {
    socketRef.current?.emit('create-poll', { roomId, ...pollData });
  }, [roomId]);

  const votePoll = useCallback((optionIndex) => {
    socketRef.current?.emit('vote-poll', { roomId, optionIndex });
  }, [roomId]);

  const endPoll = useCallback(() => {
    socketRef.current?.emit('end-poll', { roomId });
  }, [roomId]);

  const publishPollResult = useCallback(() => {
    socketRef.current?.emit('publish-poll-result', { roomId });
  }, [roomId]);

  return {
    socketId: socketRef.current?.id || null,
    localStream,
    screenStream,
    remoteStreams,
    peers,
    participants,
    messages,
    activePoll,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    screenShareAllowed,
    activeScreenShare,
    unmuteRequest,
    connectionStatus,
    mediaError,
    initLocalStream,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    acceptUnmuteRequest,
    declineUnmuteRequest,
    sendMessage,
    muteParticipant,
    requestUnmute,
    setScreenSharePermission,
    stopParticipantScreenShare,
    removeParticipant,
    endMeetingForAll,
    createPoll,
    votePoll,
    endPoll,
    publishPollResult,
  };
};
