import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { order_id, business_id } = await req.json()

    // Validate required fields
    if (!order_id || !business_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: order_id and business_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate order exists
    const { data: order, error: orderError } = await supabaseClient
      .from('mock_orders')
      .select('*')
      .eq('order_id', order_id)
      .single()

    if (orderError || !order) {
      return new Response(
        JSON.stringify({ error: 'Order not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Create new return request
    const { data: returnRequest, error: createError } = await supabaseClient
      .from('return_requests')
      .insert([
        {
          business_id,
          order_id,
          customer_email: order.customer_email,
          status: 'pending_triage'
        }
      ])
      .select()
      .single()

    if (createError) {
      throw createError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        public_id: returnRequest.public_id,
        portal_url: `${Deno.env.get('SITE_URL')}/return/${returnRequest.public_id}`,
        order_details: {
          product_name: order.product_name,
          purchase_date: order.purchase_date
        }
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