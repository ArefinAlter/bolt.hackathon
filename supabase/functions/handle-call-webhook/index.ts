import { serve } from "https://deno.land/std@0.220.0/http/server.ts"

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

    const { provider, event_type, session_id, data } = await req.json()

    // Validate webhook data
    if (!provider || !event_type || !session_id) {
      return new Response(
        JSON.stringify({ error: 'Invalid webhook data' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Find call session by external session ID
    const { data: callSession, error: sessionError } = await supabaseClient
      .from('call_sessions')
      .select('*')
      .eq('external_session_id', session_id)
      .single()

    if (sessionError || !callSession) {
      console.log(`Call session not found for external ID: ${session_id}`)
      return new Response(
        JSON.stringify({ error: 'Call session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Process webhook based on event type
    await processCallWebhook(supabaseClient, callSession, provider, event_type, data)

    // Broadcast real-time event to WebSocket connections if streaming is enabled
    if (callSession.streaming_enabled) {
      await broadcastRealTimeEvent(callSession.id, provider, event_type, data)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in handle-call-webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processCallWebhook(supabase: any, callSession: any, provider: string, eventType: string, data: any) {
  console.log(`Processing ${provider} webhook: ${eventType}`, data)
  
  // Provider-specific status mapping
  const statusMap: Record<string, string> = {
    // ElevenLabs events
    'call_started': 'active',
    'call_ended': 'ended',
    'call_failed': 'failed',
    'transcript': 'active',
    'audio_chunk': 'active',
    'voice_detected': 'active',
    'silence_detected': 'active',
    
    // Tavus events
    'system.replica_joined': 'active',
    'system.shutdown': 'ended',
    'system.error': 'failed',
    'application.transcription.final': 'active',
    'application.conversation.started': 'active',
    'application.conversation.ended': 'ended',
    'video.frame': 'active',
    'video.chunk': 'active',
    'replica.speaking': 'active',
    'replica.listening': 'active',
    
    // Replica training events
    'replica.training.started': 'training',
    'replica.training.completed': 'ready',
    'replica.training.failed': 'failed',
    
    // Video generation events
    'video.generation.started': 'processing',
    'video.generation.completed': 'ready',
    'video.generation.failed': 'failed'
  }

  // Update call session status
  if (statusMap[eventType]) {
    await supabase
      .from('call_sessions')
      .update({ 
        status: statusMap[eventType],
        webhook_data: data,
        ended_at: eventType.includes('ended') || eventType.includes('shutdown') ? new Date().toISOString() : null
      })
      .eq('id', callSession.id)
  }

  // Handle transcript events
  if (eventType === 'transcript' || eventType === 'application.transcription.final') {
    if (data.text) {
      await supabase
        .from('call_transcripts')
        .insert([
          {
            call_session_id: callSession.id,
            speaker: data.speaker || 'user',
            message: data.text,
            timestamp_seconds: data.timestamp || Date.now() / 1000,
            confidence_score: data.confidence || 1.0
          }
        ])

      // Process transcript with AI if streaming is enabled
      if (callSession.streaming_enabled) {
        await processTranscriptWithAI(callSession.id, data.text, data.speaker || 'user')
      }
    }
  }

  // Handle real-time audio events
  if (eventType === 'audio_chunk' || eventType === 'voice_detected' || eventType === 'silence_detected') {
    if (callSession.streaming_enabled) {
      await processRealTimeAudioEvent(callSession.id, eventType, data)
    }
  }

  // Handle real-time video events
  if (eventType === 'video.frame' || eventType === 'video.chunk' || eventType === 'replica.speaking' || eventType === 'replica.listening') {
    if (callSession.streaming_enabled) {
      await processRealTimeVideoEvent(callSession.id, eventType, data)
    }
  }

  // Handle Tavus conversation events
  if (provider === 'tavus') {
    if (eventType === 'system.replica_joined') {
      // Replica has joined the conversation
      await supabase
        .from('call_sessions')
        .update({
          provider_data: {
            ...callSession.provider_data,
            replica_joined: true,
            conversation_started: new Date().toISOString()
          }
        })
        .eq('id', callSession.id)
    }

    if (eventType === 'application.conversation.started') {
      // Conversation has started
      await supabase
        .from('call_sessions')
        .update({
          provider_data: {
            ...callSession.provider_data,
            conversation_active: true,
            conversation_start_time: new Date().toISOString()
          }
        })
        .eq('id', callSession.id)
    }

    if (eventType === 'application.conversation.ended') {
      // Conversation has ended
      await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          provider_data: {
            ...callSession.provider_data,
            conversation_active: false,
            conversation_end_time: new Date().toISOString(),
            conversation_duration: data.duration || 0
          }
        })
        .eq('id', callSession.id)
    }
  }

  // Handle ElevenLabs events
  if (provider === 'elevenlabs') {
    if (eventType === 'call_started') {
      await supabase
        .from('call_sessions')
        .update({
          provider_data: {
            ...callSession.provider_data,
            voice_call_active: true,
            call_start_time: new Date().toISOString()
          }
        })
        .eq('id', callSession.id)
    }

    if (eventType === 'call_ended') {
      await supabase
        .from('call_sessions')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          provider_data: {
            ...callSession.provider_data,
            voice_call_active: false,
            call_end_time: new Date().toISOString()
          }
        })
        .eq('id', callSession.id)
    }
  }

  // Log analytics event
  await supabase
    .from('call_analytics')
    .insert([
      {
        call_session_id: callSession.id,
        provider: provider,
        event_type: eventType,
        event_data: data,
        timestamp: new Date().toISOString()
      }
    ])
}

// =================================================================
// REAL-TIME EVENT PROCESSING
// =================================================================

async function broadcastRealTimeEvent(callSessionId: string, provider: string, eventType: string, data: any): Promise<void> {
  try {
    // Broadcast event to WebSocket connections
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager/broadcast`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        message: {
          type: 'webhook_event',
          provider,
          eventType,
          data,
          timestamp: Date.now()
        }
      })
    })

    if (!response.ok) {
      console.warn('Failed to broadcast real-time event to WebSocket connections')
    }
  } catch (error) {
    console.error('Error broadcasting real-time event:', error)
  }
}

async function processTranscriptWithAI(callSessionId: string, transcript: string, speaker: string): Promise<void> {
  try {
    // Call the call-ai-processor function with transcript
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/call-ai-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        message: transcript,
        speaker,
        messageType: 'transcript',
        isRealTime: true
      })
    })

    if (response.ok) {
      const result = await response.json()
      
      // If AI generates a response, trigger TTS or video generation
      if (result.aiResponse) {
        await triggerAIResponse(callSessionId, result.aiResponse, result.responseType)
      }
    }
  } catch (error) {
    console.error('Error processing transcript with AI:', error)
  }
}

async function processRealTimeAudioEvent(callSessionId: string, eventType: string, data: any): Promise<void> {
  try {
    // Process audio event with audio stream processor
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/audio-stream-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        eventType,
        data,
        timestamp: Date.now()
      })
    })

    if (!response.ok) {
      console.warn('Failed to process real-time audio event')
    }
  } catch (error) {
    console.error('Error processing real-time audio event:', error)
  }
}

async function processRealTimeVideoEvent(callSessionId: string, eventType: string, data: any): Promise<void> {
  try {
    // Process video event with video stream processor
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/video-stream-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        eventType,
        data,
        timestamp: Date.now()
      })
    })

    if (!response.ok) {
      console.warn('Failed to process real-time video event')
    }
  } catch (error) {
    console.error('Error processing real-time video event:', error)
  }
}

async function triggerAIResponse(callSessionId: string, aiResponse: string, responseType: string): Promise<void> {
  try {
    // Get call session to determine call type
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { data: callSession } = await supabaseClient
      .from('call_sessions')
      .select('call_type, provider')
      .eq('id', callSessionId)
      .single()

    if (!callSession) return

    if (callSession.call_type === 'voice') {
      // Generate audio response using ElevenLabs
      await generateAudioResponse(callSessionId, aiResponse)
    } else if (callSession.call_type === 'video') {
      // Generate video response using Tavus
      await generateVideoResponse(callSessionId, aiResponse)
    }
  } catch (error) {
    console.error('Error triggering AI response:', error)
  }
}

async function generateAudioResponse(callSessionId: string, text: string): Promise<void> {
  try {
    // Call the stream-voice-call function
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/stream-voice-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        text,
        isResponse: true,
        isRealTime: true
      })
    })

    if (response.ok) {
      const result = await response.json()
      
      // Broadcast audio response to WebSocket connections
      await broadcastRealTimeEvent(callSessionId, 'elevenlabs', 'audio_response', {
        audioUrl: result.audioUrl,
        text: text
      })
    }
  } catch (error) {
    console.error('Error generating audio response:', error)
  }
}

async function generateVideoResponse(callSessionId: string, script: string): Promise<void> {
  try {
    // Call the test-persona function for video generation
    const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/test-persona`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        script,
        isResponse: true,
        isRealTime: true
      })
    })

    if (response.ok) {
      const result = await response.json()
      
      // Broadcast video response to WebSocket connections
      await broadcastRealTimeEvent(callSessionId, 'tavus', 'video_response', {
        videoUrl: result.videoUrl,
        script: script
      })
    }
  } catch (error) {
    console.error('Error generating video response:', error)
  }
}