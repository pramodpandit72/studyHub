import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { meetingApi } from '../services/meeting.api';
import { useWebRTC } from '../hooks/useWebRTC';
import { VideoTile } from '../components/meeting/VideoTile';
import { MeetingControls } from '../components/meeting/MeetingControls';
import { ChatPanel } from '../components/meeting/ChatPanel';
import { ParticipantsPanel } from '../components/meeting/ParticipantsPanel';
import { PollPanel } from '../components/meeting/PollPanel';
import { PageLoader } from '../components/common/Loader';
import { Copy, Check, Users, Shield, ArrowLeft, Sun, Moon } from 'lucide-react';

export const MeetingRoom = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [meeting, setMeeting] = useState(location.state?.meeting || null);
  const [loading, setLoading] = useState(!meeting);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isPollOpen, setIsPollOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Initial media preference passed from preview screen
  const initialAudio = location.state?.initialAudio || false;
  const initialVideo = location.state?.initialVideo || false;

  // Fetch meeting if not in location state
  useEffect(() => {
    if (!meeting && id) {
      const load = async () => {
        try {
          const { data } = await meetingApi.getById(id);
          setMeeting(data.data.meeting);
        } catch (err) {
          error('Failed to load meeting details.');
          navigate('/meetings');
        } finally {
          setLoading(false);
        }
      };
      load();
    }
  }, [id, meeting, navigate, error]);

  const meetingCode = meeting?.meetingCode;
  const isHost = meeting?.host?._id === user?._id || meeting?.host === user?._id;

  // WebRTC Hook
  const {
    localStream,
    remoteStreams,
    participants,
    messages,
    activePoll,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
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
  } = useWebRTC(meetingCode, id, user, {
    onMeetingEnded: () => {
      error('The host has ended this meeting.');
      navigate('/dashboard');
    },
    onRemovedFromMeeting: () => {
      error('You have been removed from this meeting by the host.');
      navigate('/dashboard');
    },
  });

  // Initialize media based on preview preferences
  useEffect(() => {
    if (meetingCode && (initialAudio || initialVideo)) {
      initLocalStream(initialVideo, initialAudio);
    }
  }, [meetingCode, initLocalStream, initialAudio, initialVideo]);

  // Display media error toast if any
  useEffect(() => {
    if (mediaError) {
      error(mediaError);
    }
  }, [mediaError, error]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${meetingCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    success('Meeting invite link copied!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleLeaveMeeting = async () => {
    try {
      await meetingApi.leave(id);
    } catch {
      // ignore
    }
    navigate('/meetings');
  };

  const handleEndMeeting = async () => {
    if (!window.confirm('Are you sure you want to end this meeting for everyone?')) return;
    try {
      endMeetingForAll();
      await meetingApi.end(id);
      success('Meeting ended for all participants.');
      navigate(`/attendance?meetingId=${id}`);
    } catch (err) {
      error('Failed to end meeting.');
    }
  };

  if (loading || !meeting) return <PageLoader />;

  // Calculate dynamic grid columns
  const remoteEntries = Object.entries(remoteStreams);
  const totalTiles = 1 + remoteEntries.length;

  const gridClass =
    totalTiles === 1
      ? 'grid-cols-1'
      : totalTiles === 2
      ? 'grid-cols-1 md:grid-cols-2'
      : totalTiles <= 4
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-2 lg:grid-cols-3';

  return (
    <div className="flex flex-col h-screen bg-surface-50 dark:bg-surface-950 text-text-primary transition-colors overflow-hidden">
      {/* Top Header */}
      <header className="h-14 px-4 bg-surface-50/95 dark:bg-surface-900/95 border-b border-border-color flex items-center justify-between shrink-0 z-10 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {!isHost && (
            <button
              onClick={handleLeaveMeeting}
              className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
              title="Leave room and return to meetings"
            >
              <ArrowLeft size={14} />
              <span>← Leave</span>
            </button>
          )}
          <div>
            <h2 className="text-sm font-semibold truncate max-w-xs sm:max-w-md text-text-primary">
              {meeting.title}
            </h2>
            <div className="flex items-center gap-2 text-[11px] text-text-secondary">
              <span className="font-mono bg-surface-100 dark:bg-surface-800 px-1.5 py-0.2 rounded text-text-primary border border-border-color">
                {meeting.meetingCode}
              </span>
              <span>•</span>
              <span className="capitalize">{meeting.status}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Visible Light/Dark Mode toggle inside Meeting Room */}
          <button
            onClick={toggleTheme}
            className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
            aria-label="Toggle theme"
          >
            {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
            <span className="hidden sm:inline">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
          </button>

          <button
            onClick={handleCopyLink}
            className="btn btn-secondary btn-sm text-xs flex items-center gap-1.5"
          >
            {copiedLink ? <Check size={13} /> : <Copy size={13} />}
            <span className="hidden sm:inline">Copy Link</span>
          </button>
        </div>
      </header>

      {/* Main Call Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Video Grid */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex items-center justify-center">
          <div className={`grid ${gridClass} gap-3 sm:gap-4 w-full h-full max-h-[85vh]`}>
            {/* Local Video Tile */}
            <VideoTile
              stream={localStream}
              name={user?.name || 'You'}
              role={user?.role}
              isAudioEnabled={isAudioEnabled}
              isVideoEnabled={isVideoEnabled}
              isLocal={true}
              isHost={isHost}
            />

            {/* Remote Video Tiles */}
            {remoteEntries.map(([socketId, stream]) => {
              const participant = participants.find((p) => p.socketId === socketId);
              return (
                <VideoTile
                  key={socketId}
                  stream={stream}
                  name={participant?.name || 'Participant'}
                  role={participant?.role || 'participant'}
                  isAudioEnabled={participant?.audio || false}
                  isVideoEnabled={participant?.video || false}
                  isLocal={false}
                  isHost={participant?.role === 'host' || participant?.role === 'Teacher'}
                />
              );
            })}
          </div>
        </div>

        {/* Side Drawers */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          messages={messages}
          onSendMessage={sendMessage}
          currentUserId={user?._id}
        />

        <ParticipantsPanel
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          participants={[
            {
              socketId: 'local',
              userId: user?._id,
              name: user?.name,
              role: isHost ? 'host' : user?.role,
              audio: isAudioEnabled,
              video: isVideoEnabled,
            },
            ...participants.filter((p) => p.userId !== user?._id),
          ]}
          currentUserId={user?._id}
          isHost={isHost}
          onMuteParticipant={muteParticipant}
          onRemoveParticipant={removeParticipant}
        />

        <PollPanel
          isOpen={isPollOpen}
          onClose={() => setIsPollOpen(false)}
          isHost={isHost}
          activePoll={activePoll}
          onCreatePoll={createPoll}
          onVotePoll={votePoll}
          onEndPoll={endPoll}
          currentUserId={user?._id}
        />
      </div>

      {/* Bottom Meeting Controls */}
      <MeetingControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        isPollOpen={isPollOpen}
        hasActivePoll={Boolean(activePoll?.isActive)}
        participantCount={participants.length + 1}
        isHost={isHost}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={toggleScreenShare}
        onToggleChat={() => {
          setIsChatOpen(!isChatOpen);
          if (isParticipantsOpen) setIsParticipantsOpen(false);
          if (isPollOpen) setIsPollOpen(false);
        }}
        onToggleParticipants={() => {
          setIsParticipantsOpen(!isParticipantsOpen);
          if (isChatOpen) setIsChatOpen(false);
          if (isPollOpen) setIsPollOpen(false);
        }}
        onTogglePoll={() => {
          setIsPollOpen(!isPollOpen);
          if (isChatOpen) setIsChatOpen(false);
          if (isParticipantsOpen) setIsParticipantsOpen(false);
        }}
        onLeaveMeeting={handleLeaveMeeting}
        onEndMeeting={handleEndMeeting}
      />
    </div>
  );
};
