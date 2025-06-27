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

    const url = new URL(req.url)
    const call_session_id = url.searchParams.get('call_session_id')

    if (!call_session_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: call_session_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get call session with related data
    const { data: callSession, error } = await supabaseClient
      .from('call_sessions')
      .select(`
        *,
        chat_sessions (
          id,
          user_id,
          session_name,
          chat_mode
        ),
        call_transcripts (
          speaker,
          message,
          timestamp_seconds,
          created_at
        ),
        call_analytics (
          metrics,
          events
        )
      `)
      .eq('id', call_session_id)
      .single()

    if (error) {
      throw error
    }

    if (!callSession) {
      return new Response(
        JSON.stringify({ error: 'Call session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        data: callSession
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-call-session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})