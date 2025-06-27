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

    const { config_id, test_content, test_type } = await req.json()

    // Validate required fields
    if (!config_id || !test_content) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: config_id and test_content' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get persona configuration
    const { data: personaConfig, error: configError } = await supabaseClient
      .from('provider_configs')
      .select('*')
      .eq('id', config_id)
      .single()

    if (configError || !personaConfig) {
      return new Response(
        JSON.stringify({ error: 'Persona configuration not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Start timing the test
    const startTime = Date.now()

    let testResult = {}

    // Test based on provider type
    if (personaConfig.provider === 'elevenlabs') {
      testResult = await testVoicePersona(personaConfig, test_content)
    } else if (personaConfig.provider === 'tavus') {
      testResult = await testVideoPersona(personaConfig, test_content)
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported provider type' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Log the test results
    const { error: logError } = await supabaseClient
      .from('persona_test_logs')
      .insert([
        {
          business_id: personaConfig.business_id,
          config_id: config_id,
          test_type: test_type || 'interaction',
          test_content: test_content,
          test_result: {
            input: test_content,
            response: testResult,
            persona_config: personaConfig
          },
          success: true,
          test_duration_ms: Date.now() - startTime,
          created_at: new Date().toISOString()
        }
      ])

    if (logError) {
      console.error('Error logging persona test:', logError)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        test_result: testResult,
        persona_config: personaConfig,
        response_time_ms: Date.now() - startTime
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in test-persona:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function testVoicePersona(personaConfig: any, testContent: string) {
  const voiceId = personaConfig.config_data.voice_id
  
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text: testContent,
      model_id: 'eleven_flash_v2.5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      },
      output_format: 'mp3_44100_128'
    })
  })

  if (!response.ok) {
    throw new Error(`ElevenLabs TTS error: ${response.statusText}`)
  }

  const audioBuffer = await response.arrayBuffer()
  const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)))

  return {
    audio_url: `data:audio/mpeg;base64,${audioBase64}`,
    duration: 'Generated successfully',
    voice_id: voiceId,
    model_used: 'eleven_flash_v2.5'
  }
}

async function testVideoPersona(personaConfig: any, testContent: string) {
  const replicaId = personaConfig.config_data.replica_id
  
  const response = await fetch('https://api.tavus.com/v2/videos', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'x-api-key': Deno.env.get('TAVUS_API_KEY') || '',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      replica_id: replicaId,
      script: testContent,
      callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`,
      settings: {
        background: 'transparent',
        quality: 'standard'
      }
    })
  })

  if (!response.ok) {
    throw new Error(`Tavus video generation error: ${response.statusText}`)
  }

  const videoData = await response.json()

  return {
    video_id: videoData.video_id,
    status: videoData.status,
    replica_id: replicaId,
    estimated_duration: 'Processing...',
    callback_url: videoData.callback_url
  }
} 