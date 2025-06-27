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
    const { CustomerServiceAgent } = await import('../customer-service-agent')
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { session_id, message, sender, message_type, metadata } = await req.json()

    // Validate required fields
    if (!session_id || !message || !sender) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, message, sender' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify session exists and get business context
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('*, profiles!business_id(*)')
      .eq('id', session_id)
      .single()

    if (sessionError || !session) {
      return new Response(
        JSON.stringify({ error: 'Chat session not found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // Store user message
    const { data: userMessage, error: messageError } = await supabaseClient
      .from('chat_messages')
      .insert([
        {
          session_id,
          sender,
          message,
          message_type: message_type || 'text',
          metadata: metadata || {}
        }
      ])
      .select()
      .single()

    if (messageError) {
      throw messageError
    }

    let agentResponse: string | null = null

    // If user message, generate AI response using CustomerServiceAgent
    if (sender === 'user') {
      // Initialize AI agent
      const customerServiceAgent = new CustomerServiceAgent()
      
      // Get conversation history for context
      const { data: conversationHistory } = await supabaseClient
        .from('chat_messages')
        .select('*')
        .eq('session_id', session_id)
        .order('created_at', { ascending: true })

      // Prepare agent context
      const agentContext = {
        businessId: session.business_id || '123e4567-e89b-12d3-a456-426614174000',
        customerEmail: session.customer_email,
        sessionId: session_id,
        userRole: 'customer' as const,
        timestamp: new Date().toISOString()
      }

      // Get AI response
      const aiResponse = await customerServiceAgent.processChatMessage(
        message,
        agentContext,
        conversationHistory || []
      )

      if (aiResponse.success) {
        agentResponse = aiResponse.message

        // If return request detected, create return request
        if (aiResponse.data?.returnRequest) {
          const returnRequest = aiResponse.data.returnRequest
          
          // Check if order exists
          // Note: mock_orders are shared demo data for hackathon purposes
          // In production, this would be business-specific order data
          const { data: order } = await supabaseClient
            .from('mock_orders')
            .select('*')
            .eq('order_id', returnRequest.orderId)
            .single()

          if (order) {
            // Create return request
            const { data: newReturnRequest } = await supabaseClient
              .from('return_requests')
              .insert([
                {
                  business_id: session.business_id,
                  order_id: returnRequest.orderId,
                  customer_email: returnRequest.customerEmail,
                  reason_for_return: returnRequest.reason,
                  conversation_log: [
                    {
                      message: message,
                      timestamp: new Date().toISOString(),
                      sender: 'customer'
                    }
                  ]
                }
              ])
              .select()
              .single()

            if (newReturnRequest) {
              // Update agent response with return portal link
              agentResponse += `\n\nI've created a return request for you with ID ${newReturnRequest.public_id}. You can access your return portal here: ${Deno.env.get('SITE_URL')}/return/${newReturnRequest.public_id}`
            }
          }
        }
      } else {
        // Fallback response if AI fails
        agentResponse = "I'm here to help with your return or refund request. Could you please provide your order number and describe the issue you're experiencing?"
      }

      // Store agent response
      if (agentResponse) {
        const { data: response } = await supabaseClient
          .from('chat_messages')
          .insert([
            {
              session_id,
              sender: 'agent',
              message: agentResponse,
              message_type: 'text',
              metadata: {
                return_detected: !!aiResponse.data?.returnRequest,
                next_action: aiResponse.nextAction
              }
            }
          ])
          .select()
          .single()

        return new Response(
          JSON.stringify({ 
            success: true,
            user_message: userMessage,
            agent_response: response,
            return_detected: !!aiResponse.data?.returnRequest
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: userMessage
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in send-chat-message:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
