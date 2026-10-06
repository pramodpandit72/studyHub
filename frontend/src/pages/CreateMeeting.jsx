import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { meetingApi } from '../services/meeting.api';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { ButtonLoader } from '../components/common/Loader';
import {
  Video,
  Calendar,
  Clock,
  Users,
  ArrowRight,
  ArrowLeft,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';

export const CreateMeeting = () => {
  const [searchParams] = useSearchParams();
  const initialType = searchParams.get('type') === 'instant' ? 'instant' : 'scheduled';

  const navigate = useNavigate();
  const { success, error } = useToast();
  const { theme, toggleTheme } = useTheme();

  const [loading, setLoading] = useState(false);
  const [meetingType, setMeetingType] = useState(initialType);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: new Date().toISOString().split('T')[0],
    startTime: new Date(Date.now() + 15 * 60 * 1000).toTimeString().substring(0, 5),
    maxParticipants: 50,
    waitingRoom: false,
    canShareScreen: true,
    canChat: true,
    canUnmute: true,
    canEnableCamera: true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      return error('Please enter a meeting title.');
    }

    setLoading(true);
    try {
      const scheduledDateTime = meetingType === 'scheduled'
        ? new Date(`${formData.startDate}T${formData.startTime}:00`)
        : new Date();

      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        meetingType,
        startTime: scheduledDateTime.toISOString(),
        maxParticipants: parseInt(formData.maxParticipants, 10) || 50,
        waitingRoom: formData.waitingRoom,
        participantPermissions: {
          canShareScreen: formData.canShareScreen,
          canChat: formData.canChat,
          canUnmute: formData.canUnmute,
          canEnableCamera: formData.canEnableCamera,
        },
      };

      const { data } = await meetingApi.create(payload);
      const meeting = data.data.meeting;

      success(`Meeting created successfully! Code: ${meeting.meetingCode}`);

      if (meetingType === 'instant') {
        navigate(`/join/${meeting.meetingCode}`);
      } else {
        navigate('/meetings?tab=upcoming');
      }
    } catch (err) {
      error(err.response?.data?.message || 'Failed to create meeting.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
      {/* Top Bar: Back Button & Theme Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          aria-label="Back"
        >
          <ArrowLeft size={15} />
          <span>← Back</span>
        </button>

        <button
          onClick={toggleTheme}
          className="btn btn-secondary btn-sm flex items-center gap-1.5"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
          <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>
        </button>
      </div>

      <div className="card p-6 sm:p-8 bg-surface-50 dark:bg-surface-800 border border-border-color shadow-sm">
        <div className="border-b border-border-color pb-5 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary">
            {meetingType === 'instant' ? 'Start Instant Meeting' : 'Schedule a Meeting'}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Choose meeting timing, participant capacity, and basic permissions.
          </p>

          {/* Type Toggle Tabs */}
          <div className="flex items-center gap-2 mt-5 p-1 bg-surface-100 dark:bg-surface-700/60 rounded-lg max-w-xs border border-border-color">
            <button
              type="button"
              onClick={() => setMeetingType('instant')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
                meetingType === 'instant'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Instant Meeting
            </button>
            <button
              type="button"
              onClick={() => setMeetingType('scheduled')}
              className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
                meetingType === 'scheduled'
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-xs'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Schedule for Later
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="label" htmlFor="title">
                Meeting Title <span className="font-bold">*</span>
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={200}
                placeholder="e.g. Science Class Discussion"
                value={formData.title}
                onChange={handleChange}
                className="input-field text-sm"
                autoFocus
              />
            </div>

            <div>
              <label className="label" htmlFor="description">
                Description / Notes <span className="text-text-tertiary font-normal">(Optional)</span>
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                maxLength={1000}
                placeholder="Write any agenda or notes for participants..."
                value={formData.description}
                onChange={handleChange}
                className="input-field text-sm resize-none"
              />
            </div>
          </div>

          {/* Timing (If Scheduled) */}
          {meetingType === 'scheduled' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-100/60 dark:bg-surface-700/40 border border-border-color">
              <div>
                <label className="label" htmlFor="startDate">
                  Date
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Calendar size={16} />
                  </div>
                  <input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="label" htmlFor="startTime">
                  Start Time
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                    <Clock size={16} />
                  </div>
                  <input
                    id="startTime"
                    name="startTime"
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={handleChange}
                    className="input-field pl-10 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Access & Capacity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label" htmlFor="maxParticipants">
                Maximum Participants
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-tertiary">
                  <Users size={16} />
                </div>
                <input
                  id="maxParticipants"
                  name="maxParticipants"
                  type="number"
                  min={2}
                  max={100}
                  value={formData.maxParticipants}
                  onChange={handleChange}
                  className="input-field pl-10 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-start gap-3 p-3 rounded-xl border border-border-color mt-auto">
              <div>
                <p className="text-xs font-semibold text-text-primary">Waiting Room</p>
                <p className="text-[11px] text-text-secondary">Host must admit each participant</p>
              </div>
              <input
                type="checkbox"
                name="waitingRoom"
                checked={formData.waitingRoom}
                onChange={handleChange}
                className="w-4 h-4 rounded border-border-color cursor-pointer ml-auto accent-black dark:accent-white"
              />
            </div>
          </div>

          {/* Participant Permissions */}
          <div>
            <label className="label mb-2 flex items-center gap-1.5">
              <Sliders size={14} className="text-text-secondary" />
              <span>Participant Permissions</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-xl bg-surface-100/50 dark:bg-surface-700/30 border border-border-color text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="canShareScreen"
                  checked={formData.canShareScreen}
                  onChange={handleChange}
                  className="rounded cursor-pointer accent-black dark:accent-white"
                />
                <span className="text-text-primary">Screen Share</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="canChat"
                  checked={formData.canChat}
                  onChange={handleChange}
                  className="rounded cursor-pointer accent-black dark:accent-white"
                />
                <span className="text-text-primary">Meeting Chat</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="canUnmute"
                  checked={formData.canUnmute}
                  onChange={handleChange}
                  className="rounded cursor-pointer accent-black dark:accent-white"
                />
                <span className="text-text-primary">Microphone</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="canEnableCamera"
                  checked={formData.canEnableCamera}
                  onChange={handleChange}
                  className="rounded cursor-pointer accent-black dark:accent-white"
                />
                <span className="text-text-primary">Video Camera</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-4 border-t border-border-color flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="btn btn-secondary btn-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md flex items-center gap-2"
            >
              {loading ? <ButtonLoader /> : (
                <>
                  <span>{meetingType === 'instant' ? 'Start Meeting Now' : 'Schedule Meeting'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
