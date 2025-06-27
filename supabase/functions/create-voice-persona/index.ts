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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { business_id, persona_name, voice_samples, voice_settings } = await req.json()

    // Validate required fields
    if (!business_id || !persona_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business_id and persona_name' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create voice persona using ElevenLabs API
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: persona_name,
        files: voice_samples, // Array of base64 encoded audio files
        description: `Voice persona for ${persona_name}`,
        labels: {
          accent: voice_settings?.accent || 'neutral',
          age: voice_settings?.age || 'adult',
          gender: voice_settings?.gender || 'neutral'
        }
      })
    })

    if (!elevenLabsResponse.ok) {
      const errorData = await elevenLabsResponse.json()
      throw new Error(`ElevenLabs API error: ${errorData.detail || elevenLabsResponse.statusText}`)
    }

    const voiceData = await elevenLabsResponse.json()

    // Store persona configuration in provider_configs
    const { data: personaConfig, error: configError } = await supabaseClient
      .from('provider_configs')
      .insert([
        {
          business_id,
          provider: 'elevenlabs',
          config_name: `voice_persona_${persona_name.toLowerCase().replace(/\s+/g, '_')}`,
          config_data: {
            voice_id: voiceData.voice_id,
            persona_name,
            voice_settings,
            created_at: new Date().toISOString(),
            is_default: false
          },
          is_active: true
        }
      ])
      .select()
      .single()

    if (configError) {
      throw configError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        voice_id: voiceData.voice_id,
        persona_config: personaConfig,
        message: 'Voice persona created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-voice-persona:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 