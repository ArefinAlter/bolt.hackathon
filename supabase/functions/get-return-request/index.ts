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

    const url = new URL(req.url)
    const public_id = url.searchParams.get('public_id')

    if (!public_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: public_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get return request with order details
    const { data: returnRequest, error } = await supabaseClient
      .from('return_requests')
      .select(`
        *,
        mock_orders (
          order_id,
          purchase_date,
          customer_email,
          product_name,
          product_category
        )
      `)
      .eq('public_id', public_id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return new Response(
        JSON.stringify({ error: 'Return request not found', details: error.message }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    if (!returnRequest) {
      return new Response(
        JSON.stringify({ error: 'Return request not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Calculate additional metadata
    const purchaseDate = new Date(returnRequest.mock_orders.purchase_date)
    const currentDate = new Date()
    const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

    // Format response
    const response = {
      success: true,
      data: {
        ...returnRequest,
        days_since_purchase: daysSincePurchase,
        created_at_formatted: new Date(returnRequest.created_at).toLocaleDateString(),
        order_details: returnRequest.mock_orders
      }
    }

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-return-request:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})