// Layered Decision Engine - Integrates AI Agents with MCP Servers
// Each layer adds value and passes enriched data to the next layer

import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { MCPServer, MCPRequest, MCPResponse } from '../mcp-base/index.ts'
import { TriageAgent } from '../triage-agent/index.ts'
import { CustomerServiceAgent } from '../customer-service-agent/index.ts'

export interface DecisionContext {
  businessId: string
  customerEmail?: string
  sessionId?: string
  requestId?: string
  callSessionId?: string
  conversationId?: string
  userRole: 'customer' | 'business' | 'system'
  timestamp: string
  rawData: any
  enrichedData: any
  policyData: any
  aiAnalysis: any
  finalDecision: any
  auditTrail: any[]
}

export interface LayerResult {
  success: boolean
  data: any
  errors: string[]
  warnings: string[]
  metadata: any
}

export class LayeredDecisionEngine {
  private triageAgent: TriageAgent
  private customerServiceAgent: CustomerServiceAgent
  private mcpServers: Map<string, MCPServer> = new Map()
  
  constructor() {
    this.triageAgent = new TriageAgent()
    this.customerServiceAgent = new CustomerServiceAgent()
  }
  
  // Register MCP servers for different layers
  registerMCPServer(layer: string, server: MCPServer): void {
    this.mcpServers.set(layer, server)
  }
  
  // Main decision flow through all layers
  async processDecision(request: MCPRequest): Promise<MCPResponse> {
    const context: DecisionContext = {
      businessId: request.businessId,
      customerEmail: request.context.sessionId ? undefined : undefined, // Will be enriched
      sessionId: request.context.sessionId,
      requestId: request.context.requestId,
      callSessionId: request.context.callSessionId,
      conversationId: request.context.sessionId,
      userRole: (request.context.userRole as 'customer' | 'business' | 'system') || 'customer',
      timestamp: request.timestamp,
      rawData: request.data,
      enrichedData: {},
      policyData: {},
      aiAnalysis: {},
      finalDecision: {},
      auditTrail: []
    }
    
    try {
      // Layer 1: Data Collection & Validation
      const layer1Result = await this.executeLayer1_DataCollection(context)
      if (!layer1Result.success) {
        return this.createErrorResponse(request, `Layer 1 failed: ${layer1Result.errors.join(', ')}`)
      }
      context.enrichedData = layer1Result.data
      context.auditTrail.push({ layer: 1, result: layer1Result })
      
      // Layer 2: Policy & Business Rules
      const layer2Result = await this.executeLayer2_PolicyValidation(context)
      if (!layer2Result.success) {
        return this.createErrorResponse(request, `Layer 2 failed: ${layer2Result.errors.join(', ')}`)
      }
      context.policyData = layer2Result.data
      context.auditTrail.push({ layer: 2, result: layer2Result })
      
      // Layer 3: AI Analysis & Decision Making
      const layer3Result = await this.executeLayer3_AIAnalysis(context)
      if (!layer3Result.success) {
        return this.createErrorResponse(request, `Layer 3 failed: ${layer3Result.errors.join(', ')}`)
      }
      context.aiAnalysis = layer3Result.data
      context.auditTrail.push({ layer: 3, result: layer3Result })
      
      // Layer 4: Action Execution & Logging
      const layer4Result = await this.executeLayer4_ActionExecution(context)
      if (!layer4Result.success) {
        return this.createErrorResponse(request, `Layer 4 failed: ${layer4Result.errors.join(', ')}`)
      }
      context.finalDecision = layer4Result.data
      context.auditTrail.push({ layer: 4, result: layer4Result })
      
      // Log complete decision flow
      await this.logCompleteDecisionFlow(context)
      
      return this.createSuccessResponse(request, context.finalDecision, Date.now() - new Date(request.timestamp).getTime())
      
    } catch (error) {
      console.error('Layered Decision Engine Error:', error)
      return this.createErrorResponse(request, error.message)
    }
  }
  
  // Layer 1: Data Collection & Validation
  private async executeLayer1_DataCollection(context: DecisionContext): Promise<LayerResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const enrichedData: any = {}
    
    try {
      // Get request MCP server for data collection
      const requestServer = this.mcpServers.get('request')
      if (!requestServer) {
        errors.push('Request MCP server not registered')
        return { success: false, data: {}, errors, warnings, metadata: {} }
      }
      
      // Collect customer history
      if (context.rawData.customerEmail) {
        const historyRequest: MCPRequest = {
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          agentId: 'layered-engine',
          businessId: context.businessId,
          action: 'get_customer_history',
          data: {
            customerEmail: context.rawData.customerEmail,
            businessId: context.businessId
          },
          context: { userRole: 'system' }
        }
        
        const historyResponse = await requestServer.handleRequest(historyRequest)
        if (historyResponse.success) {
          enrichedData.customerHistory = historyResponse.data
        } else {
          warnings.push('Failed to get customer history')
        }
      }
      
      // Collect call session data if applicable
      if (context.callSessionId) {
        const callServer = this.mcpServers.get('call')
        if (callServer) {
          const callRequest: MCPRequest = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agentId: 'layered-engine',
            businessId: context.businessId,
            action: 'get_call_status',
            data: { callSessionId: context.callSessionId },
            context: { userRole: 'system' }
          }
          
          const callResponse = await callServer.handleRequest(callRequest)
          if (callResponse.success) {
            enrichedData.callSession = callResponse.data
          } else {
            warnings.push('Failed to get call session data')
          }
        }
      }
      
