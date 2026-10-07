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
import {
  Copy,
  Check,
  Users,
  Shield,
  ArrowLeft,
  Sun,
  Moon,
  Mic,
  MonitorUp,
  MonitorOff,
  Radio,
} from 'lucide-react';

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
    screenStream,
    remoteStreams,
    participants,
    messages,

    activePoll,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    screenShareAllowed,
    activeScreenShare,
    unmuteRequest,
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
  } = useWebRTC(meetingCode, id, user, {
    onMeetingEnded: () => {
      error('The host has ended this meeting.');
      navigate('/dashboard');
    },
    onRemovedFromMeeting: () => {
      error('You have been removed from this meeting by the host.');
      navigate('/dashboard');
    },
    onMutedByHost: () => {
      error('You have been muted by the host.');
    },
    onScreenShareRevoked: () => {
      error('Screen sharing was disabled or stopped by the host.');
    },
  });

  // Handle participant requesting screen share toggle
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      stopScreenShare();
    } else {
      if (!isHost && !screenShareAllowed) {
        error('Screen sharing is not permitted by the host.');
        return;
      }
      await startScreenShare();
    }
  };

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

  // Filter remote streams to only active participants (no ghost/stale tiles)
  const activeRemoteEntries = Object.entries(remoteStreams).filter(([socketId]) =>
    participants.some((p) => p.socketId === socketId)
  );

  const isRemoteScreenSharing = Boolean(
    activeScreenShare && activeScreenShare.socketId && remoteStreams[activeScreenShare.socketId]
  );
  const isSomeoneScreenSharing = isScreenSharing || isRemoteScreenSharing;

  // Calculate dynamic grid columns for normal mode
  const totalTiles = 1 + activeRemoteEntries.length;
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
        {/* Unmute Request Modal */}
        {unmuteRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
            <div className="bg-surface-50 dark:bg-neutral-900 border border-border-color dark:border-neutral-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center mx-auto shadow-md">
                <Mic size={24} />
              </div>
              <div>
                <h3 className="text-base font-semibold text-text-primary dark:text-white">
                  Host Requested Unmute
                </h3>
                <p className="text-xs text-text-secondary dark:text-neutral-400 mt-1">
                  {unmuteRequest.hostName} wants you to unmute your microphone.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={declineUnmuteRequest}
                  className="btn btn-secondary flex-1 text-xs py-2"
                >
                  Stay Muted
                </button>
                <button
                  onClick={acceptUnmuteRequest}
                  className="btn btn-primary flex-1 text-xs py-2 bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                >
                  Unmute
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Video Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto flex flex-col items-center justify-center">
          {/* Active Screen Sharing Layout */}
          {isSomeoneScreenSharing ? (
            <div className="w-full h-full flex flex-col lg:flex-row gap-3">
              {/* Featured Screen Share Tile */}
              <div className="flex-1 relative bg-neutral-950 rounded-xl overflow-hidden border border-neutral-800 flex items-center justify-center min-h-[350px]">
                {isScreenSharing ? (
                  /* Local user presenting live screen */
                  <div className="relative w-full h-full flex items-center justify-center">
                    <VideoTile
                      stream={screenStream}
                      name="Your Screen (Presenting)"
                      role="presenter"
                      isAudioEnabled={false}
                      isVideoEnabled={true}
                      isLocal={true}
                      isHost={isHost}
                    />
                    {/* Top presentation label */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                      <span className="px-2.5 py-1 bg-neutral-900/90 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 backdrop-blur-xs">
                        <Radio size={12} className="animate-pulse" />
                        You are presenting
                      </span>
                    </div>

                    {/* Stop sharing button */}
                    <div className="absolute top-3 right-3 z-20">
                      <button
                        onClick={stopScreenShare}
                        className="px-3 py-1.5 bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs font-semibold rounded-md border border-neutral-700 flex items-center gap-1.5 shadow-md transition"
                        title="Stop sharing your screen"
                      >
                        <MonitorOff size={14} />
                        <span>Stop Sharing</span>
                      </button>
                    </div>
                  </div>
                ) : (

                  /* Remote user presenting */
                  <div className="relative w-full h-full flex items-center justify-center">
                    <VideoTile
                      stream={remoteStreams[activeScreenShare.socketId]}
                      name={`${activeScreenShare.user?.name || 'Participant'}'s Screen`}
                      role="presenter"
                      isAudioEnabled={
                        participants.find((p) => p.socketId === activeScreenShare.socketId)?.audio || false
                      }
                      isVideoEnabled={true}
                      isLocal={false}
                      isHost={
                        participants.find((p) => p.socketId === activeScreenShare.socketId)?.isHost || false
                      }
                    />
                    {/* Top presentation label */}
                    <div className="absolute top-3 left-3 flex items-center gap-2 z-20">
                      <span className="px-2.5 py-1 bg-neutral-900/90 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 border border-neutral-700 backdrop-blur-xs">
                        <Radio size={12} className="animate-pulse" />
                        {activeScreenShare.user?.name}'s Screen
                      </span>
                    </div>

                    {/* Host action to stop remote share */}
                    {isHost && (
                      <div className="absolute top-3 right-3 z-20">
                        <button
                          onClick={() => stopParticipantScreenShare(activeScreenShare.socketId)}
                          className="px-2.5 py-1 bg-neutral-900/90 hover:bg-neutral-800 text-white text-xs font-medium rounded-md border border-neutral-700 flex items-center gap-1.5"
                          title="Stop this participant's screen share"
                        >
                          <MonitorOff size={12} />
                          <span>Stop Share</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Side Filmstrip of Participant Cameras */}
              <div className="lg:w-64 flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto shrink-0 max-h-[220px] lg:max-h-full">
                {/* Local Camera Tile */}
                <div className="w-48 lg:w-full h-32 shrink-0">
                  <VideoTile
                    stream={localStream}
                    name={user?.name || 'You'}
                    role={user?.role}
                    isAudioEnabled={isAudioEnabled}
                    isVideoEnabled={isVideoEnabled}
                    isLocal={true}
                    isHost={isHost}
                  />
                </div>

                {/* Remote Participant Tiles (exclude active presenter to prevent duplicate tile and audio echo) */}
                {activeRemoteEntries
                  .filter(([socketId]) => !activeScreenShare || activeScreenShare.socketId !== socketId)
                  .map(([socketId, stream]) => {
                    const participant = participants.find((p) => p.socketId === socketId);
                    return (
                      <div key={socketId} className="w-48 lg:w-full h-32 shrink-0">
                        <VideoTile
                          stream={stream}
                          name={participant?.name || 'Participant'}
                          role={participant?.role || 'participant'}
                          isAudioEnabled={participant?.audio || false}
                          isVideoEnabled={participant?.video || false}
                          isLocal={false}
                          isHost={participant?.isHost || participant?.role === 'host' || participant?.role === 'Teacher'}
                        />
                      </div>
                    );
                  })}
              </div>
            </div>
          ) : (
            /* Standard Grid Layout */
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
              {activeRemoteEntries.map(([socketId, stream]) => {
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
                    isHost={participant?.isHost || participant?.role === 'host' || participant?.role === 'Teacher'}
                  />
                );
              })}
            </div>
          )}
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
              isHost,
              canShareScreen: isHost || screenShareAllowed,
            },
            ...participants.filter((p) => p.userId !== user?._id),
          ]}
          currentUserId={user?._id}
          isHost={isHost}
          activeScreenSharer={activeScreenShare}
          roomScreenShareAllowed={screenShareAllowed}
          onMuteParticipant={muteParticipant}
          onRequestUnmute={requestUnmute}
          onToggleScreenSharePermission={setScreenSharePermission}
          onStopParticipantScreenShare={stopParticipantScreenShare}
          onRemoveParticipant={removeParticipant}
        />

        <PollPanel
          isOpen={isPollOpen}
          onClose={() => setIsPollOpen(false)}
          isHost={isHost}
          activePoll={activePoll}
          onCreatePoll={createPoll}
          onVotePoll={votePoll}
          endPoll={endPoll}
          currentUserId={user?._id}
        />
      </div>

      {/* Bottom Meeting Controls */}
      <MeetingControls
        isAudioEnabled={isAudioEnabled}
        isVideoEnabled={isVideoEnabled}
        isScreenSharing={isScreenSharing}
        screenShareAllowed={screenShareAllowed}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        isPollOpen={isPollOpen}
        hasActivePoll={Boolean(activePoll?.isActive)}
        participantCount={participants.length + 1}
        isHost={isHost}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleScreenShare={handleToggleScreenShare}
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

