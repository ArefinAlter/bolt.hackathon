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
    const { public_id, status, admin_notes, demo_mode } = await req.json()

    // Demo mode - return mock data
    if (demo_mode) {
      const mockUpdatedReturn = {
        id: 'demo-return-123',
        public_id: public_id || 'demo-return-123',
        business_id: '123e4567-e89b-12d3-a456-426614174000',
        order_id: 'ORDER-12345',
        customer_email: 'customer@example.com',
        reason_for_return: 'Product arrived damaged',
        status: status || 'approved',
        evidence_urls: ['https://example.com/photo1.jpg'],
        admin_notes: admin_notes || 'Demo approval - customer provided valid evidence',
        admin_decision_at: new Date().toISOString(),
        conversation_log: [
          {
            message: 'Product arrived damaged',
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
          data: mockUpdatedReturn,
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
    if (!public_id || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: public_id, status' }),
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

    // Update return request
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    }

    if (admin_notes) {
      updateData.admin_notes = admin_notes
    }

    if (status === 'approved' || status === 'denied') {
      updateData.admin_decision_at = new Date().toISOString()
    }

    const { data: updatedReturn, error } = await supabaseClient
      .from('return_requests')
      .update(updateData)
      .eq('public_id', public_id)
      .select()
      .single()

    if (error) {
      throw error
    }

    if (!updatedReturn) {
      return new Response(
        JSON.stringify({ error: 'Return request not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: updatedReturn
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in update-return-status:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})