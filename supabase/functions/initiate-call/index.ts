import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CustomerServiceAgent } from '../customer-service-agent/index.ts'

// Type definitions for provider responses
interface ElevenLabsResponse {
  external_session_id: string
  session_url: string
  streaming_url?: string
  agent_id: string
  conversation_id: string
  status: string
  ai_agent_ready: boolean
  initial_audio?: string
  voice_settings: {
    model_id: string
    stability: number
    similarity_boost: number
    chunk_length_schedule?: number[]
  }
  ai_context?: {
    agent_initialized: boolean
    conversation_history: number
    business_context: any
  }
  streaming_config?: {
    enabled: boolean
    processor_url: string
    websocket_url: string
  }
}

interface TavusResponse {
  external_session_id: string
  session_url: string
  replica_id: string
  conversation_id: string
  status: string
  tavus_replica_id: string
  tavus_conversation_id: string
  streaming_config?: {
    enabled: boolean
    processor_url: string
    websocket_url: string
  }
}

interface ConfigOverride {
  voice_id?: string
  replica_id?: string
  persona_id?: string
  elevenlabs_agent_id?: string
  tavus_replica_id?: string
  persona_config_id?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to validate UUID format
function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Helper function to validate required UUID fields
function validateUUIDFields(fields: Record<string, string | undefined>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value && !isValidUUID(value)) {
      errors.push(`${fieldName} must be a valid UUID format`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
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

    const { chat_session_id, call_type, provider, config_override, enable_streaming = true, demo_mode } = await req.json()

    // Validate required fields
    if (!chat_session_id || !call_type || !provider) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: chat_session_id, call_type, provider' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Demo mode - skip UUID validation and use mock data
    if (demo_mode) {
      const mockCallSession = {
        id: `demo-call-${Date.now()}`,
        chat_session_id,
        call_type,
        provider,
        status: 'initiated',
        is_active: true,
        streaming_enabled: enable_streaming,
        external_session_id: `demo-${provider}-session-${Date.now()}`,
        session_url: `https://demo.${provider}.com/session/${Date.now()}`,
        websocket_url: `wss://demo.websocket.com/session/${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Mock provider response
      const mockProviderResponse = provider === 'elevenlabs' ? {
        external_session_id: mockCallSession.external_session_id,
        session_url: mockCallSession.session_url,
        agent_id: 'demo-agent-123',
        conversation_id: `demo-conversation-${Date.now()}`,
        status: 'ready',
        ai_agent_ready: true,
        streaming_config: {
          enabled: enable_streaming,
          processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`,
          websocket_url: mockCallSession.websocket_url
        }
      } : {
        external_session_id: mockCallSession.external_session_id,
        session_url: mockCallSession.session_url,
        replica_id: 'demo-replica-123',
        conversation_id: `demo-conversation-${Date.now()}`,
        status: 'ready',
        tavus_replica_id: 'demo-replica-123',
        tavus_conversation_id: `demo-conversation-${Date.now()}`,
        streaming_config: {
          enabled: enable_streaming,
          processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/video-stream-processor`,
          websocket_url: mockCallSession.websocket_url
        }
      };

      return new Response(
        JSON.stringify({
          success: true,
          call_session_id: mockCallSession.id,
          status: 'initiated',
          streaming_enabled: enable_streaming,
          websocket_url: mockCallSession.websocket_url,
          stream_processor_urls: {
            audio: mockProviderResponse.streaming_config?.processor_url,
            video: mockProviderResponse.streaming_config?.processor_url
          },
          provider: mockProviderResponse,
          demo_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate UUID fields (only for non-demo mode)
    const uuidValidation = validateUUIDFields({
      chat_session_id,
      ...(config_override?.elevenlabs_agent_id && { elevenlabs_agent_id: config_override.elevenlabs_agent_id }),
      ...(config_override?.tavus_replica_id && { tavus_replica_id: config_override.tavus_replica_id }),
      ...(config_override?.persona_config_id && { persona_config_id: config_override.persona_config_id })
    })

    if (!uuidValidation.valid) {
      return new Response(
        JSON.stringify({ error: 'Invalid UUID format', details: uuidValidation.errors }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify chat session exists and get business context
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('*, profiles!business_id(*)')
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

    let providerResponse: ElevenLabsResponse | TavusResponse

    // Provider-specific integration with AI agent and streaming
    if (provider === 'elevenlabs') {
      providerResponse = await initializeElevenLabsCall(callSession.id, session, config_override, enable_streaming, supabaseClient)
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
      await initializeStreamingInfrastructure(callSession.id, call_type, provider, supabaseClient)
    }

    // Update call session with provider data
    await supabaseClient
      .from('call_sessions')
      .update({
        external_session_id: providerResponse.external_session_id,
        session_url: providerResponse.session_url,
        provider_data: providerResponse,
        status: 'connecting',
        elevenlabs_agent_id: 'agent_id' in providerResponse ? providerResponse.agent_id : undefined,
        elevenlabs_conversation_id: 'agent_id' in providerResponse ? providerResponse.conversation_id : undefined,
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
        streaming_url: 'streaming_url' in providerResponse ? providerResponse.streaming_url : undefined,
        ai_agent_ready: 'ai_agent_ready' in providerResponse ? providerResponse.ai_agent_ready : false,
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
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

// =================================================================
// STREAMING INFRASTRUCTURE INITIALIZATION
// =================================================================

async function initializeStreamingInfrastructure(callSessionId: string, callType: string, provider: string, supabaseClient: any): Promise<void> {
  try {
    // Initialize audio streaming if needed
    if (callType === 'voice' || callType === 'video') {
      await initializeAudioStreamProcessor(callSessionId, provider)
    }
    
    // Initialize video streaming if needed
    if (callType === 'video') {
      await initializeVideoStreamProcessor(callSessionId, provider)
    }

    // Log streaming session
    const { error: streamingError } = await supabaseClient
      .from('streaming_sessions')
      .insert([
        {
          session_id: callSessionId,
          stream_type: callType,
          provider,
          status: 'initialized',
          created_at: new Date().toISOString()
        }
      ])

    if (streamingError) {
      console.error('Error logging streaming session:', streamingError)
    }

    console.log(`Streaming infrastructure initialized for call session ${callSessionId}`)
  } catch (error) {
    console.error('Error initializing streaming infrastructure:', error)
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

async function initializeElevenLabsCall(callSessionId: string, session: any, configOverride?: ConfigOverride, enableStreaming?: boolean, supabaseClient: any): Promise<ElevenLabsResponse> {
  try {
    // Get ElevenLabs Conversational AI Agent ID from environment or config
    const agentId = configOverride?.elevenlabs_agent_id || Deno.env.get('ELEVENLABS_CONVERSATIONAL_AGENT_ID') || 'agent_01jyy0m7raf6p9gmw9cvhzvm2f'
    
    if (!agentId) {
      throw new Error('No ElevenLabs Conversational AI Agent ID configured')
    }

    // Initialize ElevenLabs Conversational AI session
    const response = await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}/conversations`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Call Session ${callSessionId}`,
        description: `Voice call session for customer service`,
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`,
        webhook_events: ['conversation_started', 'conversation_ended', 'message_received', 'message_sent'],
        metadata: {
          call_session_id: callSessionId,
          business_id: session.business_id,
          customer_email: session.customer_email,
          chat_session_id: session.id,
          context: {
            business_id: session.business_id,
            session_id: session.id,
            demo_mode: demo_mode || false,
            call_type: call_type,
            provider: provider,
            timestamp: new Date().toISOString()
          }
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`ElevenLabs Conversational AI error: ${errorData.detail || response.statusText}`)
    }

    const conversationData = await response.json()

    // Create conversation session ID
    const conversationId = conversationData.conversation_id

    return {
      external_session_id: conversationId,
      session_url: `${Deno.env.get('SITE_URL')}/call/${conversationId}`,
      streaming_url: enableStreaming ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/stream-voice-call?session_id=${conversationId}` : undefined,
      agent_id: agentId,
      conversation_id: conversationId,
      status: 'active',
      ai_agent_ready: true,
      initial_audio: undefined, // Will be generated by Conversational AI
      voice_settings: {
        model_id: 'eleven_flash_v2_5',
        stability: 0.5,
        similarity_boost: 0.5,
        chunk_length_schedule: [120, 500, 1000]
      },
      ai_context: {
        agent_initialized: true,
        conversation_history: 0,
        business_context: session.profiles
      },
      streaming_config: enableStreaming ? {
        enabled: true,
        processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`,
        websocket_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSessionId}&callType=voice`
      } : undefined
    }
  } catch (error) {
    console.error('ElevenLabs Conversational AI initialization error:', error)
    // Fallback to placeholder for demo
    return {
      external_session_id: `el_${callSessionId}`,
      session_url: `${Deno.env.get('SITE_URL')}/call/demo/${callSessionId}`,
      streaming_url: enableStreaming ? `${Deno.env.get('SUPABASE_URL')}/functions/v1/stream-voice-call?session_id=demo_${callSessionId}` : undefined,
      agent_id: 'demo_agent_id',
      conversation_id: `demo_${callSessionId}`,
      status: 'demo_mode',
      ai_agent_ready: true,
      initial_audio: undefined,
      voice_settings: {
        model_id: 'eleven_flash_v2_5',
        stability: 0.5,
        similarity_boost: 0.5
      },
      streaming_config: enableStreaming ? {
        enabled: true,
        processor_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`,
        websocket_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager?sessionId=${callSessionId}&callType=voice`
      } : undefined
    }
  }
}

async function initializeTavusCall(callSessionId: string, configOverride?: ConfigOverride, enableStreaming?: boolean): Promise<TavusResponse> {
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
      } : undefined
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
      } : undefined
    }
  }
}
