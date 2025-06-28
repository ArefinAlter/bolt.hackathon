import { MCPServer, MCPRequest, MCPResponse, ConversationContext } from '../mcp-base/index.ts'

export class ConversationMCPServer extends MCPServer {
  private supabase: any
  private aiAgents: Map<string, any> = new Map()
  private conversationCache: Map<string, any> = new Map()
  
  constructor() {
    super('conversation-mcp-server', [
      'create_conversation',
      'join_conversation',
      'leave_conversation',
      'send_message',
      'get_conversation_history',
      'update_conversation_state',
      'escalate_conversation',
      'assign_ai_agent',
      'get_ai_response',
      'stream_conversation',
      'analyze_sentiment',
      'detect_intent',
      'get_conversation_analytics',
      'handle_conversation_event',
      'merge_conversations',
      'archive_conversation'
    ], 'high')
    
    this.initializeSupabase()
    this.initializeAIAgents()
  }
  
  private async initializeSupabase() {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
  }
  
  private initializeAIAgents() {
    // Initialize different AI agent types
    this.aiAgents.set('triage', {
      type: 'triage',
      model: 'gpt-4',
      systemPrompt: 'You are a triage agent for return requests. Assess urgency and route appropriately.',
      capabilities: ['assess_urgency', 'route_request', 'basic_validation']
    })
    
    this.aiAgents.set('customer_service', {
      type: 'customer_service',
      model: 'gpt-4',
      systemPrompt: 'You are a customer service agent. Help customers with their return requests professionally.',
      capabilities: ['handle_returns', 'explain_policies', 'process_refunds']
    })
    
    this.aiAgents.set('escalation', {
      type: 'escalation',
      model: 'gpt-4',
      systemPrompt: 'You are an escalation specialist. Handle complex return requests that require human intervention.',
      capabilities: ['complex_returns', 'policy_exceptions', 'human_handoff']
    })
  }
  
  protected async processRequest(request: MCPRequest): Promise<any> {
    switch (request.action) {
      case 'create_conversation':
        return await this.createConversation(request.data)
      
      case 'join_conversation':
        return await this.joinConversation(request.data)
      
      case 'leave_conversation':
        return await this.leaveConversation(request.data)
      
      case 'send_message':
        return await this.sendMessage(request.data)
      
      case 'get_conversation_history':
        return await this.getConversationHistory(request.data)
      
      case 'update_conversation_state':
        return await this.updateConversationState(request.data)
      
      case 'escalate_conversation':
        return await this.escalateConversation(request.data)
      
      case 'assign_ai_agent':
        return await this.assignAIAgent(request.data)
      
      case 'get_ai_response':
        return await this.getAIResponse(request.data)
      
      case 'stream_conversation':
        return await this.streamConversation(request.data)
      
      case 'analyze_sentiment':
        return await this.analyzeSentiment(request.data)
      
      case 'detect_intent':
        return await this.detectIntent(request.data)
      
      case 'get_conversation_analytics':
        return await this.getConversationAnalytics(request.data)
      
      case 'handle_conversation_event':
        return await this.handleConversationEvent(request.data)
      
      case 'merge_conversations':
        return await this.mergeConversations(request.data)
      
      case 'archive_conversation':
        return await this.archiveConversation(request.data)
      
      default:
        throw new Error(`Unknown action: ${request.action}`)
    }
  }
  
