import { serve } from "https://deno.land/std@0.220.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get Tavus API key
    const tavusApiKey = Deno.env.get('TAVUS_API_KEY')
    
    if (!tavusApiKey) {
      return new Response(
        JSON.stringify({ error: 'Tavus API key not configured' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    console.log('🔍 Testing Tavus API connection...')

    // First, let's test the API key by listing replicas
    const replicasResponse = await fetch('https://tavusapi.com/v2/replicas', {
      method: 'GET',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Replicas API Response Status:', replicasResponse.status)

    if (!replicasResponse.ok) {
      const errorData = await replicasResponse.text()
      console.error('❌ Replicas API error:', replicasResponse.status, errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch replicas',
          status: replicasResponse.status,
          details: errorData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const replicasData = await replicasResponse.json()
    console.log('✅ Replicas fetched successfully:', replicasData)

    // Now let's test the specific replica ID
    const testReplicaId = 'rf4703150052'
    console.log('🔍 Testing specific replica ID:', testReplicaId)

    const replicaResponse = await fetch(`https://tavusapi.com/v2/replicas/${testReplicaId}`, {
      method: 'GET',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json'
      }
    })

    console.log('📡 Specific Replica API Response Status:', replicaResponse.status)

    if (!replicaResponse.ok) {
      const errorData = await replicaResponse.text()
      console.error('❌ Specific Replica API error:', replicaResponse.status, errorData)
      
      return new Response(
        JSON.stringify({ 
          error: 'Failed to fetch specific replica',
          status: replicaResponse.status,
          details: errorData,
          available_replicas: replicasData,
          tested_replica_id: testReplicaId
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const replicaData = await replicaResponse.json()
    console.log('✅ Specific replica fetched successfully:', replicaData)

    return new Response(
      JSON.stringify({
        success: true,
        api_key_valid: true,
        available_replicas: replicasData,
        tested_replica: replicaData,
        tested_replica_id: testReplicaId
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ Error in test-tavus-replicas:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 