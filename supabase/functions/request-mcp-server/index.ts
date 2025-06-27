import { MCPServer, MCPRequest, MCPResponse } from '../mcp-base'

export class RequestMCPServer extends MCPServer {
  private supabase: any
  
  constructor() {
    super('request-mcp-server', [
      'get_return_request',
      'update_status',
      'create_return_request',
      'get_customer_history',
      'log_decision',
      'handle_call_request',
      'update_call_status',
      'get_call_history',
      'create_call_request',
      'stream_call_update',
      'get_request_real_time_metrics'
    ], 'high')
    
    this.initializeSupabase()
  }
  
  private async initializeSupabase() {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
  }
  
  protected async processRequest(request: MCPRequest): Promise<any> {
    switch (request.action) {
      case 'get_return_request':
        return await this.getReturnRequest(request.data.publicId)
      
      case 'update_status':
        return await this.updateStatus(request.data)
      
      case 'create_return_request':
        return await this.createReturnRequest(request.data)
      
      case 'get_customer_history':
        return await this.getCustomerHistory(request.data)
      
      case 'log_decision':
        return await this.logDecision(request.data)
      
      case 'handle_call_request':
        return await this.handleCallRequest(request.data)
      
      case 'update_call_status':
        return await this.updateCallStatus(request.data)
      
      case 'get_call_history':
        return await this.getCallHistory(request.data)
      
      case 'create_call_request':
        return await this.createCallRequest(request.data)
      
      case 'stream_call_update':
        return await this.streamCallUpdate(request.data)
      
      case 'get_request_real_time_metrics':
        return await this.getRequestRealTimeMetrics(request.data)
      
      default:
        throw new Error(`Unknown action: ${request.action}`)
    }
  }
  
  private async getReturnRequest(publicId: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('return_requests')
      .select(`
        *,
        mock_orders (*)
      `)
      .eq('public_id', publicId)
      .single()
    
    if (error) {
      throw new Error(`Failed to get return request: ${error.message}`)
    }
    
    return data
  }
  
  private async updateStatus(data: any): Promise<any> {
    const { publicId, status, adminNotes, decisionReason } = data
    
    const updateData: any = {
      status,
      admin_notes: adminNotes
    }
    
    if (status === 'approved' || status === 'denied') {
      updateData.admin_decision_at = new Date().toISOString()
      if (decisionReason) {
        updateData.admin_notes = `${updateData.admin_notes || ''}\n\nDecision: ${decisionReason}`.trim()
      }
    }
    
    const { data: updatedRequest, error } = await this.supabase
      .from('return_requests')
      .update(updateData)
      .eq('public_id', publicId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update status: ${error.message}`)
    }
    
    return updatedRequest
  }
  
  private async createReturnRequest(data: any): Promise<any> {
    const { businessId, orderId, customerEmail, reason, evidenceUrls } = data
    
    const { data: newRequest, error } = await this.supabase
      .from('return_requests')
      .insert([{
        business_id: businessId,
        order_id: orderId,
        customer_email: customerEmail,
        reason_for_return: reason,
        evidence_urls: evidenceUrls || [],
        status: 'pending_triage'
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create return request: ${error.message}`)
    }
    
