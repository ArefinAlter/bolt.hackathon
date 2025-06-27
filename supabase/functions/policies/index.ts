import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface Database {
  public: {
    Tables: {
      policies: {
        Row: {
          id: number
          business_id: string
          version: string
          is_active: boolean
          effective_date: string
          rules: any
          created_at: string
        }
        Insert: {
          business_id: string
          version: string
          is_active?: boolean
          effective_date: string
          rules: any
        }
        Update: {
          version?: string
          is_active?: boolean
          effective_date?: string
          rules?: any
        }
      }
      profiles: {
        Row: {
          id: string
          business_id: string
          business_name: string
        }
      }
    }
  }
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client
    const supabaseClient = createClient<Database>(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Get current user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const url = new URL(req.url)
    const segments = url.pathname.split('/').filter(Boolean)
    
    // Route handling
    if (req.method === 'GET' && segments.length === 1) {
      // GET /policies?business_id=xxx
      return await getPolicies(req, supabaseClient, user.id)
    }
    
    if (req.method === 'POST' && segments.length === 1) {
      // POST /policies
      return await createPolicy(req, supabaseClient, user.id)
    }
    
    if (req.method === 'PUT' && segments.length === 2) {
      const policyId = segments[1]
      // PUT /policies/:id
      return await updatePolicy(req, supabaseClient, user.id, policyId)
    }
    
    if (req.method === 'PUT' && segments.length === 3 && segments[2] === 'activate') {
      const policyId = segments[1]
      // PUT /policies/:id/activate
      return await activatePolicy(req, supabaseClient, user.id, policyId)
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// Get all policies for a business
async function getPolicies(req: Request, supabase: any, userId: string) {
  const url = new URL(req.url)
  const businessId = url.searchParams.get('business_id')
  
  if (!businessId) {
    return new Response(
      JSON.stringify({ error: 'business_id required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify user has access to this business
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', userId)
    .single()

  if (!profile || profile.business_id !== businessId) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Get policies
  const { data: policies, error } = await supabase
    .from('policies')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return new Response(
    JSON.stringify({ success: true, data: policies }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Create new policy
async function createPolicy(req: Request, supabase: any, userId: string) {
  const body = await req.json()
  const { business_id, version, rules, effective_date } = body

  // Verify user has access to this business
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', userId)
    .single()

  if (!profile || profile.business_id !== business_id) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Check if version already exists
  const { data: existingPolicy } = await supabase
    .from('policies')
    .select('id')
    .eq('business_id', business_id)
    .eq('version', version)
    .single()

  if (existingPolicy) {
    return new Response(
      JSON.stringify({ error: 'Policy version already exists' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Create policy
  const { data: newPolicy, error } = await supabase
    .from('policies')
    .insert({
      business_id,
      version,
      rules,
      effective_date,
      is_active: false
    })
    .select()

  if (error) {
    throw error
  }

  // Log policy change
  const { error: historyError } = await supabase
    .from('policy_change_history')
    .insert([
      {
        business_id,
        policy_id: newPolicy[0].id,
        change_type: 'created',
        change_data: {
          version,
          rules,
          effective_date,
          created_by: userId
        },
        created_at: new Date().toISOString()
      }
    ])

  if (historyError) {
    console.error('Error logging policy change:', historyError)
  }

  return new Response(
    JSON.stringify({ success: true, data: newPolicy[0] }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Update existing policy
async function updatePolicy(req: Request, supabase: any, userId: string, policyId: string) {
  const body = await req.json()
  const { business_id, version, rules, effective_date } = body

  // Verify user has access to this business
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', userId)
    .single()

  if (!profile || profile.business_id !== business_id) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Verify policy exists and belongs to business
  const { data: existingPolicy } = await supabase
    .from('policies')
    .select('business_id, is_active')
    .eq('id', policyId)
    .single()

  if (!existingPolicy || existingPolicy.business_id !== business_id) {
    return new Response(
      JSON.stringify({ error: 'Policy not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  if (existingPolicy.is_active) {
    return new Response(
      JSON.stringify({ error: 'Cannot edit active policy' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Update policy
  const { data: updatedPolicy, error } = await supabase
    .from('policies')
    .update({ version, rules, effective_date })
    .eq('id', policyId)
    .select()
    .single()

  if (error) {
    throw error
  }

  // Log policy change
  const { error: historyError } = await supabase
    .from('policy_change_history')
    .insert([
      {
        business_id,
        policy_id: policyId,
        change_type: 'updated',
        change_data: {
          version,
          rules,
          effective_date,
          updated_by: userId
        },
        created_at: new Date().toISOString()
      }
    ])

  if (historyError) {
    console.error('Error logging policy change:', historyError)
  }

  return new Response(
    JSON.stringify({ success: true, data: updatedPolicy }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Activate policy
async function activatePolicy(req: Request, supabase: any, userId: string, policyId: string) {
  const body = await req.json()
  const { business_id } = body

  // Verify user has access to this business
  const { data: profile } = await supabase
    .from('profiles')
    .select('business_id')
    .eq('id', userId)
    .single()

  if (!profile || profile.business_id !== business_id) {
    return new Response(
      JSON.stringify({ error: 'Access denied' }),
      { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Deactivate all policies for this business
  await supabase
    .from('policies')
    .update({ is_active: false })
    .eq('business_id', business_id)

  // Activate the selected policy
  const { data: activatedPolicy, error } = await supabase
    .from('policies')
    .update({ 
      is_active: true,
      effective_date: new Date().toISOString()
    })
    .eq('id', policyId)
    .eq('business_id', business_id)
    .select()
    .single()

  if (error) {
    throw error
  }

  if (!activatedPolicy) {
    return new Response(
      JSON.stringify({ error: 'Policy not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  // Log policy activation
  const { error: historyError } = await supabase
    .from('policy_change_history')
    .insert([
      {
        business_id,
        policy_id: policyId,
        change_type: 'activated',
        change_data: {
          activated_by: userId,
          effective_date: activatedPolicy.effective_date
        },
        created_at: new Date().toISOString()
      }
    ])

  if (historyError) {
    console.error('Error logging policy change:', historyError)
  }

  return new Response(
    JSON.stringify({ success: true, data: activatedPolicy }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}