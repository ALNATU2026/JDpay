import React from 'react';
import { CheckCircle2, Clock, XCircle, RotateCcw } from 'lucide-react';
import { TransactionStatus } from '../../types';

interface StatusBadgeProps {
  status: TransactionStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const isSmall = size === 'sm';
  const iconClass = isSmall ? 'w-3 h-3' : 'w-3.5 h-3.5';

  switch (status) {
    case 'SUCCESSFUL':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <CheckCircle2 className={iconClass} />
          <span>Successful</span>
        </span>
      );

    case 'PENDING':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-amber-50 text-amber-700 border border-amber-200/60 ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <Clock className={iconClass} />
          <span>Pending</span>
        </span>
      );

    case 'FAILED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-rose-50 text-rose-700 border border-rose-200/60 ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <XCircle className={iconClass} />
          <span>Failed</span>
        </span>
      );

    case 'REFUNDED':
      return (
        <span
          className={`inline-flex items-center gap-1.5 font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 ${
            isSmall ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs'
          }`}
        >
          <RotateCcw className={iconClass} />
          <span>Refunded</span>
        </span>
      );

    default:
      return <span className="text-xs text-slate-600">{status}</span>;
  }
};
