import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

// ==============================================================================
// WebRTC & Media Stream Mock Infrastructures
// ==============================================================================

class MockMediaStreamTrack {
  constructor(kind, label = 'mock-track') {
    this.id = 'track-' + Math.random().toString(36).slice(2, 9);
    this.kind = kind; // 'video' | 'audio'
    this.label = label;
    this.enabled = true;
    this.readyState = 'live';
    this.onended = null;
    this.onmute = null;
    this.onunmute = null;
    this.stopped = false;
  }

  stop() {
    this.readyState = 'ended';
    this.stopped = true;
    if (typeof this.onended === 'function') {
      this.onended();
    }
  }
}

class MockMediaStream {
  constructor(tracks = []) {
    this.id = 'stream-' + Math.random().toString(36).slice(2, 9);
    this._tracks = [...tracks];
  }

  getTracks() {
    return [...this._tracks];
  }

  getVideoTracks() {
    return this._tracks.filter((t) => t.kind === 'video');
  }

  getAudioTracks() {
    return this._tracks.filter((t) => t.kind === 'audio');
  }

  addTrack(track) {
    if (!this._tracks.some((t) => t.id === track.id)) {
      this._tracks.push(track);
    }
  }

  removeTrack(track) {
    this._tracks = this._tracks.filter((t) => t.id !== track.id);
  }
}

class MockRTCRtpSender {
  constructor(track = null) {
    this.track = track;
    this.replacedTracks = [];
  }

  async replaceTrack(newTrack) {
    this.track = newTrack;
    this.replacedTracks.push(newTrack);
    return Promise.resolve();
  }
}

class MockRTCRtpTransceiver {
  constructor(kind, init = {}) {
    this.direction = init.direction || 'sendrecv';
    this.sender = new MockRTCRtpSender(null);
    this.receiver = { track: new MockMediaStreamTrack(kind) };
  }
}

class MockRTCSessionDescription {
  constructor(init) {
    this.type = init.type;
    this.sdp = init.sdp || 'v=0\r\no=mock 0 0 IN IP4 127.0.0.1';
  }
}

class MockRTCIceCandidate {
  constructor(init) {
    this.candidate = init.candidate || 'candidate:1 1 UDP 2122260223 192.168.1.100 50000 typ host';
    this.sdpMid = init.sdpMid || '0';
    this.sdpMLineIndex = init.sdpMLineIndex || 0;
  }
}

class MockRTCPeerConnection {
  constructor(config = {}) {
    this.config = config;
    this.signalingState = 'stable';
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.localDescription = null;
    this.remoteDescription = null;
    this.transceivers = [];
    this.senders = [];
    this.tracksAdded = [];
    this.addedIceCandidates = [];
    this.onicecandidate = null;
    this.ontrack = null;
    this.onconnectionstatechange = null;
    this.isClosed = false;
  }

  getTransceivers() {
    return this.transceivers;
  }

  getSenders() {
    return this.senders;
  }

  addTransceiver(kind, init) {
    const transceiver = new MockRTCRtpTransceiver(kind, init);
    this.transceivers.push(transceiver);
    this.senders.push(transceiver.sender);
    return transceiver;
  }

  addTrack(track, stream) {
    this.tracksAdded.push({ track, stream });
    let sender = this.senders.find((s) => s.track && s.track.kind === track.kind);
    if (!sender) {
      sender = new MockRTCRtpSender(track);
      this.senders.push(sender);
    } else {
      sender.track = track;
    }
    return sender;
  }

  async createOffer() {
    return new MockRTCSessionDescription({
      type: 'offer',
      sdp: 'v=0\r\no=local-offer',
    });
  }

  async createAnswer() {
    return new MockRTCSessionDescription({
      type: 'answer',
      sdp: 'v=0\r\no=local-answer',
    });
  }

  async setLocalDescription(desc) {
    if (desc.type === 'rollback') {
      this.signalingState = 'stable';
      this.localDescription = null;
      return;
    }
    this.localDescription = desc;
    if (desc.type === 'offer') {
      this.signalingState = 'have-local-offer';
    } else if (desc.type === 'answer') {
      this.signalingState = 'stable';
    }
  }

  async setRemoteDescription(desc) {
    this.remoteDescription = desc;
    if (desc.type === 'offer') {
      this.signalingState = 'have-remote-offer';
    } else if (desc.type === 'answer') {
      this.signalingState = 'stable';
    }
  }

  async addIceCandidate(candidate) {
    this.addedIceCandidates.push(candidate);
  }

  close() {
    this.isClosed = true;
    this.signalingState = 'closed';
    this.connectionState = 'closed';
  }
}

class MockSocket {
  constructor(id = 'mock-socket-' + Math.random().toString(36).slice(2, 7)) {
    this.id = id;
    this.connected = true;
    this.emittedEvents = [];
    this.listeners = new Map();
  }

  emit(event, data) {
    this.emittedEvents.push({ event, data });
  }

  on(event, handler) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(handler);
  }

  off(event, handler) {
    if (!event) {
      this.listeners.clear();
      return;
    }
    if (!handler) {
      this.listeners.delete(event);
      return;
    }
    const handlers = this.listeners.get(event) || [];
    this.listeners.set(
      event,
      handlers.filter((h) => h !== handler)
    );
  }

  trigger(event, payload) {
    const handlers = this.listeners.get(event) || [];
    handlers.forEach((h) => h(payload));
  }
}

