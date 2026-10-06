export const EmptyState = ({ icon: Icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
    {Icon && <Icon size={40} className="mb-3" style={{ color: 'var(--text-tertiary)' }} />}
    <h3 className="text-base font-medium mb-1" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    {description && (
      <p className="text-sm mb-4 max-w-sm" style={{ color: 'var(--text-secondary)' }}>{description}</p>
    )}
    {action && action}
  </div>
);
