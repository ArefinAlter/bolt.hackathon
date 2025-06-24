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

    const { public_id, reason_for_return, evidence_urls, conversation_log } = await req.json()

    // Validate required fields
    if (!public_id || !reason_for_return) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: public_id and reason_for_return' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get return request with order details
    const { data: returnRequest, error: fetchError } = await supabaseClient
      .from('return_requests')
      .select(`
        *,
        mock_orders (*)
      `)
      .eq('public_id', public_id)
      .single()

    if (fetchError || !returnRequest) {
      return new Response(
        JSON.stringify({ error: 'Return request not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Get active policy for business
    const { data: policy, error: policyError } = await supabaseClient
      .from('policies')
      .select('rules')
      .eq('business_id', returnRequest.business_id)
      .eq('is_active', true)
      .single()

    if (policyError || !policy) {
      // If no policy exists, create a default one
      console.log('No active policy found, using default rules')
      var defaultRules = {
        return_window_days: 30,
        auto_approve_threshold: 100,
        required_evidence: ['photo'],
        acceptable_reasons: ['defective', 'wrong_item', 'damaged', 'not_as_described']
      }
    } else {
      var defaultRules = policy.rules
    }

    // Calculate days since purchase
    const purchaseDate = new Date(returnRequest.mock_orders.purchase_date)
    const currentDate = new Date()
    const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))

    // Call OpenAI for triage decision
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a triage agent for return requests. Analyze the request against the business policy and determine the appropriate action.
            
            Business Policy Rules: ${JSON.stringify(defaultRules)}
            
            Decision Rules:
            - "auto_approve": Low risk, meets all policy criteria, within return window, order value below threshold
            - "auto_deny": Clear policy violation (outside return window, invalid reason, etc.)
            - "human_review": Requires human judgment (high value, complex case, unclear evidence)
            
            Analyze these factors:
            1. Return window compliance
            2. Order value vs auto-approval threshold  
            3. Return reason validity
            4. Evidence quality/completeness
            5. Customer risk factors
            
            Respond in JSON format: {"decision": "auto_approve", "confidence": 0.95, "reasoning": "Order within return window, valid defect claim with photo evidence, low order value qualifies for auto-approval"}`
          },
          {
            role: 'user',
            content: `Order Details:
            - Order ID: ${returnRequest.order_id}
            - Purchase Date: ${returnRequest.mock_orders.purchase_date}
            - Days Since Purchase: ${daysSincePurchase}
            - Product: ${returnRequest.mock_orders.product_name}
            - Category: ${returnRequest.mock_orders.product_category}
            - Customer Email: ${returnRequest.customer_email}
            
            Return Request:
            - Reason: ${reason_for_return}
            - Evidence Provided: ${evidence_urls && evidence_urls.length > 0 ? 'Yes - ' + evidence_urls.length + ' files' : 'No'}
            - Evidence URLs: ${evidence_urls || 'None'}
            
            Please analyze and provide decision.`
          }
        ],
        temperature: 0.1
      })
    })

    if (!openAIResponse.ok) {
      throw new Error(`OpenAI API error: ${openAIResponse.statusText}`)
    }

    const aiDecision = await openAIResponse.json()
    let decision
    
    try {
      decision = JSON.parse(aiDecision.choices[0].message.content)
    } catch (parseError) {
      // Fallback if JSON parsing fails
      decision = {
        decision: 'human_review',
        confidence: 0.5,
        reasoning: 'AI response could not be parsed, defaulting to human review'
      }
    }

    // Update return request based on decision
    let updateData: any = {
      reason_for_return,
      evidence_urls,
      conversation_log,
      ai_recommendation: decision.decision,
      ai_confidence_score: decision.confidence
    }

    switch (decision.decision) {
      case 'auto_approve':
        updateData.status = 'approved'
        break
      case 'auto_deny':
        updateData.status = 'denied'
        break
      case 'human_review':
        updateData.status = 'pending_review'
        break
      default:
        updateData.status = 'pending_review'
    }

    const { data: updatedRequest, error: updateError } = await supabaseClient
      .from('return_requests')
      .update(updateData)
      .eq('public_id', public_id)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    // If auto-approved, you could trigger refund processing here
    // For now, we'll just log it
    if (decision.decision === 'auto_approve') {
      console.log(`Auto-approved return request ${public_id} - refund processing would trigger here`)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        decision: decision.decision,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        status: updateData.status,
        days_since_purchase: daysSincePurchase
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in triage-return:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})