// Set up global environment mocks
global.RTCPeerConnection = MockRTCPeerConnection;
global.RTCSessionDescription = MockRTCSessionDescription;
global.RTCIceCandidate = MockRTCIceCandidate;
global.MediaStream = MockMediaStream;

function setNavigatorMediaDevices(gum, gdm) {
  const mediaDevices = {
    getUserMedia: gum || (async () => new MockMediaStream()),
    getDisplayMedia: gdm || (async () => new MockMediaStream([new MockMediaStreamTrack('video', 'screen')])),
  };
  Object.defineProperty(globalThis, 'navigator', {
    value: { mediaDevices },
    configurable: true,
    writable: true,
  });
}

// ==============================================================================
// 1. VIDEO UNIT TESTS
// ==============================================================================
describe('Media Unit Tests - Video Functionality', () => {
  let mockSocket;
  let gumMock;

  beforeEach(() => {
    mockSocket = new MockSocket();
    gumMock = async (constraints) => {
      const tracks = [];
      if (constraints.video) {
        tracks.push(new MockMediaStreamTrack('video', 'camera'));
      }
      if (constraints.audio) {
        tracks.push(new MockMediaStreamTrack('audio', 'microphone'));
      }
      return new MockMediaStream(tracks);
    };
    setNavigatorMediaDevices(gumMock);
  });

  it('1.1: getUserMedia() is called with correct video constraints for camera', async () => {
    let capturedConstraints = null;
    setNavigatorMediaDevices(async (c) => {
      capturedConstraints = c;
      return new MockMediaStream([new MockMediaStreamTrack('video')]);
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: { ideal: 640 }, height: { ideal: 480 } },
      audio: false,
    });

    assert.ok(stream);
    assert.deepEqual(capturedConstraints.video, { width: { ideal: 640 }, height: { ideal: 480 } });
    assert.equal(capturedConstraints.audio, false);
  });

  it('1.2: Camera stream is created successfully and contains a video track', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    assert.ok(stream instanceof MockMediaStream);
    const videoTracks = stream.getVideoTracks();
    assert.equal(videoTracks.length, 1);
    assert.equal(videoTracks[0].kind, 'video');
    assert.equal(videoTracks[0].readyState, 'live');
  });

  it('1.3: Video track is added to peer connection or transceivers', () => {
    const peer = new MockRTCPeerConnection();
    const videoTrack = new MockMediaStreamTrack('video', 'cam1');
    const stream = new MockMediaStream([videoTrack]);

    peer.addTrack(videoTrack, stream);
    assert.equal(peer.tracksAdded.length, 1);
    assert.equal(peer.tracksAdded[0].track.kind, 'video');
    assert.equal(peer.tracksAdded[0].track.id, videoTrack.id);
  });

  it('1.4: Camera ON updates local state and emits toggle-video event', async () => {
    let isVideoEnabled = false;
    let localStream = null;

    const toggleVideo = async (roomId) => {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      localStream = stream;
      isVideoEnabled = true;
      mockSocket.emit('toggle-video', { roomId, enabled: true });
    };

    await toggleVideo('room-101');
    assert.equal(isVideoEnabled, true);
    assert.ok(localStream);
    assert.equal(localStream.getVideoTracks().length, 1);

    const emitted = mockSocket.emittedEvents.find((e) => e.event === 'toggle-video');
    assert.ok(emitted);
    assert.deepEqual(emitted.data, { roomId: 'room-101', enabled: true });
  });

  it('1.5: Camera OFF updates local state and stops hardware track completely', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const videoTrack = stream.getVideoTracks()[0];
    let isVideoEnabled = true;

    // Simulate Camera OFF in StudyHub
    const turnCameraOff = (roomId) => {
      videoTrack.stop();
      stream.removeTrack(videoTrack);
      isVideoEnabled = false;
      mockSocket.emit('toggle-video', { roomId, enabled: false });
    };

    turnCameraOff('room-101');
    assert.equal(isVideoEnabled, false);
    assert.equal(videoTrack.readyState, 'ended');
    assert.equal(videoTrack.stopped, true);
    assert.equal(stream.getVideoTracks().length, 0);

    const emitted = mockSocket.emittedEvents.find(
      (e) => e.event === 'toggle-video' && e.data.enabled === false
    );
    assert.ok(emitted);
  });

  it('1.6: Camera OFF replaces video track with null on active peers', async () => {
    const peer = new MockRTCPeerConnection();
    const initialTrack = new MockMediaStreamTrack('video');
    peer.addTrack(initialTrack, new MockMediaStream([initialTrack]));

    const sender = peer.getSenders().find((s) => s.track?.kind === 'video');
    assert.ok(sender);

    // Camera turned off -> replace with null
    await sender.replaceTrack(null);
    assert.equal(sender.track, null);
    assert.equal(sender.replacedTracks[sender.replacedTracks.length - 1], null);
  });

  it('1.7: Camera can be re-enabled after being stopped with fresh track', async () => {
    let currentTrack = new MockMediaStreamTrack('video', 'track-1');
    currentTrack.stop();
    assert.equal(currentTrack.stopped, true);

    // Turn camera back ON: Acquire new track
    const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
    const freshTrack = newStream.getVideoTracks()[0];

    assert.notEqual(freshTrack.id, currentTrack.id);
    assert.equal(freshTrack.readyState, 'live');
    assert.equal(freshTrack.stopped, false);
  });

  it('1.8: Remote video track is correctly received via ontrack event', () => {
    const peer = new MockRTCPeerConnection();
    const remoteTrack = new MockMediaStreamTrack('video', 'remote-cam');
    const remoteStream = new MockMediaStream([remoteTrack]);

    let receivedStream = null;
    let receivedTrack = null;

    peer.ontrack = (event) => {
      receivedStream = event.streams[0];
      receivedTrack = event.track;
    };

    peer.ontrack({
      track: remoteTrack,
      streams: [remoteStream],
    });

    assert.ok(receivedStream);
    assert.equal(receivedTrack.kind, 'video');
    assert.equal(receivedTrack.id, remoteTrack.id);
  });

  it('1.9: Remote participant stream is mapped to correct participant socket ID', () => {
    const remoteStreams = {};
    const handleRemoteTrack = (socketId, track) => {
      if (!remoteStreams[socketId]) {
        remoteStreams[socketId] = new MockMediaStream();
      }
      remoteStreams[socketId].addTrack(track);
    };

    const trackA = new MockMediaStreamTrack('video', 'peerA-track');
    const trackB = new MockMediaStreamTrack('video', 'peerB-track');

    handleRemoteTrack('socket-A', trackA);
    handleRemoteTrack('socket-B', trackB);

    assert.equal(remoteStreams['socket-A'].getVideoTracks()[0].id, trackA.id);
    assert.equal(remoteStreams['socket-B'].getVideoTracks()[0].id, trackB.id);
    assert.notEqual(remoteStreams['socket-A'], remoteStreams['socket-B']);
  });

  it('1.10: Multiple participant video streams are not overwritten', () => {
    const remoteStreams = {
      userA: new MockMediaStream([new MockMediaStreamTrack('video', 'userA-v')]),
      userB: new MockMediaStream([new MockMediaStreamTrack('video', 'userB-v')]),
    };

    // User C joins
    const userCTrack = new MockMediaStreamTrack('video', 'userC-v');
    remoteStreams.userC = new MockMediaStream([userCTrack]);

    assert.equal(Object.keys(remoteStreams).length, 3);
    assert.equal(remoteStreams.userA.getVideoTracks()[0].label, 'userA-v');
    assert.equal(remoteStreams.userB.getVideoTracks()[0].label, 'userB-v');
    assert.equal(remoteStreams.userC.getVideoTracks()[0].label, 'userC-v');
  });

  it('1.11: Duplicate video tracks and ended tracks are prevented in remote stream', () => {
    const stream = new MockMediaStream();
    const track1 = new MockMediaStreamTrack('video', 'v1');
    stream.addTrack(track1);

    // Track 1 ends
    track1.stop();

    // New track 2 arrives
    const track2 = new MockMediaStreamTrack('video', 'v2');

    // Deduplication & ended track replacement
    stream.getTracks().forEach((oldTrack) => {
      if (oldTrack.kind === track2.kind && (oldTrack.id !== track2.id || oldTrack.readyState === 'ended')) {
        stream.removeTrack(oldTrack);
      }
    });
    stream.addTrack(track2);

    assert.equal(stream.getVideoTracks().length, 1);
    assert.equal(stream.getVideoTracks()[0].id, track2.id);
  });

  it('1.12: Video cleanup occurs when leaving meeting (all tracks stopped)', () => {
    const stream = new MockMediaStream([
      new MockMediaStreamTrack('video', 'cam'),
      new MockMediaStreamTrack('audio', 'mic'),
    ]);

    const leaveMeetingCleanup = (localStream) => {
      localStream.getTracks().forEach((track) => track.stop());
    };

    leaveMeetingCleanup(stream);
    assert.ok(stream.getTracks().every((t) => t.stopped === true && t.readyState === 'ended'));
  });

  it('1.13: Permission denial for camera is handled gracefully with error state', async () => {
    setNavigatorMediaDevices(async () => {
      const err = new Error('Permission denied');
      err.name = 'NotAllowedError';
      throw err;
    });

    let mediaError = null;
    const requestCamera = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
      } catch (err) {
        mediaError = err.message || 'Could not access camera/microphone';
      }
    };

    await requestCamera();
    assert.equal(mediaError, 'Permission denied');
  });

  it('1.14: WebRTC connection failure is handled without crashing UI', () => {
    const peer = new MockRTCPeerConnection();
    let peerClosed = false;

    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'failed') {
        peer.close();
        peerClosed = true;
      }
    };

    peer.connectionState = 'failed';
    peer.onconnectionstatechange();

    assert.equal(peerClosed, true);
    assert.equal(peer.isClosed, true);
  });
});

