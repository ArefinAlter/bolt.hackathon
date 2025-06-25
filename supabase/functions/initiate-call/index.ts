import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    const { chat_session_id, call_type, provider, config_override, enable_streaming = true } = await req.json()

    // Validate required fields
    if (!chat_session_id || !call_type || !provider) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: chat_session_id, call_type, provider' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify chat session exists and get business context
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('*, businesses(*)')
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
          status: 'initiated',
          is_active: true,
          streaming_enabled: enable_streaming
        }
      ])
      .select()
      .single()

    if (callError) {
      throw callError
    }

    let providerResponse = {}

    // Provider-specific integration with AI agent and streaming
    if (provider === 'elevenlabs') {
      providerResponse = await initializeElevenLabsCall(callSession.id, session, config_override, enable_streaming)
    } else if (provider === 'tavus') {
      providerResponse = await initializeTavusCall(callSession.id, config_override, enable_streaming)
    } else {
      return new Response(
        JSON.stringify({ error: `Unsupported provider: ${provider}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize streaming infrastructure if enabled
    if (enable_streaming) {
      await initializeStreamingInfrastructure(callSession.id, call_type, provider)
    }

    // Update call session with provider data
    await supabaseClient
      .from('call_sessions')
      .update({
        external_session_id: providerResponse.external_session_id,
        session_url: providerResponse.session_url,
        provider_data: providerResponse,
        status: 'connecting',
        elevenlabs_agent_id: providerResponse.agent_id,
        elevenlabs_conversation_id: providerResponse.conversation_id,
        streaming_enabled: enable_streaming,
        websocket_url: enable_streaming ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSession.id}&userId=${session.customer_email}&callType=${call_type}` : null
      })
      .eq('id', callSession.id)

    // Add system message to chat
    await supabaseClient
      .from('chat_messages')
      .insert([
        {
          session_id: chat_session_id,
          sender: 'system',
          message: `${call_type === 'voice' ? 'Voice' : 'Video'} call initiated via ${provider}${enable_streaming ? ' with real-time streaming' : ''}. Connecting...`,
          message_type: 'system',
          metadata: { 
            call_session_id: callSession.id,
            provider_data: providerResponse,
            streaming_enabled: enable_streaming
          }
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
        message: `${call_type === 'voice' ? 'Voice' : 'Video'} call initiated successfully`,
        streaming_url: providerResponse.streaming_url,
        ai_agent_ready: providerResponse.ai_agent_ready,
        streaming_enabled: enable_streaming,
        websocket_url: enable_streaming ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSession.id}&userId=${session.customer_email}&callType=${call_type}` : null,
        stream_processor_urls: enable_streaming ? {
          audio: `${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`,
          video: `${Deno.env.get('SUPABASE_URL')}/functions/v1/video-stream-processor`
        } : null
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
// STREAMING INFRASTRUCTURE INITIALIZATION
// =================================================================

async function initializeStreamingInfrastructure(callSessionId: string, callType: string, provider: string): Promise<void> {
  try {
    // Initialize stream processors based on call type
    if (callType === 'voice') {
      await initializeAudioStreamProcessor(callSessionId, provider)
    } else if (callType === 'video') {
      await initializeVideoStreamProcessor(callSessionId, provider)
    }

    // Set up WebSocket connection monitoring
    await setupWebSocketMonitoring(callSessionId, callType)

    console.log(`Streaming infrastructure initialized for call session ${callSessionId}`)
  } catch (error) {
    console.error('Error initializing streaming infrastructure:', error)
    // Don't fail the call initiation if streaming setup fails
  }
}

async function initializeAudioStreamProcessor(callSessionId: string, provider: string): Promise<void> {
  try {
    // Initialize audio stream processor
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'initialize',
        sessionId: callSessionId,
        provider: provider,
        callType: 'voice'
      })
    })

    if (!response.ok) {
      console.warn('Audio stream processor initialization failed, continuing without streaming')
    }
  } catch (error) {
    console.error('Error initializing audio stream processor:', error)
  }
}

async function initializeVideoStreamProcessor(callSessionId: string, provider: string): Promise<void> {
  try {
    // Initialize video stream processor
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/video-stream-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'initialize',
        sessionId: callSessionId,
        provider: provider,
        callType: 'video'
      })
    })

    if (!response.ok) {
      console.warn('Video stream processor initialization failed, continuing without streaming')
    }
  } catch (error) {
    console.error('Error initializing video stream processor:', error)
  }
}

async function setupWebSocketMonitoring(callSessionId: string, callType: string): Promise<void> {
  try {
    // Set up WebSocket connection monitoring
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager/session-info`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.warn('WebSocket monitoring setup failed, continuing without monitoring')
    }
  } catch (error) {
    console.error('Error setting up WebSocket monitoring:', error)
  }
}

// =================================================================
// PROVIDER INTEGRATION FUNCTIONS
// =================================================================

async function initializeElevenLabsCall(callSessionId: string, session: any, configOverride?: any, enableStreaming?: boolean) {
  try {
    // Get default voice configuration
    const voiceId = configOverride?.voice_id || Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID')
    
    if (!voiceId) {
      throw new Error('No voice ID configured for ElevenLabs')
    }

    // Initialize AI agent for conversation
    const customerServiceAgent = new CustomerServiceAgent()
    
    // Get conversation history for context
    const { data: conversationHistory } = await supabaseClient
      .from('chat_messages')
      .select('*')
      .eq('session_id', session.id)
      .order('created_at', { ascending: true })

    // Prepare agent context
    const agentContext = {
      businessId: session.business_id || '123e4567-e89b-12d3-a456-426614174000',
      customerEmail: session.customer_email,
      sessionId: session.id,
      userRole: 'customer' as const,
      timestamp: new Date().toISOString()
    }

    // Generate initial greeting using AI agent
    const aiResponse = await customerServiceAgent.processMessage(
      "Hello, I'm starting a voice call. Please greet the customer warmly and explain that you're here to help with their return or refund request.",
      agentContext,
      conversationHistory || []
    )

    let initialGreeting = "Hello! I'm here to help you with your return or refund request. How can I assist you today?"
    
    if (aiResponse.success) {
      initialGreeting = aiResponse.message
    }

    // Create streaming TTS session using correct ElevenLabs API
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: initialGreeting,
        model_id: 'eleven_flash_v2.5', // Use Flash model for low latency
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        },
        chunk_length_schedule: [120, 500, 1000], // Optimize for real-time conversation
        output_format: 'mp3_44100_128'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`)
    }

    // Store the initial audio for immediate playback
    const audioBuffer = await response.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    // Create conversation session ID
    const conversationId = `call_${callSessionId}_${Date.now()}`

    return {
      external_session_id: conversationId,
      session_url: `${Deno.env.get('SITE_URL')}/call/${conversationId}`,
      streaming_url: enableStreaming ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/stream-voice-call?session_id=${conversationId}` : null,
      agent_id: voiceId,
      conversation_id: conversationId,
      status: 'active',
      ai_agent_ready: true,
      initial_audio: `data:audio/mpeg;base64,${audioBase64}`,
      voice_settings: {
        model_id: 'eleven_flash_v2.5',
        stability: 0.5,
        similarity_boost: 0.5,
        chunk_length_schedule: [120, 500, 1000]
      },
      ai_context: {
        agent_initialized: true,
        conversation_history: conversationHistory?.length || 0,
        business_context: session.businesses
      },
      streaming_config: enableStreaming ? {
        enabled: true,
        processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`,
        websocket_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSessionId}&callType=voice`
      } : null
    }
  } catch (error) {
    console.error('ElevenLabs initialization error:', error)
    // Fallback to placeholder for demo
    return {
      external_session_id: `el_${callSessionId}`,
      session_url: `${Deno.env.get('SITE_URL')}/call/demo/${callSessionId}`,
      streaming_url: enableStreaming ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/stream-voice-call?session_id=demo_${callSessionId}` : null,
      agent_id: 'demo_voice_id',
      conversation_id: `demo_${callSessionId}`,
      status: 'demo_mode',
      ai_agent_ready: true,
      initial_audio: null,
      voice_settings: {
        model_id: 'eleven_flash_v2.5',
        stability: 0.5,
        similarity_boost: 0.5
      },
      streaming_config: enableStreaming ? {
        enabled: true,
        processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`,
        websocket_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSessionId}&callType=voice`
      } : null
    }
  }
}

async function initializeTavusCall(callSessionId: string, configOverride?: any, enableStreaming?: boolean) {
  try {
    // Get default replica configuration
    const replicaId = configOverride?.replica_id || Deno.env.get('TAVUS_DEFAULT_REPLICA_ID')
    
    if (!replicaId) {
      throw new Error('No replica ID configured for Tavus')
    }

    // Create video call session using correct Tavus CVI API
    const response = await fetch('https://api.tavus.com/v2/conversations', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-api-key': Deno.env.get('TAVUS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: replicaId,
        persona_id: configOverride?.persona_id || 'default_persona',
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`,
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
      external_session_id: callData.conversation_id,
      session_url: callData.conversation_url,
      replica_id: replicaId,
      conversation_id: callData.conversation_id,
      status: 'active',
      tavus_replica_id: replicaId,
      tavus_conversation_id: callData.conversation_id,
      streaming_config: enableStreaming ? {
        enabled: true,
        processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/video-stream-processor`,
        websocket_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSessionId}&callType=video`
      } : null
    }
  } catch (error) {
    console.error('Tavus initialization error:', error)
    // Fallback to placeholder for demo
    return {
      external_session_id: `tv_${callSessionId}`,
      session_url: `${Deno.env.get('SITE_URL')}/call/demo/${callSessionId}`,
      replica_id: 'demo_replica_id',
      conversation_id: `demo_${callSessionId}`,
      status: 'demo_mode',
      tavus_replica_id: 'demo_replica_id',
      tavus_conversation_id: `demo_${callSessionId}`,
      streaming_config: enableStreaming ? {
        enabled: true,
        processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/video-stream-processor`,
        websocket_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSessionId}&callType=video`
      } : null
    }
  }
}
