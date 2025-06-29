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
    const { call_session_id, replica_id, persona_id, conversation_settings, demo_mode } = await req.json()

    if (!call_session_id) {
      return new Response(
        JSON.stringify({ error: 'call_session_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get Tavus API key and default replica_id
    const tavusApiKey = Deno.env.get('TAVUS_API_KEY')
    const tavusReplicaId = Deno.env.get('TAVUS_REPLICA_ID')
    
    if (!tavusApiKey) {
      console.error('❌ TAVUS_API_KEY not configured')
      return new Response(
        JSON.stringify({ error: 'Tavus API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Use provided replica_id or fall back to environment variable (no demo fallbacks)
    const finalReplicaId = replica_id || tavusReplicaId
    // persona_id is only for DB, not for Tavus API
    const finalPersonaId = persona_id // only from frontend, optional

    if (!finalReplicaId) {
      return new Response(
        JSON.stringify({ error: 'replica_id is required (either from request or TAVUS_REPLICA_ID env var)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('🎬 Creating Tavus video conversation with real API:', {
      replica_id: finalReplicaId,
      persona_id: finalPersonaId || 'not provided',
      demo_mode: demo_mode,
      source: {
        replica_from_request: !!replica_id,
        persona_from_request: !!persona_id,
        replica_from_env: !!tavusReplicaId
      }
    })

    // Create video conversation with Tavus using correct API
    const requestBody: any = {
      replica_id: finalReplicaId,
      conversation_name: `Customer Support Call - ${demo_mode ? 'Demo' : 'Live'}`,
      conversational_context: demo_mode 
        ? "You are a helpful customer service AI assistant for an e-commerce return management platform. Help customers with returns, refunds, and general inquiries. Be polite, professional, and empathetic."
        : "You are a professional customer service agent. Help the customer with their inquiry.",
      custom_greeting: demo_mode 
        ? "Hello! I'm here to help you with your return or refund request. How can I assist you today?"
        : "Hello! How can I help you today?",
      properties: {
        max_call_duration: 3600,
        participant_left_timeout: 60,
        participant_absent_timeout: 300,
        enable_recording: false,
        enable_closed_captions: true,
        apply_greenscreen: true,
        language: "english"
      }
    };
    // Do NOT include persona_id in Tavus API call

    console.log('🎬 Tavus API request body:', JSON.stringify(requestBody, null, 2));

    let tavusData: any;
    const tavusResponse = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    console.log('📡 Tavus API Response Status:', tavusResponse.status)

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      console.error('🎬 Tavus API error response:', {
        status: tavusResponse.status,
        statusText: tavusResponse.statusText,
        body: errorText,
        requestBody: requestBody
      });
      
      // Try with replica_uuid if replica_id fails
      if (tavusResponse.status === 400 && errorText.includes('replica_uuid')) {
        console.log('🔄 Retrying with replica_uuid instead of replica_id...');
        const retryBody = { ...requestBody, replica_uuid: finalReplicaId };
        delete retryBody.replica_id;
        
        const retryResponse = await fetch('https://tavusapi.com/v2/conversations', {
          method: 'POST',
          headers: {
            'x-api-key': tavusApiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(retryBody)
        });
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.error('🎬 Tavus API retry error:', {
            status: retryResponse.status,
            statusText: retryResponse.statusText,
            body: retryErrorText,
            requestBody: retryBody
          });
          throw new Error(`Tavus API error: ${retryResponse.status} - ${retryErrorText}`);
        }
        
        tavusData = await retryResponse.json();
      } else {
        throw new Error(`Tavus API error: ${tavusResponse.status} - ${errorText}`);
      }
    } else {
      tavusData = await tavusResponse.json();
    }

    console.log('✅ Tavus conversation created:', tavusData.conversation_id)
    
    // Update call session in database if not demo mode
    if (!demo_mode) {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_ANON_KEY') ?? ''
      )

      await supabaseClient
        .from('call_sessions')
        .update({
          status: 'active',
          external_session_id: tavusData.conversation_id,
          session_url: tavusData.conversation_url,
          websocket_url: tavusData.conversation_url, // Tavus uses conversation_url for WebSocket
          provider_data: {
            replica_id: finalReplicaId,
            persona_id: finalPersonaId,
            conversation_id: tavusData.conversation_id,
            conversation_url: tavusData.conversation_url,
            websocket_url: tavusData.conversation_url,
            ai_agent_ready: true
          }
        })
        .eq('id', call_session_id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: tavusData.conversation_id,
        conversation_url: tavusData.conversation_url,
        websocket_url: tavusData.conversation_url, // Tavus uses conversation_url for WebSocket
        ai_agent_ready: true,
        replica_id: finalReplicaId,
        persona_id: finalPersonaId,
        demo_mode: demo_mode
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in initiate-video-conversation:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create video conversation',
        details: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 
