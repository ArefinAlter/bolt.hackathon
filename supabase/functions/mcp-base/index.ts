export interface MCPRequest {
    id: string
    timestamp: string
    agentId: string
    businessId: string
    action: string
    data: any
    context: {
      sessionId?: string
      requestId?: string
      userRole: string
      // Call-specific context
      callSessionId?: string
      callType?: 'voice' | 'video'
      provider?: string
      isCallInteraction?: boolean
      streamingEnabled?: boolean
    }
  }
  
  export interface MCPResponse {
    id: string
    timestamp: string
    success: boolean
    data?: any
    error?: string
    auditTrail: {
      requestId: string
      agentId: string
      businessId: string
      action: string
      duration: number
      securityFlags: string[]
      // Call-specific audit info
      callSessionId?: string
      callType?: string
      provider?: string
    }
  }

  export interface CallContext {
    callSessionId: string
    callType: 'voice' | 'video'
    provider: string
    streamingEnabled: boolean
    participantCount: number
    callStatus: string
    aiConversationStateId?: string
    lastActivity: string
  }

  export interface ConversationContext {
    sessionId: string
    channel: 'chat' | 'voice' | 'video' | 'hybrid'
    participants: string[]
    conversationHistory: any[]
    currentIntent?: string
    escalationLevel: number
    aiAgentType: string
  }
  
  export abstract class MCPServer {
    protected serverId: string
    protected allowedActions: string[]
    protected securityLevel: 'low' | 'medium' | 'high'
    protected rateLimiter: Map<string, number[]> = new Map()
    protected circuitBreaker: Map<string, { failures: number; lastFailure: number }> = new Map()
    protected callSessions: Map<string, CallContext> = new Map()
    protected conversationSessions: Map<string, ConversationContext> = new Map()
    
    constructor(serverId: string, allowedActions: string[], securityLevel: 'low' | 'medium' | 'high' = 'medium') {
      this.serverId = serverId
      this.allowedActions = allowedActions
      this.securityLevel = securityLevel
    }
    
    async handleRequest(request: MCPRequest): Promise<MCPResponse> {
      const startTime = Date.now()
      
      try {
        // 1. Validate request
        const validation = this.validateRequest(request)
        if (!validation.valid) {
          return this.createErrorResponse(request, validation.error || 'Invalid request')
        }
        
        // 2. Check rate limiting
        if (!this.checkRateLimit(request.agentId)) {
          return this.createErrorResponse(request, 'Rate limit exceeded')
        }
        
        // 3. Check circuit breaker
        if (this.isCircuitBreakerOpen(request.agentId)) {
          return this.createErrorResponse(request, 'Service temporarily unavailable')
        }
        
        // 4. Process request
        const result = await this.processRequest(request)
        
        // 5. Record success
        this.recordSuccess(request.agentId)
        
        // 6. Create response
        const response = this.createSuccessResponse(request, result, Date.now() - startTime)
        
        return response
        
      } catch (error) {
        // Record failure
        this.recordFailure(request.agentId)
        
        return this.createErrorResponse(request, error.message)
      }
    }
    
    protected validateRequest(request: MCPRequest): { valid: boolean; error?: string } {
      // Check required fields
      if (!request.id || !request.agentId || !request.businessId || !request.action) {
        return { valid: false, error: 'Missing required fields' }
      }
      
      // Check allowed actions
      if (!this.allowedActions.includes(request.action)) {
        return { valid: false, error: `Action '${request.action}' not allowed` }
      }
      
      // Validate call-specific context if present
      if (request.context.isCallInteraction && !request.context.callSessionId) {
        return { valid: false, error: 'Call session ID required for call interactions' }
      }
      
      return { valid: true }
    }
    
    protected checkRateLimit(agentId: string): boolean {
      const now = Date.now()
      const windowMs = 60000 // 1 minute
      const maxRequests = 100 // Max requests per minute
      
      if (!this.rateLimiter.has(agentId)) {
        this.rateLimiter.set(agentId, [now])
        return true
      }
      
      const requests = this.rateLimiter.get(agentId)!
      const recentRequests = requests.filter(time => now - time < windowMs)
      
      if (recentRequests.length >= maxRequests) {
        return false
      }
      
      recentRequests.push(now)
      this.rateLimiter.set(agentId, recentRequests)
      return true
    }
    
    protected isCircuitBreakerOpen(agentId: string): boolean {
      const breaker = this.circuitBreaker.get(agentId)
      if (!breaker) return false
      
      const threshold = 5
      const timeout = 60000 // 1 minute
      
      if (breaker.failures >= threshold) {
        const timeSinceLastFailure = Date.now() - breaker.lastFailure
        if (timeSinceLastFailure < timeout) {
          return true
        } else {
          this.circuitBreaker.delete(agentId)
          return false
        }
      }
      
      return false
    }
    
    protected recordSuccess(agentId: string): void {
      this.circuitBreaker.delete(agentId)
    }
    
    protected recordFailure(agentId: string): void {
      const breaker = this.circuitBreaker.get(agentId) || { failures: 0, lastFailure: 0 }
      breaker.failures++
      breaker.lastFailure = Date.now()
      this.circuitBreaker.set(agentId, breaker)
    }
    
    protected createSuccessResponse(request: MCPRequest, data: any, duration: number): MCPResponse {
      return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        success: true,
        data,
        auditTrail: {
          requestId: request.id,
          agentId: request.agentId,
          businessId: request.businessId,
          action: request.action,
          duration,
          securityFlags: [],
          callSessionId: request.context.callSessionId,
          callType: request.context.callType,
          provider: request.context.provider
        }
      }
    }
    
    protected createErrorResponse(request: MCPRequest, error: string): MCPResponse {
      return {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        success: false,
        error,
        auditTrail: {
          requestId: request.id,
          agentId: request.agentId,
          businessId: request.businessId,
          action: request.action,
          duration: 0,
          securityFlags: ['error_response'],
          callSessionId: request.context.callSessionId,
          callType: request.context.callType,
          provider: request.context.provider
        }
      }
    }

    // Call-specific methods
    protected registerCallSession(callSessionId: string, context: CallContext): void {
      this.callSessions.set(callSessionId, context)
    }

    protected getCallSession(callSessionId: string): CallContext | undefined {
      return this.callSessions.get(callSessionId)
    }

    protected updateCallSession(callSessionId: string, updates: Partial<CallContext>): void {
      const session = this.callSessions.get(callSessionId)
      if (session) {
        this.callSessions.set(callSessionId, { ...session, ...updates, lastActivity: new Date().toISOString() })
      }
    }

    protected removeCallSession(callSessionId: string): void {
      this.callSessions.delete(callSessionId)
    }

    protected registerConversationSession(sessionId: string, context: ConversationContext): void {
      this.conversationSessions.set(sessionId, context)
    }

    protected getConversationSession(sessionId: string): ConversationContext | undefined {
      return this.conversationSessions.get(sessionId)
    }

    protected updateConversationSession(sessionId: string, updates: Partial<ConversationContext>): void {
      const session = this.conversationSessions.get(sessionId)
      if (session) {
        this.conversationSessions.set(sessionId, { ...session, ...updates })
      }
    }

    protected removeConversationSession(sessionId: string): void {
      this.conversationSessions.delete(sessionId)
    }

    protected async validateCallContext(callSessionId: string): Promise<{ valid: boolean; error?: string }> {
      const session = this.getCallSession(callSessionId)
      if (!session) {
        return { valid: false, error: 'Call session not found' }
      }

      if (session.callStatus === 'ended') {
        return { valid: false, error: 'Call session has ended' }
      }

      return { valid: true }
    }

    protected async validateConversationContext(sessionId: string): Promise<{ valid: boolean; error?: string }> {
      const session = this.getConversationSession(sessionId)
      if (!session) {
        return { valid: false, error: 'Conversation session not found' }
      }

      return { valid: true }
    }

    protected getActiveCallSessions(): CallContext[] {
      return Array.from(this.callSessions.values()).filter(session => session.callStatus !== 'ended')
    }

    protected getActiveConversationSessions(): ConversationContext[] {
      return Array.from(this.conversationSessions.values())
    }
    
    // Abstract method that must be implemented by subclasses
    protected abstract processRequest(request: MCPRequest): Promise<any>
  }