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
  // TODO: Implement webhook processing logic
  console.log(`Processing ${provider} webhook: ${eventType}`, data)
  
  // Placeholder logic - update call session status
  const statusMap: Record<string, string> = {
    'call_started': 'active',
    'call_ended': 'ended',
    'call_failed': 'failed',
    'transcript': 'active' // Keep active for transcript events
  }

  if (statusMap[eventType]) {
    await supabase
      .from('call_sessions')
      .update({ 
        status: statusMap[eventType],
        webhook_data: data,
        ended_at: eventType === 'call_ended' ? new Date().toISOString() : null
      })
      .eq('id', callSession.id)
  }

  // Handle transcript events
  if (eventType === 'transcript' && data.text) {
    await supabase
      .from('call_transcripts')
      .insert([
        {
          call_session_id: callSession.id,
          speaker: data.speaker || 'user',
          message: data.text,
          timestamp_seconds: data.timestamp || 0,
          confidence_score: data.confidence || 1.0
        }
      ])
  }
}