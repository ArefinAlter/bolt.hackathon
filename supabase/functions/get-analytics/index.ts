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
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const business_id = url.searchParams.get('business_id')
    const metric_type = url.searchParams.get('metric_type') || 'all' // all, returns, ai_accuracy, satisfaction, policy
    const demo_mode = url.searchParams.get('demo_mode') === 'true'

    if (!business_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameter: business_id' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    if (demo_mode) {
      // Return demo analytics data without database queries
      const demoAnalytics = {
        returns: {
          total_returns: 45,
          approved_returns: 32,
          denied_returns: 8,
          pending_review: 5,
          approval_rate: '71.1',
          trend: {
            recent_period: 15,
            previous_period: 12,
            change_percentage: '25.0'
          }
        },
        ai_accuracy: {
          total_ai_decisions: 38,
          correct_decisions: 34,
          accuracy_rate: '89.5'
        },
        satisfaction: {
          total_interactions: 156,
          positive_interactions: 142,
          negative_interactions: 8,
          satisfaction_score: '85.9',
          response_time_avg: '2.3s'
        },
        policy: {
          total_policies: 3,
          active_policy: 'v2.1',
          policy_changes: 2,
          current_approval_rate: '71.1',
          policy_effectiveness: 'High'
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          business_id,
          analytics: demoAnalytics,
          demo_mode: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let analytics = {}

    // Get return request metrics
    if (metric_type === 'all' || metric_type === 'returns') {
      analytics.returns = await getReturnMetrics(supabaseClient, business_id)
    }

    // Get AI accuracy metrics
    if (metric_type === 'all' || metric_type === 'ai_accuracy') {
      analytics.ai_accuracy = await getAIAccuracyMetrics(supabaseClient, business_id)
    }

    // Get customer satisfaction metrics
    if (metric_type === 'all' || metric_type === 'satisfaction') {
      analytics.satisfaction = await getSatisfactionMetrics(supabaseClient, business_id)
    }

    // Get policy effectiveness metrics
    if (metric_type === 'all' || metric_type === 'policy') {
      analytics.policy = await getPolicyMetrics(supabaseClient, business_id)
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        business_id,
        analytics
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in get-analytics:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function getReturnMetrics(supabase: any, businessId: string) {
  const { data: returns } = await supabase
    .from('return_requests')
    .select('status, created_at')
    .eq('business_id', businessId)

  if (!returns) return {}

  const total = returns.length
  const approved = returns.filter(r => r.status === 'approved').length
  const denied = returns.filter(r => r.status === 'denied').length
  const pending = returns.filter(r => r.status === 'pending_review').length

  // Calculate trends (last 30 days vs previous 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000)
  
  const recentReturns = returns.filter(r => new Date(r.created_at) > thirtyDaysAgo)
  const previousReturns = returns.filter(r => {
    const date = new Date(r.created_at)
    return date > sixtyDaysAgo && date <= thirtyDaysAgo
  })

  return {
    total_returns: total,
    approved_returns: approved,
    denied_returns: denied,
    pending_review: pending,
    approval_rate: total > 0 ? (approved / total * 100).toFixed(1) : 0,
    trend: {
      recent_period: recentReturns.length,
      previous_period: previousReturns.length,
      change_percentage: previousReturns.length > 0 ? 
        ((recentReturns.length - previousReturns.length) / previousReturns.length * 100).toFixed(1) : 0
    }
  }
}

async function getAIAccuracyMetrics(supabase: any, businessId: string) {
  const { data: returns } = await supabase
    .from('return_requests')
    .select('ai_recommendation, status, admin_notes')
    .eq('business_id', businessId)
    .not('ai_recommendation', 'is', null)

  if (!returns) return {}

  const aiDecisions = returns.filter(r => r.ai_recommendation && r.status !== 'pending_triage')
  const correctDecisions = aiDecisions.filter(r => {
    if (r.ai_recommendation === 'auto_approve' && r.status === 'approved') return true
    if (r.ai_recommendation === 'auto_deny' && r.status === 'denied') return true
    return false
  })

  return {
    total_ai_decisions: aiDecisions.length,
    correct_decisions: correctDecisions.length,
    accuracy_rate: aiDecisions.length > 0 ? (correctDecisions.length / aiDecisions.length * 100).toFixed(1) : 0
  }
}

async function getSatisfactionMetrics(supabase: any, businessId: string) {
  // This would typically come from customer feedback/surveys
  // For now, we'll use chat message sentiment as a proxy
  const { data: chatMessages } = await supabase
    .from('chat_messages')
    .select('message, created_at')
    .eq('sender', 'user')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (!chatMessages) return {}

  // Simple sentiment analysis based on keywords
  const positiveWords = ['thank', 'great', 'good', 'excellent', 'happy', 'satisfied', 'helpful']
  const negativeWords = ['bad', 'terrible', 'awful', 'angry', 'frustrated', 'disappointed', 'unhappy']

  let positiveCount = 0
  let negativeCount = 0

  chatMessages.forEach(msg => {
    const text = msg.message.toLowerCase()
    if (positiveWords.some(word => text.includes(word))) positiveCount++
    if (negativeWords.some(word => text.includes(word))) negativeCount++
  })

  const total = chatMessages.length
  const satisfactionScore = total > 0 ? ((positiveCount - negativeCount) / total * 100 + 50).toFixed(1) : 50

  return {
    total_interactions: total,
    positive_interactions: positiveCount,
    negative_interactions: negativeCount,
    satisfaction_score: satisfactionScore,
    response_time_avg: '2.3s' // Placeholder
  }
}

async function getPolicyMetrics(supabase: any, businessId: string) {
  const { data: policies } = await supabase
    .from('policies')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  const { data: returns } = await supabase
    .from('return_requests')
    .select('status, created_at')
    .eq('business_id', businessId)

  if (!policies || !returns) return {}

  const activePolicy = policies.find(p => p.is_active)
  const totalPolicies = policies.length
  const policyChanges = policies.length - 1 // Assuming first policy was initial

  // Calculate policy effectiveness (simplified)
  const recentReturns = returns.filter(r => new Date(r.created_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))
  const approvalRate = recentReturns.length > 0 ? 
    recentReturns.filter(r => r.status === 'approved').length / recentReturns.length * 100 : 0

  return {
    total_policies: totalPolicies,
    active_policy: activePolicy ? activePolicy.version : 'None',
    policy_changes: policyChanges,
    current_approval_rate: approvalRate.toFixed(1),
    policy_effectiveness: approvalRate > 70 ? 'High' : approvalRate > 50 ? 'Medium' : 'Low'
  }
} 