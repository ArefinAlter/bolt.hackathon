import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const type = searchParams.get('type');
  
  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }
  
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    let results = [];
    
    // Search return requests
    if (!type || type === 'return') {
      const { data: returnRequests, error: returnError } = await supabase
        .from('return_requests')
        .select('id, public_id, order_id, customer_email, reason_for_return, status, created_at')
        .or(`order_id.ilike.%${query}%,customer_email.ilike.%${query}%,reason_for_return.ilike.%${query}%`)
        .limit(10);
      
      if (returnError) {
        console.error('Error searching return requests:', returnError);
      } else if (returnRequests) {
        results.push(...returnRequests.map(request => ({
          id: request.id,
          type: 'return',
          title: request.order_id,
          description: `${request.reason_for_return || 'No reason'} - ${request.status}`,
          url: `/return/${request.public_id}`,
          created_at: request.created_at
        })));
      }
    }
    
    // Search policies
    if (!type || type === 'policy') {
      const { data: policies, error: policyError } = await supabase
        .from('policies')
        .select('id, version, is_active, created_at')
        .or(`version.ilike.%${query}%`)
        .limit(10);
      
      if (policyError) {
        console.error('Error searching policies:', policyError);
      } else if (policies) {
        results.push(...policies.map(policy => ({
          id: policy.id,
          type: 'policy',
          title: `Policy ${policy.version}`,
          description: policy.is_active ? 'Active policy' : 'Inactive policy',
          url: `/dashboard/policy`,
          created_at: policy.created_at
        })));
      }
    }
    
    // Search chat messages
    if (!type || type === 'message') {
      const { data: messages, error: messageError } = await supabase
        .from('chat_messages')
        .select('id, session_id, message, created_at')
        .ilike('message', `%${query}%`)
        .limit(10);
      
      if (messageError) {
        console.error('Error searching messages:', messageError);
      } else if (messages) {
        results.push(...messages.map(message => ({
          id: message.id,
          type: 'message',
          title: message.message.substring(0, 30) + (message.message.length > 30 ? '...' : ''),
          description: `Message from chat session ${message.session_id}`,
          url: `/customer/chat`,
          created_at: message.created_at
        })));
      }
    }
    
    // Sort results by recency
    results.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}