import React from 'react';
import { PriorityLevel } from '../../types';

interface PriorityBadgeProps {
  priority: PriorityLevel;
  className?: string;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, className = '' }) => {
  const getStyle = () => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300 font-bold';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-200 font-medium';
      case 'MEDIUM':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200 font-medium';
      case 'LOW':
        return 'bg-slate-100 text-slate-700 border-slate-200 font-medium';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${getStyle()} ${className}`}>
      {priority}
    </span>
  );
};
