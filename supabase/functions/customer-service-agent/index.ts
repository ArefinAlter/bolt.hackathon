import { AgentConfig, AgentContext, AgentResponse, sanitizeInput } from '../agent-config'
import { serve } from "https://deno.land/std@0.220.0/http/server.ts"

export interface ReturnRequest {
  orderId: string
  reason: string
  customerEmail: string
  evidenceUrls?: string[]
  confidence: number
}

export class CustomerServiceAgent {
  private config: AgentConfig
  
  constructor() {
    this.config = {
      name: 'Customer Service Agent',
      role: 'customer-service',
      model: 'gpt-4o',
      temperature: 0.1,
      maxTokens: 2000,
      systemPrompt: this.getSystemPrompt(),
      securityLevel: 'medium',
      allowedActions: ['greet', 'detect_return', 'request_evidence', 'explain_process', 'escalate'],
      rateLimit: {
        requestsPerMinute: 60,
        requestsPerHour: 1000
      }
    }
  }
  
  async processChatMessage(
    message: string,
    context: AgentContext,
    conversationHistory: any[] = []
  ): Promise<AgentResponse> {
    // Sanitize input
    const sanitizedMessage = sanitizeInput(message)
    
    // Detect return request
    const returnRequest = this.detectReturnRequestInMessage(sanitizedMessage, context)
    
    // Build conversation context
    const messages = this.buildConversationContext(
      conversationHistory,
      sanitizedMessage,
      returnRequest,
      context
    )
    
    // Get AI response using OpenAI
    const response = await this.callOpenAI(messages, context)
    
    // Enhance response with return request data if detected
    if (returnRequest && returnRequest.confidence > 0.7) {
      response.data = {
        ...response.data,
        returnRequest,
        nextAction: 'initiate_return_process'
      }
    }

    // Add call-specific enhancements
    if (context.callSessionId) {
      response.data = {
        ...response.data,
        callContext: {
          sessionId: context.callSessionId,
          provider: context.provider,
          callType: context.callType
        },
        isCallInteraction: true
      }
    }
    
    return response
  }
  
  private detectReturnRequestInMessage(message: string, context: AgentContext): ReturnRequest | null {
    const lowerMessage = message.toLowerCase()
    const returnKeywords = ['return', 'refund', 'broken', 'defective', 'wrong', 'damaged']
    
    const hasReturnKeywords = returnKeywords.some(
      keyword => lowerMessage.includes(keyword)
    )
    
    if (!hasReturnKeywords) {
      return null
    }
    
    // Extract order ID
    const orderIdMatch = message.match(/ORDER-\d+/i)
    const orderId = orderIdMatch ? orderIdMatch[0].toUpperCase() : null
    
    // Calculate confidence
    let confidence = 0.5
    if (orderId) confidence += 0.3
    if (lowerMessage.includes('return') || lowerMessage.includes('refund')) confidence += 0.2
    
    return {
      orderId: orderId || 'UNKNOWN',
      reason: this.extractReturnReasonFromMessage(message),
      customerEmail: context.customerEmail || 'unknown@example.com',
      confidence: Math.min(confidence, 1.0)
    }
  }
  
  private extractReturnReasonFromMessage(message: string): string {
    const reasons = ['defective', 'broken', 'wrong item', 'damaged', 'not as described']
    const lowerMessage = message.toLowerCase()
    const foundReason = reasons.find(reason => lowerMessage.includes(reason))
    return foundReason || 'general issue'
  }
  
  private buildConversationContext(
    history: any[],
    currentMessage: string,
    returnRequest: ReturnRequest | null,
    context: AgentContext
  ): any[] {
    const messages = [
      {
        role: 'system',
        content: this.getSystemPrompt()
      }
    ]
    
    // Add conversation history
    const recentHistory = history.slice(-10)
    messages.push(...recentHistory)
    
    // Add current message with context
    let enhancedMessage = currentMessage
    if (returnRequest) {
      enhancedMessage += `\n\n[RETURN_REQUEST_DETECTED: Order ${returnRequest.orderId}, Reason: ${returnRequest.reason}, Confidence: ${returnRequest.confidence}]`
    }
    
    messages.push({
      role: 'user',
      content: enhancedMessage
    })
    
    return messages
  }
  
