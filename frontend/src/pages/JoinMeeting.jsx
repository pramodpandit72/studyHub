import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { meetingApi } from '../services/meeting.api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { PageLoader, ButtonLoader } from '../components/common/Loader';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  User,
  ShieldCheck,
  LogIn,
  ArrowLeft,
} from 'lucide-react';

export const JoinMeeting = () => {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { error } = useToast();

  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [localStream, setLocalStream] = useState(null);

  const videoRef = useRef(null);

  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const { data } = await meetingApi.getByCode(code);
        setMeeting(data.data.meeting);
      } catch (err) {
        error(err.response?.data?.message || 'This meeting could not be found. Check the code and try again.');
        navigate('/meetings');
      } finally {
        setLoading(false);
      }
    };

    if (code) {
      fetchMeeting();
    }
  }, [code, navigate, error]);

  // Handle local camera preview
  const toggleCamera = async () => {
    if (isVideoEnabled) {
      if (localStream) {
        localStream.getVideoTracks().forEach((t) => t.stop());
      }
      setIsVideoEnabled(false);
      if (videoRef.current) videoRef.current.srcObject = null;
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setLocalStream(stream);
        setIsVideoEnabled(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        error('Could not access camera.');
      }
    }
  };

  const toggleMic = () => {
    setIsAudioEnabled(!isAudioEnabled);
  };

  // Cleanup tracks on leave
  useEffect(() => {
    return () => {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [localStream]);

  const handleEnterMeeting = async () => {
    setJoining(true);
    try {
      const { data } = await meetingApi.join(code);
      if (data.data?.waiting) {
        error('You have been placed in the waiting room. Host will admit you shortly.');
        return;
      }
      navigate(`/meetings/${meeting._id}/room`, {
        state: {
          meeting,
          initialAudio: isAudioEnabled,
          initialVideo: isVideoEnabled,
        },
      });
    } catch (err) {
      error(err.response?.data?.message || 'Failed to join meeting.');
    } finally {
      setJoining(false);
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="flex-1 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto w-full">
      {/* Top Bar: Back Button & Theme Toggle */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate('/meetings')}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          aria-label="Back to Meetings"
        >
          <ArrowLeft size={15} />
          <span>← Back to Meetings</span>
        </button>
      </div>

      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Left: Video Preview */}
        <div className="flex flex-col items-center">
          <div className="relative w-full aspect-video bg-surface-900 rounded-xl overflow-hidden border border-border-color shadow-md flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${
                isVideoEnabled ? 'block' : 'hidden'
              }`}
            />

            {!isVideoEnabled && (
              <div className="flex flex-col items-center text-center p-4">
                <div className="w-20 h-20 rounded-full bg-surface-800 border-2 border-surface-700 flex items-center justify-center text-white text-2xl font-bold">
                  {user?.name?.charAt(0).toUpperCase() || <User size={32} />}
                </div>
                <p className="mt-3 text-xs text-surface-400">Camera is off</p>
              </div>
            )}

            {/* Preview Controls */}
            <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-3 z-10">
              <button
                type="button"
                onClick={toggleMic}
                className={`p-3 rounded-full transition shadow-md border ${
                  isAudioEnabled
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 text-white border-neutral-700'
                }`}
                title={isAudioEnabled ? 'Mute Mic' : 'Unmute Mic'}
              >
                {isAudioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
              </button>

              <button
                type="button"
                onClick={toggleCamera}
                className={`p-3 rounded-full transition shadow-md border ${
                  isVideoEnabled
                    ? 'bg-white text-black border-white'
                    : 'bg-neutral-900 text-white border-neutral-700'
                }`}
                title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isVideoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
            </div>
          </div>
          <p className="text-[11px] text-text-secondary mt-2">
            Check your microphone and camera before entering the meeting.
          </p>
        </div>

        {/* Right: Meeting Info & Join Action */}
        <div className="card p-6 sm:p-8 space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-surface-100 dark:bg-surface-700 text-text-primary mb-3 border border-border-color">
              <ShieldCheck size={13} />
              Ready to Join
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-text-primary">
              {meeting?.title}
            </h1>
            {meeting?.description && (
              <p className="text-xs sm:text-sm text-text-secondary mt-2">
                {meeting.description}
              </p>
            )}
          </div>

          <div className="space-y-2 py-3 border-y border-border-color text-xs text-text-secondary">
            <div className="flex justify-between">
              <span>Host</span>
              <strong className="text-text-primary">{meeting?.host?.name || 'Instructor'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Meeting Code</span>
              <span className="font-mono text-text-primary font-bold">{meeting?.meetingCode}</span>
            </div>
            <div className="flex justify-between">
              <span>Status</span>
              <span className="capitalize text-text-primary font-medium">{meeting?.status}</span>
            </div>
          </div>

          <div>
            <button
              onClick={handleEnterMeeting}
              disabled={joining}
              className="btn btn-primary w-full py-3 text-sm font-semibold flex items-center justify-center gap-2"
            >
              {joining ? <ButtonLoader /> : (
                <>
                  <LogIn size={16} />
                  <span>Join Meeting</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
