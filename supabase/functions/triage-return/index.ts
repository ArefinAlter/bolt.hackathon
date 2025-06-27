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
      const { TriageAgent } = await import('../triage-agent')
      
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
  
      let policyRules
      if (policyError || !policy) {
        // If no policy exists, create a default one
        console.log('No active policy found, using default rules')
        policyRules = {
          return_window_days: 30,
          auto_approve_threshold: 100,
          required_evidence: ['photo'],
          acceptable_reasons: ['defective', 'wrong_item', 'damaged', 'not_as_described'],
          high_risk_categories: ['electronics', 'jewelry'],
          fraud_flags: ['multiple_returns', 'high_value', 'suspicious_pattern']
        }
      } else {
        policyRules = policy.rules
      }
  
      // Calculate days since purchase
      const purchaseDate = new Date(returnRequest.mock_orders.purchase_date)
      const currentDate = new Date()
      const daysSincePurchase = Math.floor((currentDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
  
      // Initialize Triage Agent
      const triageAgent = new TriageAgent()
  
      // Prepare return request data for triage with all required fields
      const returnData = {
        orderId: returnRequest.order_id,
        customerEmail: returnRequest.customer_email,
        reason: reason_for_return,
        evidenceUrls: evidence_urls || [],
        orderValue: returnRequest.mock_orders.purchase_price,
        productCategory: returnRequest.mock_orders.product_category,
        daysSincePurchase,
        conversationLog: conversation_log || [],
        customerRiskScore: 0.5, // Default risk score
        returnHistory: 0 // Default return history
      }
  
      // Get triage decision using AI agent - FIXED: using correct method name
      const triageDecision = await triageAgent.evaluateReturnRequest(
        returnData,
        policyRules,
        returnRequest.business_id
      )
  
      // Update return request based on decision
      let updateData: any = {
        reason_for_return,
        evidence_urls,
        conversation_log,
        ai_recommendation: triageDecision.decision,
        ai_reasoning: triageDecision.reasoning,
        policy_violations: triageDecision.policyViolations || [],
        risk_factors: triageDecision.riskFactors || []
      }
  
      switch (triageDecision.decision) {
        case 'auto_approve':
          updateData.status = 'approved'
          updateData.approved_at = new Date().toISOString()
          break
        case 'auto_deny':
          updateData.status = 'denied'
          updateData.denied_at = new Date().toISOString()
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
  
      // Note: TriageAgent already logs the decision internally via logTriageDecision method
  
      // If auto-approved, trigger refund processing
      if (triageDecision.decision === 'auto_approve') {
        console.log(`Auto-approved return request ${public_id} - refund processing would trigger here`)
        
        // You could add refund processing logic here
        // await processRefund(public_id, returnRequest.mock_orders.order_value)
      }
  
      // Check for suspicious patterns
      if (daysSincePurchase < 1 || returnRequest.return_history > 5) {
        // Log security event for suspicious return
        const { error: securityError } = await supabaseClient
          .from('security_events')
          .insert([
            {
              business_id: returnRequest.business_id,
              event_type: 'suspicious_behavior',
              event_data: {
                return_id: returnRequest.id,
                customer_email: returnRequest.customer_email,
                days_since_purchase: daysSincePurchase,
                return_history: returnRequest.return_history,
                reason: reason_for_return
              },
              severity: 'medium',
              created_at: new Date().toISOString()
            }
          ])

        if (securityError) {
          console.error('Error logging security event:', securityError)
        }
      }
  
      return new Response(
        JSON.stringify({ 
          success: true, 
          decision: triageDecision.decision,
          reasoning: triageDecision.reasoning,
          status: updateData.status,
          days_since_purchase: daysSincePurchase,
          policy_violations: triageDecision.policyViolations,
          risk_factors: triageDecision.riskFactors,
          next_steps: triageDecision.nextSteps
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
