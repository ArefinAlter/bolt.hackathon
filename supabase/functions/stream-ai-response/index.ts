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

    const { call_session_id, user_message, stream_type } = await req.json()

    if (!call_session_id || !user_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: call_session_id, user_message' }),
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

    // Initialize AI agent
    const customerServiceAgent = new CustomerServiceAgent()
    
    // Get conversation history
    const { data: conversationHistory } = await supabaseClient
      .from('call_transcripts')
      .select('*')
      .eq('call_session_id', callSession.id)
      .order('timestamp_seconds', { ascending: true })

    // Prepare agent context
    const agentContext = {
      businessId: callSession.chat_sessions?.business_id || '123e4567-e89b-12d3-a456-426614174000',
      customerEmail: callSession.chat_sessions?.customer_email,
      sessionId: callSession.chat_session_id,
      userRole: 'customer' as const,
      timestamp: new Date().toISOString(),
      callSessionId: callSession.id,
      provider: callSession.provider,
      callType: callSession.call_type
    }

    // Get AI response
    const aiResponse = await customerServiceAgent.processChatMessage(
      user_message,
      agentContext,
      conversationHistory || []
    )

    if (!aiResponse.success) {
      return new Response(
        JSON.stringify({ error: 'Failed to generate AI response' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Store user input and AI response
    await Promise.all([
      supabaseClient
        .from('call_transcripts')
        .insert([
          {
            call_session_id: callSession.id,
            speaker: 'user',
            message: user_message,
            timestamp_seconds: Date.now() / 1000,
            confidence_score: 1.0
          }
        ]),
      supabaseClient
        .from('call_transcripts')
        .insert([
          {
            call_session_id: callSession.id,
            speaker: 'agent',
            message: aiResponse.message,
            timestamp_seconds: Date.now() / 1000,
            confidence_score: aiResponse.data?.confidence || 1.0,
            metadata: {
              ai_agent: 'customer_service_agent',
              next_action: aiResponse.data?.nextAction,
              return_detected: !!aiResponse.data?.returnRequest
            }
          }
        ])
    ])

    // Generate streaming response based on type
    if (stream_type === 'voice' && callSession.provider === 'elevenlabs') {
      return await streamVoiceResponse(aiResponse.message, callSession)
    } else if (stream_type === 'video' && callSession.provider === 'tavus') {
      return await streamVideoResponse(aiResponse.message, callSession)
    } else {
      // Return text response for immediate feedback
      return new Response(
        JSON.stringify({
          success: true,
          response_type: 'text',
          text_response: aiResponse.message,
          next_action: aiResponse.data?.nextAction,
          confidence: aiResponse.data?.confidence,
          return_detected: !!aiResponse.data?.returnRequest
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('Error in stream-ai-response:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function streamVoiceResponse(text: string, callSession: any): Promise<Response> {
  try {
    const voiceId = callSession.provider_data?.agent_id || Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID')
    
    // Split text into chunks for streaming
    const textChunks = splitTextIntoChunks(text, 200)
    
    const audioChunks = []
    
    for (const chunk of textChunks) {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: chunk,
          model_id: 'eleven_flash_v2.5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          },
          chunk_length_schedule: [120, 500, 1000],
          output_format: 'mp3_44100_128'
        })
      })

      if (response.ok) {
        const audioBuffer = await response.arrayBuffer()
        const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
        audioChunks.push(audioBase64)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        response_type: 'voice_stream',
        audio_chunks: audioChunks,
        text_response: text,
        voice_id: voiceId,
        model_used: 'eleven_flash_v2.5'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Voice streaming error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate voice response' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

async function streamVideoResponse(text: string, callSession: any): Promise<Response> {
  try {
    const replicaId = callSession.provider_data?.replica_id || callSession.tavus_replica_id
    
    if (!replicaId) {
      throw new Error('No replica ID configured for video response')
    }

    // For video, we generate a single response since Tavus CVI handles real-time
    const response = await fetch('https://api.tavus.com/v2/videos', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-api-key': Deno.env.get('TAVUS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        replica_id: replicaId,
        script: text,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`,
        settings: {
          background: 'transparent',
          quality: 'standard'
        }
      })
    })

    if (response.ok) {
      const videoData = await response.json()
      
      return new Response(
        JSON.stringify({
          success: true,
          response_type: 'video_generation',
          video_id: videoData.video_id,
          status: videoData.status,
          text_response: text,
          replica_id: replicaId,
          estimated_duration: 'Processing...'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      throw new Error('Failed to generate video response')
    }

  } catch (error) {
    console.error('Video streaming error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to generate video response' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
  const chunks = []
  let currentChunk = ''

  for (const sentence of sentences) {
    const trimmedSentence = sentence.trim()
    if (currentChunk.length + trimmedSentence.length <= maxChunkSize) {
      currentChunk += (currentChunk ? '. ' : '') + trimmedSentence
    } else {
      if (currentChunk) {
        chunks.push(currentChunk + '.')
        currentChunk = trimmedSentence
      } else {
        // If a single sentence is too long, split it
        const words = trimmedSentence.split(' ')
        let tempChunk = ''
        for (const word of words) {
          if (tempChunk.length + word.length + 1 <= maxChunkSize) {
            tempChunk += (tempChunk ? ' ' : '') + word
          } else {
            if (tempChunk) {
              chunks.push(tempChunk + '.')
              tempChunk = word
            } else {
              chunks.push(word + '.')
            }
          }
        }
        if (tempChunk) {
          currentChunk = tempChunk
        }
      }
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk + '.')
  }

  return chunks
} 
