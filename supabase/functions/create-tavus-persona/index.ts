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

    const { business_id, persona_name, train_video_url, consent_video_url, persona_settings } = await req.json()

    // Validate required fields
    if (!business_id || !persona_name || !train_video_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business_id, persona_name, train_video_url' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 1: Create Replica using Tavus v2 API
    const replicaResponse = await fetch('https://api.tavus.com/v2/replicas', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-api-key': Deno.env.get('TAVUS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        train_video_url: train_video_url,
        consent_video_url: consent_video_url,
        name: persona_name,
        description: `Video avatar for ${persona_name}`,
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`
      })
    })

    if (!replicaResponse.ok) {
      const errorData = await replicaResponse.json()
      throw new Error(`Tavus Replica API error: ${errorData.message || replicaResponse.statusText}`)
    }

    const replicaData = await replicaResponse.json()

    // Step 2: Create Persona for conversational behavior
    const personaResponse = await fetch('https://api.tavus.com/v2/personas', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-api-key': Deno.env.get('TAVUS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${persona_name}_persona`,
        description: `Conversational persona for ${persona_name}`,
        system_prompt: persona_settings?.system_prompt || `You are ${persona_name}, a professional customer service representative. You help customers with return and refund requests. Be polite, professional, and empathetic.`,
        context: persona_settings?.context || 'Customer service for e-commerce returns and refunds',
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`
      })
    })

    if (!personaResponse.ok) {
      const errorData = await personaResponse.json()
      throw new Error(`Tavus Persona API error: ${errorData.message || personaResponse.statusText}`)
    }

    const personaData = await personaResponse.json()

    // Store persona configuration in provider_configs
    const { data: personaConfig, error: configError } = await supabaseClient
      .from('provider_configs')
      .insert([
        {
          business_id,
          provider: 'tavus',
          config_name: `video_persona_${persona_name.toLowerCase().replace(/\s+/g, '_')}`,
          config_data: {
            replica_id: replicaData.replica_id,
            persona_id: personaData.persona_id,
            persona_name,
            train_video_url,
            consent_video_url,
            persona_settings,
            created_at: new Date().toISOString(),
            is_default: false,
            status: 'training', // Tavus replicas need training time
            training_estimated_time: '4-6 hours'
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
        replica_id: replicaData.replica_id,
        persona_id: personaData.persona_id,
        persona_config: personaConfig,
        message: 'Video persona created successfully. Training will begin shortly and take 4-6 hours.',
        training_status: 'initiated',
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-tavus-persona:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 