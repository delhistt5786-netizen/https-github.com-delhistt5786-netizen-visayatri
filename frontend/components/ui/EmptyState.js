import Link from 'next/link';

export default function EmptyState({ icon = '📋', title, subtitle, action, actionHref, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-5xl mb-4">{icon}</div>
      <h3 className="text-lg font-bold text-gray-800 mb-2">{title}</h3>
      {subtitle && <p className="text-gray-400 text-sm mb-6 max-w-xs">{subtitle}</p>}
      {actionHref && (
        <Link href={actionHref} className="btn-primary text-sm">{actionLabel || 'Get Started'}</Link>
      )}
      {action && (
        <button onClick={action} className="btn-primary text-sm">{actionLabel || 'Get Started'}</button>
      )}
    </div>
  );
}
