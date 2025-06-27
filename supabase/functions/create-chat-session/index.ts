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

    const { user_id, session_name, chat_mode, session_type } = await req.json()

    // Validate required fields
    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create new chat session
    const { data: session, error } = await supabaseClient
      .from('chat_sessions')
      .insert([
        {
          user_id,
          session_name: session_name || 'Test Session',
          chat_mode: chat_mode || 'normal',
          session_type: session_type || 'test_mode',
          is_active: true
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    // Add welcome message
    await supabaseClient
      .from('chat_messages')
      .insert([
        {
          session_id: session.id,
          sender: 'system',
          message: `Welcome to Dokani! I'm your AI assistant. You can test return requests with any order from our mock orders. How can I help you today?`,
          message_type: 'text'
        }
      ])

    return new Response(
      JSON.stringify({ 
        success: true, 
        session_id: session.id,
        chat_mode: session.chat_mode,
        message: 'Chat session created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-chat-session:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})