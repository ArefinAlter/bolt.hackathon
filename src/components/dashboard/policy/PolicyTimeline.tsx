'use client';

import { useState } from 'react';
import { 
  FileText, 
  CheckCircle, 
  Clock, 
  ArrowRight, 
  Calendar,
  Edit,
  Copy,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Policy } from '@/types/policy';
import { format } from 'date-fns';

interface PolicyTimelineProps {
  policies: Policy[];
  onEdit: (policy: Policy) => void;
  onDuplicate: (policy: Policy) => void;
  onActivate: (policyId: number) => void;
  onRollback: (policy: Policy) => void;
}

export function PolicyTimeline({ 
  policies, 
  onEdit, 
  onDuplicate, 
  onActivate,
  onRollback
}: PolicyTimelineProps) {
  const [hoveredPolicy, setHoveredPolicy] = useState<number | null>(null);

  // Sort policies by created_at date
  const sortedPolicies = [...policies].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      
      {/* Timeline items */}
      <div className="space-y-8 relative">
        {sortedPolicies.map((policy, index) => (
          <div 
            key={policy.id} 
            className="relative pl-10"
            onMouseEnter={() => setHoveredPolicy(policy.id)}
            onMouseLeave={() => setHoveredPolicy(null)}
          >
            {/* Timeline dot */}
            <div className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center ${
              policy.is_active 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600'
            }`}>
              {policy.is_active ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <Clock className="h-5 w-5" />
              )}
            </div>
            
            {/* Timeline content */}
            <div className={`p-4 rounded-lg border ${
              policy.is_active 
                ? 'border-green-200 bg-green-50' 
                : 'border-gray-200 bg-white'
            }`}>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-2">
                <div className="flex items-center">
                  <FileText className="h-5 w-5 mr-2 text-gray-500" />
                  <h3 className="text-lg font-medium">{policy.version}</h3>
                  {policy.is_active && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Active
                    </span>
                  )}
                </div>
                <div className="flex items-center mt-2 md:mt-0 text-sm text-gray-500">
                  <Calendar className="h-4 w-4 mr-1" />
                  Created: {format(new Date(policy.created_at), 'MMM d, yyyy')}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-gray-500">Return Window</p>
                  <p className="font-medium">{policy.rules.return_window_days} days</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Auto-Approve Threshold</p>
                  <p className="font-medium">${policy.rules.auto_approve_threshold}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Effective Date</p>
                  <p className="font-medium">{format(new Date(policy.effective_date), 'MMM d, yyyy')}</p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className={`mt-4 flex space-x-2 transition-opacity duration-200 ${
                hoveredPolicy === policy.id ? 'opacity-100' : 'opacity-0'
              }`}>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => onEdit(policy)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs"
                  onClick={() => onDuplicate(policy)}
                >
                  <Copy className="h-3 w-3 mr-1" />
                  Duplicate
                </Button>
                
                {!policy.is_active && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                    onClick={() => onActivate(policy.id)}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Activate
                  </Button>
                )}
                
                {index > 0 && policy.is_active && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100"
                    onClick={() => onRollback(sortedPolicies[index - 1])}
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}