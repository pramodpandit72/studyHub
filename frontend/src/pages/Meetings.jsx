import { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { meetingApi } from '../services/meeting.api';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { PageLoader } from '../components/common/Loader';
import {
  Video,
  PlusCircle,
  Copy,
  Check,
  Calendar,
  Clock,
  Trash2,
  Share2,
  Play,
  ArrowLeft,
} from 'lucide-react';

export const Meetings = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'upcoming';

  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);

  const { user } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const { data } = await meetingApi.getAll({ limit: 50 });
      setMeetings(data.data.meetings || []);
    } catch (err) {
      error('Failed to load meetings.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const filteredMeetings = useMemo(() => {
    if (activeTab === 'upcoming') {
      return meetings.filter((m) => m.status === 'scheduled');
    }
    if (activeTab === 'live') {
      return meetings.filter((m) => m.status === 'live');
    }
    if (activeTab === 'completed') {
      return meetings.filter((m) => m.status === 'completed' || m.status === 'cancelled');
    }
    return meetings;
  }, [meetings, activeTab]);

  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/join/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    success('Join link copied to clipboard!');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting?')) return;
    try {
      await meetingApi.delete(id);
      success('Meeting deleted successfully.');
      setMeetings((prev) => prev.filter((m) => m._id !== id));
    } catch (err) {
      error(err.response?.data?.message || 'Failed to delete meeting.');
    }
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return '';
    }
  };

  const formatTime = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={15} />
          <span>← Back to Dashboard</span>
        </button>
      </div>

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-color">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            My Meetings
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            View scheduled meetings, live rooms, and completed attendance records.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link to="/meetings/create" className="btn btn-primary btn-sm flex items-center gap-1.5">
            <PlusCircle size={16} />
            <span>Create Meeting</span>
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-color gap-4">
        {[
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'live', label: 'Live Now' },
          { id: 'completed', label: 'Completed' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`pb-3 text-sm font-medium transition border-b-2 ${
              activeTab === tab.id
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <PageLoader />
      ) : filteredMeetings.length === 0 ? (
        <div className="card p-12">
          <EmptyState
            icon={Calendar}
            title={`No ${activeTab} meetings found`}
            description={
              activeTab === 'upcoming'
                ? 'You do not have any upcoming meetings scheduled.'
                : activeTab === 'live'
                ? 'There are no active meetings currently in progress.'
                : 'No finished meetings found in your history.'
            }
            action={
              activeTab === 'upcoming' ? (
                <Link to="/meetings/create" className="btn btn-primary btn-sm">
                  Create Meeting
                </Link>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredMeetings.map((mtg) => {
            const isHost = mtg.host?._id === user?._id || mtg.host === user?._id;

            return (
              <div
                key={mtg._id}
                className="card p-5 flex flex-col justify-between hover:border-neutral-500 transition"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h2 className="font-semibold text-sm text-text-primary line-clamp-1">
                      {mtg.title}
                    </h2>
                    <StatusBadge status={mtg.status} />
                  </div>

                  {mtg.description && (
                    <p className="text-xs text-text-secondary line-clamp-2 mb-3">
                      {mtg.description}
                    </p>
                  )}

                  <div className="space-y-1.5 text-xs text-text-secondary py-2 border-y border-border-color my-2">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-text-secondary" />
                      <span>{formatDate(mtg.startTime)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-text-secondary" />
                      <span>{formatTime(mtg.startTime)}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-700 text-text-primary font-bold border border-border-color">
                        {mtg.meetingCode}
                      </span>
                      <button
                        onClick={() => handleCopyLink(mtg.meetingCode)}
                        className="text-text-primary text-[11px] font-semibold flex items-center gap-1 hover:underline"
                      >
                        {copiedCode === mtg.meetingCode ? (
                          <>
                            <Check size={12} />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Share2 size={12} />
                            <span>Share Link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {mtg.status !== 'completed' && mtg.status !== 'cancelled' ? (
                      <Link
                        to={`/join/${mtg.meetingCode}`}
                        className="btn btn-primary btn-sm flex items-center gap-1.5"
                      >
                        <Play size={13} />
                        <span>{mtg.status === 'live' ? 'Join Now' : 'Join'}</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/attendance?meetingId=${mtg._id}`}
                        className="btn btn-secondary btn-sm text-xs"
                      >
                        View Attendance
                      </Link>
                    )}
                  </div>

                  {isHost && mtg.status !== 'live' && (
                    <button
                      onClick={() => handleDeleteMeeting(mtg._id)}
                      className="p-1.5 text-text-secondary hover:text-text-primary hover:bg-surface-200 dark:hover:bg-surface-700 rounded transition"
                      title="Delete meeting"
                      aria-label="Delete meeting"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
