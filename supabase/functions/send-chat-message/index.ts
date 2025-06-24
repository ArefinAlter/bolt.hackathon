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

    const { session_id, message, sender, message_type, metadata } = await req.json()

    // Validate required fields
    if (!session_id || !message || !sender) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: session_id, message, sender' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Verify session exists
    const { data: session, error: sessionError } = await supabaseClient
      .from('chat_sessions')
      .select('*')
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

    let agentResponse = null

    // If user message, generate AI response
    if (sender === 'user') {
      // Check if message mentions return/refund
      const isReturnRequest = /return|refund|broken|defective|wrong|damaged/i.test(message)
      
      if (isReturnRequest) {
        // Extract order ID if mentioned
        const orderIdMatch = message.match(/ORDER-\d+/i)
        
        if (orderIdMatch) {
          const orderId = orderIdMatch[0].toUpperCase()
          
          // Check if order exists
          const { data: order } = await supabaseClient
            .from('mock_orders')
            .select('*')
            .eq('order_id', orderId)
            .single()

          if (order) {
            // Create return request
            const { data: returnRequest } = await supabaseClient
              .from('return_requests')
              .insert([
                {
                  business_id: session.business_id || '123e4567-e89b-12d3-a456-426614174000',
                  order_id: orderId,
                  customer_email: order.customer_email,
                  reason_for_return: message,
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

            if (returnRequest) {
              agentResponse = `I've found your order ${orderId} for ${order.product_name}. I understand you're having an issue with this item. I've created a return request for you with ID ${returnRequest.public_id}. 

Would you like me to process this return automatically, or would you prefer to upload some evidence first? You can access your return portal here: ${Deno.env.get('SITE_URL')}/return/${returnRequest.public_id}`
            }
          } else {
            agentResponse = `I couldn't find order ${orderId} in our system. Could you please double-check the order number? You can find it in your confirmation email.`
          }
        } else {
          agentResponse = `I'd be happy to help you with your return request! Could you please provide your order number? It should look like ORDER-12345.`
        }
      } else {
        // General AI response
        agentResponse = `I understand you're reaching out about an issue. I'm here to help with returns, refunds, and order problems. Could you tell me more about what's wrong with your order?`
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
              message_type: 'text'
            }
          ])
          .select()
          .single()

        return new Response(
          JSON.stringify({ 
            success: true,
            user_message: userMessage,
            agent_response: response
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