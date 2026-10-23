import React from 'react';

interface BadgeProps {
  variant?: 'amber' | 'emerald' | 'rose' | 'slate' | 'blue';
  children: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'slate', children, className = '' }) => {
  const styles = {
    amber: 'bg-warm-accent-light text-warm-accent-hover border-warm-accent/30',
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    rose: 'bg-rose-50 text-rose-700 border-rose-200/80',
    slate: 'bg-warm-highlight text-warm-secondary border-warm-border',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/80',
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
