import React from 'react';

interface BadgeProps {
  variant?: 'blue' | 'emerald' | 'amber' | 'rose' | 'slate' | 'purple';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'slate', children, className = '' }) => {
  const styles = {
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/60',
    slate: 'bg-slate-100 text-slate-700 border-slate-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/60',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
