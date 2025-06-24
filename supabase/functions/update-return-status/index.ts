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

    const { public_id, status, admin_notes, decision_reason } = await req.json()

    // Validate required fields
    if (!public_id || !status) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: public_id and status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Validate status values
    const validStatuses = ['pending_triage', 'pending_review', 'approved', 'denied', 'completed']
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Check if return request exists
    const { data: existingRequest, error: fetchError } = await supabaseClient
      .from('return_requests')
      .select('*')
      .eq('public_id', public_id)
      .single()

    if (fetchError || !existingRequest) {
      return new Response(
        JSON.stringify({ error: 'Return request not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = {
      status,
      admin_notes: admin_notes || existingRequest.admin_notes
    }

    // Add decision timestamp and reason for manual decisions
    if ((status === 'approved' || status === 'denied') && existingRequest.status === 'pending_review') {
      updateData.admin_decision_at = new Date().toISOString()
      if (decision_reason) {
        updateData.admin_notes = `${updateData.admin_notes || ''}\n\nDecision: ${decision_reason}`.trim()
      }
    }

    // Update the return request
    const { data: updatedRequest, error: updateError } = await supabaseClient
      .from('return_requests')
      .update(updateData)
      .eq('public_id', public_id)
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
      .single()

    if (updateError) {
      throw updateError
    }

    // Log status change for audit trail
    console.log(`Return request ${public_id} status changed from ${existingRequest.status} to ${status}`)

    // Here you could trigger additional actions based on status:
    if (status === 'approved') {
      console.log(`Processing refund for return request ${public_id}`)
      // TODO: Integrate with Stripe for actual refund processing
    }

    if (status === 'completed') {
      console.log(`Return request ${public_id} completed - archiving case`)
      // TODO: Any cleanup or archival logic
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Return request status updated to ${status}`,
        data: updatedRequest,
        previous_status: existingRequest.status
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