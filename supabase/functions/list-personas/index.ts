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
    const business_id = url.searchParams.get('business_id')
    const provider = url.searchParams.get('provider') // Optional filter: 'elevenlabs' or 'tavus'

    if (!business_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: business_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Build query
    let query = supabaseClient
      .from('provider_configs')
      .select('*')
      .eq('business_id', business_id)
      .eq('is_active', true)

    // Filter by provider if specified
    if (provider) {
      query = query.eq('provider', provider)
    } else {
      // Only get persona configs (voice and video)
      query = query.in('provider', ['elevenlabs', 'tavus'])
    }

    const { data: personas, error } = await query

    if (error) {
      throw error
    }

    // Format response by provider type
    const voicePersonas = personas.filter(p => p.provider === 'elevenlabs')
    const videoPersonas = personas.filter(p => p.provider === 'tavus')

    return new Response(
      JSON.stringify({ 
        success: true,
        data: {
          voice_personas: voicePersonas,
          video_personas: videoPersonas,
          total_count: personas.length
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in list-personas:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 