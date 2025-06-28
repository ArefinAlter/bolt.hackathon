'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { ReturnRequest } from '@/types/return';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

interface WebSocketManagerProps {
  publicId: string;
  onUpdate: (updatedRequest: ReturnRequest) => void;
  onReturnUpdate: (updatedRequest: ReturnRequest) => void;
  onMessageReceived: (message: any) => void;
  onEvidenceUpdate: (evidence: any) => void;
}

export function WebSocketManager({ publicId, onUpdate, onReturnUpdate, onMessageReceived, onEvidenceUpdate }: WebSocketManagerProps) {
  const channelRef = useRef<any>(null);
  const { toast } = useToast();
  const [previousStatus, setPreviousStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!publicId || !supabase) return;

    // Subscribe to return request updates for this specific return
    const returnSubscription = supabase
      .channel(`return-${publicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'return_requests',
          filter: `public_id=eq.${publicId}`
        },
        (payload) => {
          console.log('Return request update:', payload);
          if (payload.eventType === 'UPDATE') {
            onReturnUpdate(payload.new as ReturnRequest);
          }
        }
      )
      .subscribe();

    // Subscribe to conversation updates for this return
    const conversationSubscription = supabase
      .channel(`conversation-${publicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversation_logs',
          filter: `return_request_id=eq.${publicId}`
        },
        (payload) => {
          console.log('Conversation update:', payload);
          if (payload.eventType === 'INSERT') {
            onMessageReceived(payload.new);
          }
        }
      )
      .subscribe();

    // Subscribe to evidence updates for this return
    const evidenceSubscription = supabase
      .channel(`evidence-${publicId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'evidence_files',
          filter: `return_request_id=eq.${publicId}`
        },
        (payload) => {
          console.log('Evidence update:', payload);
          if (payload.eventType === 'INSERT') {
            onEvidenceUpdate(payload.new);
          }
        }
      )
      .subscribe();

    return () => {
      returnSubscription.unsubscribe();
      conversationSubscription.unsubscribe();
      evidenceSubscription.unsubscribe();
    };
  }, [publicId, supabase, onReturnUpdate, onMessageReceived, onEvidenceUpdate]);

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