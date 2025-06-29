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

    // Get Tavus API key
    const tavusApiKey = Deno.env.get('TAVUS_API_KEY')
    
    if (!tavusApiKey) {
      return new Response(
        JSON.stringify({ error: 'Tavus API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Use demo replica/persona if in demo mode or not provided
    const finalReplicaId = demo_mode ? (replica_id || 'demo-replica-123') : replica_id
    const finalPersonaId = demo_mode ? (persona_id || 'demo-persona-123') : persona_id

    if (!finalReplicaId) {
      return new Response(
        JSON.stringify({ error: 'replica_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create video conversation with Tavus
    const tavusResponse = await fetch('https://api.tavus.com/v1/conversations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tavusApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: finalReplicaId,
        persona_id: finalPersonaId,
        settings: {
          background: conversation_settings?.background || 'transparent',
          quality: conversation_settings?.quality || 'standard',
          ...conversation_settings
        },
        metadata: {
          call_session_id: call_session_id,
          demo_mode: demo_mode,
          business_id: demo_mode ? 'demo-business-123' : 'live-business-456'
        }
      })
    })

    if (!tavusResponse.ok) {
      const errorData = await tavusResponse.json()
      console.error('❌ Tavus API error:', errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create video conversation',
          details: errorData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const tavusData = await tavusResponse.json()
    
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
          websocket_url: tavusData.websocket_url,
          provider_data: {
            replica_id: finalReplicaId,
            persona_id: finalPersonaId,
            conversation_id: tavusData.conversation_id,
            conversation_url: tavusData.conversation_url,
            websocket_url: tavusData.websocket_url,
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
        websocket_url: tavusData.websocket_url,
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
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 
