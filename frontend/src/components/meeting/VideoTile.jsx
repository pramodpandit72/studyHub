import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, User, Volume2, Radio } from 'lucide-react';

export const VideoTile = ({
  stream,
  frame = null,
  name = 'Participant',
  role = 'participant',
  isAudioEnabled = false,
  isVideoEnabled = false,
  isLocal = false,
  isHost = false,
  className = '',
}) => {
  const videoRef = useRef(null);
  const audioRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [videoTrackCount, setVideoTrackCount] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Dynamically track live, unmuted video tracks on stream
  useEffect(() => {
    if (!stream) {
      setVideoTrackCount(0);
      setIsVideoPlaying(false);
      return;
    }

    const checkTracks = () => {
      const activeTracks = stream.getVideoTracks().filter((t) => t.readyState === 'live');
      setVideoTrackCount(activeTracks.length);
      if (activeTracks.length > 0 && videoRef.current) {
        const video = videoRef.current;
        video.muted = isLocal;
        video.defaultMuted = isLocal;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        if (video.srcObject !== stream) {
          video.srcObject = stream;
        }
        video.play?.().catch(() => {});
      }
    };

    checkTracks();

    stream.addEventListener('addtrack', checkTracks);
    stream.addEventListener('removetrack', checkTracks);

    const tracks = stream.getVideoTracks();
    tracks.forEach((t) => {
      t.addEventListener('mute', checkTracks);
      t.addEventListener('unmute', checkTracks);
      t.addEventListener('ended', checkTracks);
    });

    const aTracks = stream.getAudioTracks();
    aTracks.forEach((t) => {
      t.addEventListener('mute', checkTracks);
      t.addEventListener('unmute', checkTracks);
      t.addEventListener('ended', checkTracks);
    });

    return () => {
      stream.removeEventListener('addtrack', checkTracks);
      stream.removeEventListener('removetrack', checkTracks);
      tracks.forEach((t) => {
        t.removeEventListener('mute', checkTracks);
        t.removeEventListener('unmute', checkTracks);
        t.removeEventListener('ended', checkTracks);
      });
      aTracks.forEach((t) => {
        t.removeEventListener('mute', checkTracks);
        t.removeEventListener('unmute', checkTracks);
        t.removeEventListener('ended', checkTracks);
      });
    };
  }, [stream, isLocal, isAudioEnabled]);

  // Attach stream to video element with iOS Safari / WebKit compliance
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Critical DOM properties for iOS Safari WebKit inline video
    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');

    if (stream) {
      if (video.srcObject !== stream) {
        video.srcObject = stream;
      }
      video.play?.().catch((err) => {
        console.debug('Video autoplay catch:', err.message);
      });
    } else {
      video.srcObject = null;
      setIsVideoPlaying(false);
    }
  }, [stream, role, isVideoEnabled]);

  // Track whether video element is actively decoding & playing frames
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlaying = () => setIsVideoPlaying(true);
    const onLoadedMetadata = () => {
      if (video.videoWidth > 0) setIsVideoPlaying(true);
      video.play?.().catch(() => {});
    };
    const onTimeUpdate = () => {
      if (video.videoWidth > 0 && !isVideoPlaying) setIsVideoPlaying(true);
    };
    const onEndedOrPause = () => setIsVideoPlaying(false);

    video.addEventListener('playing', onPlaying);
    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('pause', onEndedOrPause);
    video.addEventListener('ended', onEndedOrPause);

    return () => {
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('pause', onEndedOrPause);
      video.removeEventListener('ended', onEndedOrPause);
    };
  }, [isVideoPlaying]);

  // Active speaker detection via Web Audio API
  useEffect(() => {
    if (!stream || !isAudioEnabled) {
      setIsSpeaking(false);
      return;
    }

    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0 || !audioTracks[0].enabled) {
      setIsSpeaking(false);
      return;
    }

    let audioContext = null;
    let source = null;
    let analyser = null;
    let animationFrameId = null;
    let silenceTimer = null;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;

      audioContext = new AudioCtx();
      analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.4;

      source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;

        // Threshold for human speech activity (~12-15 on 0-255 scale)
        if (average > 14) {
          setIsSpeaking(true);
          if (silenceTimer) clearTimeout(silenceTimer);
          silenceTimer = setTimeout(() => {
            setIsSpeaking(false);
          }, 350);
        }

        animationFrameId = requestAnimationFrame(checkVolume);
      };

      checkVolume();
    } catch (e) {
      console.debug('Audio analyser init error:', e.message);
    }

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (silenceTimer) clearTimeout(silenceTimer);
      try {
        if (source) source.disconnect();
        if (analyser) analyser.disconnect();
        if (audioContext && audioContext.state !== 'closed') {
          audioContext.close();
        }
      } catch (e) {
        // cleanup ignore
      }
    };
  }, [stream, isAudioEnabled]);

  // Deliver remote participant audio reliably to speaker
  useEffect(() => {
    if (isLocal) return;
    const audioEl = audioRef.current;
    if (audioEl && stream) {
      if (audioEl.srcObject !== stream) {
        audioEl.srcObject = stream;
      }
      audioEl.play().catch((err) => {
        console.debug('Remote audio autoplay waiting for gesture:', err.message);
      });
    }
  }, [stream, isLocal, isAudioEnabled]);

  // Unlock audio playback on first user gesture in room (click, touch, keydown)
  useEffect(() => {
    if (isLocal) return;
    const unlock = () => {
      if (audioRef.current && stream) {
        audioRef.current.play().catch(() => {});
      }
      if (videoRef.current && stream && !isLocal) {
        videoRef.current.play().catch(() => {});
      }
    };
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
    window.addEventListener('touchstart', unlock, { passive: true });
    return () => {
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, [isLocal, stream]);

  const isPresenter = role === 'presenter';
  const hasLiveVideoTrack = Boolean(
    stream && stream.getVideoTracks().some((t) => t.readyState === 'live' && t.enabled)
  );

  // WebRTC video is actively rendering if local with video ON, or remote with live track / playing frames
  const hasActiveWebRTCVideo = isLocal
    ? isVideoEnabled
    : (isVideoEnabled || isPresenter) && (isVideoPlaying || hasLiveVideoTrack || videoTrackCount > 0);

  // Either WebRTC stream or Socket frame relay is available
  const hasAnyVideoContent = hasActiveWebRTCVideo || Boolean(frame);

  return (
    <div
      className={`relative w-full h-full aspect-video bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border shadow-md group transition-all duration-200 ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          : 'border-neutral-800'
      } ${className}`}
    >
      {/* Remote Audio Playback Element - delivers audio directly from stream */}
      {!isLocal && stream && (
        <audio
          ref={audioRef}
          autoPlay
          playsInline
        />
      )}

      {/* Video Element - muted only for local user to prevent echo; unmuted for remote participants to hear audio */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        onPlaying={() => setIsVideoPlaying(true)}
        onLoadedMetadata={() => setIsVideoPlaying(true)}
        className={`w-full h-full object-contain transition-opacity duration-200 ${
          hasActiveWebRTCVideo
            ? 'opacity-100 relative z-10'
            : 'opacity-0 pointer-events-none absolute inset-0'
        } ${isLocal && !isPresenter ? 'scale-x-[-1]' : ''}`}
      />

      {/* Fallback frame image from socket frame relay - object-contain prevents any cropping */}
      {frame && (
        <img
          src={frame}
          alt={name}
          className={`w-full h-full object-contain absolute inset-0 transition-opacity duration-200 ${
            hasActiveWebRTCVideo ? 'opacity-0 pointer-events-none z-0' : 'opacity-100 z-10'
          }`}
        />
      )}

      {/* Presenter connecting state or Avatar Fallback */}
      {!hasAnyVideoContent && isPresenter ? (
        <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white mb-3 shadow-lg">
            <Radio size={28} className="animate-pulse text-indigo-400" />
          </div>
          <span className="text-sm font-semibold text-neutral-200">{name}</span>
          <span className="text-xs text-neutral-400 mt-1">Connecting to screen share...</span>
        </div>
      ) : !hasAnyVideoContent && (
        <div className="flex flex-col items-center justify-center p-4">
          <div
            className={`w-20 h-20 rounded-full bg-neutral-900 border-2 flex items-center justify-center text-white text-2xl font-bold shadow-inner transition-all duration-200 ${
              isSpeaking
                ? 'border-emerald-500 scale-105 shadow-[0_0_15px_rgba(16,185,129,0.4)]'
                : 'border-neutral-700'
            }`}
          >
            {name ? name.charAt(0).toUpperCase() : <User size={32} />}
          </div>
          <span className="mt-3 text-sm font-medium text-neutral-300 flex items-center gap-1.5">
            {name} {isLocal && '(You)'}
            {isSpeaking && (
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            )}
          </span>
        </div>
      )}

      {/* Top Left: Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-20">
        {isHost && (
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-white text-black rounded-md border border-white">
            Host
          </span>
        )}
        {isLocal && (
          <span className="px-2 py-0.5 text-[11px] font-medium bg-neutral-900/90 text-white rounded-md border border-neutral-700">
            You
          </span>
        )}
        {isSpeaking && (
          <span className="px-2 py-0.5 text-[11px] font-semibold bg-emerald-500 text-white rounded-md flex items-center gap-1 shadow-xs animate-pulse">
            <Volume2 size={12} />
            <span>Speaking</span>
          </span>
        )}
      </div>

      {/* Bottom Bar: Name & Mic status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-none">
        <div className="px-2.5 py-1 bg-neutral-900/90 rounded-md text-xs font-medium text-white truncate max-w-[70%] border border-neutral-800 flex items-center gap-1.5">
          <span className="truncate">{name}</span>
        </div>

        <div
          className={`p-1.5 rounded-full border transition-colors ${
            isSpeaking
              ? 'bg-emerald-500 text-white border-emerald-400'
              : isAudioEnabled
              ? 'bg-neutral-800 text-white border-neutral-700'
              : 'bg-neutral-950 text-neutral-300 border-neutral-700 ring-1 ring-white/10'
          }`}
        >
          {isAudioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
        </div>
      </div>
    </div>
  );
};