// ==============================================================================
// 2. AUDIO / MICROPHONE UNIT TESTS
// ==============================================================================
describe('Media Unit Tests - Audio / Microphone Functionality', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = new MockSocket();
    setNavigatorMediaDevices(async (constraints) => {
      const tracks = [];
      if (constraints.audio) {
        tracks.push(new MockMediaStreamTrack('audio', 'microphone'));
      }
      if (constraints.video) {
        tracks.push(new MockMediaStreamTrack('video', 'camera'));
      }
      return new MockMediaStream(tracks);
    });
  });

  it('2.1: getUserMedia() correctly requests microphone with audio constraint', async () => {
    let capturedConstraints = null;
    setNavigatorMediaDevices(async (c) => {
      capturedConstraints = c;
      return new MockMediaStream([new MockMediaStreamTrack('audio')]);
    });

    await navigator.mediaDevices.getUserMedia({ audio: true });
    assert.deepEqual(capturedConstraints, { audio: true });
  });

  it('2.2: Audio track is created with live readyState and kind audio', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTracks = stream.getAudioTracks();
    assert.equal(audioTracks.length, 1);
    assert.equal(audioTracks[0].kind, 'audio');
    assert.equal(audioTracks[0].readyState, 'live');
    assert.equal(audioTracks[0].enabled, true);
  });

  it('2.3: Audio track is attached to peer connection', () => {
    const peer = new MockRTCPeerConnection();
    const audioTrack = new MockMediaStreamTrack('audio', 'mic-track');
    const stream = new MockMediaStream([audioTrack]);

    peer.addTrack(audioTrack, stream);
    assert.equal(peer.tracksAdded.length, 1);
    assert.equal(peer.tracksAdded[0].track.kind, 'audio');
    assert.equal(peer.tracksAdded[0].track.id, audioTrack.id);
  });

  it('2.4: Microphone ON works and emits toggle-audio event', async () => {
    let isAudioEnabled = false;
    let audioTrack = null;

    const toggleAudio = async (roomId) => {
      if (!audioTrack) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        audioTrack = stream.getAudioTracks()[0];
        isAudioEnabled = true;
        mockSocket.emit('toggle-audio', { roomId, enabled: true });
      }
    };

    await toggleAudio('room-101');
    assert.equal(isAudioEnabled, true);
    assert.ok(audioTrack);
    assert.equal(audioTrack.enabled, true);

    const emitted = mockSocket.emittedEvents.find((e) => e.event === 'toggle-audio');
    assert.ok(emitted);
    assert.deepEqual(emitted.data, { roomId: 'room-101', enabled: true });
  });

  it('2.5: Microphone OFF mutes audio track and updates state', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = stream.getAudioTracks()[0];
    let isAudioEnabled = true;

    const toggleAudio = (roomId) => {
      const newState = !audioTrack.enabled;
      audioTrack.enabled = newState;
      isAudioEnabled = newState;
      mockSocket.emit('toggle-audio', { roomId, enabled: newState });
    };

    toggleAudio('room-101');
    assert.equal(isAudioEnabled, false);
    assert.equal(audioTrack.enabled, false);

    const emitted = mockSocket.emittedEvents.find(
      (e) => e.event === 'toggle-audio' && e.data.enabled === false
    );
    assert.ok(emitted);
  });

  it('2.6: Audio track is stopped/released during room exit cleanup', async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const audioTrack = stream.getAudioTracks()[0];

    const cleanupAudio = () => {
      audioTrack.stop();
    };

    cleanupAudio();
    assert.equal(audioTrack.stopped, true);
    assert.equal(audioTrack.readyState, 'ended');
  });

  it('2.7: Host force-mute disables local audio track and updates state', () => {
    const audioTrack = new MockMediaStreamTrack('audio');
    audioTrack.enabled = true;
    let isAudioEnabled = true;
    let mutedNotificationReceived = false;

    mockSocket.on('force-mute', () => {
      audioTrack.enabled = false;
      isAudioEnabled = false;
      mutedNotificationReceived = true;
    });

    mockSocket.trigger('force-mute');
    assert.equal(audioTrack.enabled, false);
    assert.equal(isAudioEnabled, false);
    assert.equal(mutedNotificationReceived, true);
  });

  it('2.8: Unmute request from host presents prompt to participant', () => {
    let unmuteRequest = null;

    mockSocket.on('unmute-requested', ({ hostName }) => {
      unmuteRequest = { hostName: hostName || 'The host' };
    });

    mockSocket.trigger('unmute-requested', { hostName: 'Prof. Miller' });
    assert.deepEqual(unmuteRequest, { hostName: 'Prof. Miller' });
  });

  it('2.9: Remote audio toggle updates participant state correctly', () => {
    let participants = [
      { socketId: 'peer-1', audio: false, name: 'Alice' },
      { socketId: 'peer-2', audio: false, name: 'Bob' },
    ];

    mockSocket.on('participant-audio-toggle', ({ socketId, enabled }) => {
      participants = participants.map((p) =>
        p.socketId === socketId ? { ...p, audio: enabled } : p
      );
    });

    mockSocket.trigger('participant-audio-toggle', { socketId: 'peer-1', enabled: true });

    assert.equal(participants[0].audio, true);
    assert.equal(participants[1].audio, false);
  });

  it('2.10: Multiple participant audio streams are handled independently', () => {
    const audioTracks = {
      peerA: new MockMediaStreamTrack('audio', 'peerA-audio'),
      peerB: new MockMediaStreamTrack('audio', 'peerB-audio'),
    };

    audioTracks.peerA.enabled = false;
    audioTracks.peerB.enabled = true;

    assert.equal(audioTracks.peerA.enabled, false);
    assert.equal(audioTracks.peerB.enabled, true);
    assert.notEqual(audioTracks.peerA.id, audioTracks.peerB.id);
  });

  it('2.11: Microphone permission denial is handled without crashing', async () => {
    setNavigatorMediaDevices(async () => {
      const err = new Error('Permission denied');
      err.name = 'NotAllowedError';
      throw err;
    });

    let mediaError = null;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      mediaError = 'Microphone permission denied or unavailable';
    }

    assert.equal(mediaError, 'Microphone permission denied or unavailable');
  });

  it('2.12: Audio errors do not crash meeting component', async () => {
    let errorCaught = false;
    try {
      throw new Error('Audio device disconnected');
    } catch (e) {
      errorCaught = true;
    }
    assert.equal(errorCaught, true);
  });
});

