import { useRef, useEffect, useState } from 'react';
import { Mic, MicOff, User, Volume2 } from 'lucide-react';

export const VideoTile = ({
  stream,
  name = 'Participant',
  role = 'participant',
  isAudioEnabled = false,
  isVideoEnabled = false,
  isLocal = false,
  isHost = false,
}) => {
  const videoRef = useRef(null);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play?.().catch((err) => {
        // Autoplay may require interaction or is already active
        console.debug('Video play catch:', err.message);
      });
    }
  }, [stream]);

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
      // AudioContext policy or device unsupported
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

  const isPresenter = role === 'presenter';
  const hasActiveVideo = (isVideoEnabled || isPresenter) && stream && stream.getVideoTracks().length > 0;

  return (
    <div
      className={`relative w-full h-full min-h-[200px] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border shadow-md group transition-all duration-200 ${
        isSpeaking
          ? 'border-emerald-500 ring-2 ring-emerald-500/80 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
          : 'border-neutral-800'
      }`}
    >
      {/* Video Element (Kept active in DOM with opacity-0 so remote audio continues playing when video is off) */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full ${
          isPresenter ? 'object-contain' : 'object-cover'
        } transition-opacity duration-200 ${
          hasActiveVideo ? 'opacity-100 relative z-0' : 'opacity-0 pointer-events-none absolute inset-0'
        } ${isLocal && !isPresenter ? 'scale-x-[-1]' : ''}`}
      />

      {/* Avatar Fallback when Video is off */}
      {!hasActiveVideo && (
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
      <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
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
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
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
