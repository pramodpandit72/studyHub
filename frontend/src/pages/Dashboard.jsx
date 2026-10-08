import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { meetingApi } from '../services/meeting.api';
import { StatusBadge } from '../components/common/StatusBadge';
import { EmptyState } from '../components/common/EmptyState';
import { PageLoader } from '../components/common/Loader';
import {
  Video,
  PlusCircle,
  Calendar,
  Clock,
  Users,
  Copy,
  Check,
  ArrowRight,
  GraduationCap,
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentMeetings, setRecentMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState(null);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [upRes, histRes] = await Promise.all([
          meetingApi.upcoming(),
          meetingApi.history({ limit: 5 }),
        ]);
        setUpcomingMeetings(upRes.data.data.meetings || []);
        setRecentMeetings(histRes.data.data.meetings || []);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    success(`Copied meeting code: ${code}`);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (joinCodeInput.trim()) {
      navigate(`/join/${joinCodeInput.trim().toUpperCase()}`);
    }
  };

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString([], {
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
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  if (loading) return <PageLoader />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-8">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-6 border-b border-border-color">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Welcome back, {user?.name}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            {user?.role} • {user?.institution || 'StudyHub Classroom'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Join Input */}
          <form onSubmit={handleJoinByCode} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Meeting Code (e.g. 8F31KD)"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              maxLength={6}
              className="input-field text-xs sm:text-sm uppercase tracking-wider font-mono h-9 w-40 sm:w-48"
            />
            <button type="submit" className="btn btn-primary btn-sm h-9">
              Join Meeting
            </button>
          </form>
        </div>
      </div>

      {/* Main Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Instant Meeting */}
        <div className="card p-5 hover:border-neutral-500 transition group flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color group-hover:scale-105 transition-transform shrink-0">
              <Video size={22} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Start Instant Meeting
              </h2>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Start a live meeting right now and share the code with others.
              </p>
              <p className="text-xs text-text-secondary/80 mt-1 leading-relaxed">
                Instant one-click HD video rooms with live chat, audio, and screen sharing.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-color">
            <Link
              to="/meetings/create?type=instant"
              className="btn btn-primary btn-sm w-full justify-center"
            >
              Start Instant Meeting
            </Link>
          </div>
        </div>

        {/* Mock Test */}
        <div className="card p-5 hover:border-neutral-500 transition group flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color group-hover:scale-105 transition-transform shrink-0">
              <GraduationCap size={22} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Mock Test
              </h2>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Practice with mock tests designed for government exam preparation.
              </p>
              <p className="text-xs text-text-secondary/80 mt-1 leading-relaxed">
                Attempt timed tests, submit answers, and check your score and performance.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-color">
            <Link
              to="/mock-tests"
              className="btn btn-primary btn-sm w-full justify-center"
            >
              Take Mock Test
            </Link>
          </div>
        </div>

        {/* Schedule Meeting */}
        <div className="card p-5 hover:border-neutral-500 transition group flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color group-hover:scale-105 transition-transform shrink-0">
              <Calendar size={22} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Schedule Meeting
              </h2>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Plan upcoming classes, tutoring, or webinars in advance.
              </p>
              <p className="text-xs text-text-secondary/80 mt-1 leading-relaxed">
                Set custom dates, recurring lecture sessions, and automated reminder alerts.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-color">
            <Link
              to="/meetings/create?type=scheduled"
              className="btn btn-secondary btn-sm w-full justify-center"
            >
              Schedule Meeting
            </Link>
          </div>
        </div>

        {/* Attendance Records */}
        <div className="card p-5 hover:border-neutral-500 transition group flex flex-col justify-between">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary border border-border-color group-hover:scale-105 transition-transform shrink-0">
              <Users size={22} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-primary">
                Attendance Records
              </h2>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Check attendance, join times, and duration for your meetings.
              </p>
              <p className="text-xs text-text-secondary/80 mt-1 leading-relaxed">
                Export downloadable attendance reports and track student engagement stats.
              </p>
            </div>
          </div>
          <div className="mt-4 pt-3 border-t border-border-color">
            <Link
              to="/attendance"
              className="btn btn-secondary btn-sm w-full justify-center"
            >
              View Attendance
            </Link>
          </div>
        </div>
      </div>

      {/* Grid: Upcoming Meetings & Recent Sessions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upcoming / Live Meetings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Clock size={16} className="text-text-primary" />
              Upcoming & Live Meetings
            </h2>
            <Link
              to="/meetings"
              className="text-xs font-semibold text-text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {upcomingMeetings.length === 0 ? (
            <div className="card p-6">
              <EmptyState
                icon={Calendar}
                title="No meetings scheduled"
                description="You don't have any upcoming meetings right now."
                action={
                  <Link to="/meetings/create" className="btn btn-primary btn-sm">
                    Create Meeting
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingMeetings.map((mtg) => (
                <div
                  key={mtg._id}
                  className="card p-4 hover:border-border-focus transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">
                        {mtg.title}
                      </span>
                      <StatusBadge status={mtg.status} />
                    </div>
                    <p className="text-xs text-text-secondary">
                      {formatDate(mtg.startTime)} at {formatTime(mtg.startTime)} • Host: {mtg.host?.name || 'You'}
                    </p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-100 dark:bg-surface-700 text-text-primary font-bold border border-border-color">
                        {mtg.meetingCode}
                      </span>
                      <button
                        onClick={() => handleCopyCode(mtg.meetingCode)}
                        className="text-text-secondary hover:text-text-primary transition"
                        title="Copy code"
                        aria-label="Copy code"
                      >
                        {copiedCode === mtg.meetingCode ? (
                          <Check size={13} />
                        ) : (
                          <Copy size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:self-center">
                    <Link
                      to={`/join/${mtg.meetingCode}`}
                      className="btn btn-primary btn-sm w-full sm:w-auto justify-center"
                    >
                      {mtg.status === 'live' ? 'Join Now' : 'Start / Join'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Past Meetings */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Calendar size={16} className="text-text-secondary" />
              Completed Meetings
            </h2>
            <Link
              to="/meetings?tab=completed"
              className="text-xs font-semibold text-text-primary hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight size={12} />
            </Link>
          </div>

          {recentMeetings.length === 0 ? (
            <div className="card p-6">
              <EmptyState
                icon={Video}
                title="No completed meetings yet"
                description="When your meetings finish, they will show up here."
              />
            </div>
          ) : (
            <div className="space-y-3">
              {recentMeetings.map((mtg) => (
                <div
                  key={mtg._id}
                  className="card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-text-primary">
                        {mtg.title}
                      </span>
                      <StatusBadge status={mtg.status} />
                    </div>
                    <p className="text-xs text-text-secondary">
                      Held on {formatDate(mtg.startTime)} • Host: {mtg.host?.name || 'You'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/attendance?meetingId=${mtg._id}`}
                      className="btn btn-secondary btn-sm text-xs"
                    >
                      View Attendance
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
