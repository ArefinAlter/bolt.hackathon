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
    const user_id = url.searchParams.get('user_id')
    const demo_mode = url.searchParams.get('demo_mode') === 'true'

    if (!user_id && !demo_mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: user_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (demo_mode) {
      // Return demo user preferences without database query
      const demoPreferences = {
        preferred_chat_mode: 'normal',
        voice_enabled: true,
        video_enabled: true,
        notifications_enabled: true,
        auto_escalate: false,
        language: 'en',
        ai_agent_preference: 'customer-service',
        call_quality_preference: 'high',
        response_time_preference: 'fast'
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          preferences: demoPreferences,
          last_updated: new Date().toISOString(),
          demo_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user preferences
    let { data: preferences, error } = await supabaseClient
      .from('user_preferences')
      .select('*')
      .eq('user_id', user_id)
      .single()

    // If no preferences exist, create default ones
    if (error && error.code === 'PGRST116') {
      const { data: newPreferences, error: createError } = await supabaseClient
        .from('user_preferences')
        .insert([
          {
            user_id,
            preferences: {
              preferred_chat_mode: 'normal',
              voice_enabled: true,
              video_enabled: true,
              notifications_enabled: true,
              auto_escalate: false,
              language: 'en'
            }
          }
        ])
        .select()
        .single()

      if (createError) {
        throw createError
      }

      preferences = newPreferences
    } else if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        preferences: preferences.preferences,
        last_updated: preferences.updated_at
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-user-preferences:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})