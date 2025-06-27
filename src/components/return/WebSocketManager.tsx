'use client';

import { useEffect, useRef } from 'react';
import { ReturnRequest } from '@/types/return';
import { supabase } from '@/lib/supabase';

interface WebSocketManagerProps {
  publicId: string;
  onUpdate: (updatedRequest: ReturnRequest) => void;
}

export function WebSocketManager({ publicId, onUpdate }: WebSocketManagerProps) {
  const channelRef = useRef<any>(null);

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
              onUpdate(updatedRequest);
            }
          });
        }
      )
      .subscribe();
    
    channelRef.current = channel;
    
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

  return null; // This component doesn't render anything
}