      // Validate required fields
      if (!context.rawData.orderId) {
        errors.push('Order ID is required')
      }
      
      if (!context.rawData.reason) {
        errors.push('Return reason is required')
      }
      
      return {
        success: errors.length === 0,
        data: enrichedData,
        errors,
        warnings,
        metadata: { layer: 'data_collection', timestamp: new Date().toISOString() }
      }
      
    } catch (error) {
      errors.push(`Data collection error: ${error.message}`)
      return { success: false, data: {}, errors, warnings, metadata: {} }
    }
  }
  
  // Layer 2: Policy & Business Rules
  private async executeLayer2_PolicyValidation(context: DecisionContext): Promise<LayerResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const policyData: any = {}
    
    try {
      // Get policy MCP server
      const policyServer = this.mcpServers.get('policy')
      if (!policyServer) {
        errors.push('Policy MCP server not registered')
        return { success: false, data: {}, errors, warnings, metadata: {} }
      }
      
      // Get active policy
      const policyRequest: MCPRequest = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentId: 'layered-engine',
        businessId: context.businessId,
        action: 'get_active_policy',
        data: { businessId: context.businessId },
        context: { userRole: 'system' }
      }
      
      const policyResponse = await policyServer.handleRequest(policyRequest)
      if (policyResponse.success) {
        policyData.activePolicy = policyResponse.data
      } else {
        errors.push('Failed to get active policy')
        return { success: false, data: {}, errors, warnings, metadata: {} }
      }
      
      // Validate request against policy
      const validationRequest: MCPRequest = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        agentId: 'layered-engine',
        businessId: context.businessId,
        action: 'validate_request',
        data: {
          businessId: context.businessId,
          returnRequest: {
            ...context.rawData,
            ...context.enrichedData
          }
        },
        context: { userRole: 'system' }
      }
      
      const validationResponse = await policyServer.handleRequest(validationRequest)
      if (validationResponse.success) {
        policyData.validation = validationResponse.data
      } else {
        errors.push('Failed to validate request against policy')
        return { success: false, data: {}, errors, warnings, metadata: {} }
      }
      
      return {
        success: errors.length === 0,
        data: policyData,
        errors,
        warnings,
        metadata: { layer: 'policy_validation', timestamp: new Date().toISOString() }
      }
      
    } catch (error) {
      errors.push(`Policy validation error: ${error.message}`)
      return { success: false, data: {}, errors, warnings, metadata: {} }
    }
  }
  
  // Layer 3: AI Analysis & Decision Making
  private async executeLayer3_AIAnalysis(context: DecisionContext): Promise<LayerResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const aiAnalysis: any = {}
    
    try {
      // Determine which AI agent to use based on context
      let aiAgent: TriageAgent | CustomerServiceAgent
      let analysisMethod: string
      
      if (context.callSessionId || context.rawData.isCallInteraction) {
        // Use CustomerServiceAgent for call interactions
        aiAgent = this.customerServiceAgent
        analysisMethod = 'processCallMessage'
        
        const callAnalysis = await this.customerServiceAgent.processCallMessage(
          context.rawData.message || context.rawData.reason,
          {
            businessId: context.businessId,
            customerEmail: context.rawData.customerEmail,
            sessionId: context.callSessionId,
            userRole: context.userRole,
            timestamp: context.timestamp,
            callSessionId: context.callSessionId,
            callType: context.enrichedData.callSession?.call_type,
            provider: context.enrichedData.callSession?.provider
          },
          context.enrichedData.callSession?.transcripts || []
        )
        
        aiAnalysis.callAnalysis = callAnalysis
        
      } else {
        // Use TriageAgent for return request evaluation
        aiAgent = this.triageAgent
        analysisMethod = 'evaluateReturnRequest'
        
        const triageAnalysis = await this.triageAgent.evaluateReturnRequest(
          {
            orderId: context.rawData.orderId,
            customerEmail: context.rawData.customerEmail,
            reason: context.rawData.reason,
            orderValue: context.rawData.orderValue || 0,
            daysSincePurchase: context.rawData.daysSincePurchase || 0,
            evidenceUrls: context.rawData.evidenceUrls || [],
            customerRiskScore: context.enrichedData.customerHistory?.riskScore || 0.5,
            returnHistory: context.enrichedData.customerHistory?.returnCount || 0,
            productCategory: context.rawData.productCategory || 'general'
          },
          context.policyData.activePolicy.rules,
          context.businessId
        )
        
        aiAnalysis.triageAnalysis = triageAnalysis
      }
      
      // Combine AI analysis with policy validation
      aiAnalysis.combinedDecision = this.combineAIAnalysisWithPolicy(
        aiAnalysis,
        context.policyData.validation
      )
      
      return {
        success: errors.length === 0,
        data: aiAnalysis,
        errors,
        warnings,
        metadata: { 
          layer: 'ai_analysis', 
          aiAgent: aiAgent.constructor.name,
          analysisMethod,
          timestamp: new Date().toISOString() 
        }
      }
      
    } catch (error) {
      errors.push(`AI analysis error: ${error.message}`)
      return { success: false, data: {}, errors, warnings, metadata: {} }
    }
  }
  
  // Layer 4: Action Execution & Logging
  private async executeLayer4_ActionExecution(context: DecisionContext): Promise<LayerResult> {
    const errors: string[] = []
    const warnings: string[] = []
    const finalDecision: any = {}
    
    try {
      // Execute the final decision
      const decision = context.aiAnalysis.combinedDecision
      
      if (decision.action === 'create_return_request') {
        // Create return request via MCP server
        const requestServer = this.mcpServers.get('request')
        if (requestServer) {
          const createRequest: MCPRequest = {
            id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            agentId: 'layered-engine',
            businessId: context.businessId,
            action: 'create_return_request',
            data: {
              businessId: context.businessId,
              orderId: context.rawData.orderId,
              customerEmail: context.rawData.customerEmail,
              reason: context.rawData.reason,
              evidenceUrls: context.rawData.evidenceUrls || []
            },
            context: { userRole: 'system' }
          }
          
          const createResponse = await requestServer.handleRequest(createRequest)
          if (createResponse.success) {
            finalDecision.returnRequest = createResponse.data
          } else {
            errors.push('Failed to create return request')
          }
        }
      }
      
      // Log the complete decision flow
      await this.logDecisionFlow(context)
      
      finalDecision.decision = decision
      finalDecision.timestamp = new Date().toISOString()
      
      return {
        success: errors.length === 0,
        data: finalDecision,
        errors,
        warnings,
        metadata: { layer: 'action_execution', timestamp: new Date().toISOString() }
      }
      
    } catch (error) {
      errors.push(`Action execution error: ${error.message}`)
      return { success: false, data: {}, errors, warnings, metadata: {} }
    }
  }
  
  // Helper methods
  private combineAIAnalysisWithPolicy(aiAnalysis: any, policyValidation: any): any {
    // Combine AI decision with policy validation
    const aiDecision = aiAnalysis.triageAnalysis || aiAnalysis.callAnalysis
    
    return {
      action: this.determineFinalAction(aiDecision, policyValidation),
      confidence: aiDecision.confidence || 0.5,
      reasoning: aiDecision.reasoning || 'No reasoning provided',
      policyCompliance: policyValidation.compliance,
      violations: policyValidation.violations || [],
      requiresHumanReview: this.shouldRequireHumanReview(aiDecision, policyValidation)
    }
  }
  
  private determineFinalAction(aiDecision: any, policyValidation: any): string {
    // If policy validation fails, always require human review
    if (!policyValidation.compliance.withinReturnWindow || 
        !policyValidation.compliance.validReason) {
      return 'human_review'
    }
    
    // If AI suggests human review, follow that
    if (aiDecision.decision === 'human_review') {
      return 'human_review'
    }
    
    // If AI suggests auto-approve and policy allows, approve
    if (aiDecision.decision === 'auto_approve' && 
        policyValidation.compliance.belowThreshold) {
      return 'create_return_request'
    }
    
    // Default to human review
    return 'human_review'
  }
  
  private shouldRequireHumanReview(aiDecision: any, policyValidation: any): boolean {
    return aiDecision.decision === 'human_review' || 
           !policyValidation.compliance.withinReturnWindow ||
           !policyValidation.compliance.validReason ||
           aiDecision.confidence < 0.7
  }
  
  private async logDecisionFlow(context: DecisionContext): Promise<void> {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
    
    // Log to agent_performance_logs
    await supabase.from('agent_performance_logs').insert({
      business_id: context.businessId,
      agent_type: 'layered_engine',
      interaction_id: context.requestId || context.rawData.orderId,
      performance_metrics: {
        layers: context.auditTrail.length,
        finalDecision: context.finalDecision.decision,
        confidence: context.aiAnalysis.combinedDecision?.confidence,
        policyCompliance: context.aiAnalysis.combinedDecision?.policyCompliance,
        auditTrail: context.auditTrail
      },
      created_at: new Date().toISOString()
    })
  }
  
  private async logCompleteDecisionFlow(context: DecisionContext): Promise<void> {
    // Additional logging for complete flow
    console.log('Complete Decision Flow:', {
      businessId: context.businessId,
      requestId: context.requestId,
      layers: context.auditTrail.length,
      finalDecision: context.finalDecision,
      timestamp: new Date().toISOString()
    })
  }
  
  private createSuccessResponse(request: MCPRequest, data: any, duration: number): MCPResponse {
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
        securityFlags: []
      }
    }
  }
  
  private createErrorResponse(request: MCPRequest, error: string): MCPResponse {
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
        securityFlags: ['error']
      }
    }
  }
} 
