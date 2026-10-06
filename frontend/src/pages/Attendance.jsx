import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { attendanceApi, meetingApi } from '../services/meeting.api';
import { EmptyState } from '../components/common/EmptyState';
import { PageLoader } from '../components/common/Loader';
import { useToast } from '../context/ToastContext';
import {
  ClipboardList,
  Search,
  ArrowLeft,
} from 'lucide-react';

export const Attendance = () => {
  const [searchParams] = useSearchParams();
  const meetingIdParam = searchParams.get('meetingId');
  const navigate = useNavigate();

  const { error } = useToast();

  const [meetings, setMeetings] = useState([]);
  const [selectedMeetingId, setSelectedMeetingId] = useState(meetingIdParam || '');
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [summary, setSummary] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [activeTab, setActiveTab] = useState(meetingIdParam ? 'host' : 'my');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch host meetings & user attendance records
  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const [mtgRes, myRes] = await Promise.all([
          meetingApi.getAll({ limit: 50 }),
          attendanceApi.getMyAttendance(),
        ]);

        const allMtgs = mtgRes.data.data.meetings || [];
        setMeetings(allMtgs);
        setMyAttendance(myRes.data.data.attendance || []);

        if (meetingIdParam) {
          setSelectedMeetingId(meetingIdParam);
        } else if (allMtgs.length > 0) {
          setSelectedMeetingId(allMtgs[0]._id);
        }
      } catch (err) {
        error('Failed to load attendance details.');
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [meetingIdParam, error]);

  // Fetch specific meeting attendance when selected
  useEffect(() => {
    if (!selectedMeetingId || activeTab !== 'host') return;

    const fetchMeetingAttendance = async () => {
      setLoading(true);
      try {
        const { data } = await attendanceApi.getMeetingAttendance(selectedMeetingId);
        setAttendanceRecords(data.data.attendance || []);
        setSummary(data.data.summary || null);
      } catch (err) {
        console.warn('Could not fetch host attendance:', err);
        setAttendanceRecords([]);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetingAttendance();
  }, [selectedMeetingId, activeTab]);

  const filteredRecords = attendanceRecords.filter((rec) =>
    rec.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.user?.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      return `${d.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch {
      return '—';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
      {/* Back Button */}
      <div>
        <button
          onClick={() => navigate('/meetings')}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          aria-label="Back to Meetings"
        >
          <ArrowLeft size={15} />
          <span>← Back to Meetings</span>
        </button>
      </div>

      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border-color">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">
            Attendance Records
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            See who joined your meetings, their join times, and duration.
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1 p-1 bg-surface-100 dark:bg-surface-800 rounded-lg border border-border-color">
            <button
              onClick={() => setActiveTab('host')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'host'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Host Session View
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                activeTab === 'my'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              My Attendance History
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <PageLoader />
      ) : activeTab === 'host' ? (
        /* Host Session View */
        <div className="space-y-6">
          {/* Meeting Selector & Search Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <label htmlFor="meetingSelect" className="text-xs font-semibold text-text-primary shrink-0">
                Select Meeting:
              </label>
              <select
                id="meetingSelect"
                value={selectedMeetingId}
                onChange={(e) => setSelectedMeetingId(e.target.value)}
                className="input-field text-xs sm:text-sm max-w-xs"
              >
                {meetings.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m.title} ({m.meetingCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-2.5 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search participant name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field pl-9 text-xs"
              />
            </div>
          </div>

          {/* Metric Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="card p-4 border border-border-color">
                <span className="text-xs text-text-secondary">Total Logged</span>
                <p className="text-xl font-bold text-text-primary mt-1">{summary.total}</p>
              </div>
              <div className="card p-4 border border-border-color">
                <span className="text-xs text-text-secondary">Present</span>
                <p className="text-xl font-bold text-text-primary mt-1">{summary.present}</p>
              </div>
              <div className="card p-4 border border-border-color">
                <span className="text-xs text-text-secondary">Late / Left Early</span>
                <p className="text-xl font-bold text-text-primary mt-1">{summary.late + summary.leftEarly}</p>
              </div>
              <div className="card p-4 border border-border-color">
                <span className="text-xs text-text-secondary">Avg Duration</span>
                <p className="text-xl font-bold text-text-primary mt-1">
                  {summary.averageDuration} mins
                </p>
              </div>
            </div>
          )}

          {/* Attendance Table */}
          {filteredRecords.length === 0 ? (
            <div className="card p-8 border border-border-color">
              <EmptyState
                icon={ClipboardList}
                title="No attendance records found"
                description="Participants who join this meeting will automatically be logged here."
              />
            </div>
          ) : (
            <div className="card overflow-hidden p-0 border border-border-color">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-100 dark:bg-surface-800 text-text-secondary border-b border-border-color font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Participant</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Joined At</th>
                      <th className="py-3 px-4">Left At</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {filteredRecords.map((rec) => (
                      <tr key={rec._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <td className="py-3 px-4">
                          <span className="font-semibold text-text-primary">{rec.user?.name || 'User'}</span>
                          <span className="block text-[11px] text-text-secondary">{rec.user?.email}</span>
                        </td>
                        <td className="py-3 px-4 text-text-secondary capitalize">{rec.user?.role || 'Student'}</td>
                        <td className="py-3 px-4 text-text-secondary">{formatDateTime(rec.joinedAt)}</td>
                        <td className="py-3 px-4 text-text-secondary">{formatDateTime(rec.leftAt)}</td>
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {rec.duration ? `${rec.duration} mins` : 'Active'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge badge-scheduled">
                            {rec.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* User's Personal Attendance History */
        <div className="space-y-4">
          {myAttendance.length === 0 ? (
            <div className="card p-8 border border-border-color">
              <EmptyState
                icon={ClipboardList}
                title="No personal attendance recorded"
                description="Meetings you attend will be recorded here automatically."
              />
            </div>
          ) : (
            <div className="card overflow-hidden p-0 border border-border-color">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-100 dark:bg-surface-800 text-text-secondary border-b border-border-color font-semibold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Meeting Title</th>
                      <th className="py-3 px-4">Code</th>
                      <th className="py-3 px-4">Joined At</th>
                      <th className="py-3 px-4">Duration</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-color">
                    {myAttendance.map((rec) => (
                      <tr key={rec._id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                        <td className="py-3 px-4 font-semibold text-text-primary">
                          {rec.meeting?.title || 'Meeting Session'}
                        </td>
                        <td className="py-3 px-4 font-mono text-text-primary font-bold">{rec.meeting?.meetingCode}</td>
                        <td className="py-3 px-4 text-text-secondary">{formatDateTime(rec.joinedAt)}</td>
                        <td className="py-3 px-4 font-medium text-text-primary">
                          {rec.duration ? `${rec.duration} mins` : 'In Progress'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="badge badge-scheduled">{rec.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
