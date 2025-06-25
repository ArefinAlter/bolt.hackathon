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
// PROVIDER INTEGRATION FUNCTIONS
// =================================================================

async function initializeElevenLabsCall(callSessionId: string, configOverride?: any) {
  try {
    // Get default voice configuration
    const voiceId = configOverride?.voice_id || Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID')
    
    if (!voiceId) {
      throw new Error('No voice ID configured for ElevenLabs')
    }

    // Create conversation session
    const response = await fetch('https://api.elevenlabs.io/v1/conversation', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        voice_id: voiceId,
        conversation_id: `call_${callSessionId}`,
        settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`)
    }

    const conversationData = await response.json()

    return {
      external_session_id: conversationData.conversation_id,
      session_url: `https://elevenlabs.io/conversation/${conversationData.conversation_id}`,
      agent_id: voiceId,
      conversation_id: conversationData.conversation_id,
      status: 'active'
    }
  } catch (error) {
    console.error('ElevenLabs initialization error:', error)
    // Fallback to placeholder for demo
    return {
      external_session_id: `el_${callSessionId}`,
      session_url: `https://elevenlabs.placeholder.com/session/${callSessionId}`,
      agent_id: 'demo_voice_id',
      status: 'demo_mode'
    }
  }
}

async function initializeTavusCall(callSessionId: string, configOverride?: any) {
  try {
    // Get default replica configuration
    const replicaId = configOverride?.replica_id || Deno.env.get('TAVUS_DEFAULT_REPLICA_ID')
    
    if (!replicaId) {
      throw new Error('No replica ID configured for Tavus')
    }

    // Create video call session
    const response = await fetch('https://api.tavus.com/v1/calls', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('TAVUS_API_KEY') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: replicaId,
        call_id: `call_${callSessionId}`,
        settings: {
          background: 'transparent',
          quality: 'standard',
          auto_respond: true
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Tavus API error: ${errorData.message || response.statusText}`)
    }

    const callData = await response.json()

    return {
      external_session_id: callData.call_id,
      session_url: callData.call_url,
      replica_id: replicaId,
      call_id: callData.call_id,
      status: 'active'
    }
  } catch (error) {
    console.error('Tavus initialization error:', error)
    // Fallback to placeholder for demo
    return {
      external_session_id: `tv_${callSessionId}`,
      session_url: `https://tavus.placeholder.com/session/${callSessionId}`,
      replica_id: 'demo_replica_id',
      status: 'demo_mode'
    }
  }
}