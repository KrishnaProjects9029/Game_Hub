import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'info', dot = false }) => {
  return (
    <span className={`badge badge-${variant}`}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />}
      {label}
    </span>
  );
};