    return newRequest
  }
  
  private async getCustomerHistory(data: any): Promise<any> {
    const { customerEmail, businessId } = data
    
    const { data: history, error } = await this.supabase
      .from('return_requests')
      .select('*')
      .eq('customer_email', customerEmail)
      .eq('business_id', businessId)
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get customer history: ${error.message}`)
    }
    
    return history
  }
  
  private async logDecision(data: any): Promise<any> {
    const { businessId, returnRequestId, decision, confidence, reasoning } = data
    
    const { data: logEntry, error } = await this.supabase
      .from('agent_performance_logs')
      .insert([{
        business_id: businessId,
        agent_type: 'triage',
        interaction_id: returnRequestId,
        performance_metrics: {
          decision,
          confidence,
          reasoning
        },
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to log decision: ${error.message}`)
    }
    
    return logEntry
  }

  // Call-specific methods
  private async handleCallRequest(data: any): Promise<any> {
    const { businessId, callSessionId, returnRequest, callType, customerInfo } = data
    
    // Validate call context
    const callValidation = await this.validateCallContext(callSessionId)
    if (!callValidation.valid) {
      throw new Error(callValidation.error)
    }
    
    // Create or update return request for call
    let returnRequestData
    if (returnRequest.id) {
      // Update existing request
      returnRequestData = await this.updateReturnRequestForCall(returnRequest)
    } else {
      // Create new request from call
      returnRequestData = await this.createReturnRequestFromCall({
        businessId,
        callSessionId,
        returnRequest,
        callType,
        customerInfo
      })
    }
    
    // Log call interaction
    await this.logCallInteraction({
      businessId,
      callSessionId,
      returnRequestId: returnRequestData.id,
      callType,
      interactionType: 'request_handling'
    })
    
    return {
      returnRequest: returnRequestData,
      callContext: {
        sessionId: callSessionId,
        type: callType,
        status: 'active',
        lastActivity: new Date().toISOString()
      }
    }
  }

  private async updateCallStatus(data: any): Promise<any> {
    const { callSessionId, status, notes, duration, outcome } = data
    
    // Update call session
    this.updateCallSession(callSessionId, {
      callStatus: status,
      lastActivity: new Date().toISOString()
    })
    
    // Log call completion
    if (status === 'ended') {
      await this.logCallCompletion({
        callSessionId,
        duration,
        outcome,
        notes
      })
    }
    
    return {
      callSessionId,
      status,
      updatedAt: new Date().toISOString()
    }
  }

  private async getCallHistory(data: any): Promise<any> {
    const { businessId, customerEmail, limit = 10 } = data
    
    const { data: callHistory, error } = await this.supabase
      .from('call_sessions')
      .select(`
        *,
        chat_sessions!inner(*)
      `)
      .eq('chat_sessions.business_id', businessId)
      .eq('chat_sessions.customer_email', customerEmail)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      throw new Error(`Failed to get call history: ${error.message}`)
    }
    
    return callHistory
  }

  private async createCallRequest(data: any): Promise<any> {
    const { businessId, customerEmail, callType, returnRequestId, provider, chatSessionId } = data
    
    const { data: callSession, error } = await this.supabase
      .from('call_sessions')
      .insert([{
        chat_session_id: chatSessionId,
        call_type: callType,
        provider: provider || 'internal',
        status: 'initiated',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create call session: ${error.message}`)
    }
    
    // Register call session in MCP server
    this.registerCallSession(callSession.id, {
      callSessionId: callSession.id,
      callType: callType as 'voice' | 'video',
      provider: provider || 'internal',
      streamingEnabled: true,
      participantCount: 1,
      callStatus: 'initiated',
      lastActivity: new Date().toISOString()
    })
    
    return callSession
  }

  private async streamCallUpdate(data: any): Promise<any> {
    const { callSessionId, updateType, updateData } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Update call session
    this.updateCallSession(callSessionId, {
      lastActivity: new Date().toISOString()
    })
    
    // Log streaming update
    await this.logStreamingUpdate({
      callSessionId,
      updateType,
      updateData,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      updateType,
      timestamp: new Date().toISOString(),
      status: 'streamed'
    }
  }

  private async getRequestRealTimeMetrics(data: any): Promise<any> {
    const { businessId } = data
    
    // Get active call sessions
    const activeCalls = this.getActiveCallSessions()
      .filter(session => session.provider === businessId)
    
    // Get recent return requests
    const { data: recentRequests, error } = await this.supabase
      .from('return_requests')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
    
    if (error) {
      throw new Error(`Failed to get recent requests: ${error.message}`)
    }
    
    const metrics = {
      activeCalls: activeCalls.length,
      voiceCalls: activeCalls.filter(call => call.callType === 'voice').length,
      videoCalls: activeCalls.filter(call => call.callType === 'video').length,
      recentRequests: recentRequests.length,
      pendingRequests: recentRequests.filter(r => r.status === 'pending_triage').length,
      averageCallDuration: this.calculateRequestCallDuration(activeCalls),
      systemLoad: this.getRequestSystemLoad()
    }
    
    return metrics
  }

  // Helper methods
  private async updateReturnRequestForCall(returnRequest: any): Promise<any> {
    const { data: updatedRequest, error } = await this.supabase
      .from('return_requests')
      .update({
        status: returnRequest.status,
        admin_notes: returnRequest.adminNotes,
        updated_at: new Date().toISOString()
      })
      .eq('id', returnRequest.id)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update return request: ${error.message}`)
    }
    
    return updatedRequest
  }

  private async createReturnRequestFromCall(data: any): Promise<any> {
    const { businessId, callSessionId, returnRequest, callType, customerInfo } = data
    
    const { data: newRequest, error } = await this.supabase
      .from('return_requests')
      .insert([{
        business_id: businessId,
        order_id: returnRequest.orderId,
        customer_email: customerInfo.email,
        reason_for_return: returnRequest.reason,
        evidence_urls: returnRequest.evidenceUrls || [],
        status: 'pending_triage',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create return request from call: ${error.message}`)
    }
    
    return newRequest
  }

  private async logCallInteraction(data: any): Promise<any> {
    const { businessId, callSessionId, returnRequestId, callType, interactionType } = data
    
    const { data: logEntry, error } = await this.supabase
      .from('agent_performance_logs')
      .insert([{
        business_id: businessId,
        agent_type: 'call_agent',
        interaction_id: callSessionId,
        return_request_id: returnRequestId,
        performance_metrics: {
          callType,
          interactionType,
          timestamp: new Date().toISOString()
        },
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to log call interaction: ${error.message}`)
    }
    
    return logEntry
  }

  private async logCallCompletion(data: any): Promise<any> {
    const { callSessionId, duration, outcome, notes } = data
    
    const { data: logEntry, error } = await this.supabase
      .from('call_sessions')
      .update({
        duration,
        outcome,
        notes,
        ended_at: new Date().toISOString()
      })
      .eq('id', callSessionId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to log call completion: ${error.message}`)
    }
    
    return logEntry
  }

  private async logStreamingUpdate(data: any): Promise<any> {
    const { callSessionId, updateType, updateData, timestamp } = data
    
    // Log streaming update to conversation_chunks table
    const { data: chunk, error } = await this.supabase
      .from('conversation_chunks')
      .insert([{
        session_id: callSessionId,
        chunk_type: updateType,
        content: updateData,
        timestamp,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to log streaming update: ${error.message}`)
    }
    
    return chunk
  }

  private calculateRequestCallDuration(calls: any[]): number {
    if (calls.length === 0) return 0
    
    const totalDuration = calls.reduce((sum, call) => {
      return sum + (call.duration || 0)
    }, 0)
    
    return totalDuration / calls.length
  }

  private getRequestSystemLoad(): number {
    // Simulate system load calculation for request processing
    const activeSessions = this.getActiveConversationSessions().length
    const activeCalls = this.getActiveCallSessions().length
    
    return Math.min(100, (activeSessions + activeCalls) * 8) // Request processing is medium load
  }
}