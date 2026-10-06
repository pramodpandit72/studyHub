export const StatusBadge = ({ status }) => {
  const classes = {
    live: 'badge-live',
    scheduled: 'badge-scheduled',
    completed: 'badge-completed',
    cancelled: 'badge-cancelled',
  };

  const labels = {
    live: 'Live',
    scheduled: 'Scheduled',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };

  return (
    <span className={`badge ${classes[status] || 'badge-scheduled'}`}>
      {status === 'live' && <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current animate-pulse" />}
      {labels[status] || status}
    </span>
  );
};
