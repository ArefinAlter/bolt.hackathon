'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Package,
  Eye,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnRequest } from '@/types/return';
import { fetchReturnRequests, subscribeToReturnRequests } from '@/lib/return';
import { format } from 'date-fns';

interface ReviewQueueProps {
  businessId: string;
  onViewRequest: (request: ReturnRequest) => void;
}

export function ReviewQueue({ businessId, onViewRequest }: ReviewQueueProps) {
  const [pendingRequests, setPendingRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPendingRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we're in demo mode by checking if businessId is the demo ID
      const isDemoMode = businessId === '550e8400-e29b-41d4-a716-446655440000';
      
      if (isDemoMode) {
        // Use the API endpoint for demo mode
        const response = await fetch(`/api/requests?demo_mode=true&business_id=${businessId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch return requests');
        }
        const data = await response.json();
        // Filter for pending requests only
        const pendingRequests = (data.data || []).filter((request: any) => 
          request.status === 'pending_review' || request.status === 'pending_triage'
        );
        setPendingRequests(pendingRequests);
      } else {
        // Use the existing function for live mode
      const data = await fetchReturnRequests(businessId, {
        status: 'pending_review',
        sortBy: 'created_at',
        sortDirection: 'asc'
      });
      setPendingRequests(data);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
      setError('Failed to load pending requests');
    } finally {
      setIsLoading(false);
    }
  }, [businessId]);

  useEffect(() => {
    // Only load data if businessId is available
    if (businessId) {
      loadPendingRequests();
    }
    
    // Only subscribe to real-time updates if not in demo mode
    const isDemoMode = businessId === '550e8400-e29b-41d4-a716-446655440000';
    
    if (!isDemoMode && businessId) {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToReturnRequests(businessId, (payload) => {
        // Reload data when changes occur
        loadPendingRequests();
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [businessId]);

  const handleRefresh = useCallback(() => {
    loadPendingRequests();
  }, [loadPendingRequests]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5 text-orange-500" />
              Review Queue
            </CardTitle>
            <CardDescription>
              Return requests requiring human review
            </CardDescription>
          </div>
          <div className="mt-4 md:mt-0">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{error}</p>
              </div>
            </div>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : pendingRequests.length > 0 ? (
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <div 
                key={request.id} 
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center flex-shrink-0">
                      <Clock className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <div className="flex items-center">
                        <h3 className="font-medium text-black">{request.order_id}</h3>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                          Pending Review
                        </span>
                      </div>
                      <p className="text-sm text-black mt-1">
                        {request.customer_email}
                      </p>
                      <p className="text-sm text-black mt-1">
                        <span className="font-medium">Reason:</span> {request.reason_for_return || 'Not specified'}
                      </p>
                      <p className="text-sm text-black">
                        <span className="font-medium">Date:</span> {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-4 md:mt-0 flex flex-col items-start md:items-end">
                    <div className="flex items-center mb-2">
                      <span className="text-sm font-medium mr-2">AI Recommendation:</span>
                      {request.ai_recommendation === 'auto_approve' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Approve
                        </span>
                      ) : request.ai_recommendation === 'auto_deny' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" />
                          Deny
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-black">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Review
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="text-xs"
                      onClick={() => onViewRequest(request)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Review Request
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-black mb-1">No pending reviews</h3>
            <p className="text-black">
              All return requests have been processed
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}