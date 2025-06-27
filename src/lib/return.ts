import { supabase } from './supabase';
import { 
  ReturnRequest, 
  ReturnRequestsResponse, 
  ReturnRequestResponse, 
  ReturnRequestUpdateData,
  ReturnRequestFilter
} from '@/types/return';

// Fetch all return requests for a business
export async function fetchReturnRequests(
  businessId: string,
  filter?: ReturnRequestFilter
): Promise<ReturnRequest[]> {
  try {
    // Build query
    let query = supabase
      .from('return_requests')
      .select(`
        *,
        mock_orders (
          order_id,
          purchase_date,
          customer_email,
          product_name,
          product_category,
          purchase_price
        )
      `)
      .eq('business_id', businessId);
    
    // Apply filters
    if (filter) {
      if (filter.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      
      if (filter.dateRange) {
        query = query
          .gte('created_at', filter.dateRange.start.toISOString())
          .lte('created_at', filter.dateRange.end.toISOString());
      }
      
      if (filter.search) {
        query = query.or(`order_id.ilike.%${filter.search}%,customer_email.ilike.%${filter.search}%,reason_for_return.ilike.%${filter.search}%`);
      }
      
      // Apply sorting
      if (filter.sortBy) {
        query = query.order(filter.sortBy, { 
          ascending: filter.sortDirection === 'asc' 
        });
      } else {
        query = query.order('created_at', { ascending: false });
      }
    } else {
      // Default sorting by created_at
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching return requests:', error);
    throw error;
  }
}

// Fetch a single return request by ID
export async function fetchReturnRequestById(id: string): Promise<ReturnRequest> {
  try {
    // Call the get-return-request function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-return-request?public_id=${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch return request');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching return request:', error);
    throw error;
  }
}

// Update a return request
export async function updateReturnRequest(
  publicId: string,
  updateData: ReturnRequestUpdateData
): Promise<ReturnRequest> {
  try {
    // Call the update-return-status function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/update-return-status`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public_id: publicId,
        status: updateData.status,
        admin_notes: updateData.admin_notes,
        decision_reason: updateData.decision_reason
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update return request');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating return request:', error);
    throw error;
  }
}

// Create a manual return request
export async function createReturnRequest(
  businessId: string,
  orderId: string,
  customerEmail: string,
  reason?: string
): Promise<ReturnRequest> {
  try {
    // Call the init-return function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/init-return`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        order_id: orderId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create return request');
    }
    
    const data = await response.json();
    
    // If reason is provided, update the return request with the reason
    if (reason && data.public_id) {
      await updateReturnRequest(data.public_id, {
        status: 'pending_triage',
        admin_notes: `Manually created return for order ${orderId}. Reason: ${reason}`
      });
    }
    
    // Fetch the created return request
    return await fetchReturnRequestById(data.public_id);
  } catch (error) {
    console.error('Error creating return request:', error);
    throw error;
  }
}

// Subscribe to real-time updates for return requests
export function subscribeToReturnRequests(
  businessId: string,
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel('return_requests_channel')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'return_requests',
        filter: `business_id=eq.${businessId}`
      },
      (payload) => {
        callback(payload);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to real-time updates for a specific return request
export function subscribeToReturnRequest(
  publicId: string,
  callback: (payload: any) => void
) {
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
        callback(payload);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Process a return request with AI triage
export async function processReturnRequest(
  publicId: string,
  reason: string,
  evidenceUrls: string[] = [],
  conversationLog: any[] = []
): Promise<any> {
  try {
    // Call the triage-return function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-return`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        public_id: publicId,
        reason_for_return: reason,
        evidence_urls: evidenceUrls,
        conversation_log: conversationLog
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process return request');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing return request:', error);
    throw error;
  }
}