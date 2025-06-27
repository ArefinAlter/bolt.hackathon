export interface TriageDecision {
    decision: 'auto_approve' | 'auto_deny' | 'human_review'
    confidence: number
    reasoning: string
    riskFactors: string[]
    policyViolations: string[]
    nextSteps: string[]
  }
  
  export interface PolicyRules {
    return_window_days: number
    auto_approve_threshold: number
    required_evidence: string[]
    acceptable_reasons: string[]
    high_risk_categories: string[]
    fraud_flags: string[]
  }
  
  export interface ReturnRequestData {
    orderId: string
    customerEmail: string
    reason: string
    orderValue: number
    daysSincePurchase: number
    evidenceUrls: string[]
    customerRiskScore: number
    returnHistory: number
    productCategory: string
  }
  
  export class TriageAgent {
    private model: string = 'gpt-4o'
    private temperature: number = 0.1
    private maxTokens: number = 2000
    
    async evaluateReturnRequest(
      requestData: ReturnRequestData,
      policyRules: PolicyRules,
      businessId: string
    ): Promise<TriageDecision> {
      try {
        const apiKey = Deno.env.get('OPENAI_API_KEY')
        if (!apiKey) {
          throw new Error('OPENAI_API_KEY not configured')
        }
        
        const systemPrompt = this.buildSystemPrompt(policyRules)
        const userPrompt = this.buildUserPrompt(requestData)
        
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: this.temperature,
            max_tokens: this.maxTokens
          })
        })
        
        if (!response.ok) {
          throw new Error(`OpenAI API error: ${response.status}`)
        }
        
        const data = await response.json()
        const content = data.choices[0].message.content
        
        // Parse the structured response
        const decision = this.parseTriageResponse(content)
        
        // Log the decision for audit trail
        await this.logTriageDecision(businessId, requestData, decision)
        
        return decision
        
      } catch (error) {
        console.error('Triage Agent Error:', error)
        
        // Fallback to human review on error
        return {
          decision: 'human_review',
          confidence: 0.0,
          reasoning: 'Error occurred during automated evaluation, defaulting to human review',
          riskFactors: ['system_error'],
          policyViolations: [],
          nextSteps: ['Manual review required due to system error']
        }
      }
    }
    
    private buildSystemPrompt(policyRules: PolicyRules): string {
      return `You are a Triage Agent for an e-commerce return management system. Your job is to evaluate return requests against business policies and make automated decisions.
  
  **Business Policy Rules:**
  - Return Window: ${policyRules.return_window_days} days
  - Auto-approval Threshold: $${policyRules.auto_approve_threshold}
  - Required Evidence: ${policyRules.required_evidence.join(', ')}
  - Acceptable Reasons: ${policyRules.acceptable_reasons.join(', ')}
  
  **Decision Criteria:**
  
  1. **AUTO_APPROVE** if:
     - Within return window
     - Order value below auto-approval threshold
     - Valid reason provided
     - Required evidence present (if applicable)
     - Low customer risk score (< 0.3)
  
  2. **AUTO_DENY** if:
     - Outside return window
     - Invalid/unacceptable reason
     - Clear policy violation
     - High fraud risk indicators
  
  3. **HUMAN_REVIEW** if:
     - High order value (> auto-approval threshold)
     - Complex case requiring judgment
     - Unclear evidence
     - Medium customer risk score (0.3-0.7)
  
  **Response Format:**
  Respond in JSON format:
  {
    "decision": "auto_approve|auto_deny|human_review",
    "confidence": 0.0-1.0,
    "reasoning": "Detailed explanation of decision",
    "riskFactors": ["factor1", "factor2"],
    "policyViolations": ["violation1", "violation2"],
    "nextSteps": ["step1", "step2"]
  }`
    }
    
    private buildUserPrompt(requestData: ReturnRequestData): string {
      return `Please evaluate this return request:
  
  **Order Details:**
  - Order ID: ${requestData.orderId}
  - Customer Email: ${requestData.customerEmail}
  - Order Value: $${requestData.orderValue}
  - Days Since Purchase: ${requestData.daysSincePurchase}
  - Product Category: ${requestData.productCategory}
  
  **Return Request:**
  - Reason: ${requestData.reason}
  - Evidence Provided: ${requestData.evidenceUrls.length > 0 ? 'Yes' : 'No'}
  - Evidence URLs: ${requestData.evidenceUrls.join(', ') || 'None'}
  
  **Customer Profile:**
  - Risk Score: ${requestData.customerRiskScore}
  - Return History: ${requestData.returnHistory} previous returns
  
  Please analyze this request and provide your decision in the specified JSON format.`
    }
    
    private parseTriageResponse(content: string): TriageDecision {
      try {
        // Try to extract JSON from the response
        const jsonMatch = content.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0])
          return {
            decision: parsed.decision || 'human_review',
            confidence: parsed.confidence || 0.5,
            reasoning: parsed.reasoning || 'No reasoning provided',
            riskFactors: parsed.riskFactors || [],
            policyViolations: parsed.policyViolations || [],
            nextSteps: parsed.nextSteps || []
          }
        }
        
        // Fallback parsing if JSON extraction fails
        return {
          decision: 'human_review',
          confidence: 0.5,
          reasoning: 'Could not parse structured response, defaulting to human review',
          riskFactors: ['response_parsing_error'],
          policyViolations: [],
          nextSteps: ['Manual review required due to parsing error']
        }
        
      } catch (error) {
        console.error('Failed to parse triage response:', error)
        return {
          decision: 'human_review',
          confidence: 0.0,
          reasoning: 'Error parsing AI response, defaulting to human review',
          riskFactors: ['parsing_error'],
          policyViolations: [],
          nextSteps: ['Manual review required due to parsing error']
        }
      }
    }
    
    private async logTriageDecision(
      businessId: string,
      requestData: ReturnRequestData,
      decision: TriageDecision
    ): Promise<void> {
      try {
        const { createClient } = await import('npm:@supabase/supabase-js@2')
        const supabase = createClient(
          Deno.env.get('SUPABASE_URL') || '',
          Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
        )
        
        // Log to agent_performance_logs table
        await supabase.from('agent_performance_logs').insert({
          business_id: businessId,
          agent_type: 'triage',
          interaction_id: requestData.orderId,
          performance_metrics: {
            decision: decision.decision,
            confidence: decision.confidence,
            reasoning: decision.reasoning,
            riskFactors: decision.riskFactors,
            policyViolations: decision.policyViolations,
            nextSteps: decision.nextSteps
          },
          decision_quality_score: decision.confidence,
          created_at: new Date().toISOString()
        })
        
        // Also log to business_analytics for cost tracking
        await supabase.from('business_analytics').insert({
          business_id: businessId,
          metric_type: 'ai_accuracy',
          metric_data: {
            agent_type: 'triage',
            decision: decision.decision,
            confidence: decision.confidence,
            orderId: requestData.orderId,
            customerEmail: requestData.customerEmail,
            timestamp: new Date().toISOString()
          },
          calculated_at: new Date().toISOString()
        })
        
      } catch (error) {
        console.error('Failed to log triage decision to database:', error)
        // Fallback to console log if database fails
        console.log('Triage Decision Log:', {
          businessId,
          orderId: requestData.orderId,
          customerEmail: requestData.customerEmail,
          decision: decision.decision,
          confidence: decision.confidence,
          reasoning: decision.reasoning,
          riskFactors: decision.riskFactors,
          policyViolations: decision.policyViolations,
          timestamp: new Date().toISOString()
        })
      }
    }
  }

// Standalone Edge Function entry point
Deno.serve(async (req) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { requestData, policyRules, businessId } = await req.json()

    // Validate required fields
    if (!requestData || !policyRules || !businessId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: requestData, policyRules, and businessId' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Initialize Triage Agent
    const triageAgent = new TriageAgent()

    // Evaluate return request
    const triageDecision = await triageAgent.evaluateReturnRequest(
      requestData,
      policyRules,
      businessId
    )

    return new Response(
      JSON.stringify({ 
        success: true, 
        decision: triageDecision
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in triage-agent:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})