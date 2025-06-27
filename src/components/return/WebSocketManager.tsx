'use client';

import { useEffect, useRef, useState } from 'react';
import { ReturnRequest } from '@/types/return';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface WebSocketManagerProps {
  publicId: string;
  onUpdate: (updatedRequest: ReturnRequest) => void;
}

export function WebSocketManager({ publicId, onUpdate }: WebSocketManagerProps) {
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  useEffect(() => {
    // Set up real-time subscription
    const channel = supabase
      .channel(`return_${publicId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'return_requests',
          filter: `public_id=eq.${publicId}`
        },
        (payload) => {
          console.log('Return request updated:', payload);
          
          // Fetch the updated request
          fetchReturnRequest(publicId).then(updatedRequest => {
            if (updatedRequest) {
              // Check if status has changed
              if (previousStatus && previousStatus !== updatedRequest.status) {
                showStatusChangeNotification(updatedRequest.status);
              }
              
              // Update previous status
              setPreviousStatus(updatedRequest.status);
              
              // Update the request in the UI
              onUpdate(updatedRequest);
            }
          });
        }
      )
      .subscribe();
    
    channelRef.current = channel;
    
    // Fetch initial request to set previous status
    fetchReturnRequest(publicId).then(request => {
      if (request) {
        setPreviousStatus(request.status);
      }
    });
    
    return () => {
      // Clean up subscription
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [publicId, onUpdate]);

  const fetchReturnRequest = async (publicId: string): Promise<ReturnRequest | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.error('No active session');
        return null;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-return-request?public_id=${publicId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch return request');
      }
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error fetching return request:', error);
      return null;
    }
  };

  const showStatusChangeNotification = (newStatus: string) => {
    let title = 'Return Status Updated';
    let description = 'Your return request status has changed.';
    let icon = null;
    
    switch (newStatus) {
      case 'approved':
        title = 'Return Approved!';
        description = 'Your return request has been approved.';
        icon = <CheckCircle className="h-4 w-4 text-green-500" />;
        break;
      case 'denied':
        title = 'Return Denied';
        description = 'Your return request has been denied.';
        icon = <XCircle className="h-4 w-4 text-red-500" />;
        break;
      case 'pending_review':
        title = 'Under Review';
        description = 'Your return request is now under review.';
        icon = <Clock className="h-4 w-4 text-orange-500" />;
        break;
      case 'completed':
        title = 'Return Completed';
        description = 'Your return process has been completed.';
        icon = <CheckCircle className="h-4 w-4 text-purple-500" />;
        break;
    }
    
    toast({
      title,
      description,
      duration: 5000,
    });
    
    // Show browser notification if supported and permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: description,
        icon: '/favicon.ico'
      });
    }
  };

  return null; // This component doesn't render anything
}