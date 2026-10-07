import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Video,
  ClipboardList,
  Users,
  ArrowRight,
  ShieldCheck,
  MessageSquare,
  BarChart3,
  GraduationCap,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEO } from '../components/common/SEO';

export const Landing = () => {
  const [meetingCode, setMeetingCode] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const handleJoinByCode = (e) => {
    e.preventDefault();
    if (meetingCode.trim()) {
      navigate(`/join/${meetingCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <SEO
        title="StudyHub — Online Meetings, Classes & Study Sessions"
        description="StudyHub delivers clear video meetings, interactive online classes, simple scheduling, automated attendance, chat, and polling for students and educators."
        canonical="https://studyhub.online"
      />

      {/* Hero Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-border-color bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-100 dark:bg-surface-800 text-text-primary mb-6 border border-border-color">
            <ShieldCheck size={14} />
            <span>Modern Meeting &amp; Learning Platform</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary leading-tight">
            Meet, Teach and Learn — <br className="hidden sm:inline" />
            <span>Without Confusion.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            StudyHub provides clear video meetings, interactive virtual classes, automated attendance tracking,
            and collaborative tools built specifically for students, educators, and study groups.
          </p>

          {/* Quick Actions / Join Form */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <span>Go to Dashboard</span>
                <ArrowRight size={18} />
              </Link>
            ) : (
              <Link
                to="/signup"
                className="btn btn-primary btn-lg w-full sm:w-auto flex items-center justify-center gap-2"
              >
                <span>Create Free Account</span>
                <ArrowRight size={18} />
              </Link>
            )}

            <form onSubmit={handleJoinByCode} className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter Meeting Code"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value.toUpperCase())}
                maxLength={6}
                aria-label="6-character meeting code"
                className="input-field text-center uppercase tracking-widest font-mono text-sm h-11 w-full sm:w-44"
              />
              <button type="submit" className="btn btn-secondary h-11 px-4 text-sm font-semibold">
                Join Meeting
              </button>
            </form>
          </div>

          {/* Quick Anchor Navigation */}
          <div className="mt-8 flex items-center justify-center gap-6 text-xs text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors underline decoration-border-color underline-offset-4">
              Explore Features ↓
            </a>
            <span className="text-border-color">•</span>
            <a href="#how-it-works" className="hover:text-text-primary transition-colors underline decoration-border-color underline-offset-4">
              How It Works ↓
            </a>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Essential Tools for Online Learning &amp; Collaboration
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            Everything students, teachers, and study groups need for productive sessions with zero clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <Video size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Instant &amp; Scheduled Meetings</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Launch a live session instantly or schedule classes in advance with unique, easy-to-share 6-character room codes.
              </p>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <GraduationCap size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Virtual Classes &amp; Study Sessions</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Optimized peer media mesh with screen sharing and audio-video feeds ideal for mentorship, lectures, and study groups.
              </p>
            </div>
          </div>

          {/* Feature 3 */}
          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <ClipboardList size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Automated Attendance Tracking</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Automatically records join times, departures, and active durations without disrupting learning with manual roll calls.
              </p>
            </div>
          </div>

          {/* Feature 4 */}
          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <Users size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Host Moderation &amp; Control</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Manage participants cleanly: mute audio when needed, enforce waiting rooms, remove disruptive attendees, or end sessions for all.
              </p>
            </div>
          </div>

          {/* Feature 5 */}
          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">In-Meeting Real-Time Chat</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Exchange text messages, links, and questions seamlessly with timestamps during live sessions without interrupting the speaker.
              </p>
            </div>
          </div>

          {/* Feature 6 */}
          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <BarChart3 size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Live Host Polling</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Publish live multiple-choice questions during sessions and collect instantaneous feedback and votes from participants.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border-color bg-surface-100/50 dark:bg-surface-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">How StudyHub Works</h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">Host or join a study session in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Create or Schedule</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-xs">
                Log in and create a meeting instantly or schedule for a specific date and duration.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Share the Code</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-xs">
                Send your unique 6-character meeting code or direct link to participants or students.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h3 className="text-sm font-semibold text-text-primary">Connect &amp; Learn</h3>
              <p className="text-xs text-text-secondary mt-1 max-w-xs">
                Enter the room with video, audio, screen share, chat, polls, and automatic attendance.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Ready to get started?</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Experience clean, dependable video meetings designed specifically for education and mentoring.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-md flex items-center gap-2">
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-md flex items-center gap-2">
                <span>Create Account</span>
                <ArrowRight size={16} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-md">
                Log In
              </Link>
            </>
          )}
          <Link to="/feedback" className="btn btn-secondary btn-md">
            Give Feedback
          </Link>
        </div>
      </section>
    </div>
  );
};
