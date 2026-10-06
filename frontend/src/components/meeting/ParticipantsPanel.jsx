import { X, Mic, MicOff, Video, VideoOff, UserX, VolumeX, ShieldCheck } from 'lucide-react';

export const ParticipantsPanel = ({
  isOpen,
  onClose,
  participants = [],
  currentUserId,
  isHost = false,
  onMuteParticipant,
  onRemoveParticipant,
}) => {

  if (!isOpen) return null;

  return (
    <div className="w-80 md:w-96 h-full flex flex-col bg-surface-50 dark:bg-surface-900 border-l border-border-color z-20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-50 dark:bg-surface-900">
        <h3 className="text-sm font-semibold text-text-primary">
          Participants ({participants.length})
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition"
          aria-label="Close participants panel"
        >
          <X size={18} />
        </button>
      </div>

      {/* Participants List */}
      <div className="flex-1 p-3 overflow-y-auto space-y-2">
        {participants.map((p) => {
          const isMe = p.userId === currentUserId || (!p.userId && p.socketId === 'local');
          const isParticipantHost = p.role === 'host' || p.role === 'Teacher';

          return (
            <div
              key={p.socketId || p.userId}
              className="flex items-center justify-between p-2.5 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-700/60 transition"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 flex items-center justify-center font-medium text-xs text-text-primary shrink-0 border border-border-color">
                  {p.name ? p.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-text-primary truncate">
                      {p.name} {isMe && '(You)'}
                    </span>
                    {isParticipantHost && (
                      <span className="px-1.5 py-0.2 bg-surface-200 dark:bg-surface-700 text-text-primary text-[10px] font-semibold rounded border border-border-color flex items-center gap-0.5">
                        <ShieldCheck size={10} />
                        Host
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-text-secondary capitalize">
                    {p.role || 'Participant'}
                  </span>
                </div>
              </div>

              {/* Status & Host Actions */}
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {/* Audio Status */}
                <div
                  className={`p-1.5 rounded-md border ${
                    p.audio
                      ? 'text-text-secondary border-transparent'
                      : 'text-text-primary bg-surface-200 dark:bg-surface-700 border-border-color'
                  }`}
                  title={p.audio ? 'Microphone on' : 'Microphone muted'}
                >
                  {p.audio ? <Mic size={14} /> : <MicOff size={14} />}
                </div>

                {/* Video Status */}
                <div
                  className={`p-1.5 rounded-md border ${
                    p.video
                      ? 'text-text-secondary border-transparent'
                      : 'text-text-tertiary border-transparent'
                  }`}
                  title={p.video ? 'Camera on' : 'Camera off'}
                >
                  {p.video ? <Video size={14} /> : <VideoOff size={14} />}
                </div>

                {/* Host Control Buttons */}
                {isHost && !isMe && (
                  <div className="flex items-center gap-1 ml-1 border-l border-border-color pl-1.5">
                    <button
                      onClick={() => onMuteParticipant?.(p.socketId)}
                      className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-200 dark:hover:bg-surface-700 transition"
                      title="Mute participant"
                      aria-label="Mute participant"
                    >
                      <VolumeX size={14} />
                    </button>
                    <button
                      onClick={() => onRemoveParticipant?.(p.socketId)}
                      className="p-1 rounded text-text-secondary hover:text-text-primary hover:bg-surface-200 dark:hover:bg-surface-700 transition"
                      title="Remove participant"
                      aria-label="Remove participant"
                    >
                      <UserX size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
