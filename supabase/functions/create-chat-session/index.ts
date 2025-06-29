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
    const { session_name, chat_mode, demo_mode } = await req.json()

    // Demo mode - return mock data
    if (demo_mode) {
      const mockChatSession = {
        id: 'demo-chat-session-123',
        user_id: 'demo-user-123',
        business_id: '123e4567-e89b-12d3-a456-426614174000',
        session_name: session_name || 'Demo Chat Session',
        chat_mode: chat_mode || 'text',
        customer_email: 'customer@example.com',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: mockChatSession,
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

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('business_id, business_name, email')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.log('Profile not found, creating default profile for user:', user.id);
      
      // Create a default profile if it doesn't exist
      const { data: newProfile, error: createProfileError } = await supabaseClient
        .from('profiles')
        .insert([
          {
            id: user.id,
            business_name: 'Default Business',
            website: null,
            subscription_plan: 'free',
            onboarded: false,
            business_id: '123e4567-e89b-12d3-a456-426614174000', // Default business ID
            created_at: new Date().toISOString()
          }
        ])
        .select()
        .single()

      if (createProfileError) {
        console.error('Failed to create profile:', createProfileError);
        // Use a default business ID if profile creation fails
        const defaultBusinessId = '123e4567-e89b-12d3-a456-426614174000';
        
        // Create chat session with default business ID
        const { data: chatSession, error } = await supabaseClient
          .from('chat_sessions')
          .insert([
            {
              user_id: user.id,
              business_id: defaultBusinessId,
              session_name: session_name || 'New Chat Session',
              chat_mode: chat_mode || 'normal',
              session_type: 'test_mode',
              customer_email: user.email,
              is_active: true,
              metadata: {}
            }
          ])
          .select()
          .single()

        if (error) {
          console.error('Failed to create chat session:', error);
          throw new Error('Failed to create chat session. Please try again.');
        }

        return new Response(
          JSON.stringify({
            success: true,
            data: chatSession
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Use the newly created profile
      const businessId = newProfile.business_id;
    } else {
      const businessId = profile.business_id;
    }

    // Create chat session
    const { data: chatSession, error } = await supabaseClient
      .from('chat_sessions')
      .insert([
        {
          user_id: user.id,
          business_id: profile?.business_id || '123e4567-e89b-12d3-a456-426614174000',
          session_name: session_name || 'New Chat Session',
          chat_mode: chat_mode || 'normal',
          session_type: 'test_mode',
          customer_email: user.email,
          is_active: true,
          metadata: {}
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Failed to create chat session:', error);
      throw new Error('Failed to create chat session. Please try again.');
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: chatSession
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