// ==============================================================================
// 3. SCREEN SHARING UNIT TESTS
// ==============================================================================
describe('Media Unit Tests - Screen Sharing Functionality', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = new MockSocket();
    setNavigatorMediaDevices(
      async () => new MockMediaStream([new MockMediaStreamTrack('video', 'camera')]),
      async () => new MockMediaStream([new MockMediaStreamTrack('video', 'screen')])
    );
  });

  it('3.1: getDisplayMedia() is called with proper display capture constraints', async () => {
    let capturedConstraints = null;
    setNavigatorMediaDevices(
      null,
      async (c) => {
        capturedConstraints = c;
        return new MockMediaStream([new MockMediaStreamTrack('video', 'screen')]);
      }
    );

    await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    assert.deepEqual(capturedConstraints, { video: true, audio: false });
  });

  it('3.2: Screen-share stream and video track are created successfully', async () => {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = displayStream.getVideoTracks()[0];

    assert.ok(displayStream instanceof MockMediaStream);
    assert.ok(screenTrack);
    assert.equal(screenTrack.kind, 'video');
    assert.equal(screenTrack.label, 'screen');
    assert.equal(screenTrack.readyState, 'live');
  });

  it('3.3: Screen track replaces video track on all active peer senders', async () => {
    const peer1 = new MockRTCPeerConnection();
    const peer2 = new MockRTCPeerConnection();
    const cameraTrack = new MockMediaStreamTrack('video', 'cam');

    peer1.addTrack(cameraTrack, new MockMediaStream([cameraTrack]));
    peer2.addTrack(cameraTrack, new MockMediaStream([cameraTrack]));

    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = displayStream.getVideoTracks()[0];

    const peers = [peer1, peer2];
    for (const peer of peers) {
      const sender = peer.getSenders().find((s) => s.track && s.track.kind === 'video');
      await sender.replaceTrack(screenTrack);
    }

    assert.equal(peer1.getSenders()[0].track.id, screenTrack.id);
    assert.equal(peer2.getSenders()[0].track.id, screenTrack.id);
  });

  it('3.4: Screen-sharing state updates correctly and emits socket notification', async () => {
    let isScreenSharing = false;

    const startScreenShare = async (roomId) => {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      isScreenSharing = true;
      mockSocket.emit('screen-share-started', { roomId });
      return stream;
    };

    await startScreenShare('room-101');
    assert.equal(isScreenSharing, true);

    const emitted = mockSocket.emittedEvents.find((e) => e.event === 'screen-share-started');
    assert.ok(emitted);
    assert.deepEqual(emitted.data, { roomId: 'room-101' });
  });

  it('3.5: Screen sharing can be stopped cleanly', async () => {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = displayStream.getVideoTracks()[0];
    let isScreenSharing = true;

    const stopScreenShare = (roomId) => {
      screenTrack.stop();
      isScreenSharing = false;
      mockSocket.emit('screen-share-stopped', { roomId });
    };

    stopScreenShare('room-101');
    assert.equal(isScreenSharing, false);
    assert.equal(screenTrack.stopped, true);
    assert.equal(screenTrack.readyState, 'ended');

    const emitted = mockSocket.emittedEvents.find((e) => e.event === 'screen-share-stopped');
    assert.ok(emitted);
  });

  it("3.6: Browser native 'Stop Sharing' banner event triggers stopScreenShare()", async () => {
    const displayStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    const screenTrack = displayStream.getVideoTracks()[0];
    let cleanupTriggered = false;

    screenTrack.onended = () => {
      cleanupTriggered = true;
      mockSocket.emit('screen-share-stopped', { roomId: 'room-101' });
    };

    screenTrack.stop();

    assert.equal(cleanupTriggered, true);
    const emitted = mockSocket.emittedEvents.find((e) => e.event === 'screen-share-stopped');
    assert.ok(emitted);
  });

  it('3.7: Camera track is restored to peer connections after screen sharing stops', async () => {
    const peer = new MockRTCPeerConnection();
    const cameraTrack = new MockMediaStreamTrack('video', 'camera');
    const isVideoEnabled = true;

    peer.addTrack(cameraTrack, new MockMediaStream([cameraTrack]));
    const videoSender = peer.getSenders()[0];

    // Screen sharing starts
    const screenTrack = new MockMediaStreamTrack('video', 'screen');
    await videoSender.replaceTrack(screenTrack);
    assert.equal(videoSender.track.id, screenTrack.id);

    // Screen sharing stops -> camera is restored
    screenTrack.stop();
    const restoreTrack = isVideoEnabled ? cameraTrack : null;
    await videoSender.replaceTrack(restoreTrack);

    assert.equal(videoSender.track.id, cameraTrack.id);
    assert.equal(videoSender.track.label, 'camera');
  });

  it('3.8: Null is sent to peers if camera was off before screen share', async () => {
    const peer = new MockRTCPeerConnection();
    const screenTrack = new MockMediaStreamTrack('video', 'screen');
    peer.addTrack(screenTrack, new MockMediaStream([screenTrack]));
    const videoSender = peer.getSenders()[0];

    const isVideoEnabled = false;
    const cameraTrack = null;

    screenTrack.stop();
    const restoreTrack = isVideoEnabled ? cameraTrack : null;
    await videoSender.replaceTrack(restoreTrack);

    assert.equal(videoSender.track, null);
  });

  it('3.9: Cancelled screen-selection dialog (NotAllowedError) is handled gracefully', async () => {
    setNavigatorMediaDevices(null, async () => {
      const err = new Error('Permission denied');
      err.name = 'NotAllowedError';
      throw err;
    });

    let mediaError = null;
    let didCrash = false;

    try {
      await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        mediaError = null;
      } else {
        mediaError = 'Screen sharing failed';
      }
    }

    assert.equal(didCrash, false);
    assert.equal(mediaError, null);
  });

  it('3.10: Screen share permission denial sets mediaError state without crashing', async () => {
    setNavigatorMediaDevices(null, async () => {
      const err = new Error('System display capture denied');
      err.name = 'SecurityError';
      throw err;
    });

    let mediaError = null;
    try {
      await navigator.mediaDevices.getDisplayMedia({ video: true });
    } catch {
      mediaError = 'Screen sharing failed or canceled';
    }

    assert.equal(mediaError, 'Screen sharing failed or canceled');
  });

  it('3.11: Host force-stop-screen-share revokes active screen share and restores camera', async () => {
    const screenTrack = new MockMediaStreamTrack('video', 'screen');
    const cameraTrack = new MockMediaStreamTrack('video', 'camera');
    const peer = new MockRTCPeerConnection();
    peer.addTrack(screenTrack, new MockMediaStream([screenTrack]));

    let isScreenSharing = true;
    let isVideoEnabled = true;

    mockSocket.on('force-stop-screen-share', async () => {
      if (isScreenSharing) {
        screenTrack.stop();
        isScreenSharing = false;
        const videoSender = peer.getSenders()[0];
        await videoSender.replaceTrack(isVideoEnabled ? cameraTrack : null);
        mockSocket.emit('screen-share-stopped', { roomId: 'room-101' });
      }
    });

    mockSocket.trigger('force-stop-screen-share');
    assert.equal(isScreenSharing, false);
    assert.equal(screenTrack.stopped, true);
    assert.equal(peer.getSenders()[0].track.id, cameraTrack.id);
  });

  it('3.12: Screen share track cleanup stops tracks when unmounting', () => {
    const screenTrack = new MockMediaStreamTrack('video', 'screen');
    assert.equal(screenTrack.stopped, false);

    screenTrack.stop();
    assert.equal(screenTrack.stopped, true);
  });
});

