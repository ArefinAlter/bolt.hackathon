import { MCPServer, MCPRequest, MCPResponse } from '../mcp-base/index.ts'

export class PolicyMCPServer extends MCPServer {
  private supabase: any
  private realtimeChannels: Map<string, any> = new Map()
  private policyCache: Map<string, { policy: any; timestamp: number }> = new Map()
  private cacheTimeout = 300000 // 5 minutes
  
  constructor() {
    super('policy-mcp-server', [
      'get_active_policy',
      'validate_request',
      'get_policy_rules',
      'check_compliance',
      'validate_call_request',
      'get_call_policy',
      'subscribe_policy_updates',
      'unsubscribe_policy_updates',
      'get_real_time_compliance',
      'validate_streaming_request',
      'get_policy_analytics',
      'get_policy_call_analytics',
      'get_policy_real_time_metrics',
      'validate_policy_call_permissions'
    ], 'high')
    
    // Initialize Supabase client using the same pattern as edge functions
    this.initializeSupabase()
  }
  
  private async initializeSupabase() {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    this.supabase = createClient(supabaseUrl, supabaseKey)
  }
  
  protected async processRequest(request: MCPRequest): Promise<any> {
    switch (request.action) {
      case 'get_active_policy':
        return await this.getActivePolicy(request.data.businessId)
      
      case 'validate_request':
        return await this.validateReturnRequest(request.data)
      
      case 'get_policy_rules':
        return await this.getPolicyRules(request.data.businessId)
      
      case 'check_compliance':
        return await this.checkCompliance(request.data)
      
      case 'validate_call_request':
        return await this.validateCallRequest(request.data)
      
      case 'get_call_policy':
        return await this.getCallPolicy(request.data.businessId)
      
      case 'subscribe_policy_updates':
        return await this.subscribePolicyUpdates(request.data.businessId, request.context.sessionId)
      
      case 'unsubscribe_policy_updates':
        return await this.unsubscribePolicyUpdates(request.data.businessId, request.context.sessionId)
      
      case 'get_real_time_compliance':
        return await this.getRealTimeCompliance(request.data)
      
      case 'validate_streaming_request':
        return await this.validateStreamingRequest(request.data)
      
      case 'get_policy_analytics':
        return await this.getPolicyAnalytics(request.data.businessId)
      
      case 'get_policy_call_analytics':
        return await this.getPolicyCallAnalytics(request.data.businessId)
      
      case 'get_policy_real_time_metrics':
        return await this.getPolicyRealTimeMetrics(request.data)
      
      case 'validate_policy_call_permissions':
        return await this.validatePolicyCallPermissions(request.data)
      
      default:
        throw new Error(`Unknown action: ${request.action}`)
    }
  }
  
  private async getActivePolicy(businessId: string): Promise<any> {
    // Check cache first
    const cached = this.policyCache.get(businessId)
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.policy
    }
    
    const supabase = await this.supabase
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()
    
    if (error) {
      throw new Error(`Failed to get active policy: ${error.message}`)
    }
    
    // Cache the result
    this.policyCache.set(businessId, { policy: data, timestamp: Date.now() })
    
