import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { CustomerServiceAgent } from '../customer-service-agent/index.ts'
import { TriageAgent } from '../triage-agent/index.ts'
import { PolicyMCPServer } from '../policy-mcp-server/index.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { testType, data } = await req.json()
    
    let result: any
    
    switch (testType) {
      case 'customer_service':
        const customerAgent = new CustomerServiceAgent()
        result = await customerAgent.processMessage(
          data.message,
          data.context,
          data.history || []
        )
        break
        
      case 'triage':
        const triageAgent = new TriageAgent()
        result = await triageAgent.evaluateReturnRequest(
          data.requestData,
          data.policyRules,
          data.businessId
        )
        break
        
      case 'policy_mcp':
        const policyServer = new PolicyMCPServer()
        result = await policyServer.handleRequest(data.request)
        break
        
      default:
        throw new Error(`Unknown test type: ${testType}`)
    }
    
    return new Response(
      JSON.stringify({ success: true, result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
