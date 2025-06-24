Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { chat_session_id, call_type, provider, config_override } = await req.json()

    // Validate required fields
    if (!chat_session_id || !call_type || !provider) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: chat_session_id, call_type, provider' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify chat session exists
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('*')
      .eq('id', chat_session_id)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Chat session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Check if voice/video is enabled (dormant check)
    const voiceVideoEnabled = Deno.env.get('VOICE_VIDEO_ENABLED') === 'true'
    
    if (!voiceVideoEnabled) {
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Voice/video calling is not enabled yet',
          message: 'This feature will be available soon!',
          dormant: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create call session record
    const { data: callSession, error: callError } = await supabaseClient
      .from('call_sessions')
      .insert([
        {
          chat_session_id,
          call_type,
          provider,
          status: 'initiated'
        }
      ])
      .select()
      .single()

    if (callError) {
      throw callError
    }

    let providerResponse = {}

    // Provider-specific integration
    if (provider === 'elevenlabs') {
      providerResponse = await initializeElevenLabsCall(callSession.id, config_override)
    } else if (provider === 'tavus') {
      providerResponse = await initializeTavusCall(callSession.id, config_override)
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${provider}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Update call session with provider data
    await supabaseClient
      .from('call_sessions')
      .update({
        external_session_id: providerResponse.external_session_id,
        session_url: providerResponse.session_url,
        provider_data: providerResponse,
        status: 'connecting'
      })
      .eq('id', callSession.id)

    // Add system message to chat
    await supabaseClient
      .from('chat_messages')
      .insert([
        {
          session_id: chat_session_id,
          sender: 'system',
          message: `${call_type === 'voice' ? 'Voice' : 'Video'} call initiated via ${provider}. Connecting...`,
          message_type: 'system',
          metadata: { call_session_id: callSession.id }
        }
      ])

    return new Response(
      JSON.stringify({ 
        success: true,
        call_session_id: callSession.id,
        session_url: providerResponse.session_url,
        provider: provider,
        call_type: call_type,
        status: 'connecting',
        message: `${call_type === 'voice' ? 'Voice' : 'Video'} call initiated successfully`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in initiate-call:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// =================================================================
// PROVIDER INTEGRATION FUNCTIONS (DORMANT - TO BE IMPLEMENTED)
// =================================================================

async function initializeElevenLabsCall(callSessionId: string, configOverride?: any) {
  // TODO: Implement ElevenLabs Conversational AI integration
  // For now, return placeholder data
  return {
    external_session_id: `el_${callSessionId}`,
    session_url: `https://elevenlabs.placeholder.com/session/${callSessionId}`,
    agent_id: 'placeholder_agent_id',
    status: 'placeholder'
  }
}

async function initializeTavusCall(callSessionId: string, configOverride?: any) {
  // TODO: Implement Tavus CVI integration
  // For now, return placeholder data  
  return {
    external_session_id: `tv_${callSessionId}`,
    session_url: `https://tavus.placeholder.com/session/${callSessionId}`,
    replica_id: 'placeholder_replica_id',
    status: 'placeholder'
  }
}