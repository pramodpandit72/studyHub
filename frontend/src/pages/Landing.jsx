import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Video, ClipboardList, Users, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
      {/* Hero Section */}
      <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 border-b border-border-color bg-surface-50 dark:bg-surface-900">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-surface-100 dark:bg-surface-800 text-text-primary mb-6 border border-border-color">
            <ShieldCheck size={14} />
            Simple & Fast Meeting Platform
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-text-primary leading-tight">
            Meet, Teach and Learn — <br className="hidden sm:inline" />
            <span>Without Confusion.</span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            StudyHub delivers clear video meetings, simple scheduling, and automated attendance tracking designed for everyone.
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
                <span>Create Account</span>
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
                className="input-field text-center uppercase tracking-widest font-mono text-sm h-11 w-full sm:w-44"
              />
              <button type="submit" className="btn btn-secondary h-11 px-4 text-sm font-semibold">
                Join Meeting
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">
            Essential Tools for Every Session
          </h2>
          <p className="mt-3 text-sm text-text-secondary">
            Everything you need for productive meetings and classes with zero clutter.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <Video size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Instant & Scheduled Meetings</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Start a meeting right away or plan one for later with simple 6-letter meeting codes.
              </p>
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <ClipboardList size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Automatic Attendance</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Records join times, departure times, and duration automatically without manual roll calls.
              </p>
            </div>
          </div>

          <div className="card p-6 flex flex-col justify-between border border-border-color">
            <div>
              <div className="w-10 h-10 rounded-lg bg-surface-100 dark:bg-surface-800 text-text-primary flex items-center justify-center mb-4 border border-border-color">
                <Users size={20} />
              </div>
              <h3 className="text-base font-semibold text-text-primary">Host Controls</h3>
              <p className="mt-2 text-xs sm:text-sm text-text-secondary leading-relaxed">
                Easily manage participants, mute audio when needed, and end meetings when finished.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 border-y border-border-color bg-surface-100/50 dark:bg-surface-800/40">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-xl sm:text-2xl font-bold text-text-primary">How StudyHub Works</h2>
            <p className="text-xs sm:text-sm text-text-secondary mt-1">Join or start a meeting in three simple steps</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm mb-4">
                1
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Create</h4>
              <p className="text-xs text-text-secondary mt-1 max-w-xs">
                Log in and create a meeting instantly or schedule for a specific time.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm mb-4">
                2
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Share</h4>
              <p className="text-xs text-text-secondary mt-1 max-w-xs">
                Send your unique 6-character meeting code or link to participants.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="w-10 h-10 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 font-bold flex items-center justify-center text-sm mb-4">
                3
              </div>
              <h4 className="text-sm font-semibold text-text-primary">Join & Connect</h4>
              <p className="text-xs text-text-secondary mt-1 max-w-xs">
                Enter the room with audio, video, and text messaging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 text-center max-w-3xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary">Ready to get started?</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Simple video meetings without unnecessary complications.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn btn-primary btn-md flex items-center gap-2">
              <span>Go to Dashboard</span>
              <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/signup" className="btn btn-primary btn-md">
                Create Account
              </Link>
              <Link to="/login" className="btn btn-secondary btn-md">
                Log In
              </Link>
            </>
          )}
        </div>
      </section>
    </div>
  );
};
