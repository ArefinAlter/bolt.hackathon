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
    const url = new URL(req.url)
    const public_id = url.searchParams.get('public_id')
    const demo_mode = url.searchParams.get('demo_mode') === 'true'

    if (!public_id && !demo_mode) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: public_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Demo mode - return mock data
    if (demo_mode) {
      const mockReturnRequest = {
        id: 'demo-return-123',
        public_id: public_id || 'demo-return-123',
        business_id: '123e4567-e89b-12d3-a456-426614174000',
        order_id: 'ORDER-12345',
        customer_email: 'customer@example.com',
        reason_for_return: 'Product arrived damaged',
        status: 'pending_triage',
        evidence_urls: ['https://example.com/photo1.jpg'],
        conversation_log: [
          {
            message: 'I received my order but it was damaged',
            timestamp: new Date().toISOString(),
            sender: 'customer'
          }
        ],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        days_since_purchase: 5,
        created_at_formatted: new Date().toLocaleDateString(),
        order_details: {
          order_id: 'ORDER-12345',
          purchase_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          customer_email: 'customer@example.com',
          product_name: 'Wireless Headphones',
          product_category: 'Electronics',
          order_value: 89.99
        }
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

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

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