import { MCPServer, MCPRequest, MCPResponse, CallContext } from '../mcp-base/index.ts'

export class CallMCPServer extends MCPServer {
  private supabase: any
  private callProviders: Map<string, any> = new Map()
  private streamingSessions: Map<string, any> = new Map()
  
  constructor() {
    super('call-mcp-server', [
      'initiate_call',
      'join_call',
      'end_call',
      'mute_participant',
      'unmute_participant',
      'add_participant',
      'remove_participant',
      'start_recording',
      'stop_recording',
      'get_call_status',
      'update_call_settings',
      'handle_call_event',
      'stream_audio',
      'stream_video',
      'get_call_server_analytics',
      'validate_call_server_permissions'
    ], 'high')
    
    this.initializeSupabase()
    this.initializeCallProviders()
  }
  
  private async initializeSupabase() {
    const { createClient } = await import('npm:@supabase/supabase-js@2')
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') || '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    )
  }
  
  private initializeCallProviders() {
    // Initialize ElevenLabs for voice calls
    this.callProviders.set('elevenlabs', {
      apiKey: Deno.env.get('ELEVENLABS_API_KEY'),
      baseUrl: 'https://api.elevenlabs.io/v1'
    })
    
    // Initialize Tavus for video calls
    this.callProviders.set('tavus', {
      apiKey: Deno.env.get('TAVUS_API_KEY'),
      baseUrl: 'https://api.tavus.com'
    })
  }
  
  protected async processRequest(request: MCPRequest): Promise<any> {
    switch (request.action) {
      case 'initiate_call':
        return await this.initiateCall(request.data)
      
      case 'join_call':
        return await this.joinCall(request.data)
      
      case 'end_call':
        return await this.endCall(request.data)
      
      case 'mute_participant':
        return await this.muteParticipant(request.data)
      
      case 'unmute_participant':
        return await this.unmuteParticipant(request.data)
      
      case 'add_participant':
        return await this.addParticipant(request.data)
      
      case 'remove_participant':
        return await this.removeParticipant(request.data)
      
      case 'start_recording':
        return await this.startRecording(request.data)
      
      case 'stop_recording':
        return await this.stopRecording(request.data)
      
      case 'get_call_status':
        return await this.getCallStatus(request.data)
      
      case 'update_call_settings':
        return await this.updateCallSettings(request.data)
      
      case 'handle_call_event':
        return await this.handleCallEvent(request.data)
      
      case 'stream_audio':
        return await this.streamAudio(request.data)
      
      case 'stream_video':
        return await this.streamVideo(request.data)
      
      case 'get_call_server_analytics':
        return await this.getCallAnalytics(request.data)
      
      case 'validate_call_server_permissions':
        return await this.validateCallPermissions(request.data)
      
      default:
        throw new Error(`Unknown action: ${request.action}`)
    }
  }
  
  private async initiateCall(data: any): Promise<any> {
    const { businessId, customerEmail, callType, returnRequestId, provider, chatSessionId } = data
    
    // Validate call permissions
    const permissions = await this.validateCallPermissions({
      businessId,
      customerEmail,
      callType
    })
    
    if (!permissions.allowed) {
      throw new Error(`Call not allowed: ${permissions.reason}`)
    }
    
    // Create call session (without non-existent fields)
    const { data: callSession, error } = await this.supabase
      .from('call_sessions')
      .insert([{
        chat_session_id: chatSessionId, // Use the proper foreign key
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
    
    // Initialize call with provider
    const providerConfig = await this.getProviderConfig(provider || 'internal')
    const callInitiation = await this.initializeCallWithProvider(callSession, providerConfig, callType)
    
    // Register call session in MCP server
    this.registerCallSession(callSession.id, {
      callSessionId: callSession.id,
      callType: callType as 'voice' | 'video',
      provider: provider || 'internal',
      streamingEnabled: true,
      participantCount: 1,
      callStatus: 'initiating',
      lastActivity: new Date().toISOString()
    })
    
    return {
      callSession,
      providerConfig: callInitiation,
      status: 'initiating'
    }
  }
  
  private async joinCall(data: any): Promise<any> {
    const { callSessionId, participantId, participantType } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Update call session
    this.updateCallSession(callSessionId, {
      participantCount: callSession.participantCount + 1,
      callStatus: 'active',
      lastActivity: new Date().toISOString()
    })
    
    // Log participant join
    await this.logCallEvent({
      callSessionId,
      eventType: 'participant_joined',
      participantId,
      participantType,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      participantId,
      status: 'joined',
      timestamp: new Date().toISOString()
    }
  }
  
  private async endCall(data: any): Promise<any> {
    const { callSessionId, reason, duration } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Update call session
    this.updateCallSession(callSessionId, {
      callStatus: 'ended',
      lastActivity: new Date().toISOString()
    })
    
    // Update database
    const { data: updatedSession, error } = await this.supabase
      .from('call_sessions')
      .update({
        status: 'ended',
        duration,
        ended_at: new Date().toISOString()
      })
      .eq('id', callSessionId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to end call: ${error.message}`)
    }
    
    // Clean up streaming session
    this.streamingSessions.delete(callSessionId)
    
    // Log call end
    await this.logCallEvent({
      callSessionId,
      eventType: 'call_ended',
      reason,
      duration,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      status: 'ended',
      duration,
      timestamp: new Date().toISOString()
    }
  }
  
  private async muteParticipant(data: any): Promise<any> {
    const { callSessionId, participantId } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Log mute event
    await this.logCallEvent({
      callSessionId,
      eventType: 'participant_muted',
      participantId,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      participantId,
      action: 'muted',
      timestamp: new Date().toISOString()
    }
  }
  
  private async unmuteParticipant(data: any): Promise<any> {
    const { callSessionId, participantId } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Log unmute event
    await this.logCallEvent({
      callSessionId,
      eventType: 'participant_unmuted',
      participantId,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      participantId,
      action: 'unmuted',
      timestamp: new Date().toISOString()
    }
  }
  
  private async addParticipant(data: any): Promise<any> {
    const { callSessionId, participantId, participantType, participantEmail } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Update participant count
    this.updateCallSession(callSessionId, {
      participantCount: callSession.participantCount + 1,
      lastActivity: new Date().toISOString()
    })
    
    // Log participant addition
    await this.logCallEvent({
      callSessionId,
      eventType: 'participant_added',
      participantId,
      participantType,
      participantEmail,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      participantId,
      participantType,
      action: 'added',
      timestamp: new Date().toISOString()
    }
  }
  
  private async removeParticipant(data: any): Promise<any> {
    const { callSessionId, participantId } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Update participant count
    this.updateCallSession(callSessionId, {
      participantCount: Math.max(0, callSession.participantCount - 1),
      lastActivity: new Date().toISOString()
    })
    
    // Log participant removal
    await this.logCallEvent({
      callSessionId,
      eventType: 'participant_removed',
      participantId,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      participantId,
      action: 'removed',
      timestamp: new Date().toISOString()
    }
  }
  
  private async startRecording(data: any): Promise<any> {
    const { callSessionId, recordingType } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Start recording with provider
    const recordingConfig = await this.startProviderRecording(callSession, recordingType)
    
    // Log recording start
    await this.logCallEvent({
      callSessionId,
      eventType: 'recording_started',
      recordingType,
      recordingConfig,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      recordingType,
      status: 'started',
      recordingConfig,
      timestamp: new Date().toISOString()
    }
  }
  
  private async stopRecording(data: any): Promise<any> {
    const { callSessionId, recordingId } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Stop recording with provider
    const recordingResult = await this.stopProviderRecording(callSession, recordingId)
    
    // Log recording stop
    await this.logCallEvent({
      callSessionId,
      eventType: 'recording_stopped',
      recordingId,
      recordingResult,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      recordingId,
      status: 'stopped',
      recordingResult,
      timestamp: new Date().toISOString()
    }
  }
  
  private async getCallStatus(data: any): Promise<any> {
    const { callSessionId } = data
    
    // Get call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Get additional status from database
    const { data: dbSession, error } = await this.supabase
      .from('call_sessions')
      .select('*')
      .eq('id', callSessionId)
      .single()
    
    if (error) {
      throw new Error(`Failed to get call status: ${error.message}`)
    }
    
    return {
      callSession,
      dbSession,
      streamingStatus: this.getStreamingStatus(callSessionId),
      timestamp: new Date().toISOString()
    }
  }
  
  private async updateCallSettings(data: any): Promise<any> {
    const { callSessionId, settings } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Update call settings
    this.updateCallSession(callSessionId, {
      lastActivity: new Date().toISOString()
    })
    
    // Update provider settings
    const providerSettings = await this.updateProviderSettings(callSession, settings)
    
    return {
      callSessionId,
      settings,
      providerSettings,
      timestamp: new Date().toISOString()
    }
  }
  
  private async handleCallEvent(data: any): Promise<any> {
    const { callSessionId, eventType, eventData } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Process call event
    const eventResult = await this.processCallEvent(callSession, eventType, eventData)
    
    // Log event
    await this.logCallEvent({
      callSessionId,
      eventType,
      eventData,
      eventResult,
      timestamp: new Date().toISOString()
    })
    
    return {
      callSessionId,
      eventType,
      eventResult,
      timestamp: new Date().toISOString()
    }
  }
  
  private async streamAudio(data: any): Promise<any> {
    const { callSessionId, audioChunk, participantId, timestamp } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Process audio stream
    const audioResult = await this.processAudioStream(callSession, audioChunk, participantId)
    
    // Store audio chunk
    await this.storeAudioChunk({
      callSessionId,
      participantId,
      audioChunk,
      timestamp,
      processingResult: audioResult
    })
    
    return {
      callSessionId,
      participantId,
      audioProcessed: true,
      audioResult,
      timestamp: new Date().toISOString()
    }
  }
  
  private async streamVideo(data: any): Promise<any> {
    const { callSessionId, videoFrame, participantId, timestamp } = data
    
    // Validate call session
    const callSession = this.getCallSession(callSessionId)
    if (!callSession) {
      throw new Error('Call session not found')
    }
    
    // Process video stream
    const videoResult = await this.processVideoStream(callSession, videoFrame, participantId)
    
    // Store video frame
    await this.storeVideoFrame({
      callSessionId,
      participantId,
      videoFrame,
      timestamp,
      processingResult: videoResult
    })
    
    return {
      callSessionId,
      participantId,
      videoProcessed: true,
      videoResult,
      timestamp: new Date().toISOString()
    }
  }
  
  private async getCallAnalytics(data: any): Promise<any> {
    const { businessId, timeRange = '24h' } = data
    
    // Get call analytics from database
    const { data: callSessions, error } = await this.supabase
      .from('call_sessions')
      .select('*')
      .eq('business_id', businessId)
      .gte('created_at', this.getCallTimeRangeStart(timeRange))
      .order('created_at', { ascending: false })
    
    if (error) {
      throw new Error(`Failed to get call analytics: ${error.message}`)
    }
    
    const analytics = {
      totalCalls: callSessions.length,
      voiceCalls: callSessions.filter(call => call.call_type === 'voice').length,
      videoCalls: callSessions.filter(call => call.call_type === 'video').length,
      averageDuration: this.calculateAverageCallDuration(callSessions),
      successRate: this.calculateCallSuccessRate(callSessions),
      providerStats: this.getProviderStats(callSessions),
      activeCalls: this.getActiveCallSessions().filter(session => session.provider === businessId).length
    }
    
    return analytics
  }
  
  private async validateCallPermissions(data: any): Promise<any> {
    const { businessId, customerEmail, callType } = data
    
    // Get business policy
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
    
    // Check if call type is allowed
    if (callType === 'voice' && !policy.rules.allow_voice_calls) {
      permissions.allowed = false
      permissions.reason = 'Voice calls not allowed'
      permissions.restrictions.push('voice_calls_disabled')
    }
    
    if (callType === 'video' && !policy.rules.allow_video_calls) {
      permissions.allowed = false
      permissions.reason = 'Video calls not allowed'
      permissions.restrictions.push('video_calls_disabled')
    }
    
    // Check business hours
    const currentHour = new Date().getHours()
    if (currentHour < 8 || currentHour > 20) {
      permissions.restrictions.push('outside_business_hours')
    }
    
    return permissions
  }
  
  // Helper methods
  private async getProviderConfig(provider: string): Promise<any> {
    const config = this.callProviders.get(provider)
    if (!config) {
      throw new Error(`Provider ${provider} not configured`)
    }
    return config
  }
  
  private async initializeCallWithProvider(callSession: any, providerConfig: any, callType: string): Promise<any> {
    // Initialize call with specific provider
    if (callType === 'voice' && providerConfig.apiKey) {
      return await this.initializeVoiceCall(callSession, providerConfig)
    } else if (callType === 'video' && providerConfig.apiKey) {
      return await this.initializeVideoCall(callSession, providerConfig)
    }
    
    return { provider: 'internal', status: 'initialized' }
  }
  
  private async initializeVoiceCall(callSession: any, providerConfig: any): Promise<any> {
    // Initialize ElevenLabs voice call
    const response = await fetch(`${providerConfig.baseUrl}/text-to-speech`, {
      method: 'POST',
      headers: {
        'xi-api-key': providerConfig.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: 'Hello, this is your AI assistant. How can I help you today?',
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5
        }
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to initialize voice call')
    }
    
    return {
      provider: 'elevenlabs',
      status: 'initialized',
      voiceId: 'default'
    }
  }
  
  private async initializeVideoCall(callSession: any, providerConfig: any): Promise<any> {
    // Initialize Tavus video call
    const response = await fetch(`${providerConfig.baseUrl}/videos`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${providerConfig.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `Call Session ${callSession.id}`,
        description: 'AI-powered video call session'
      })
    })
    
    if (!response.ok) {
      throw new Error('Failed to initialize video call')
    }
    
    return {
      provider: 'tavus',
      status: 'initialized',
      videoId: 'default'
    }
  }
  
  private async logCallEvent(data: any): Promise<any> {
    const { callSessionId, eventType, ...eventData } = data
    
    const { data: logEntry, error } = await this.supabase
      .from('call_transcripts')
      .insert([{
        call_session_id: callSessionId,
        event_type: eventType,
        event_data: eventData,
        timestamp: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to log call event: ${error.message}`)
    }
    
    return logEntry
  }
  
  private async startProviderRecording(callSession: any, recordingType: string): Promise<any> {
    // Start recording with provider
    return {
      recordingId: crypto.randomUUID(),
      recordingType,
      status: 'started'
    }
  }
  
  private async stopProviderRecording(callSession: any, recordingId: string): Promise<any> {
    // Stop recording with provider
    return {
      recordingId,
      status: 'stopped',
      recordingUrl: `https://storage.example.com/recordings/${recordingId}.mp4`
    }
  }
  
  private getStreamingStatus(callSessionId: string): any {
    const streamingSession = this.streamingSessions.get(callSessionId)
    return streamingSession || { status: 'not_streaming' }
  }
  
  private async updateProviderSettings(callSession: any, settings: any): Promise<any> {
    // Update provider settings
    return {
      updated: true,
      settings
    }
  }
  
  private async processCallEvent(callSession: any, eventType: string, eventData: any): Promise<any> {
    // Process call event
    return {
      eventType,
      processed: true,
      result: 'success'
    }
  }
  
  private async processAudioStream(callSession: any, audioChunk: any, participantId: string): Promise<any> {
    // Process audio stream
    return {
      processed: true,
      transcription: 'Sample transcription',
      sentiment: 'neutral'
    }
  }
  
  private async processVideoStream(callSession: any, videoFrame: any, participantId: string): Promise<any> {
    // Process video stream
    return {
      processed: true,
      analysis: 'Sample video analysis',
      quality: 'good'
    }
  }
  
  private async storeAudioChunk(data: any): Promise<any> {
    const { callSessionId, participantId, audioChunk, timestamp, processingResult } = data
    
    const { data: chunk, error } = await this.supabase
      .from('audio_chunks')
      .insert([{
        session_id: callSessionId,
        user_id: participantId,
        audio_data: audioChunk,
        timestamp,
        processing_status: processingResult,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to store audio chunk: ${error.message}`)
    }
    
    return chunk
  }
  
  private async storeVideoFrame(data: any): Promise<any> {
    const { callSessionId, participantId, videoFrame, timestamp, processingResult } = data
    
    const { data: frame, error } = await this.supabase
      .from('video_frames')
      .insert([{
        session_id: callSessionId,
        user_id: participantId,
        frame_data: videoFrame,
        timestamp,
        processing_status: processingResult,
        created_at: new Date().toISOString()
      }])
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to store video frame: ${error.message}`)
    }
    
    return frame
  }
  
  private getCallTimeRangeStart(timeRange: string): string {
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
  
  private calculateAverageCallDuration(callSessions: any[]): number {
    if (callSessions.length === 0) return 0
    
    const totalDuration = callSessions.reduce((sum, session) => {
      return sum + (session.duration || 0)
    }, 0)
    
    return totalDuration / callSessions.length
  }
  
  private calculateCallSuccessRate(callSessions: any[]): number {
    if (callSessions.length === 0) return 0
    
    const successfulCalls = callSessions.filter(session => 
      session.status === 'ended' || session.status === 'completed'
    ).length
    
    return (successfulCalls / callSessions.length) * 100
  }
  
  private getProviderStats(callSessions: any[]): any {
    const providerCounts = callSessions.reduce((acc, session) => {
      acc[session.provider] = (acc[session.provider] || 0) + 1
      return acc
    }, {})
    
    return Object.entries(providerCounts)
      .map(([provider, count]) => ({ provider, count }))
      .sort((a, b) => (b.count as number) - (a.count as number))
  }
} 