import React from 'react';

interface CardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ title, children, className = '', interactive = false, onClick, style }) => {
  return (
    <div
      className={`card ${interactive ? 'card-interactive' : ''} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : undefined, ...style }}
    >
      {title && (
        <div className="card-header">
          <div className="card-title">{title}</div>
        </div>
      )}
      {children}
    </div>
  );
};
