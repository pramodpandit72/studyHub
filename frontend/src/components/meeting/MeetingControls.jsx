import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Users,
  BarChart2,
  PhoneOff,
} from 'lucide-react';

export const MeetingControls = ({
  isAudioEnabled,
  isVideoEnabled,
  isScreenSharing,
  screenShareAllowed = true,
  isChatOpen,
  isParticipantsOpen,
  isPollOpen,
  hasActivePoll = false,
  unreadCount = 0,
  participantCount = 1,
  isHost = false,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onTogglePoll,
  onLeaveMeeting,
  onEndMeeting,
}) => {
  const canShareScreen = isHost || screenShareAllowed;

  return (
    <div className="flex items-center justify-between px-4 sm:px-6 py-3 bg-surface-50 dark:bg-neutral-900 border-t border-border-color dark:border-neutral-800 text-text-primary dark:text-white z-20">
      {/* Left: Meeting Status Indicator & Participant Screen Share Permission */}
      <div className="hidden sm:flex items-center gap-3 text-xs text-text-secondary dark:text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white animate-pulse" />
          <span>Connected</span>
        </div>

        {!isHost && (
          <div
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
              canShareScreen
                ? 'bg-surface-100 dark:bg-surface-800 text-text-primary border-border-color'
                : 'bg-surface-200 dark:bg-surface-800/80 text-text-tertiary border-border-color'
            }`}
          >
            Screen Sharing: {canShareScreen ? 'Allowed' : 'Not Allowed'}
          </div>
        )}
      </div>

      {/* Center: Audio / Video / Screen controls */}
      <div className="flex items-center gap-2 sm:gap-3 mx-auto sm:mx-0">
        {/* Microphone */}
        <button
          onClick={onToggleAudio}
          className={`p-3 rounded-full transition shadow-xs border ${
            isAudioEnabled
              ? 'bg-surface-200 hover:bg-surface-300 text-text-primary border-border-color dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white dark:border-neutral-700'
              : 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-950 dark:text-white dark:border-neutral-600 ring-1 ring-neutral-900/20 dark:ring-white/20'
          }`}
          title={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
          aria-label={isAudioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </button>

        {/* Camera */}
        <button
          onClick={onToggleVideo}
          className={`p-3 rounded-full transition shadow-xs border ${
            isVideoEnabled
              ? 'bg-surface-200 hover:bg-surface-300 text-text-primary border-border-color dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white dark:border-neutral-700'
              : 'bg-neutral-900 text-white border-neutral-900 dark:bg-neutral-950 dark:text-white dark:border-neutral-600 ring-1 ring-neutral-900/20 dark:ring-white/20'
          }`}
          title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
          aria-label={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </button>

        {/* Screen Share */}
        <button
          onClick={onToggleScreenShare}
          className={`p-3 rounded-full transition shadow-xs border ${
            isScreenSharing
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
              : !canShareScreen
              ? 'bg-surface-100 text-text-tertiary border-border-color opacity-60 cursor-not-allowed dark:bg-neutral-900 dark:text-neutral-500'
              : 'bg-surface-200 hover:bg-surface-300 text-text-primary border-border-color dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-white dark:border-neutral-700'
          }`}
          title={
            isScreenSharing
              ? 'Stop Screen Share'
              : canShareScreen
              ? 'Share Screen (Allowed)'
              : 'Screen Sharing: Not Allowed'
          }
          aria-label={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
        >
          <MonitorUp size={20} />
        </button>


        <div className="h-6 w-px bg-border-color dark:bg-neutral-800 mx-1 hidden sm:block" />

        {/* Participants toggle */}
        <button
          onClick={onToggleParticipants}
          className={`relative p-3 rounded-full transition border ${
            isParticipantsOpen
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
              : 'bg-surface-200 hover:bg-surface-300 text-text-primary border-border-color dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700'
          }`}
          title="Participants"
          aria-label="Participants"
        >
          <Users size={20} />
          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 text-[10px] font-bold bg-neutral-900 text-white dark:bg-neutral-700 dark:text-white rounded-full border border-border-color dark:border-neutral-900">
              {participantCount}
            </span>
          )}
        </button>

        {/* Chat toggle */}
        <button
          onClick={onToggleChat}
          className={`relative p-3 rounded-full transition border ${
            isChatOpen
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
              : 'bg-surface-200 hover:bg-surface-300 text-text-primary border-border-color dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700'
          }`}
          title="Meeting Chat"
          aria-label="Meeting Chat"
        >
          <MessageSquare size={20} />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neutral-900 dark:bg-white rounded-full ring-2 ring-surface-50 dark:ring-neutral-900" />
          )}
        </button>

        {/* Polls toggle */}
        <button
          onClick={onTogglePoll}
          className={`relative p-3 rounded-full transition border ${
            isPollOpen
              ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
              : 'bg-surface-200 hover:bg-surface-300 text-text-primary border-border-color dark:bg-neutral-800 dark:hover:bg-neutral-700 dark:text-neutral-200 dark:border-neutral-700'
          }`}
          title="Meeting Polls"
          aria-label="Meeting Polls"
        >
          <BarChart2 size={20} />
          {hasActivePoll && !isPollOpen && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-neutral-900 dark:bg-white rounded-full ring-2 ring-surface-50 dark:ring-neutral-900" />
          )}
        </button>

        {/* Exclusive: Host sees ONLY "End Meeting", Participants see "Leave Meeting" */}
        {isHost ? (
          <button
            onClick={onEndMeeting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:text-white dark:border-neutral-500 transition text-xs font-semibold shadow-xs ml-1"
            title="End Meeting for all participants"
            aria-label="End Meeting"
          >
            <PhoneOff size={16} />
            <span>End Meeting</span>
          </button>
        ) : (
          <button
            onClick={onLeaveMeeting}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-white border border-neutral-900 dark:bg-neutral-950 dark:hover:bg-neutral-800 dark:text-white dark:border-neutral-500 transition text-xs font-semibold shadow-xs ml-1"
            title="Leave Meeting"
            aria-label="Leave Meeting"
          >
            <PhoneOff size={16} />
            <span>Leave Meeting</span>
          </button>
        )}
      </div>

      {/* Right spacer */}
      <div className="hidden sm:block text-xs text-text-secondary dark:text-neutral-400">
        StudyHub Call
      </div>
    </div>
  );
};
