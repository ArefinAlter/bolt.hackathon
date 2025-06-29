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
    const url = new URL(req.url)
    const call_session_id = url.searchParams.get('call_session_id')
    const demo_mode = url.searchParams.get('demo_mode') === 'true'

    if (!call_session_id && !demo_mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: call_session_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Demo mode - return mock data
    if (demo_mode) {
      const mockCallSession = {
        id: call_session_id || 'demo-call-123',
        chat_session_id: 'demo-chat-123',
        provider: 'elevenlabs',
        call_type: 'voice',
        status: 'active',
        external_session_id: 'demo-external-123',
        session_url: 'https://demo.example.com/call/demo-123',
        streaming_enabled: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        chat_sessions: {
          id: 'demo-chat-123',
          user_id: 'demo-user-123',
          session_name: 'Demo Call Session',
          chat_mode: 'voice'
        },
        call_transcripts: [
          {
            speaker: 'user',
            message: 'Hello, I need help with a return',
            timestamp_seconds: Date.now() / 1000,
            created_at: new Date().toISOString()
          },
          {
            speaker: 'agent',
            message: 'Hello! I\'m here to help you with your return request. Could you please provide your order number?',
            timestamp_seconds: (Date.now() / 1000) + 2,
            created_at: new Date().toISOString()
          }
        ],
        call_analytics: {
          metrics: {
            duration: 120,
            quality_score: 0.95,
            customer_satisfaction: 0.9
          },
          events: [
            {
              type: 'call_started',
              timestamp: new Date().toISOString()
            },
            {
              type: 'ai_response_generated',
              timestamp: new Date().toISOString()
            }
          ]
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          data: mockCallSession,
          demo_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { createClient } = await import('npm:@supabase/supabase-js@2')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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