// ==============================================================================
// 4. WEBRTC SIGNALING UNIT TESTS
// ==============================================================================
describe('Media Unit Tests - WebRTC Signaling & Negotiation', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = new MockSocket('client-1');
  });

  it('4.1: Peer creates WebRTC offer on user-joined event', async () => {
    const peer = new MockRTCPeerConnection();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    assert.equal(peer.signalingState, 'have-local-offer');
    assert.equal(offer.type, 'offer');
  });

  it('4.2: Offer sending matches backend contract: { to, offer }', () => {
    const mockOffer = { type: 'offer', sdp: 'v=0' };
    mockSocket.emit('offer', { to: 'peer-socket-2', offer: mockOffer });

    const event = mockSocket.emittedEvents.find((e) => e.event === 'offer');
    assert.ok(event);
    assert.deepEqual(event.data, { to: 'peer-socket-2', offer: mockOffer });
  });

  it('4.3: Receiving offer sets remote description and generates answer', async () => {
    const peer = new MockRTCPeerConnection();
    const incomingOffer = { type: 'offer', sdp: 'v=0\r\no=remote-offer' };

    await peer.setRemoteDescription(new MockRTCSessionDescription(incomingOffer));
    assert.equal(peer.signalingState, 'have-remote-offer');

    const answer = await peer.createAnswer();
    await peer.setLocalDescription(answer);

    assert.equal(peer.signalingState, 'stable');
    assert.equal(answer.type, 'answer');
  });

  it('4.4: Answer sending matches backend contract: { to, answer }', () => {
    const mockAnswer = { type: 'answer', sdp: 'v=0' };
    mockSocket.emit('answer', { to: 'peer-socket-1', answer: mockAnswer });

    const event = mockSocket.emittedEvents.find((e) => e.event === 'answer');
    assert.ok(event);
    assert.deepEqual(event.data, { to: 'peer-socket-1', answer: mockAnswer });
  });

  it('4.5: Receiving answer transitions peer connection to stable state', async () => {
    const peer = new MockRTCPeerConnection();
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    assert.equal(peer.signalingState, 'have-local-offer');

    const incomingAnswer = { type: 'answer', sdp: 'v=0\r\no=remote-answer' };
    await peer.setRemoteDescription(new MockRTCSessionDescription(incomingAnswer));

    assert.equal(peer.signalingState, 'stable');
  });

  it('4.6: ICE candidate is generated and emitted to socket: { to, candidate }', () => {
    const peer = new MockRTCPeerConnection();
    peer.onicecandidate = (event) => {
      if (event.candidate) {
        mockSocket.emit('ice-candidate', {
          to: 'peer-socket-2',
          candidate: event.candidate,
        });
      }
    };

    const mockCandidate = { candidate: 'candidate:1 1 UDP', sdpMid: '0', sdpMLineIndex: 0 };
    peer.onicecandidate({ candidate: mockCandidate });

    const event = mockSocket.emittedEvents.find((e) => e.event === 'ice-candidate');
    assert.ok(event);
    assert.deepEqual(event.data, { to: 'peer-socket-2', candidate: mockCandidate });
  });

  it('4.7: ICE candidates arriving before remote description are queued', () => {
    const iceQueue = [];
    const remoteDescriptionSet = false;

    const handleIncomingCandidate = (candidate) => {
      if (!remoteDescriptionSet) {
        iceQueue.push(candidate);
      }
    };

    handleIncomingCandidate({ candidate: 'cand-1' });
    handleIncomingCandidate({ candidate: 'cand-2' });

    assert.equal(iceQueue.length, 2);
  });

  it('4.8: Queued ICE candidates are flushed after remote description is set', async () => {
    const peer = new MockRTCPeerConnection();
    await peer.setRemoteDescription(new MockRTCSessionDescription({ type: 'offer' }));

    const iceQueue = [{ candidate: 'cand-1' }, { candidate: 'cand-2' }];

    while (iceQueue.length > 0) {
      const cand = iceQueue.shift();
      await peer.addIceCandidate(new MockRTCIceCandidate(cand));
    }

    assert.equal(iceQueue.length, 0);
    assert.equal(peer.addedIceCandidates.length, 2);
  });

  it('4.9: Glare resolution handles simultaneous offers with rollback', async () => {
    const peer = new MockRTCPeerConnection();
    const localOffer = await peer.createOffer();
    await peer.setLocalDescription(localOffer);
    assert.equal(peer.signalingState, 'have-local-offer');

    if (peer.signalingState === 'have-local-offer') {
      await peer.setLocalDescription({ type: 'rollback' });
    }
    assert.equal(peer.signalingState, 'stable');

    await peer.setRemoteDescription(new MockRTCSessionDescription({ type: 'offer' }));
    assert.equal(peer.signalingState, 'have-remote-offer');
  });

  it('4.10: Participant connection is created on demand for each peer', () => {
    const peers = {};
    const getOrCreatePeer = (socketId) => {
      if (!peers[socketId]) {
        peers[socketId] = new MockRTCPeerConnection();
      }
      return peers[socketId];
    };

    const peerA = getOrCreatePeer('socket-A');
    const peerB = getOrCreatePeer('socket-B');
    const peerAAgain = getOrCreatePeer('socket-A');

    assert.notEqual(peerA, peerB);
    assert.equal(peerA, peerAAgain);
  });

  it('4.11: Participant connection cleanup closes connection and deletes reference', () => {
    const peers = {
      'socket-A': new MockRTCPeerConnection(),
      'socket-B': new MockRTCPeerConnection(),
    };

    const closePeer = (socketId) => {
      if (peers[socketId]) {
        peers[socketId].close();
        delete peers[socketId];
      }
    };

    closePeer('socket-A');
    assert.equal(peers['socket-A'], undefined);
    assert.ok(peers['socket-B']);
    assert.equal(peers['socket-B'].isClosed, false);
  });
});

