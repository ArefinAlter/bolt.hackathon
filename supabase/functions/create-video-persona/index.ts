import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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

    const { business_id, persona_name, video_samples, avatar_settings } = await req.json()

    // Validate required fields
    if (!business_id || !persona_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business_id and persona_name' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Create video persona using Tavus API
    const tavusResponse = await fetch('https://api.tavus.com/v1/replicas', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('TAVUS_API_KEY') || ''}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: persona_name,
        source_video_url: video_samples[0], // Primary video sample URL
        description: `Video avatar for ${persona_name}`,
        settings: {
          quality: avatar_settings?.quality || 'standard',
          style: avatar_settings?.style || 'natural',
          background: avatar_settings?.background || 'transparent'
        }
      })
    })

    if (!tavusResponse.ok) {
      const errorData = await tavusResponse.json()
      throw new Error(`Tavus API error: ${errorData.message || tavusResponse.statusText}`)
    }

    const avatarData = await tavusResponse.json()

    // Store persona configuration in provider_configs
    const { data: personaConfig, error: configError } = await supabaseClient
      .from('provider_configs')
      .insert([
        {
          business_id,
          provider: 'tavus',
          config_name: `video_persona_${persona_name.toLowerCase().replace(/\s+/g, '_')}`,
          config_data: {
            replica_id: avatarData.replica_id,
            persona_name,
            avatar_settings,
            video_samples,
            created_at: new Date().toISOString(),
            is_default: false,
            status: 'training' // Tavus replicas need training time
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
        replica_id: avatarData.replica_id,
        persona_config: personaConfig,
        message: 'Video persona created successfully. Training will begin shortly.'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-video-persona:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 