'use client';

import { CheckCircle, XCircle, Clock, Package } from 'lucide-react';

interface ReturnStatusBadgeProps {
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed';
  className?: string;
}

export function ReturnStatusBadge({ status, className = '' }: ReturnStatusBadgeProps) {
  switch (status) {
    case 'approved':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 ${className}`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Approved
        </span>
      );
    case 'denied':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 ${className}`}>
          <XCircle className="w-3 h-3 mr-1" />
          Denied
        </span>
      );
    case 'completed':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 ${className}`}>
          <CheckCircle className="w-3 h-3 mr-1" />
          Completed
        </span>
      );
    case 'pending_review':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 ${className}`}>
          <Clock className="w-3 h-3 mr-1" />
          Pending Review
        </span>
      );
    case 'pending_triage':
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ${className}`}>
          <Package className="w-3 h-3 mr-1" />
          Processing
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-900 ${className}`}>
          {status}
        </span>
      );
  }
}