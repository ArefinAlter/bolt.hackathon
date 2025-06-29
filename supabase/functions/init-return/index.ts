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
    const { order_id, customer_email, reason, evidence_urls, demo_mode } = await req.json()

    // Demo mode - return mock data
    if (demo_mode) {
      const mockReturnRequest = {
        id: 'demo-return-init-123',
        public_id: 'demo-return-123',
        business_id: '123e4567-e89b-12d3-a456-426614174000',
        order_id: order_id || 'ORDER-12345',
        customer_email: customer_email || 'customer@example.com',
        reason_for_return: reason || 'Product arrived damaged',
        evidence_urls: evidence_urls || ['https://example.com/photo1.jpg'],
        status: 'pending_triage',
        conversation_log: [
          {
            message: reason || 'Product arrived damaged',
            timestamp: new Date().toISOString(),
            sender: 'customer'
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: mockReturnRequest,
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

    // Validate required fields
    if (!order_id || !customer_email || !reason) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id, customer_email, reason' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

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
      .select('business_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Profile not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Create return request
    const { data: returnRequest, error } = await supabaseClient
      .from('return_requests')
      .insert([
        {
          business_id: profile.business_id,
          order_id,
          customer_email,
          reason_for_return: reason,
          evidence_urls: evidence_urls || [],
          status: 'pending_triage',
          conversation_log: [
            {
              message: reason,
              timestamp: new Date().toISOString(),
              sender: 'customer'
            }
          ]
        }
      ])
      .select()
      .single()

    if (error) {
      throw error
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: returnRequest
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in init-return:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})