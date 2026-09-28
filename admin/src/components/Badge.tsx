import React from 'react';

interface BadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ status, size = 'sm' }) => {
  const norm = (status || '').toUpperCase();

  let colorClasses = 'bg-slate-100 text-slate-700 border-slate-200';

  if (['ACTIVE', 'OPEN', 'PUBLISHED', 'APPROVED', 'WINNER_CONFIRMED', 'QUALIFIED'].includes(norm)) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (['PAUSED', 'PENDING', 'PENDING_APPROVAL', 'DRAFT'].includes(norm)) {
    colorClasses = 'bg-amber-50 text-amber-700 border-amber-200';
  } else if (['CLOSED', 'FINALIZED'].includes(norm)) {
    colorClasses = 'bg-blue-50 text-blue-800 border-blue-200';
  } else if (['SUSPENDED', 'DEACTIVATED', 'DISQUALIFIED', 'CANCELLED', 'INACTIVE'].includes(norm)) {
    colorClasses = 'bg-rose-50 text-rose-700 border-rose-200';
  } else if (['NOT_CONFIGURED', 'NOT_STARTED'].includes(norm)) {
    colorClasses = 'bg-slate-100 text-slate-500 border-slate-300';
  }

  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs font-semibold' : 'px-2.5 py-1 text-sm font-semibold';

  return (
    <span className={`inline-flex items-center rounded-md border tracking-wide uppercase ${sizeClasses} ${colorClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status.replace(/_/g, ' ')}
    </span>
  );
};
