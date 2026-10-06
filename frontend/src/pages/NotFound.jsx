import { Link } from 'react-router-dom';
import { Video, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-14 h-14 rounded-2xl bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 flex items-center justify-center mb-6">
        <Video size={28} />
      </div>
      <h1 className="text-3xl font-bold text-text-primary">404 — Page Not Found</h1>
      <p className="text-sm text-text-secondary mt-2 max-w-sm">
        The meeting room or page you are looking for does not exist or has been moved.
      </p>
      <div className="mt-6">
        <Link to="/dashboard" className="btn btn-primary btn-sm flex items-center gap-2">
          <ArrowLeft size={16} />
          <span>← Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
};
