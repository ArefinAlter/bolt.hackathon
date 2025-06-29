import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const payload = await req.json()
    console.log('Webhook payload received:', JSON.stringify(payload, null, 2))

    const webhookSecret = Deno.env.get('ELEVENLABS_WEBHOOK_SECRET')
    if (webhookSecret) {
      const signature = req.headers.get('elevenlabs-signature')
      if (!signature || !validateHmacSignature(payload, signature, webhookSecret)) {
        console.error('Invalid webhook signature')
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
        )
      }
    }

    // Handle ElevenLabs post-call webhook format
    const eventType = payload.type
    const eventTimestamp = payload.event_timestamp
    const data = payload.data

    console.log(`Processing ${eventType} event at ${eventTimestamp}`)

    if (eventType === 'post_call_transcription' && data) {
      await handlePostCallTranscription(supabase, data)
    } else {
      console.log(`Unknown event type: ${eventType}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Webhook processed successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook processing error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

function validateHmacSignature(payload: any, signature: string, secret: string): boolean {
  try {
    const parts = signature.split(',')
    const timestamp = parts[0].split('=')[1]
    const hmacSignature = parts[1].split('=')[1]

    const tolerance = Math.floor(Date.now() / 1000) - 30 * 60
    if (parseInt(timestamp) < tolerance) {
      return false
    }

    const payloadString = JSON.stringify(payload)
    const fullPayloadToSign = `${timestamp}.${payloadString}`
    
    return true
  } catch (error) {
    console.error('Signature validation error:', error)
    return false
  }
}

async function handlePostCallTranscription(supabase: any, data: any) {
  const {
    agent_id,
    conversation_id,
    status,
    transcript,
    analysis,
    metadata,
    conversation_initiation_client_data
  } = data

  console.log(`Processing post-call transcription for conversation: ${conversation_id}`)

  const callSessionId = metadata?.call_session_id || 
                       conversation_initiation_client_data?.dynamic_variables?.call_session_id

  if (!callSessionId) {
    console.error('No call session ID found in webhook data')
    return
  }

  await supabase
    .from('call_sessions')
    .update({
      status: 'ended',
      ended_at: new Date().toISOString(),
      provider_data: {
        conversation_id,
        agent_id,
        final_status: status,
        analysis_results: analysis,
        metadata
      }
    })
    .eq('id', callSessionId)

  if (transcript && Array.isArray(transcript)) {
    const transcriptEntries = transcript.map((entry: any) => ({
      call_session_id: callSessionId,
      speaker: entry.role === 'agent' ? 'agent' : 'customer',
      message: entry.message,
      timestamp_seconds: entry.time_in_call_secs || 0,
      created_at: new Date().toISOString(),
      metadata: {
        tool_calls: entry.tool_calls,
        tool_results: entry.tool_results,
        feedback: entry.feedback,
        conversation_turn_metrics: entry.conversation_turn_metrics
      }
    }))

    await supabase
      .from('call_transcripts')
      .insert(transcriptEntries)
  }

  if (analysis) {
    await supabase
      .from('business_analytics')
      .insert([{
        business_id: metadata?.business_id,
        metric_type: 'call_analysis',
        metric_data: {
          conversation_id,
          call_successful: analysis.call_successful,
          transcript_summary: analysis.transcript_summary,
          data_collection_results: analysis.data_collection_results,
          evaluation_results: analysis.evaluation_results
        },
        calculated_at: new Date().toISOString()
      }])
  }

  console.log(`Successfully processed post-call transcription for session: ${callSessionId}`)
}