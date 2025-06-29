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
    const { call_session_id, audio_data, user_message, demo_mode } = await req.json()

    // Demo mode - return mock processed data
    if (demo_mode) {
      const mockProcessedVoice = {
        success: true,
        user_input: user_message || 'Hello, I need help with a return request',
        ai_response: 'Hello! I\'m here to help you with your return request. Could you please provide your order number so I can assist you better?',
        audio_data: 'data:audio/mpeg;base64,demo_audio_data',
        next_action: 'request_order_number',
        return_detected: true,
        demo_mode: true
      }

      return new Response(
        JSON.stringify(mockProcessedVoice),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (!call_session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: call_session_id' }),
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

    // Process speech-to-text if audio provided
    let transcribedText = user_message
    if (audio_data && !user_message) {
      transcribedText = await processSpeechToText(audio_data)
    }

    if (!transcribedText) {
      return new Response(
        JSON.stringify({ error: 'No text to process' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Store user input transcript
    await supabaseClient
      .from('call_transcripts')
      .insert([
        {
          call_session_id: callSession.id,
          speaker: 'user',
          message: transcribedText,
          timestamp_seconds: Date.now() / 1000
        }
      ])

    // Process with AI agent
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
      transcribedText,
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
              timestamp_seconds: Date.now() / 1000
            }
          ])

        return new Response(
          JSON.stringify({
            success: true,
            user_input: transcribedText,
            ai_response: aiResponse.message,
            audio_data: `data:audio/mpeg;base64,${audioBase64}`,
            next_action: aiResponse.nextAction,
            return_detected: !!aiResponse.data?.returnRequest
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Failed to process voice input',
        user_input: transcribedText
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in process-voice-input:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function processSpeechToText(audioData: string): Promise<string> {
  try {
    // Use ElevenLabs Scribe API for speech-to-text
    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        audio: audioData, // Base64 encoded audio
        model_id: 'eleven_scribev2'
      })
    })

    if (!response.ok) {
      throw new Error(`Speech-to-text error: ${response.statusText}`)
    }

    const result = await response.json()
    return result.text || ''

  } catch (error) {
    console.error('Speech-to-text processing error:', error)
    // Fallback: return empty string, let user provide text manually
    return ''
  }
} 