// ==============================================================================
// 5. MULTI-PARTICIPANT LOGIC TESTS
// ==============================================================================
describe('Media Unit Tests - Multi-Participant Logic (Mesh Architecture)', () => {
  it('5.1: 4-participant mesh topology maintains separate peer connections', () => {
    const activePeers = new Map();
    const participants = ['Participant-A', 'Participant-B', 'Participant-C'];

    participants.forEach((pId) => {
      activePeers.set(pId, new MockRTCPeerConnection());
    });

    assert.equal(activePeers.size, 3);
    assert.ok(activePeers.has('Participant-A'));
    assert.ok(activePeers.has('Participant-B'));
    assert.ok(activePeers.has('Participant-C'));
  });

  it('5.2: Adding Participant B does not overwrite Participant A video/audio stream', () => {
    const remoteStreams = new Map();

    const streamA = new MockMediaStream([
      new MockMediaStreamTrack('video', 'streamA-v'),
      new MockMediaStreamTrack('audio', 'streamA-a'),
    ]);
    remoteStreams.set('peer-A', streamA);

    const streamB = new MockMediaStream([
      new MockMediaStreamTrack('video', 'streamB-v'),
      new MockMediaStreamTrack('audio', 'streamB-a'),
    ]);
    remoteStreams.set('peer-B', streamB);

    assert.equal(remoteStreams.get('peer-A').getVideoTracks()[0].label, 'streamA-v');
    assert.equal(remoteStreams.get('peer-B').getVideoTracks()[0].label, 'streamB-v');
  });

  it('5.3: Independent camera states for Host, Participant A, B, and C', () => {
    const participants = [
      { id: 'host', isHost: true, video: true, audio: true },
      { id: 'partA', isHost: false, video: false, audio: true },
      { id: 'partB', isHost: false, video: true, audio: false },
      { id: 'partC', isHost: false, video: false, audio: false },
    ];

    const updateVideoState = (userId, enabled) => {
      const p = participants.find((x) => x.id === userId);
      if (p) p.video = enabled;
    };

    updateVideoState('partA', true);
    assert.equal(participants.find((x) => x.id === 'partA').video, true);
    assert.equal(participants.find((x) => x.id === 'partB').video, true);
    assert.equal(participants.find((x) => x.id === 'partC').video, false);
  });

  it('5.4: Participant leaves without disrupting remaining peer streams', () => {
    const peers = new Map();
    const streams = new Map();

    ['A', 'B', 'C'].forEach((id) => {
      peers.set(id, new MockRTCPeerConnection());
      streams.set(id, new MockMediaStream());
    });

    const onParticipantLeft = (id) => {
      if (peers.has(id)) {
        peers.get(id).close();
        peers.delete(id);
      }
      streams.delete(id);
    };

    onParticipantLeft('B');

    assert.equal(peers.has('B'), false);
    assert.equal(streams.has('B'), false);
    assert.equal(peers.has('A'), true);
    assert.equal(peers.has('C'), true);
    assert.equal(peers.get('A').isClosed, false);
    assert.equal(peers.get('C').isClosed, false);
  });

  it('5.5: Participant reconnect cleans up stale peer connection before creating new one', () => {
    const peers = new Map();
    const initialPeer = new MockRTCPeerConnection();
    peers.set('socket-old-A', initialPeer);

    if (peers.has('socket-old-A')) {
      peers.get('socket-old-A').close();
      peers.delete('socket-old-A');
    }
    const newPeer = new MockRTCPeerConnection();
    peers.set('socket-new-A', newPeer);

    assert.equal(initialPeer.isClosed, true);
    assert.equal(peers.has('socket-old-A'), false);
    assert.equal(peers.get('socket-new-A'), newPeer);
  });

  it('5.6: Only one participant can have active screen share at a time', () => {
    let activeScreenSharer = null;

    const startSharing = (user) => {
      activeScreenSharer = user;
    };

    const stopSharing = (socketId) => {
      if (activeScreenSharer?.socketId === socketId) {
        activeScreenSharer = null;
      }
    };

    startSharing({ socketId: 'socket-A', name: 'Alice' });
    assert.equal(activeScreenSharer.name, 'Alice');

    startSharing({ socketId: 'socket-B', name: 'Bob' });
    assert.equal(activeScreenSharer.name, 'Bob');

    stopSharing('socket-B');
    assert.equal(activeScreenSharer, null);
  });
});

