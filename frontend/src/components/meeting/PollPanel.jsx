import { useState } from 'react';
import { BarChart2, X, Plus, Trash2, CheckCircle2, Vote } from 'lucide-react';

export const PollPanel = ({
  isOpen,
  onClose,
  isHost,
  activePoll,
  onCreatePoll,
  onVotePoll,
  onEndPoll,
  onPublishResult,
  currentUserId,
}) => {
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!isOpen) return null;

  const handleAddOption = () => {
    if (options.length < 6) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (indexToRemove) => {
    if (options.length > 2) {
      setOptions(options.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleOptionChange = (index, value) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handlePublishPoll = (e) => {
    e.preventDefault();
    if (!question.trim()) return;
    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) return;

    onCreatePoll({
      question: question.trim(),
      options: filledOptions,
    });

    setQuestion('');
    setOptions(['', '']);
    setShowCreateForm(false);
  };

  const handleVote = () => {
    if (selectedOptionId === null || !activePoll) return;
    setIsSubmitting(true);
    onVotePoll({
      pollId: activePoll.id,
      optionId: selectedOptionId,
    });
    setIsSubmitting(false);
  };

  // Check if current user has already voted
  const userVotedOptionId =
    activePoll && currentUserId && activePoll.voters
      ? activePoll.voters[currentUserId]
      : undefined;
  const hasVoted = userVotedOptionId !== undefined;

  const totalVotes = activePoll?.totalVotes || 0;

  return (
    <div className="w-80 md:w-96 h-full flex flex-col bg-surface-50 dark:bg-surface-900 border-l border-border-color z-20 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border-color bg-surface-50 dark:bg-surface-900">
        <div className="flex items-center gap-2">
          <BarChart2 size={18} className="text-text-primary" />
          <h3 className="text-sm font-semibold text-text-primary">Polls</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-surface-100 dark:hover:bg-surface-800 transition"
          aria-label="Close polls"
        >
          <X size={18} />
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-surface-100/30 dark:bg-surface-950/40">
        {/* If Host wants to create a poll or no active poll exists */}
        {isHost && (!activePoll || showCreateForm) ? (
          <form onSubmit={handlePublishPoll} className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-color">
              <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Create a Poll
              </span>
              {activePoll && (
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="text-xs text-text-secondary hover:text-text-primary"
                >
                  Cancel
                </button>
              )}
            </div>

            <div>
              <label className="label text-xs" htmlFor="poll-question">
                Question
              </label>
              <input
                id="poll-question"
                type="text"
                required
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="Ask a question..."
                className="input-field text-sm py-2"
              />
            </div>

            <div className="space-y-2">
              <label className="label text-xs">Options (Min 2)</label>
              {options.map((opt, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type="text"
                    required
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className="input-field text-sm py-1.5 flex-1"
                  />
                  {options.length > 2 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-1.5 text-text-tertiary hover:text-text-primary transition rounded"
                      title="Remove option"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              ))}

              {options.length < 6 && (
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="mt-1 flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition"
                >
                  <Plus size={14} />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={
                !question.trim() ||
                options.filter((o) => o.trim()).length < 2
              }
              className="btn btn-primary btn-sm w-full justify-center mt-2 disabled:opacity-50"
            >
              Publish Poll
            </button>
          </form>
        ) : activePoll ? (
          /* Active or Ended Poll View */
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border-color">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                  {activePoll.isActive ? 'Active Poll' : 'Closed Poll'}
                </span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    activePoll.isActive
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900'
                      : 'bg-surface-200 text-text-secondary dark:bg-surface-800'
                  }`}
                >
                  {activePoll.isActive ? 'Live' : 'Ended'}
                </span>
              </div>
              <span className="text-xs text-text-secondary">
                {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'}
              </span>
            </div>

            {/* Question */}
            <div className="p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-border-color">
              <p className="text-sm font-semibold text-text-primary">
                {activePoll.question}
              </p>
              <p className="text-[11px] text-text-secondary mt-1">
                Created by {activePoll.createdBy?.name || 'Host'}
              </p>
            </div>

            {/* If Participant hasn't voted yet and poll is active */}
            {!hasVoted && activePoll.isActive && !isHost ? (
              <div className="space-y-3">
                <p className="text-xs font-medium text-text-secondary">
                  Select an option to cast your vote:
                </p>
                <div className="space-y-2">
                  {activePoll.options.map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition text-sm ${
                        selectedOptionId === opt.id
                          ? 'border-neutral-900 bg-surface-100 dark:border-white dark:bg-surface-800 text-text-primary font-medium'
                          : 'border-border-color hover:bg-surface-100/50 dark:hover:bg-surface-800/50 text-text-primary'
                      }`}
                    >
                      <input
                        type="radio"
                        name="poll-option"
                        value={opt.id}
                        checked={selectedOptionId === opt.id}
                        onChange={() => setSelectedOptionId(opt.id)}
                        className="text-neutral-900 dark:text-white"
                      />
                      <span>{opt.text}</span>
                    </label>
                  ))}
                </div>

                <button
                  onClick={handleVote}
                  disabled={selectedOptionId === null || isSubmitting}
                  className="btn btn-primary btn-sm w-full justify-center disabled:opacity-50 mt-2"
                >
                  <Vote size={15} />
                  <span>Submit Vote</span>
                </button>
              </div>
            ) : (
              /* Results view: Shown for host, or participant after voting, or when poll is closed */
              <div className="space-y-3">
                <div className="space-y-2">
                  {activePoll.options.map((opt) => {
                    const percentage =
                      totalVotes > 0
                        ? Math.round((opt.votes / totalVotes) * 100)
                        : 0;
                    const isUserPick = userVotedOptionId === opt.id;

                    return (
                      <div
                        key={opt.id}
                        className={`p-3 rounded-lg border transition ${
                          isUserPick
                            ? 'border-neutral-900/60 dark:border-white/60 bg-surface-50 dark:bg-surface-900'
                            : 'border-border-color bg-surface-50 dark:bg-surface-900'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-medium text-text-primary mb-1.5">
                          <span className="flex items-center gap-1.5 truncate pr-2">
                            {opt.text}
                            {isUserPick && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-text-secondary bg-surface-200 dark:bg-surface-800 px-1.5 py-0.2 rounded">
                                <CheckCircle2 size={11} />
                                <span>You</span>
                              </span>
                            )}
                          </span>
                          <span className="shrink-0 font-mono text-[11px] text-text-secondary">
                            {opt.votes} ({percentage}%)
                          </span>
                        </div>

                        {/* Minimalist Progress Bar */}
                        <div className="w-full h-1.5 bg-surface-200 dark:bg-surface-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-900 dark:bg-white rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {hasVoted && (
                  <p className="text-[11px] text-center text-text-secondary">
                    Your response has been recorded. Results update in real-time.
                  </p>
                )}

                {/* Host Controls */}
                {isHost && (
                  <div className="pt-2 border-t border-border-color space-y-2">
                    {activePoll.isActive ? (
                      <button
                        onClick={() => onEndPoll(activePoll.id)}
                        className="btn btn-secondary btn-sm w-full justify-center"
                      >
                        End Poll
                      </button>
                    ) : (
                      <>
                        {!activePoll.isResultPublished ? (
                          <button
                            onClick={() => onPublishResult?.(activePoll.id)}
                            className="btn btn-primary btn-sm w-full justify-center flex items-center gap-1.5"
                          >
                            <BarChart2 size={14} />
                            <span>Publish Result to Everyone</span>
                          </button>
                        ) : (
                          <div className="p-2 rounded-md bg-surface-200 dark:bg-surface-800 text-[11px] font-medium text-center text-text-secondary border border-border-color">
                            ✓ Final Results Published to All Participants
                          </div>
                        )}
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="btn btn-secondary btn-sm w-full justify-center"
                        >
                          Create Another Poll
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          /* Empty state for non-host when no poll */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <BarChart2 size={32} className="text-text-tertiary" />
            <p className="text-xs font-semibold text-text-primary">
              No active polls
            </p>
            <p className="text-[11px] text-text-secondary max-w-[200px]">
              The meeting host has not published a poll yet. Live polls will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
