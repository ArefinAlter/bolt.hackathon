// AI Agent Core Configuration
export interface AgentConfig {
    name: string
    role: string
    model: string
    temperature: number
    maxTokens: number
    systemPrompt: string
    securityLevel: 'low' | 'medium' | 'high'
    allowedActions: string[]
    rateLimit: {
      requestsPerMinute: number
      requestsPerHour: number
    }
  }
  
  export interface AgentContext {
    businessId: string
    customerEmail?: string
    sessionId?: string
    requestId?: string
    userRole: 'customer' | 'business' | 'system'
    timestamp: string
    // Call-specific fields
    callSessionId?: string
    provider?: string
    callType?: string
    isCallInteraction?: boolean
    callTranscripts?: any[]
    // Demo mode flag
    demo_mode?: boolean
  }
  
  export interface AgentResponse {
    success: boolean
    message: string
    data?: any
    confidence?: number
    nextAction?: string
    requiresHumanReview?: boolean
    securityFlags?: string[]
  }
  
  // Base configuration for all agents
  export const BASE_AGENT_CONFIG = {
    model: 'gpt-4o',
    temperature: 0.1,
    maxTokens: 2000,
    rateLimit: {
      requestsPerMinute: 60,
      requestsPerHour: 1000
    }
  }
  
  // Security validation functions
  const allowedRoles: Record<string, string[]> = {
    'customer-service': ['customer', 'business'],
    triage: ['customer', 'business'],
    policy: ['business']
  };
  
  type UserRole = 'customer' | 'business';
  
  export function isRoleAllowed(agentType: string, context: { userRole: UserRole }): boolean {
    return allowedRoles[agentType]?.includes(context.userRole) || false;
  }
  
  export function sanitizeInput(input: string): string {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()
  }