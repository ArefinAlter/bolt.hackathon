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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { user_id, business_name } = await req.json()

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: user_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if profile already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user_id)
      .single()

    if (existingProfile) {
      return new Response(
        JSON.stringify({ success: true, data: existingProfile }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create new profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert([
        {
          id: user_id,
          business_name: business_name || 'New Business',
          subscription_plan: 'free',
          onboarded: false,
          business_id: crypto.randomUUID()
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Error creating profile:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to create profile' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create user preferences
    const { error: prefsError } = await supabase
      .from('user_preferences')
      .insert([
        {
          user_id: user_id,
          preferences: {
            language: "en",
            auto_escalate: false,
            video_enabled: true,
            voice_enabled: true,
            auto_transcript: true,
            tavus_replica_id: null,
            elevenlabs_voice_id: null,
            preferred_chat_mode: "normal",
            call_history_enabled: true,
            notifications_enabled: true,
            theme: "system"
          }
        }
      ])

    if (prefsError) {
      console.error('Error creating user preferences:', prefsError)
      // Don't fail the request, preferences are optional
    }

    return new Response(
      JSON.stringify({ success: true, data: profile }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-profile function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 