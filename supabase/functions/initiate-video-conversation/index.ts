import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CustomerServiceAgent } from '../customer-service-agent/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { call_session_id, replica_id, persona_id, conversation_settings } = await req.json()

    if (!call_session_id || !replica_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: call_session_id, replica_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get call session details
    const { data: callSession, error: sessionError } = await supabaseClient
      .from('call_sessions')
      .select('*, chat_sessions(*)')
      .eq('id', call_session_id)
      .single()

    if (sessionError || !callSession) {
      return new Response(
        JSON.stringify({ error: 'Call session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Initialize AI agent for conversation context
    const customerServiceAgent = new CustomerServiceAgent()
    
    // Get conversation history
    const { data: conversationHistory } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('session_id', callSession.chat_session_id)
      .order('created_at', { ascending: true })

    // Prepare agent context
    const agentContext = {
      businessId: callSession.chat_sessions?.business_id || '123e4567-e89b-12d3-a456-426614174000',
      customerEmail: callSession.chat_sessions?.customer_email,
      sessionId: callSession.chat_session_id,
      userRole: 'customer' as const,
      timestamp: new Date().toISOString()
    }

    // Create conversation using Tavus CVI API
    const response = await fetch('https://api.tavus.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-api-key': Deno.env.get('TAVUS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: replica_id,
        persona_id: persona_id || 'default_persona',
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`,
        settings: {
          background: conversation_settings?.background || 'transparent',
          quality: conversation_settings?.quality || 'standard',
          auto_respond: true,
          conversation_context: {
            business_id: callSession.chat_sessions?.business_id,
            customer_email: callSession.chat_sessions?.customer_email,
            conversation_history: conversationHistory?.slice(-10) || [], // Last 10 messages
            ai_agent_context: agentContext
          }
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Tavus CVI API error: ${errorData.message || response.statusText}`)
    }

    const conversationData = await response.json()

    // Update call session with conversation details
    await supabaseClient
      .from('call_sessions')
      .update({
        external_session_id: conversationData.conversation_id,
        session_url: conversationData.conversation_url,
        provider_data: {
          ...callSession.provider_data,
          conversation_id: conversationData.conversation_id,
          conversation_url: conversationData.conversation_url,
          replica_id: replica_id,
          persona_id: persona_id,
          ai_agent_ready: true,
          conversation_context: {
            business_id: callSession.chat_sessions?.business_id,
            customer_email: callSession.chat_sessions?.customer_email,
            conversation_history: conversationHistory?.length || 0
          }
        },
        status: 'active',
        tavus_replica_id: replica_id,
        tavus_conversation_id: conversationData.conversation_id
      })
      .eq('id', call_session_id)

    // Add system message to chat
    await supabaseClient
      .from('chat_messages')
      .insert([
        {
          session_id: callSession.chat_session_id,
          sender: 'system',
          message: `Video conversation initiated via Tavus CVI. Conversation ID: ${conversationData.conversation_id}`,
          message_type: 'system',
          metadata: { 
            call_session_id: callSession.id,
            conversation_id: conversationData.conversation_id,
            provider: 'tavus_cvi'
          }
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: conversationData.conversation_id,
        conversation_url: conversationData.conversation_url,
        replica_id: replica_id,
        persona_id: persona_id,
        status: 'active',
        ai_agent_ready: true,
        message: 'Video conversation initiated successfully',
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in initiate-video-conversation:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 
