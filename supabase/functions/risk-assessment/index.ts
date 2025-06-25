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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const url = new URL(req.url)
    const action = url.pathname.split('/').pop()

    switch (action) {
      case 'calculate':
        return await calculateRiskScore(req, supabase)
      case 'update':
        return await updateCustomerProfile(req, supabase)
      case 'profile':
        return await getCustomerRiskProfile(req, supabase)
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

async function calculateRiskScore(req: Request, supabase: any) {
  const { customer_email, business_id, order_value, return_reason } = await req.json()

  // Get or create customer risk profile
  let { data: profile } = await supabase
    .from('customer_risk_profiles')
    .select('*')
    .eq('customer_email', customer_email)
    .eq('business_id', business_id)
    .single()

  if (!profile) {
    const { data: newProfile } = await supabase
      .from('customer_risk_profiles')
      .insert({
        customer_email,
        business_id,
        risk_score: 0.5,
        return_frequency: 0
      })
      .select()
      .single()
    profile = newProfile
  }

  // Calculate risk factors
  let riskScore = 0.5 // Base risk
  const riskFactors = []

  // Factor 1: Return frequency
  if (profile.return_frequency > 5) {
    riskScore += 0.2
    riskFactors.push('High return frequency')
  } else if (profile.return_frequency > 2) {
    riskScore += 0.1
    riskFactors.push('Moderate return frequency')
  }

  // Factor 2: Order value vs return frequency
  if (order_value > 500 && profile.return_frequency > 1) {
    riskScore += 0.15
    riskFactors.push('High value + return history')
  }

  // Factor 3: Suspicious return reasons
  const suspiciousReasons = ['wrong item', 'not as described', 'defective']
  if (suspiciousReasons.some(reason => 
    return_reason?.toLowerCase().includes(reason)
  )) {
    riskScore += 0.05
    riskFactors.push('Potentially suspicious reason')
  }

  // Factor 4: Recent return frequency (last 30 days)
  const { data: recentReturns } = await supabase
    .from('return_requests')
    .select('id')
    .eq('customer_email', customer_email)
    .eq('business_id', business_id)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())

  if (recentReturns && recentReturns.length > 2) {
    riskScore += 0.2
    riskFactors.push('Multiple recent returns')
  }

  // Cap risk score at 1.0
  riskScore = Math.min(riskScore, 1.0)

  // Update customer profile
  await supabase
    .from('customer_risk_profiles')
    .update({
      risk_score: riskScore,
      return_frequency: profile.return_frequency + 1,
      last_updated: new Date().toISOString(),
      behavior_patterns: {
        ...profile.behavior_patterns,
        last_risk_factors: riskFactors,
        last_calculated: new Date().toISOString()
      }
    })
    .eq('id', profile.id)

  return new Response(JSON.stringify({
    success: true,
    data: {
      risk_score: riskScore,
      risk_factors: riskFactors,
      recommendation: riskScore < 0.3 ? 'auto_approve' : 
                     riskScore < 0.7 ? 'manual_review' : 'high_risk_review'
    }
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function updateCustomerProfile(req: Request, supabase: any) {
  const { customer_email, business_id, fraud_indicator, behavior_data } = await req.json()

  const { data, error } = await supabase
    .from('customer_risk_profiles')
    .upsert({
      customer_email,
      business_id,
      fraud_indicators: fraud_indicator ? { [fraud_indicator]: true } : {},
      behavior_patterns: behavior_data || {},
      last_updated: new Date().toISOString()
    })
    .select()

  if (error) throw error

  return new Response(JSON.stringify({ success: true, data }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}

async function getCustomerRiskProfile(req: Request, supabase: any) {
  const url = new URL(req.url)
  const customer_email = url.searchParams.get('customer_email')
  const business_id = url.searchParams.get('business_id')

  const { data, error } = await supabase
    .from('customer_risk_profiles')
    .select('*')
    .eq('customer_email', customer_email)
    .eq('business_id', business_id)
    .single()

  if (error && error.code !== 'PGRST116') throw error

  return new Response(JSON.stringify({ 
    success: true, 
    data: data || null 
  }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}