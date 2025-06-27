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

    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')
    const action = url.searchParams.get('action') || 'stream'

    if (!sessionId) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: session_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get call session details
    const { data: callSession, error: sessionError } = await supabaseClient
      .from('call_sessions')
      .select('*, chat_sessions(*)')
      .eq('external_session_id', sessionId)
      .single()

    if (sessionError || !callSession) {
      return new Response(
        JSON.stringify({ error: 'Call session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (action === 'stream') {
      return handleStreamingRequest(req, callSession, supabaseClient)
    } else if (action === 'process_input') {
      return handleVoiceInput(req, callSession, supabaseClient)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

  } catch (error) {
    console.error('Error in stream-voice-call:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function handleStreamingRequest(req: Request, callSession: any, supabaseClient: any) {
  const { text, voice_id, flush } = await req.json()

  if (!text || !voice_id) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields: text, voice_id' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }

  try {
    // Generate streaming TTS using ElevenLabs
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voice_id}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2.5',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        },
        chunk_length_schedule: [120, 500, 1000],
        output_format: 'mp3_44100_128',
        flush: flush || false
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`ElevenLabs API error: ${errorData.detail || response.statusText}`)
    }

    // Get audio data
    const audioBuffer = await response.arrayBuffer()
    const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

    // Store transcript
    await supabaseClient
      .from('call_transcripts')
      .insert([
        {
          call_session_id: callSession.id,
          speaker: 'agent',
          message: text,
          timestamp_seconds: Date.now() / 1000,
          confidence_score: 1.0
        }
      ])

    return new Response(
      JSON.stringify({
        success: true,
        audio_data: `data:audio/mpeg;base64,${audioBase64}`,
        text: text,
        timestamp: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Streaming TTS error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}

async function handleVoiceInput(req: Request, callSession: any, supabaseClient: any) {
  const { audio_data, user_message } = await req.json()

  if (!audio_data) {
    return new Response(
      JSON.stringify({ error: 'Missing required field: audio_data' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }

  try {
    // Store user input transcript
    await supabaseClient
      .from('call_transcripts')
      .insert([
        {
          call_session_id: callSession.id,
          speaker: 'user',
          message: user_message || 'Voice input received',
          timestamp_seconds: Date.now() / 1000,
          confidence_score: 1.0
        }
      ])

    // Process with AI agent if message provided
    if (user_message) {
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
        timestamp: new Date().toISOString()
      }

      // Get AI response
      const aiResponse = await customerServiceAgent.processChatMessage(
        user_message,
        agentContext,
        conversationHistory
      )

      if (aiResponse.success) {
        // Generate TTS for AI response
        const voiceId = callSession.provider_data?.agent_id || Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID')
        
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: aiResponse.message,
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

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer()
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

          // Store agent response transcript
          await supabaseClient
            .from('call_transcripts')
            .insert([
              {
                call_session_id: callSession.id,
                speaker: 'agent',
                message: aiResponse.message,
                timestamp_seconds: Date.now() / 1000,
                confidence_score: 1.0
              }
            ])

          return new Response(
            JSON.stringify({
              success: true,
              ai_response: aiResponse.message,
              audio_data: `data:audio/mpeg;base64,${audioBase64}`,
              confidence: aiResponse.confidence,
              next_action: aiResponse.nextAction
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Voice input processed successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Voice input processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
} 
