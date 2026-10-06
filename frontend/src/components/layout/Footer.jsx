import { Video } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="border-t border-border-color bg-surface-50 dark:bg-surface-900 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center font-bold">
              <Video size={13} />
            </div>
            <span className="font-bold text-text-primary text-sm">viMeet</span>
            <span className="text-xs text-text-secondary ml-2">
              © {new Date().getFullYear()} viMeet. All rights reserved.
            </span>
          </div>

          <div className="flex items-center gap-5 text-xs text-text-secondary">
            <Link to="/meetings" className="hover:text-text-primary transition">Meetings</Link>
            <Link to="/dashboard" className="hover:text-text-primary transition">Dashboard</Link>
            <Link to="/feedback" className="hover:text-text-primary transition">Feedback</Link>
            <Link to="/profile" className="hover:text-text-primary transition">Profile</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
