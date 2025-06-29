'use client';

import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Package,
  FileText
} from 'lucide-react';
import { ReturnRequest } from '@/types/return';
import { format } from 'date-fns';

interface StatusTimelineProps {
  request: ReturnRequest;
}

export function StatusTimeline({ request }: StatusTimelineProps) {
  // Define timeline steps
  const steps = [
    {
      id: 'created',
      title: 'Return Requested',
      description: `Created on ${format(new Date(request.created_at), 'MMM d, yyyy')}`,
      icon: Package,
      status: 'completed',
      date: request.created_at
    },
    {
      id: 'triage',
      title: 'AI Triage',
      description: request.ai_recommendation 
        ? `AI recommended: ${request.ai_recommendation.replace('auto_', '').replace('_', ' ')}` 
        : 'Pending AI assessment',
      icon: FileText,
      status: request.ai_recommendation ? 'completed' : 'current',
      date: request.ai_recommendation ? request.created_at : null // We don't have a specific date for this step
    },
    {
      id: 'review',
      title: 'Human Review',
      description: request.status === 'pending_review' 
        ? 'Awaiting human review' 
        : request.status === 'approved' || request.status === 'denied' || request.status === 'completed'
          ? `Reviewed on ${request.admin_decision_at ? format(new Date(request.admin_decision_at), 'MMM d, yyyy') : 'Unknown date'}`
          : 'Not required',
      icon: Clock,
      status: request.status === 'pending_review' 
        ? 'current' 
        : request.status === 'approved' || request.status === 'denied' || request.status === 'completed'
          ? 'completed'
          : 'upcoming',
      date: request.admin_decision_at
    },
    {
      id: 'decision',
      title: 'Decision',
      description: request.status === 'approved' 
        ? `Approved on ${request.approved_at ? format(new Date(request.approved_at), 'MMM d, yyyy') : 'Unknown date'}` 
        : request.status === 'denied'
          ? `Denied on ${request.denied_at ? format(new Date(request.denied_at), 'MMM d, yyyy') : 'Unknown date'}`
          : 'Awaiting decision',
      icon: request.status === 'approved' ? CheckCircle : request.status === 'denied' ? XCircle : AlertTriangle,
      status: request.status === 'approved' || request.status === 'denied' || request.status === 'completed'
        ? 'completed'
        : 'upcoming',
      date: request.status === 'approved' ? request.approved_at : request.status === 'denied' ? request.denied_at : null
    },
    {
      id: 'completed',
      title: 'Return Completed',
      description: request.status === 'completed'
        ? 'Return process completed'
        : 'Awaiting completion',
      icon: CheckCircle,
      status: request.status === 'completed' ? 'completed' : 'upcoming',
      date: null // We don't have a specific date for this step
    }
  ];

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      {/* Timeline items */}
      <div className="space-y-6 relative">
        {steps.map((step, index) => {
          // Determine icon color based on status
          let iconColor = '';
          let bgColor = '';
          
          if (step.status === 'completed') {
            iconColor = 'text-green-600';
            bgColor = 'bg-green-100';
          } else if (step.status === 'current') {
            iconColor = 'text-blue-600';
            bgColor = 'bg-blue-100';
          } else {
            iconColor = 'text-gray-900 dark:text-gray-100';
            bgColor = 'bg-gray-100';
          }
          
          const Icon = step.icon;
          
          return (
            <div key={step.id} className="relative pl-10">
              {/* Timeline dot */}
              <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${bgColor}`}>
                <Icon className={`h-5 w-5 ${iconColor}`} />
              </div>
              
              {/* Timeline content */}
              <div>
                <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">{step.title}</h3>
                <p className="text-sm text-gray-900 dark:text-gray-100">{step.description}</p>
                {step.date && (
                  <p className="text-xs text-gray-900 dark:text-gray-100 mt-1">
                    {format(new Date(step.date), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}