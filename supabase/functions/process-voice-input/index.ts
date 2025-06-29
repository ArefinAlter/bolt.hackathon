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

    // Demo mode - use APIs and CustomerServiceAgent but with demo context
    if (demo_mode) {
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

      // Use CustomerServiceAgent for demo mode
      const customerServiceAgent = new CustomerServiceAgent()
      
      // Create demo context
      const demoContext = {
        businessId: 'demo-business-123',
        customerEmail: 'demo@example.com',
        sessionId: call_session_id,
        userRole: 'customer' as const,
        timestamp: new Date().toISOString(),
        callSessionId: call_session_id,
        provider: 'elevenlabs',
        callType: 'voice'
      }

      // Get AI response using CustomerServiceAgent
      const aiResponse = await customerServiceAgent.processChatMessage(
        transcribedText,
        demoContext,
        [] // Empty conversation history for demo
      )

      if (aiResponse.success) {
        // Generate TTS for AI response using ElevenLabs
        const voiceId = Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM'
        const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
        
        console.log('🔑 ElevenLabs API Key present:', !!apiKey)
        console.log('🎤 Voice ID:', voiceId)
        console.log('📝 Text to synthesize:', aiResponse.message)
        
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': apiKey || '',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: aiResponse.message,
            model_id: 'eleven_flash_v2_5',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.5,
              style: 0.0,
              use_speaker_boost: true
            },
            output_format: 'mp3_44100_128'
          })
        })

        console.log('📡 ElevenLabs TTS Response Status:', ttsResponse.status)
        
        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer()
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
          
          console.log('✅ TTS successful, audio length:', audioBase64.length)

          return new Response(
            JSON.stringify({
              success: true,
              user_input: transcribedText,
              ai_response: aiResponse.message,
              audio_data: `data:audio/mpeg;base64,${audioBase64}`,
              next_action: aiResponse.data?.nextAction || 'continue_conversation',
              return_detected: !!aiResponse.data?.returnRequest,
              demo_mode: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Log the error response
          const errorText = await ttsResponse.text()
          console.error('❌ ElevenLabs TTS API error:', ttsResponse.status, errorText)
          
          // Fallback if TTS fails
          return new Response(
            JSON.stringify({
              success: true,
              user_input: transcribedText,
              ai_response: aiResponse.message,
              audio_data: 'data:audio/mpeg;base64,demo_audio_fallback',
              next_action: aiResponse.data?.nextAction || 'continue_conversation',
              return_detected: !!aiResponse.data?.returnRequest,
              demo_mode: true,
              tts_error: `ElevenLabs API error: ${ttsResponse.status} - ${errorText}`
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        // Fallback if AI response fails
        return new Response(
          JSON.stringify({
            success: true,
            user_input: transcribedText,
            ai_response: 'I apologize, but I\'m having trouble processing your request right now. Could you please try again?',
            audio_data: 'data:audio/mpeg;base64,demo_audio_fallback',
            next_action: 'continue_conversation',
            return_detected: false,
            demo_mode: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
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

    // Use ElevenLabs Conversational AI for live mode
    const agentId = callSession.provider_data?.agent_id || Deno.env.get('ELEVENLABS_CONVERSATIONAL_AGENT_ID')
    const conversationId = callSession.provider_data?.conversation_id

    if (!agentId || !conversationId) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs Conversational AI not properly configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Send message to ElevenLabs Conversational AI
    const response = await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: user_message || audio_data, // Send text or audio data
        message_type: audio_data ? 'audio' : 'text',
        metadata: {
          call_session_id: callSession.id,
          business_id: callSession.chat_sessions?.business_id,
          customer_email: callSession.chat_sessions?.customer_email
        }
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`ElevenLabs Conversational AI error: ${errorData.detail || response.statusText}`)
    }

    const conversationResponse = await response.json()

    // Store user input transcript
    await supabaseClient
      .from('call_transcripts')
      .insert([
        {
          call_session_id: callSession.id,
          speaker: 'user',
          message: user_message || '[Audio input]',
          timestamp_seconds: Date.now() / 1000
        }
      ])

    // Store AI response transcript
    if (conversationResponse.response?.text) {
      await supabaseClient
        .from('call_transcripts')
        .insert([
          {
            call_session_id: callSession.id,
            speaker: 'agent',
            message: conversationResponse.response.text,
            timestamp_seconds: Date.now() / 1000
          }
        ])
    }

    return new Response(
      JSON.stringify({
        success: true,
        user_input: user_message || '[Audio input]',
        ai_response: conversationResponse.response?.text || 'I apologize, but I didn\'t receive a response.',
        audio_data: conversationResponse.response?.audio_url || null,
        next_action: conversationResponse.response?.next_action || 'continue_conversation',
        return_detected: conversationResponse.response?.return_detected || false,
        conversation_id: conversationId,
        message_id: conversationResponse.message_id
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
        model_id: 'scribe_v1'
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

function generateDemoAIResponse(input: string): string {
  const lowerInput = input.toLowerCase()
  
  // System prompt for demo mode - simulate a helpful customer service agent
  const systemPrompt = `You are a helpful customer service agent for Dokani, an e-commerce platform. 
  You help customers with returns, orders, and general inquiries. 
  Be friendly, professional, and concise. Keep responses under 2 sentences for voice calls.`
  
  // Simple keyword-based responses for demo mode
  if (lowerInput.includes('hello') || lowerInput.includes('hi') || lowerInput.includes('hey')) {
    return "Hello! I'm your Dokani customer service assistant. How can I help you today?"
  }
  
  if (lowerInput.includes('return') || lowerInput.includes('refund')) {
    if (lowerInput.includes('order') || lowerInput.includes('number')) {
      return "I'd be happy to help you with your return. Could you please provide your order number?"
    } else {
      return "I can help you with your return request. Do you have your order number handy?"
    }
  }
  
  if (lowerInput.includes('order') && lowerInput.includes('number')) {
    return "Great! I can see your order. What's the reason for your return?"
  }
  
  if (lowerInput.includes('damaged') || lowerInput.includes('broken') || lowerInput.includes('defective')) {
    return "I understand the item arrived damaged. I'll process your return right away."
  }
  
  if (lowerInput.includes('wrong') || lowerInput.includes('incorrect') || lowerInput.includes('mistake')) {
    return "I apologize for the error. Let me help you get the correct item."
  }
  
  if (lowerInput.includes('size') || lowerInput.includes('fit')) {
    return "I can help you exchange for a different size. What size would you prefer?"
  }
  
  if (lowerInput.includes('tracking') || lowerInput.includes('shipping') || lowerInput.includes('delivery')) {
    return "I can check the status of your order. When did you place it?"
  }
  
  if (lowerInput.includes('thank') || lowerInput.includes('thanks')) {
    return "You're very welcome! Is there anything else I can help you with?"
  }
  
  if (lowerInput.includes('goodbye') || lowerInput.includes('bye') || lowerInput.includes('end')) {
    return "Thank you for contacting Dokani. Have a great day!"
  }
  
  // Default response for unrecognized input
  return "I understand you're saying something about that. Could you please provide more details so I can better assist you?"
} 
