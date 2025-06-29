import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { CustomerServiceAgent } from '../customer-service-agent/index.ts'
import { TriageAgent } from '../triage-agent/index.ts'

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

    const { 
      call_session_id, 
      user_message, 
      message_type, 
      context_data,
      provider 
    } = await req.json()

    if (!call_session_id || !user_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: call_session_id, user_message' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get call session with full context
    const { data: callSession, error: sessionError } = await supabaseClient
      .from('call_sessions')
      .select('*, chat_sessions(*, profiles!business_id(*))')
      .eq('id', call_session_id)
      .single()

    if (sessionError || !callSession) {
      return new Response(
        JSON.stringify({ error: 'Call session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get conversation history (both chat and call transcripts)
    const [chatHistory, callTranscripts] = await Promise.all([
      supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', callSession.chat_session_id)
        .order('created_at', { ascending: true }),
      supabaseClient
        .from('call_transcripts')
        .select('*')
        .eq('call_session_id', callSession.id)
        .order('timestamp_seconds', { ascending: true })
    ])

    // Prepare agent context
    const agentContext = {
      businessId: callSession.chat_sessions?.business_id || '123e4567-e89b-12d3-a456-426614174000',
      customerEmail: callSession.chat_sessions?.customer_email,
      sessionId: callSession.chat_session_id,
      userRole: 'customer' as const,
      timestamp: new Date().toISOString(),
      callSessionId: callSession.id,
      provider: provider || callSession.provider,
      callType: callSession.call_type
    }

    // Initialize appropriate AI agent
    let aiResponse
    if (message_type === 'return_request' || user_message.toLowerCase().includes('return') || user_message.toLowerCase().includes('refund')) {
      // Use TriageAgent for return requests
      const triageAgent = new TriageAgent()
      
      // Get business policies
      const { data: policies } = await supabaseClient
        .from('policies')
        .select('*')
        .eq('business_id', callSession.chat_sessions?.business_id)
        .eq('is_active', true)
        .single()

      const returnRequestData = {
        orderId: context_data?.orderId || 'UNKNOWN',
        reason: context_data?.reason || 'general issue',
        customerEmail: callSession.chat_sessions?.customer_email,
        evidenceUrls: context_data?.evidenceUrls || [],
        conversationLog: [
          ...(chatHistory.data || []).map(msg => ({
            message: msg.message,
            timestamp: msg.created_at,
            sender: msg.sender
          })),
          ...(callTranscripts.data || []).map(transcript => ({
            message: transcript.message,
            timestamp: new Date(transcript.timestamp_seconds * 1000).toISOString(),
            sender: transcript.speaker
          }))
        ]
      }

      aiResponse = await triageAgent.evaluateReturnRequest(
        returnRequestData,
        policies?.rules || {},
        callSession.chat_sessions?.business_id || ''
      )

      // Convert triage decision to conversational response
      const decisionResponse = formatTriageDecision(aiResponse)
      aiResponse = {
        success: true,
        message: decisionResponse,
        data: {
          triageDecision: aiResponse,
          nextAction: aiResponse.decision,
          confidence: aiResponse.confidence
        }
      }

    } else {
      // Use CustomerServiceAgent for general conversation
      const customerServiceAgent = new CustomerServiceAgent()
      
      // Combine chat and call history
      const combinedHistory = [
        ...(chatHistory.data || []),
        ...(callTranscripts.data || []).map(transcript => ({
          role: transcript.speaker === 'user' ? 'user' : 'assistant',
          content: transcript.message,
          created_at: new Date(transcript.timestamp_seconds * 1000).toISOString()
        }))
      ]

      aiResponse = await customerServiceAgent.processChatMessage(
        user_message,
        agentContext,
        combinedHistory
      )
    }

    // Store AI response in call transcripts
    if (aiResponse.success) {
      await supabaseClient
        .from('call_transcripts')
        .insert([
          {
            call_session_id: callSession.id,
            speaker: 'agent',
            message: aiResponse.message,
            timestamp_seconds: Date.now() / 1000,
            metadata: {
              ai_agent: message_type === 'return_request' ? 'triage_agent' : 'customer_service_agent',
              next_action: aiResponse.data?.nextAction,
              return_detected: !!aiResponse.data?.returnRequest
            }
          }
        ])
    }

    // Generate audio/video response based on provider
    let mediaResponse = null
    if (aiResponse.success) {
      if (provider === 'elevenlabs') {
        mediaResponse = await generateVoiceResponse(aiResponse.message, callSession)
      } else if (provider === 'tavus') {
        mediaResponse = await generateVideoResponse(aiResponse.message, callSession)
      }
    }

    return new Response(
      JSON.stringify({
        success: aiResponse.success,
        ai_response: aiResponse.message,
        media_response: mediaResponse,
        next_action: aiResponse.data?.nextAction,
        return_detected: !!aiResponse.data?.returnRequest,
        triage_decision: aiResponse.data?.triageDecision
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in call-ai-processor:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

function formatTriageDecision(triageDecision: any): string {
  const { decision, reasoning, nextSteps } = triageDecision
  
  let response = `Based on my evaluation, I've made a decision about your return request.\n\n`
  
  switch (decision) {
    case 'approve':
      response += `✅ **APPROVED**: Your return request has been approved!\n\n`
      response += `**Reasoning**: ${reasoning}\n\n`
      response += `**Next Steps**:\n`
      nextSteps.forEach((step: string, index: number) => {
        response += `${index + 1}. ${step}\n`
      })
      break
      
    case 'deny':
      response += `❌ **DENIED**: I'm sorry, but your return request has been denied.\n\n`
      response += `**Reasoning**: ${reasoning}\n\n`
      response += `**Next Steps**:\n`
      nextSteps.forEach((step: string, index: number) => {
        response += `${index + 1}. ${step}\n`
      })
      break
      
    case 'human_review':
      response += `⏳ **UNDER REVIEW**: Your return request requires human review.\n\n`
      response += `**Reasoning**: ${reasoning}\n\n`
      response += `**Next Steps**:\n`
      nextSteps.forEach((step: string, index: number) => {
        response += `${index + 1}. ${step}\n`
      })
      break
      
    default:
      response += `**Status**: ${decision}\n\n`
      response += `**Reasoning**: ${reasoning}\n\n`
      response += `**Next Steps**:\n`
      nextSteps.forEach((step: string, index: number) => {
        response += `${index + 1}. ${step}\n`
      })
  }
  
  return response
}

async function generateVoiceResponse(text: string, callSession: any): Promise<any> {
  try {
    const voiceId = callSession.provider_data?.agent_id || Deno.env.get('ELEVENLABS_DEFAULT_VOICE_ID')
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_flash_v2_5',
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
      
      return {
        type: 'audio',
        data: `data:audio/mpeg;base64,${audioBase64}`,
        format: 'mp3'
      }
    }
  } catch (error) {
    console.error('Voice generation error:', error)
  }
  
  return null
}

async function generateVideoResponse(text: string, callSession: any): Promise<any> {
  try {
    const replicaId = callSession.provider_data?.replica_id || callSession.tavus_replica_id
    
    if (replicaId) {
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
        
        return {
          type: 'video',
          video_id: videoData.video_id,
          status: videoData.status,
          estimated_duration: 'Processing...'
        }
      }
    }
  } catch (error) {
    console.error('Video generation error:', error)
  }
  
  return null
} 
