import { serve } from 'https://deno.land/std@0.220.0/http/server.ts'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const agentId = Deno.env.get('ELEVENLABS_CONVERSATIONAL_AGENT_ID') || 'agent_01jyy0m7raf6p9gmw9cvhzvm2f'
    const apiKey = Deno.env.get('ELEVENLABS_API_KEY')

    if (!apiKey) {
      throw new Error('ELEVENLABS_API_KEY not configured')
    }

    // Test 1: Check if agent exists
    console.log('Testing agent access...')
    const agentResponse = await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey
      }
    })

    if (!agentResponse.ok) {
      const errorData = await agentResponse.json()
      throw new Error(`Agent not found: ${errorData.detail || agentResponse.statusText}`)
    }

    const agentData = await agentResponse.json()
    console.log('Agent found:', agentData.name)

    // Test 2: Create a test conversation with webhook
    console.log('Creating test conversation...')
    const conversationResponse = await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}/conversations`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: 'Test Conversation',
        description: 'Testing webhook configuration',
        webhook_url: `${supabaseUrl}/functions/v1/handle-call-webhook`,
        webhook_events: ['conversation_started', 'conversation_ended', 'message_received', 'message_sent'],
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      })
    })

    if (!conversationResponse.ok) {
      const errorData = await conversationResponse.json()
      throw new Error(`Failed to create conversation: ${errorData.detail || conversationResponse.statusText}`)
    }

    const conversationData = await conversationResponse.json()
    console.log('Test conversation created:', conversationData.conversation_id)

    // Test 3: Send a test message
    console.log('Sending test message...')
    const messageResponse = await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}/conversations/${conversationData.conversation_id}/messages`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message: 'Hello, this is a test message to verify webhook configuration.',
        message_type: 'text'
      })
    })

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json()
      throw new Error(`Failed to send message: ${errorData.detail || messageResponse.statusText}`)
    }

    const messageData = await messageResponse.json()
    console.log('Test message sent successfully')

    // Test 4: End the conversation
    console.log('Ending test conversation...')
    await fetch(`https://api.elevenlabs.io/v1/agents/${agentId}/conversations/${conversationData.conversation_id}`, {
      method: 'DELETE',
      headers: {
        'xi-api-key': apiKey
      }
    })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Webhook test completed successfully',
        agent_name: agentData.name,
        conversation_id: conversationData.conversation_id,
        webhook_url: `${supabaseUrl}/functions/v1/handle-call-webhook`,
        instructions: [
          '1. Check your Supabase function logs for webhook events',
          '2. Verify that handle-call-webhook function received events',
          '3. Check that conversation events are logged in your database'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Webhook test error:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        instructions: [
          '1. Verify ELEVENLABS_API_KEY is set in Supabase secrets',
          '2. Check that agent ID is correct',
          '3. Ensure handle-call-webhook function is deployed',
          '4. Verify webhook URL is accessible from ElevenLabs'
        ]
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
}) 