    return data
  }
  
  private async validateReturnRequest(data: any): Promise<any> {
    const { businessId, returnRequest } = data
    
    // Get active policy
    const policy = await this.getActivePolicy(businessId)
    
    // Validate against policy rules
    const violations: string[] = []
    const compliance = {
      withinReturnWindow: true,
      validReason: true,
      hasRequiredEvidence: true,
      belowThreshold: true
    }
    
    // Check return window
    const daysSincePurchase = returnRequest.daysSincePurchase
    if (daysSincePurchase > policy.rules.return_window_days) {
      compliance.withinReturnWindow = false
      violations.push('Outside return window')
    }
    
    // Check reason validity
    const validReasons = policy.rules.acceptable_reasons
    const hasValidReason = validReasons.some((reason: string) => 
      returnRequest.reason.toLowerCase().includes(reason.toLowerCase())
    )
    if (!hasValidReason) {
      compliance.validReason = false
      violations.push('Invalid return reason')
    }
    
    // Check evidence requirements
    if (policy.rules.required_evidence.length > 0 && returnRequest.evidenceUrls.length === 0) {
      compliance.hasRequiredEvidence = false
      violations.push('Missing required evidence')
    }
    
    // Check order value threshold
    if (returnRequest.orderValue > policy.rules.auto_approve_threshold) {
      compliance.belowThreshold = false
      violations.push('Order value exceeds auto-approval threshold')
    }
    
    return {
      compliance,
      violations,
      policy: policy.rules
    }
  }
  
  private async getPolicyRules(businessId: string): Promise<any> {
    const policy = await this.getActivePolicy(businessId)
    return policy.rules
  }
  
  private async checkCompliance(data: any): Promise<any> {
    return await this.validateReturnRequest(data)
  }

  // Add call-specific methods
  async validateCallRequest(data: any): Promise<any> {
    const { businessId, returnRequest, callContext } = data
    
    // Get active policy
    const policy = await this.getActivePolicy(businessId)
    
    // Enhanced validation for call interactions
    const validation = await this.validateReturnRequest(data)
    
    // Add call-specific checks
    const callValidation = {
      ...validation,
      callSpecific: {
        canHandleInCall: this.canHandleInCall(returnRequest, policy),
        requiresEscalation: this.requiresCallEscalation(returnRequest, policy, callContext),
        suggestedResponse: this.generateCallResponse(returnRequest, validation, policy)
      }
    }
    
    return callValidation
  }

  async getCallPolicy(businessId: string): Promise<any> {
    const policy = await this.getActivePolicy(businessId)
    
    return {
      ...policy.rules,
      callSettings: {
        allowVoiceCalls: policy.rules.allow_voice_calls || true,
        allowVideoCalls: policy.rules.allow_video_calls || true,
        autoEscalationThreshold: policy.rules.auto_escalation_threshold || 500,
        maxCallDuration: policy.rules.max_call_duration || 1800, // 30 minutes
        requireHumanReview: policy.rules.require_human_review || false
      }
    }
  }

  private canHandleInCall(returnRequest: any, policy: any): boolean {
    // Check if request can be handled during a call
    const orderValue = returnRequest.orderValue || 0
    const isSimpleRequest = returnRequest.reason === 'general issue' || returnRequest.reason === 'wrong item'
    
    return orderValue <= policy.rules.auto_approve_threshold && isSimpleRequest
  }

  private requiresCallEscalation(returnRequest: any, policy: any, callContext: any): boolean {
    // Determine if call should be escalated
    const orderValue = returnRequest.orderValue || 0
    const callDuration = callContext?.duration || 0
    
    // Escalate for high-value orders
    if (orderValue > policy.rules.auto_approve_threshold) return true
    
    // Escalate for long calls
    if (callDuration > (policy.rules.max_call_duration || 1800)) return true
    
    // Escalate for complex issues
    if (returnRequest.reason === 'defective' || returnRequest.reason === 'damaged') return true
    
    return false
  }

  private generateCallResponse(returnRequest: any, validation: any, policy: any): string {
    if (validation.violations.length > 0) {
      return `I'm sorry, but I cannot approve your return request at this time. ${validation.violations.join(', ')}. Let me transfer you to a human representative.`
    }
    
    if (returnRequest.orderValue <= policy.rules.auto_approve_threshold) {
      return `Great news! I can approve your return request right now. Your refund will be processed within 3-5 business days.`
    }
    
    return `I understand your return request. This requires additional review due to the order value. Let me transfer you to a specialist.`
  }

  // Real-time policy monitoring methods
  private async subscribePolicyUpdates(businessId: string, sessionId: string): Promise<any> {
    const supabase = await this.supabase
    
    // Subscribe to policy changes
    const channel = supabase
      .channel(`policy-updates-${businessId}`)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'policies', filter: `business_id=eq.${businessId}` },
        (payload: any) => {
          // Clear cache when policy changes
          this.policyCache.delete(businessId)
          
          // Notify subscribers
          this.notifyPolicyUpdate(businessId, payload)
        }
      )
      .subscribe()
    
    this.realtimeChannels.set(`${businessId}-${sessionId}`, channel)
    
    return {
      subscribed: true,
      channelId: `${businessId}-${sessionId}`,
      message: 'Subscribed to policy updates'
    }
  }

  private async unsubscribePolicyUpdates(businessId: string, sessionId: string): Promise<any> {
    const channelKey = `${businessId}-${sessionId}`
    const channel = this.realtimeChannels.get(channelKey)
    
    if (channel) {
      await channel.unsubscribe()
      this.realtimeChannels.delete(channelKey)
    }
    
    return {
      unsubscribed: true,
      channelId: channelKey,
      message: 'Unsubscribed from policy updates'
    }
  }

  private notifyPolicyUpdate(businessId: string, payload: any): void {
    // Send notification to all active sessions for this business
    const activeSessions = this.getActiveConversationSessions()
      .filter(session => session.participants.includes(businessId))
    
    activeSessions.forEach(session => {
      // In a real implementation, this would send via WebSocket
      console.log(`Policy update notification sent to session ${session.sessionId}`)
    })
  }

  private async getRealTimeCompliance(data: any): Promise<any> {
    const { businessId, returnRequest, callContext } = data
    
    // Get real-time policy
    const policy = await this.getActivePolicy(businessId)
    
    // Perform real-time validation
    const validation = await this.validateReturnRequest(data)
    
    // Add real-time context
    const realTimeContext = {
      currentTime: new Date().toISOString(),
      policyLastUpdated: policy.updated_at,
      activeCallSessions: this.getActiveCallSessions().length,
      systemLoad: this.getSystemLoad(),
      complianceScore: this.calculateComplianceScore(validation)
    }
    
    return {
      ...validation,
      realTimeContext,
      recommendations: this.generateRealTimeRecommendations(validation, realTimeContext)
    }
  }

  private async validateStreamingRequest(data: any): Promise<any> {
    const { businessId, streamingType, callSessionId } = data
    
    // Validate streaming request against policy
    const policy = await this.getActivePolicy(businessId)
    const callSession = this.getCallSession(callSessionId)
    
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    const validation: {
      allowed: boolean
      restrictions: string[]
      streamingSettings: Record<string, any>
    } = {
      allowed: false,
      restrictions: [],
      streamingSettings: {}
    }
    
    // Check if streaming is allowed for this call type
    if (streamingType === 'voice' && policy.rules.allow_voice_calls) {
      validation.allowed = true
      validation.streamingSettings = {
        maxDuration: policy.rules.max_call_duration || 1800,
        quality: 'high',
        recording: policy.rules.record_calls || false
      }
    } else if (streamingType === 'video' && policy.rules.allow_video_calls) {
      validation.allowed = true
      validation.streamingSettings = {
        maxDuration: policy.rules.max_call_duration || 1800,
        quality: 'medium',
        recording: policy.rules.record_calls || false,
        bandwidthLimit: policy.rules.video_bandwidth_limit || '2Mbps'
      }
    } else {
      validation.restrictions.push(`${streamingType} calls not allowed`)
    }
    
    // Check call duration limits
    if (callSession.lastActivity) {
      const callDuration = Date.now() - new Date(callSession.lastActivity).getTime()
      if (callDuration > (policy.rules.max_call_duration || 1800) * 1000) {
        validation.allowed = false
        validation.restrictions.push('Call duration limit exceeded')
      }
    }
    
    return validation
  }

  private async getPolicyAnalytics(businessId: string): Promise<any> {
    const supabase = await this.supabase
    
    // Get policy usage analytics
    const { data: returnRequests, error } = await supabase
      .from('return_requests')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    
    if (error) {
      throw new Error(`Failed to get analytics: ${error.message}`)
    }
    
    const analytics = {
      totalRequests: returnRequests.length,
      approvedRequests: returnRequests.filter(r => r.status === 'approved').length,
      rejectedRequests: returnRequests.filter(r => r.status === 'rejected').length,
      averageProcessingTime: this.calculateAverageProcessingTime(returnRequests),
      complianceRate: this.calculateComplianceRate(returnRequests),
      topReasons: this.getTopReasons(returnRequests),
      callInteractions: this.getCallInteractionStats(businessId)
    }
    
    return analytics
  }

  private calculateAverageProcessingTime(requests: any[]): number {
    const processedRequests = requests.filter(r => r.processed_at && r.created_at)
    if (processedRequests.length === 0) return 0
    
    const totalTime = processedRequests.reduce((sum, req) => {
      return sum + (new Date(req.processed_at).getTime() - new Date(req.created_at).getTime())
    }, 0)
    
    return totalTime / processedRequests.length / 1000 // Convert to seconds
  }

  private calculateComplianceRate(requests: any[]): number {
    if (requests.length === 0) return 0
    const compliantRequests = requests.filter(r => r.compliance_score >= 0.8)
    return (compliantRequests.length / requests.length) * 100
  }

  private getTopReasons(requests: any[]): any[] {
    const reasonCounts = requests.reduce((acc, req) => {
      acc[req.reason] = (acc[req.reason] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(reasonCounts)
      .map(([reason, count]) => ({ reason, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5)
  }

  private getCallInteractionStats(businessId: string): any {
    const activeCalls = this.getActiveCallSessions()
      .filter(session => session.provider === businessId)
    
    return {
      activeCalls: activeCalls.length,
      voiceCalls: activeCalls.filter(call => call.callType === 'voice').length,
      videoCalls: activeCalls.filter(call => call.callType === 'video').length,
      averageCallDuration: this.calculatePolicyCallDuration(activeCalls)
    }
  }

  private calculatePolicyCallDuration(calls: any[]): number {
    if (calls.length === 0) return 0
    
    const totalDuration = calls.reduce((sum, call) => {
      return sum + (call.duration || 0)
    }, 0)
    
    return totalDuration / calls.length
  }

  private getSystemLoad(): number {
    // Simulate system load calculation
    const activeSessions = this.getActiveConversationSessions().length
    const activeCalls = this.getActiveCallSessions().length
    
    return Math.min(100, (activeSessions + activeCalls) * 10)
  }

  private calculateComplianceScore(validation: any): number {
    const compliance = validation.compliance
    const totalChecks = Object.keys(compliance).length
    const passedChecks = Object.values(compliance).filter(Boolean).length
    
    return (passedChecks / totalChecks) * 100
  }

  private generateRealTimeRecommendations(validation: any, context: any): string[] {
    const recommendations: string[] = []
    
    if (validation.violations.length > 0) {
      recommendations.push('Consider escalating to human agent due to policy violations')
    }
    
    if (context.systemLoad > 80) {
      recommendations.push('High system load detected - consider queuing non-urgent requests')
    }
    
    if (context.complianceScore < 70) {
      recommendations.push('Low compliance score - review policy rules')
    }
    
    return recommendations
  }

  private async getPolicyCallAnalytics(businessId: string): Promise<any> {
    // Get call analytics specific to policy enforcement
    const activeCalls = this.getActiveCallSessions()
      .filter(session => session.provider === businessId)
    
    const analytics = {
      totalPolicyChecks: activeCalls.length,
      policyViolations: activeCalls.filter(call => call.callStatus === 'policy_violation').length,
      complianceRate: this.calculatePolicyComplianceRate(activeCalls),
      averagePolicyCheckTime: this.calculateAveragePolicyCheckTime(activeCalls)
    }
    
    return analytics
  }

  private async getPolicyRealTimeMetrics(data: any): Promise<any> {
    const { businessId } = data
    
    // Get real-time policy metrics
    const activeSessions = this.getActiveConversationSessions().length
    const activeCalls = this.getActiveCallSessions().length
    
    const metrics = {
      activePolicySessions: activeSessions,
      activePolicyCalls: activeCalls,
      policySystemLoad: this.getPolicySystemLoad(),
      policyComplianceScore: this.calculatePolicyComplianceScore({ compliance: { withinReturnWindow: true, validReason: true, hasRequiredEvidence: true, belowThreshold: true } })
    }
    
    return metrics
  }

  private async validatePolicyCallPermissions(data: any): Promise<any> {
    const { businessId, customerEmail, callType } = data
    
    // Validate call permissions from policy perspective
    const { data: policy, error } = await this.supabase
      .from('policies')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single()
    
    if (error) {
      throw new Error(`Failed to get policy: ${error.message}`)
    }
    
    const permissions = {
      allowed: true,
      reason: '',
      restrictions: []
    }
    
    // Check policy-based call permissions
    if (callType === 'voice' && !policy.rules.allow_voice_calls) {
      permissions.allowed = false
      permissions.reason = 'Voice calls not allowed by policy'
      permissions.restrictions.push('voice_calls_disabled_by_policy')
    }
    
    if (callType === 'video' && !policy.rules.allow_video_calls) {
      permissions.allowed = false
      permissions.reason = 'Video calls not allowed by policy'
      permissions.restrictions.push('video_calls_disabled_by_policy')
    }
    
    return permissions
  }

  private calculatePolicyComplianceRate(calls: any[]): number {
    if (calls.length === 0) return 100
    const compliantCalls = calls.filter(call => call.callStatus !== 'policy_violation').length
    return (compliantCalls / calls.length) * 100
  }

  private calculateAveragePolicyCheckTime(calls: any[]): number {
    if (calls.length === 0) return 0
    // Simulate policy check time calculation
    return 2.5 // Average 2.5 seconds per policy check
  }

  private getPolicySystemLoad(): number {
    // Calculate policy system load
    const activeSessions = this.getActiveConversationSessions().length
    const activeCalls = this.getActiveCallSessions().length
    
    return Math.min(100, (activeSessions + activeCalls) * 5) // Policy checks are lighter
  }

  private calculatePolicyComplianceScore(validation: any): number {
    const compliance = validation.compliance
    const totalChecks = Object.keys(compliance).length
    const passedChecks = Object.values(compliance).filter(Boolean).length
    
    return (passedChecks / totalChecks) * 100
  }
}