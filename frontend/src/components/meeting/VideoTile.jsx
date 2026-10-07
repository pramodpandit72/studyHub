import { useRef, useEffect } from 'react';
import { Mic, MicOff, User } from 'lucide-react';

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

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play?.().catch((err) => {
        // Autoplay may require interaction or is already active
        console.debug('Video play catch:', err.message);
      });
    }
  }, [stream]);

  const isPresenter = role === 'presenter';
  const hasActiveVideo = (isVideoEnabled || isPresenter) && stream && stream.getVideoTracks().length > 0;

  return (
    <div className="relative w-full h-full min-h-[200px] bg-neutral-950 rounded-xl overflow-hidden flex items-center justify-center border border-neutral-800 shadow-md group">
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
          <div className="w-20 h-20 rounded-full bg-neutral-900 border-2 border-neutral-700 flex items-center justify-center text-white text-2xl font-bold shadow-inner">
            {name ? name.charAt(0).toUpperCase() : <User size={32} />}
          </div>
          <span className="mt-3 text-sm font-medium text-neutral-300">
            {name} {isLocal && '(You)'}
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
      </div>

      {/* Bottom Bar: Name & Mic status */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-none">
        <div className="px-2.5 py-1 bg-neutral-900/90 rounded-md text-xs font-medium text-white truncate max-w-[70%] border border-neutral-800">
          {name}
        </div>

        <div
          className={`p-1.5 rounded-full border ${
            isAudioEnabled
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
