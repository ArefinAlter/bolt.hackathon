import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
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
    // Test environment variables
    const openaiKey = Deno.env.get('OPENAI_API_KEY')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('🔍 Environment Variables Check:');
    console.log('OpenAI API Key:', openaiKey ? '✅ SET' : '❌ NOT SET');
    console.log('Supabase URL:', supabaseUrl ? '✅ SET' : '❌ NOT SET');
    console.log('Service Role Key:', serviceRoleKey ? '✅ SET' : '❌ NOT SET');
    
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ 
          error: 'OPENAI_API_KEY not configured',
          message: 'Please set the OPENAI_API_KEY environment variable in your Supabase project'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
    // Test OpenAI API call
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: 'You are a helpful assistant.' },
            { role: 'user', content: 'Say "Hello, AI is working!"' }
          ],
          max_tokens: 50
        })
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`OpenAI API error: ${response.status} - ${errorText}`)
      }
      
      const data = await response.json()
      const content = data.choices[0].message.content
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'AI is working correctly!',
          openaiResponse: content,
          environment: {
            openaiKey: openaiKey ? 'SET' : 'NOT SET',
            supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
            serviceRoleKey: serviceRoleKey ? 'SET' : 'NOT SET'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
      
    } catch (openaiError) {
      return new Response(
        JSON.stringify({ 
          error: 'OpenAI API test failed',
          message: openaiError.message,
          environment: {
            openaiKey: openaiKey ? 'SET' : 'NOT SET',
            supabaseUrl: supabaseUrl ? 'SET' : 'NOT SET',
            serviceRoleKey: serviceRoleKey ? 'SET' : 'NOT SET'
          }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }
    
  } catch (error) {
    console.error('Error in test-ai-agents:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