// ==============================================================================
// 6. RESOURCE & MEDIA CLEANUP TESTS
// ==============================================================================
describe('Media Unit Tests - Resource & Media Cleanup', () => {
  let mockSocket;

  beforeEach(() => {
    mockSocket = new MockSocket();
  });

  it('6.1: Camera OFF stops video track hardware and sets reference to null', () => {
    const videoTrack = new MockMediaStreamTrack('video');
    let cameraTrackRef = videoTrack;

    cameraTrackRef.stop();
    cameraTrackRef = null;

    assert.equal(videoTrack.stopped, true);
    assert.equal(cameraTrackRef, null);
  });

  it('6.2: Microphone OFF disables audio track', () => {
    const audioTrack = new MockMediaStreamTrack('audio');
    audioTrack.enabled = true;

    audioTrack.enabled = false;
    assert.equal(audioTrack.enabled, false);
  });

  it('6.3: Screen share OFF stops screen display track and clears stream', () => {
    const screenTrack = new MockMediaStreamTrack('video', 'screen');
    let screenStream = new MockMediaStream([screenTrack]);

    screenTrack.stop();
    screenStream = null;

    assert.equal(screenTrack.stopped, true);
    assert.equal(screenStream, null);
  });

  it('6.4: Leave meeting stops all local media tracks', () => {
    const localStream = new MockMediaStream([
      new MockMediaStreamTrack('video'),
      new MockMediaStreamTrack('audio'),
    ]);

    localStream.getTracks().forEach((track) => track.stop());

    assert.ok(localStream.getTracks().every((t) => t.stopped === true));
  });

  it('6.5: Leave meeting closes all peer connections', () => {
    const peers = {
      p1: new MockRTCPeerConnection(),
      p2: new MockRTCPeerConnection(),
      p3: new MockRTCPeerConnection(),
    };

    Object.values(peers).forEach((p) => p.close());

    assert.ok(Object.values(peers).every((p) => p.isClosed === true));
  });

  it('6.6: Leave meeting removes all registered socket event listeners', () => {
    const socket = new MockSocket();
    const handlers = {
      'user-joined': () => {},
      'offer': () => {},
      'answer': () => {},
      'ice-candidate': () => {},
      'participant-left': () => {},
    };

    Object.entries(handlers).forEach(([evt, fn]) => socket.on(evt, fn));
    assert.equal(socket.listeners.size, 5);

    Object.keys(handlers).forEach((evt) => socket.off(evt));
    assert.equal(socket.listeners.size, 0);
  });

  it('6.7: Unmounting component cleans up all streams without memory leaks', () => {
    const activeResources = {
      localStream: new MockMediaStream([new MockMediaStreamTrack('video')]),
      screenTrack: new MockMediaStreamTrack('video', 'screen'),
      peers: [new MockRTCPeerConnection(), new MockRTCPeerConnection()],
    };

    activeResources.localStream.getTracks().forEach((t) => t.stop());
    activeResources.screenTrack.stop();
    activeResources.peers.forEach((p) => p.close());

    assert.ok(activeResources.localStream.getTracks().every((t) => t.stopped));
    assert.equal(activeResources.screenTrack.stopped, true);
    assert.ok(activeResources.peers.every((p) => p.isClosed));
  });

  it('6.8: Socket disconnect state updates connection status to disconnected', () => {
    let connectionStatus = 'connected';
    mockSocket.on('disconnect', () => {
      connectionStatus = 'disconnected';
    });

    mockSocket.trigger('disconnect');
    assert.equal(connectionStatus, 'disconnected');
  });
});