  private async createConversation(data: any): Promise<any> {
    const { businessId, customerEmail, channel, returnRequestId, initialMessage } = data
    
    // Create conversation session
    const { data: conversation, error } = await this.supabase
      .from('conversation_sessions')
      .insert([{
        business_id: businessId,
        customer_email: customerEmail,
        channel: channel,
        return_request_id: returnRequestId,
        status: 'active',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create conversation: ${error.message}`)
    }
    
    // Register conversation session in MCP server
    this.registerConversationSession(conversation.id, {
      sessionId: conversation.id,
      channel: channel as 'chat' | 'voice' | 'video' | 'hybrid',
      participants: [customerEmail],
      conversationHistory: [],
      currentIntent: 'initial_contact',
      escalationLevel: 0,
      aiAgentType: 'triage'
    })
    
    // Send initial message if provided
    if (initialMessage) {
      await this.sendMessage({
        conversationId: conversation.id,
        senderId: customerEmail,
        message: initialMessage,
        messageType: 'text'
      })
    }
    
    return {
      conversation,
      status: 'created',
      sessionId: conversation.id
    }
  }
  
  private async joinConversation(data: any): Promise<any> {
    const { conversationId, participantId, participantType } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Add participant to conversation
    if (!conversation.participants.includes(participantId)) {
      conversation.participants.push(participantId)
      this.updateConversationSession(conversationId, {
        participants: conversation.participants
      })
    }
    
    // Log participant join
    await this.logConversationEvent({
      conversationId,
      eventType: 'participant_joined',
      participantId,
      participantType,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      participantId,
      status: 'joined',
      timestamp: new Date().toISOString()
    }
  }
  
  private async leaveConversation(data: any): Promise<any> {
    const { conversationId, participantId } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Remove participant from conversation
    const updatedParticipants = conversation.participants.filter(p => p !== participantId)
    this.updateConversationSession(conversationId, {
      participants: updatedParticipants
    })
    
    // Log participant leave
    await this.logConversationEvent({
      conversationId,
      eventType: 'participant_left',
      participantId,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      participantId,
      status: 'left',
      timestamp: new Date().toISOString()
    }
  }
  
  private async sendMessage(data: any): Promise<any> {
    const { conversationId, senderId, message, messageType, metadata } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Create message
    const { data: messageRecord, error } = await this.supabase
      .from('conversation_messages')
      .insert([{
        session_id: conversationId,
        user_id: senderId,
        content: message,
        message_type: messageType,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to send message: ${error.message}`)
    }
    
    // Update conversation history
    conversation.conversationHistory.push({
      id: messageRecord.id,
      senderId,
      message,
      messageType,
      timestamp: new Date().toISOString()
    })
    
    this.updateConversationSession(conversationId, {
      conversationHistory: conversation.conversationHistory
    })
    
    // Analyze message for intent and sentiment
    const analysis = await this.analyzeMessage(message)
    
    // Update conversation state based on analysis
    if (analysis.intent !== conversation.currentIntent) {
      this.updateConversationSession(conversationId, {
        currentIntent: analysis.intent
      })
    }
    
    // Log message event
    await this.logConversationEvent({
      conversationId,
      eventType: 'message_sent',
      senderId,
      messageId: messageRecord.id,
      analysis,
      timestamp: new Date().toISOString()
    })
    
    return {
      messageId: messageRecord.id,
      conversationId,
      senderId,
      analysis,
      timestamp: new Date().toISOString()
    }
  }
  
  private async getConversationHistory(data: any): Promise<any> {
    const { conversationId, limit = 50, offset = 0 } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Get messages from database
    const { data: messages, error } = await this.supabase
      .from('conversation_messages')
      .select('*')
      .eq('session_id', conversationId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)
    
    if (error) {
      throw new Error(`Failed to get conversation history: ${error.message}`)
    }
    
    return {
      conversationId,
      messages,
      totalCount: conversation.conversationHistory.length,
      hasMore: offset + limit < conversation.conversationHistory.length
    }
  }
  
  private async updateConversationState(data: any): Promise<any> {
    const { conversationId, updates } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Update conversation state
    this.updateConversationSession(conversationId, updates)
    
    // Log state update
    await this.logConversationEvent({
      conversationId,
      eventType: 'state_updated',
      updates,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      updates,
      timestamp: new Date().toISOString()
    }
  }
  
  private async escalateConversation(data: any): Promise<any> {
    const { conversationId, escalationReason, targetLevel } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Update escalation level
    const newLevel = targetLevel || conversation.escalationLevel + 1
    this.updateConversationSession(conversationId, {
      escalationLevel: newLevel,
      currentIntent: 'escalation'
    })
    
    // Assign appropriate AI agent
    const aiAgentType = this.determineAIAgentForEscalation(newLevel)
    this.updateConversationSession(conversationId, {
      aiAgentType
    })
    
    // Log escalation
    await this.logConversationEvent({
      conversationId,
      eventType: 'conversation_escalated',
      escalationReason,
      newLevel,
      aiAgentType,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      escalationLevel: newLevel,
      aiAgentType,
      reason: escalationReason,
      timestamp: new Date().toISOString()
    }
  }
  
  private async assignAIAgent(data: any): Promise<any> {
    const { conversationId, agentType, reason } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Validate agent type
    if (!this.aiAgents.has(agentType)) {
      throw new Error(`Unknown AI agent type: ${agentType}`)
    }
    
    // Update AI agent
    this.updateConversationSession(conversationId, {
      aiAgentType: agentType
    })
    
    // Log agent assignment
    await this.logConversationEvent({
      conversationId,
      eventType: 'ai_agent_assigned',
      agentType,
      reason,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      agentType,
      reason,
      timestamp: new Date().toISOString()
    }
  }
  
  private async getAIResponse(data: any): Promise<any> {
    const { conversationId, message, context } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Get AI agent configuration
    const aiAgent = this.aiAgents.get(conversation.aiAgentType)
    if (!aiAgent) {
      throw new Error(`AI agent not found: ${conversation.aiAgentType}`)
    }
    
    // Generate AI response
    const response = await this.generateAIResponse(aiAgent, message, conversation, context)
    
    // Send AI response as message
    const messageResult = await this.sendMessage({
      conversationId,
      senderId: `ai_${conversation.aiAgentType}`,
      message: response.content,
      messageType: 'ai_response',
      metadata: {
        agentType: conversation.aiAgentType,
        confidence: response.confidence,
        reasoning: response.reasoning
      }
    })
    
    return {
      conversationId,
      response: response.content,
      confidence: response.confidence,
      reasoning: response.reasoning,
      messageId: messageResult.messageId,
      timestamp: new Date().toISOString()
    }
  }
  
  private async streamConversation(data: any): Promise<any> {
    const { conversationId, streamType, streamData } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Process conversation stream
    const streamResult = await this.processConversationStream(conversation, streamType, streamData)
    
    // Store stream data
    await this.storeConversationStream({
      conversationId,
      streamType,
      streamData,
      processingResult: streamResult,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      streamType,
      processed: true,
      streamResult,
      timestamp: new Date().toISOString()
    }
  }
  
  private async analyzeSentiment(data: any): Promise<any> {
    const { text, conversationId } = data
    
    // Analyze sentiment using AI
    const sentiment = await this.performSentimentAnalysis(text)
    
    // Log sentiment analysis
    if (conversationId) {
      await this.logConversationEvent({
        conversationId,
        eventType: 'sentiment_analyzed',
        sentiment,
        timestamp: new Date().toISOString()
      })
    }
    
    return {
      text,
      sentiment,
      confidence: sentiment.confidence,
      timestamp: new Date().toISOString()
    }
  }
  
  private async detectIntent(data: any): Promise<any> {
    const { text, conversationId } = data
    
    // Detect intent using AI
    const intent = await this.performIntentDetection(text)
    
    // Log intent detection
    if (conversationId) {
      await this.logConversationEvent({
        conversationId,
        eventType: 'intent_detected',
        intent,
        timestamp: new Date().toISOString()
      })
    }
    
    return {
      text,
      intent,
      confidence: intent.confidence,
      timestamp: new Date().toISOString()
    }
  }
  
  private async getConversationAnalytics(data: any): Promise<any> {
    const { businessId, timeRange = '24h' } = data
    
    // Get conversation analytics from database
    const { data: conversations, error } = await this.supabase
      .from('conversation_sessions')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', this.getConversationTimeRangeStart(timeRange))
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get conversation analytics: ${error.message}`)
    }
    
    const analytics = {
      totalConversations: conversations.length,
      activeConversations: conversations.filter(conv => conv.status === 'active').length,
      averageDuration: this.calculateAverageConversationDuration(conversations),
      escalationRate: this.calculateEscalationRate(conversations),
      channelDistribution: this.getChannelDistribution(conversations),
      aiAgentUsage: this.getAIAgentUsage(conversations),
      activeConversationSessions: this.getActiveConversationSessions().filter(session => 
        session.participants.includes(businessId)
      ).length
    }
    
    return analytics
  }
  
  private async handleConversationEvent(data: any): Promise<any> {
    const { conversationId, eventType, eventData } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Process conversation event
    const eventResult = await this.processConversationEvent(conversation, eventType, eventData)
    
    // Log event
    await this.logConversationEvent({
      conversationId,
      eventType,
      eventData,
      eventResult,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      eventType,
      eventResult,
      timestamp: new Date().toISOString()
    }
  }
  
  private async mergeConversations(data: any): Promise<any> {
    const { sourceConversationId, targetConversationId, mergeReason } = data
    
    // Validate both conversation sessions
    const sourceConversation = this.getConversationSession(sourceConversationId)
    const targetConversation = this.getConversationSession(targetConversationId)
    
    if (!sourceConversation || !targetConversation) {
      throw new Error('One or both conversation sessions not found')
    }
    
    // Merge conversation histories
    const mergedHistory = [...sourceConversation.conversationHistory, ...targetConversation.conversationHistory]
    const mergedParticipants = [...new Set([...sourceConversation.participants, ...targetConversation.participants])]
    
    // Update target conversation
    this.updateConversationSession(targetConversationId, {
      conversationHistory: mergedHistory,
      participants: mergedParticipants
    })
    
    // Archive source conversation
    await this.archiveConversation({ conversationId: sourceConversationId, reason: 'merged' })
    
    // Log merge event
    await this.logConversationEvent({
      conversationId: targetConversationId,
      eventType: 'conversations_merged',
      sourceConversationId,
      mergeReason,
      timestamp: new Date().toISOString()
    })
    
    return {
      sourceConversationId,
      targetConversationId,
      mergeReason,
      timestamp: new Date().toISOString()
    }
  }
  
  private async archiveConversation(data: any): Promise<any> {
    const { conversationId, reason } = data
    
    // Validate conversation session
    const conversation = this.getConversationSession(conversationId)
    if (!conversation) {
      throw new Error('Conversation session not found')
    }
    
    // Update conversation status in database
    const { data: updatedConversation, error } = await this.supabase
      .from('conversation_sessions')
      .update({
        status: 'archived',
        archived_at: new Date().toISOString(),
        archive_reason: reason
      })
      .eq('id', conversationId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to archive conversation: ${error.message}`)
    }
    
    // Remove from active sessions
    this.removeConversationSession(conversationId)
    
    // Log archive event
    await this.logConversationEvent({
      conversationId,
      eventType: 'conversation_archived',
      reason,
      timestamp: new Date().toISOString()
    })
    
    return {
      conversationId,
      status: 'archived',
      reason,
      timestamp: new Date().toISOString()
    }
  }
  
  // Helper methods
  private async analyzeMessage(message: string): Promise<any> {
    // Analyze message for intent and sentiment
    const intent = await this.performIntentDetection(message)
    const sentiment = await this.performSentimentAnalysis(message)
    
    return {
      intent: intent.intent,
      sentiment: sentiment.sentiment,
      confidence: Math.min(intent.confidence, sentiment.confidence)
    }
  }
  
  private async performSentimentAnalysis(text: string): Promise<any> {
    // Simulate sentiment analysis
    const sentiments = ['positive', 'negative', 'neutral']
    const sentiment = sentiments[Math.floor(Math.random() * sentiments.length)]
    
    return {
      sentiment,
      confidence: 0.8 + Math.random() * 0.2
    }
  }
  
  private async performIntentDetection(text: string): Promise<any> {
    // Simulate intent detection
    const intents = ['return_request', 'refund_inquiry', 'policy_question', 'complaint', 'general_inquiry']
    const intent = intents[Math.floor(Math.random() * intents.length)]
    
    return {
      intent,
      confidence: 0.7 + Math.random() * 0.3
    }
  }
  
  private determineAIAgentForEscalation(level: number): string {
    if (level === 1) return 'customer_service'
    if (level >= 2) return 'escalation'
    return 'triage'
  }
  
  private async generateAIResponse(aiAgent: any, message: string, conversation: any, context: any): Promise<any> {
    // Simulate AI response generation
    const responses = [
      'I understand your concern. Let me help you with that.',
      'Thank you for reaching out. I can assist you with your return request.',
      'I apologize for the inconvenience. Let me escalate this to a specialist.'
    ]
    
    const response = responses[Math.floor(Math.random() * responses.length)]
    
    return {
      content: response,
      confidence: 0.8 + Math.random() * 0.2,
      reasoning: 'Generated based on conversation context and agent type'
    }
  }
  
  private async processConversationStream(conversation: any, streamType: string, streamData: any): Promise<any> {
    // Process conversation stream
    return {
      processed: true,
      streamType,
      analysis: 'Stream processed successfully'
    }
  }
  
  private async storeConversationStream(data: any): Promise<any> {
    const { conversationId, streamType, streamData, processingResult, timestamp } = data
    
    const { data: stream, error } = await this.supabase
      .from('conversation_chunks')
      .insert([{
        session_id: conversationId,
        chunk_type: streamType,
        content: streamData,
        processing_status: processingResult,
        timestamp,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to store conversation stream: ${error.message}`)
    }
    
    return stream
  }
  
  private async logConversationEvent(data: any): Promise<any> {
    const { conversationId, eventType, ...eventData } = data
    
    const { data: logEntry, error } = await this.supabase
      .from('conversation_messages')
      .insert([{
        session_id: conversationId,
        user_id: 'system',
        content: `Event: ${eventType}`,
        message_type: 'system',
        metadata: {
          eventType,
          ...eventData
        },
        timestamp: new Date().toISOString(),
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to log conversation event: ${error.message}`)
    }
    
    return logEntry
  }
  
  private async processConversationEvent(conversation: any, eventType: string, eventData: any): Promise<any> {
    // Process conversation event
    return {
      eventType,
      processed: true,
      result: 'success'
    }
  }
  
  private getConversationTimeRangeStart(timeRange: string): string {
    const now = new Date()
    switch (timeRange) {
      case '1h':
        return new Date(now.getTime() - 60 * 60 * 1000).toISOString()
      case '24h':
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      case '7d':
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      case '30d':
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
      default:
        return new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    }
  }
  
  private calculateAverageConversationDuration(conversations: any[]): number {
    if (conversations.length === 0) return 0
    
    const totalDuration = conversations.reduce((sum, conv) => {
      return sum + (conv.duration || 0)
    }, 0)
    
    return totalDuration / conversations.length
  }
  
  private calculateEscalationRate(conversations: any[]): number {
    if (conversations.length === 0) return 0
    
    const escalatedConversations = conversations.filter(conv => 
      conv.escalation_level > 0
    ).length
    
    return (escalatedConversations / conversations.length) * 100
  }
  
  private getChannelDistribution(conversations: any[]): any {
    const channelCounts = conversations.reduce((acc, conv) => {
      acc[conv.channel] = (acc[conv.channel] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(channelCounts)
      .map(([channel, count]) => ({ channel, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
  }
  
  private getAIAgentUsage(conversations: any[]): any {
    const agentCounts = conversations.reduce((acc, conv) => {
      acc[conv.ai_agent_type] = (acc[conv.ai_agent_type] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(agentCounts)
      .map(([agent, count]) => ({ agent, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
  }
} 