  private async callOpenAI(messages: any[], context: AgentContext): Promise<AgentResponse> {
    try {
      const apiKey = Deno.env.get('OPENAI_API_KEY')
      if (!apiKey) {
        throw new Error('OPENAI_API_KEY not configured')
      }
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.config.model,
          messages,
          temperature: this.config.temperature,
          max_tokens: this.config.maxTokens
        })
      })
      
      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }
      
      const data = await response.json()
      const content = data.choices[0].message.content
      
      // Log interaction to database
      await this.logInteraction(context, {
        model: data.model,
        usage: data.usage,
        response: content,
        success: true
      })
      
      return {
        success: true,
        message: content,
        data: {
          model: data.model,
          usage: data.usage
        }
      }
      
    } catch (error) {
      console.error('OpenAI API Error:', error)
      
      // Log failed interaction
      await this.logInteraction(context, {
        error: error.message,
        success: false
      })
      
      return {
        success: false,
        message: 'I apologize, but I encountered an error processing your request. Please try again.',
        data: { error: error.message }
      }
    }
  }
  
  private async logInteraction(context: AgentContext, interactionData: any): Promise<void> {
    try {
      const { createClient } = await import('npm:@supabase/supabase-js@2')
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') || '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      )
      
      // Log to agent_performance_logs table
      await supabase.from('agent_performance_logs').insert({
        business_id: context.businessId,
        agent_type: 'customer_service',
        interaction_id: context.sessionId || context.callSessionId,
        performance_metrics: {
          success: interactionData.success,
          model: interactionData.model,
          usage: interactionData.usage,
          error: interactionData.error,
          response: interactionData.response?.substring(0, 500) // Truncate long responses
        },
        response_time_ms: Date.now() - new Date(context.timestamp).getTime(),
        created_at: new Date().toISOString()
      })
      
      // Log to business_analytics for cost tracking
      if (interactionData.usage) {
        await supabase.from('business_analytics').insert({
          business_id: context.businessId,
          metric_type: 'ai_accuracy',
          metric_data: {
            agent_type: 'customer_service',
            promptTokens: interactionData.usage.prompt_tokens,
            completionTokens: interactionData.usage.completion_tokens,
            totalTokens: interactionData.usage.total_tokens,
            estimatedCost: this.calculateCost(interactionData.usage.total_tokens),
            sessionId: context.sessionId,
            callSessionId: context.callSessionId,
            timestamp: new Date().toISOString()
          },
          calculated_at: new Date().toISOString()
        })
      }
      
    } catch (error) {
      console.error('Failed to log interaction to database:', error)
      // Fallback to console log if database fails
      console.log('Customer Service Interaction Log:', {
        businessId: context.businessId,
        sessionId: context.sessionId,
        callSessionId: context.callSessionId,
        success: interactionData.success,
        timestamp: new Date().toISOString()
      })
    }
  }
  
  private calculateCost(totalTokens: number): number {
    // GPT-4o pricing (as of 2024): $0.005 per 1K input tokens, $0.015 per 1K output tokens
    const costPer1KTokens = 0.01 // Average cost
    return (totalTokens / 1000) * costPer1KTokens
  }
  
  private getSystemPrompt(): string {
    return `You are a professional Customer Service Agent for an e-commerce return management platform. Your role is to:

1. **Greet customers warmly** and provide excellent service
2. **Detect return requests** when customers mention issues with their orders
3. **Guide customers** through the return process step by step
4. **Request evidence** when appropriate (photos, videos) for defective items
5. **Explain policies** clearly and professionally
6. **Escalate complex cases** to human review when necessary

**Key Guidelines:**
- Always be polite, professional, and empathetic
- If a return request is detected, acknowledge it and guide the customer
- Ask for order ID if not provided: "Could you please provide your order number?"
- For defective items, request evidence: "Could you please share a photo of the issue?"
- Explain the process: "I'll help you process your return. Here's what happens next..."
- Set clear expectations: "Your return will be reviewed within 24 hours"

Respond naturally and conversationally while following these guidelines.`
  }

  // Add call-specific methods
  async processCallMessage(
    message: string,
    context: AgentContext,
    callTranscripts: any[] = []
  ): Promise<AgentResponse> {
    // Enhanced context for call interactions
    const callContext = {
      ...context,
      isCallInteraction: true,
      callTranscripts: callTranscripts
    }

    return this.processChatMessage(message, callContext, callTranscripts)
  }

  async generateCallGreeting(context: AgentContext): Promise<string> {
    const greetingMessages = [
      "Hello! I'm here to help you with your return or refund request. How can I assist you today?",
      "Hi there! I'm ready to help you with any questions about returns or refunds. What can I do for you?",
      "Welcome! I'm your customer service assistant. I can help you with returns, refunds, or any other questions you might have.",
      "Good day! I'm here to provide excellent customer service. How may I help you today?"
    ]

    // Select appropriate greeting based on context
    const index = Math.floor(Math.random() * greetingMessages.length)
    return greetingMessages[index]
  }

  async generateCallFarewell(context: AgentContext): Promise<string> {
    const farewellMessages = [
      "Thank you for contacting us today. Is there anything else I can help you with?",
      "I appreciate you reaching out. Please don't hesitate to contact us again if you need further assistance.",
      "Thank you for your time today. Have a wonderful day!",
      "It was a pleasure helping you today. Take care!"
    ]

    const index = Math.floor(Math.random() * farewellMessages.length)
    return farewellMessages[index]
  }

  async detectCallIntent(message: string): Promise<{
    intent: string
    confidence: number
    entities: any
  }> {
    const lowerMessage = message.toLowerCase()
    
    // Intent detection
    const intents = {
      return_request: ['return', 'refund', 'send back', 'get money back'],
      order_status: ['order', 'track', 'where is', 'shipping'],
      complaint: ['complaint', 'problem', 'issue', 'wrong', 'broken'],
      general_help: ['help', 'support', 'assist', 'question'],
      goodbye: ['bye', 'goodbye', 'end', 'finish', 'done']
    }

    let detectedIntent = 'general_help'
    let maxConfidence = 0

    for (const [intent, keywords] of Object.entries(intents)) {
      const matches = keywords.filter(keyword => lowerMessage.includes(keyword))
      const confidence = matches.length / keywords.length
      
      if (confidence > maxConfidence) {
        maxConfidence = confidence
        detectedIntent = intent
      }
    }

    // Entity extraction
    const entities = {
      orderId: this.extractOrderId(message),
      reason: this.extractReturnReasonFromMessage(message),
      urgency: this.detectUrgency(message)
    }

    return {
      intent: detectedIntent,
      confidence: maxConfidence,
      entities
    }
  }

  private extractOrderId(message: string): string | null {
    const orderIdMatch = message.match(/ORDER-\d+/i)
    return orderIdMatch ? orderIdMatch[0].toUpperCase() : null
  }

  private detectUrgency(message: string): 'low' | 'medium' | 'high' {
    const lowerMessage = message.toLowerCase()
    
    if (lowerMessage.includes('urgent') || lowerMessage.includes('asap') || lowerMessage.includes('emergency')) {
      return 'high'
    } else if (lowerMessage.includes('soon') || lowerMessage.includes('quick')) {
      return 'medium'
    }
    
    return 'low'
  }
}
