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

    if (!call_session_id) {
      return new Response(
        JSON.stringify({ error: 'call_session_id is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Always use the same agent ID for both demo and live modes
    const agentId = Deno.env.get('ELEVENLABS_CONVERSATIONAL_AGENT_ID')
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')
    
    console.log('🔍 Debug Info:')
    console.log('🔍 Agent ID:', agentId)
    console.log('🔍 API Key exists:', !!apiKey)
    console.log('🔍 API Key prefix:', apiKey?.substring(0, 10) + '...')
    
    if (!agentId || !apiKey) {
      return new Response(
        JSON.stringify({ error: 'ElevenLabs agent or API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // Create or get conversation ID (use call_session_id as conversation ID)
    // For demo mode, we need to create a real conversation if it doesn't exist
    let conversationId = call_session_id
    
    // If this is demo mode and the conversation ID looks like a demo ID, create a real conversation
    if (demo_mode && call_session_id.startsWith('demo-call-')) {
      try {
        console.log('🟡 Creating real ElevenLabs conversation for demo mode...')
        
        // ElevenLabs Conversational AI uses WebSocket connections, not REST API for conversation creation
        // We'll use the call_session_id as the conversation ID and handle the conversation through WebSocket
        conversationId = call_session_id
        console.log('🟢 Using call session ID as conversation ID for WebSocket:', conversationId)
        
        // Note: Actual conversation creation happens via WebSocket connection
        // The conversation will be created when the frontend connects to the WebSocket
        
      } catch (error) {
        console.error('❌ Error setting up conversation for demo:', error)
        return new Response(
          JSON.stringify({ 
            error: 'Failed to set up ElevenLabs conversation for demo mode',
            details: error.message 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
      }
    }

    // If we have audio data, process it with ElevenLabs STT first
    let transcribedText = user_message || ''
    if (user_message === '__init__' || user_message === 'greeting') {
      // Use a clear, friendly greeting prompt
      transcribedText = "Please greet the user and introduce yourself as the AI assistant for this call. Offer to help with any questions or requests.";
    }
    
    if (audio_data && !user_message) {
      // Convert base64 audio to buffer
      const audioBuffer = Uint8Array.from(atob(audio_data), c => c.charCodeAt(0))
      
      console.log('🎤 Processing audio data, length:', audioBuffer.length)
      
      // Send audio to ElevenLabs STT
      // ElevenLabs STT API expects the audio file to be sent as a proper file upload
      const formData = new FormData()
      
      // Create a proper file from the audio buffer
      const audioBlob = new Blob([audioBuffer], { type: 'audio/webm' })
      const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' })
      formData.append('file', audioFile)
      formData.append('model_id', 'scribe_v1')
      
      const sttResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          // Don't set Content-Type for FormData, let the browser set it with boundary
        },
        body: formData
      })

      console.log('🎤 STT Response status:', sttResponse.status)
      
      if (sttResponse.ok) {
        const sttResult = await sttResponse.json()
        transcribedText = sttResult.text || ''
        console.log('🎤 STT Result:', transcribedText)
      } else {
        const errorText = await sttResponse.text()
        console.error('❌ STT Error:', sttResponse.status, errorText)
        
        // Try alternative STT approach if the first fails
        try {
          console.log('🔄 Trying alternative STT approach...')
          
          // Try with different audio format
          const alternativeFormData = new FormData()
          const alternativeAudioBlob = new Blob([audioBuffer], { type: 'audio/mpeg' })
          const alternativeAudioFile = new File([alternativeAudioBlob], 'audio.mp3', { type: 'audio/mpeg' })
          alternativeFormData.append('file', alternativeAudioFile)
          alternativeFormData.append('model_id', 'scribe_v1')
          
          const altSttResponse = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
            method: 'POST',
            headers: {
              'xi-api-key': apiKey,
            },
            body: alternativeFormData
          })
          
          if (altSttResponse.ok) {
            const altSttResult = await altSttResponse.json()
            transcribedText = altSttResult.text || ''
            console.log('🎤 Alternative STT Result:', transcribedText)
          } else {
            const altErrorText = await altSttResponse.text()
            console.error('❌ Alternative STT Error:', altSttResponse.status, altErrorText)
            throw new Error(`STT failed: ${sttResponse.status} - ${errorText}`)
          }
        } catch (altError) {
          console.error('❌ Alternative STT approach failed:', altError)
          throw new Error(`STT failed: ${sttResponse.status} - ${errorText}`)
        }
      }
    }

    if (!transcribedText.trim()) {
      // If no text was transcribed, provide a helpful response
      console.log('⚠️ No text transcribed, providing fallback response')
      
      return new Response(
        JSON.stringify({
          success: true,
          user_input: '[Audio input - could not transcribe]',
          ai_response: 'I heard you speak, but I couldn\'t understand what you said clearly. Could you please try speaking again, or type your message instead?',
          audio_data: null,
          audio_url: null,
          conversation_id: conversationId,
          next_action: 'continue_conversation',
          return_detected: false,
          demo_mode: demo_mode,
          stt_failed: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Send message to ElevenLabs Conversational AI
    console.log('🟡 Sending message to ElevenLabs agent:', agentId, 'Conversation:', conversationId, 'Text:', transcribedText);
    
    // Since ElevenLabs Conversational AI uses WebSocket connections, we'll use our CustomerServiceAgent for now
    // In a full implementation, this would be handled via WebSocket connection
    try {
      const customerServiceAgent = new CustomerServiceAgent()
      
      // Prepare agent context
      const agentContext = {
        businessId: demo_mode ? 'demo-business-123' : 'live-business-456',
        customerEmail: demo_mode ? 'demo@example.com' : 'customer@example.com',
        sessionId: conversationId,
        userRole: 'customer' as const,
        timestamp: new Date().toISOString(),
        demo_mode: demo_mode
      }

      // Get AI response from CustomerServiceAgent
      const aiResponse = await customerServiceAgent.processChatMessage(
        transcribedText,
        agentContext,
        [] // Empty conversation history for now
      )

      if (aiResponse.success) {
        // Generate TTS for AI response using ElevenLabs
        const voiceId = Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID') || '21m00Tcm4TlvDq8ikWAM'
        
        const ttsResponse = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'xi-api-key': apiKey,
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
            }
          })
        })

        if (ttsResponse.ok) {
          const audioBuffer = await ttsResponse.arrayBuffer()
          const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))
          const audioData = `data:audio/mpeg;base64,${audioBase64}`

          return new Response(
            JSON.stringify({
              success: true,
              user_input: transcribedText,
              ai_response: aiResponse.message,
              audio_data: audioData,
              audio_url: null,
              conversation_id: conversationId,
              next_action: 'continue_conversation',
              return_detected: aiResponse.data?.returnRequest ? true : false,
              demo_mode: demo_mode
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        } else {
          // Fallback without audio
          return new Response(
            JSON.stringify({
              success: true,
              user_input: transcribedText,
              ai_response: aiResponse.message,
              audio_data: null,
              audio_url: null,
              conversation_id: conversationId,
              next_action: 'continue_conversation',
              return_detected: aiResponse.data?.returnRequest ? true : false,
              demo_mode: demo_mode,
              no_audio: true
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      } else {
        throw new Error('Failed to process message with CustomerServiceAgent')
      }
    } catch (error) {
      console.error('❌ Error processing message with CustomerServiceAgent:', error)
      return new Response(
        JSON.stringify({ 
          error: 'Failed to process message',
          details: error.message 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

  } catch (error) {
    console.error('❌ Error in process-voice-input:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
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
