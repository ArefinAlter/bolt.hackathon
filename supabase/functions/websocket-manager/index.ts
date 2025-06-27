import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface WebSocketMessage {
  type: 'connect' | 'disconnect' | 'audio_data' | 'video_data' | 'text_message' | 'call_status'
  sessionId?: string
  userId?: string
  data?: any
  timestamp: number
}

interface WebSocketConnection {
  id: string
  sessionId: string
  userId: string
  connection: WebSocket
  lastActivity: number
  callType: 'voice' | 'video'
}

class WebSocketManager {
  private connections: Map<string, WebSocketConnection> = new Map()
  private sessionConnections: Map<string, Set<string>> = new Map()
  private supabase: any

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
  }

  async handleConnection(ws: WebSocket, request: Request): Promise<void> {
    const url = new URL(request.url)
    const sessionId = url.searchParams.get('sessionId')
    const userId = url.searchParams.get('userId')
    const callType = url.searchParams.get('callType') as 'voice' | 'video'

    if (!sessionId || !userId || !callType) {
      ws.close(1008, 'Missing required parameters')
      return
    }

    const connectionId = crypto.randomUUID()
    const connection: WebSocketConnection = {
      id: connectionId,
      sessionId,
      userId,
      connection: ws,
      lastActivity: Date.now(),
      callType
    }

    // Store connection
    this.connections.set(connectionId, connection)
    
    // Add to session connections
    if (!this.sessionConnections.has(sessionId)) {
      this.sessionConnections.set(sessionId, new Set())
    }
    this.sessionConnections.get(sessionId)!.add(connectionId)

    // Send connection confirmation
    ws.send(JSON.stringify({
      type: 'connected',
      connectionId,
      sessionId,
      timestamp: Date.now()
    }))

    // Update call session status
    await this.updateCallSessionStatus(sessionId, 'connected')

    // Handle incoming messages
    ws.onmessage = async (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data)
        await this.handleMessage(connectionId, message)
      } catch (error) {
        console.error('Error handling WebSocket message:', error)
        ws.send(JSON.stringify({
          type: 'error',
          error: 'Invalid message format',
          timestamp: Date.now()
        }))
      }
    }

    // Handle connection close
    ws.onclose = async () => {
      await this.handleDisconnection(connectionId)
    }

    // Handle errors
    ws.onerror = async (error) => {
      console.error('WebSocket error:', error)
      await this.handleDisconnection(connectionId)
    }
  }

  private async handleMessage(connectionId: string, message: WebSocketMessage): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    connection.lastActivity = Date.now()

    switch (message.type) {
      case 'audio_data':
        await this.handleAudioData(connection, message)
        break
      case 'video_data':
        await this.handleVideoData(connection, message)
        break
      case 'text_message':
        await this.handleTextMessage(connection, message)
        break
      case 'call_status':
        await this.handleCallStatus(connection, message)
        break
      default:
        console.warn('Unknown message type:', message.type)
    }
  }

  private async handleAudioData(connection: WebSocketConnection, message: WebSocketMessage): Promise<void> {
    // Broadcast audio data to other participants in the same session
    const sessionConnections = this.sessionConnections.get(connection.sessionId)
    if (!sessionConnections) return

    const audioMessage = {
      type: 'audio_data',
      userId: connection.userId,
      data: message.data,
      timestamp: Date.now()
    }

    for (const connId of sessionConnections) {
      if (connId !== connection.id) {
        const conn = this.connections.get(connId)
        if (conn && conn.connection.readyState === WebSocket.OPEN) {
          conn.connection.send(JSON.stringify(audioMessage))
        }
      }
    }

    // Process audio with AI if needed
    if (message.data?.processWithAI) {
      await this.processAudioWithAI(connection, message.data)
    }
  }

  private async handleVideoData(connection: WebSocketConnection, message: WebSocketMessage): Promise<void> {
    // Broadcast video data to other participants
    const sessionConnections = this.sessionConnections.get(connection.sessionId)
    if (!sessionConnections) return

    const videoMessage = {
      type: 'video_data',
      userId: connection.userId,
      data: message.data,
      timestamp: Date.now()
    }

    for (const connId of sessionConnections) {
      if (connId !== connection.id) {
        const conn = this.connections.get(connId)
        if (conn && conn.connection.readyState === WebSocket.OPEN) {
          conn.connection.send(JSON.stringify(videoMessage))
        }
      }
    }
  }

  private async handleTextMessage(connection: WebSocketConnection, message: WebSocketMessage): Promise<void> {
    // Store message in database
    await this.storeMessage(connection.sessionId, connection.userId, message.data?.text, 'text')

    // Broadcast to session participants
    const sessionConnections = this.sessionConnections.get(connection.sessionId)
    if (!sessionConnections) return

    const textMessage = {
      type: 'text_message',
      userId: connection.userId,
      text: message.data?.text,
      timestamp: Date.now()
    }

    for (const connId of sessionConnections) {
      const conn = this.connections.get(connId)
      if (conn && conn.connection.readyState === WebSocket.OPEN) {
        conn.connection.send(JSON.stringify(textMessage))
      }
    }

    // Process with AI if needed
    if (message.data?.processWithAI) {
      await this.processTextWithAI(connection, message.data?.text)
    }
  }

  private async handleCallStatus(connection: WebSocketConnection, message: WebSocketMessage): Promise<void> {
    await this.updateCallSessionStatus(connection.sessionId, message.data?.status)
    
    // Broadcast status to all participants
    const sessionConnections = this.sessionConnections.get(connection.sessionId)
    if (!sessionConnections) return

    const statusMessage = {
      type: 'call_status',
      status: message.data?.status,
      userId: connection.userId,
      timestamp: Date.now()
    }

    for (const connId of sessionConnections) {
      const conn = this.connections.get(connId)
      if (conn && conn.connection.readyState === WebSocket.OPEN) {
        conn.connection.send(JSON.stringify(statusMessage))
      }
    }
  }

  private async handleDisconnection(connectionId: string): Promise<void> {
    const connection = this.connections.get(connectionId)
    if (!connection) return

    // Remove from session connections
    const sessionConnections = this.sessionConnections.get(connection.sessionId)
    if (sessionConnections) {
      sessionConnections.delete(connectionId)
      if (sessionConnections.size === 0) {
        this.sessionConnections.delete(connection.sessionId)
        await this.updateCallSessionStatus(connection.sessionId, 'ended')
      }
    }

    // Remove connection
    this.connections.delete(connectionId)
  }

  private async updateCallSessionStatus(sessionId: string, status: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('call_sessions')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId)

      if (error) {
        console.error('Error updating call session status:', error)
      }
    } catch (error) {
      console.error('Error updating call session status:', error)
    }
  }

  private async storeMessage(sessionId: string, userId: string, content: string, type: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          content,
          message_type: type,
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing message:', error)
      }
    } catch (error) {
      console.error('Error storing message:', error)
    }
  }

  private async processAudioWithAI(connection: WebSocketConnection, audioData: any): Promise<void> {
    // Call the process-voice-input function
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-voice-input`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: connection.sessionId,
          userId: connection.userId,
          audioData: audioData.data,
          callType: connection.callType
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Send AI response back to the client
        connection.connection.send(JSON.stringify({
          type: 'ai_response',
          data: result,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error processing audio with AI:', error)
    }
  }

  private async processTextWithAI(connection: WebSocketConnection, text: string): Promise<void> {
    // Call the call-ai-processor function
    try {
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/call-ai-processor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: connection.sessionId,
          userId: connection.userId,
          message: text,
          callType: connection.callType
        })
      })

      if (response.ok) {
        const result = await response.json()
        // Send AI response back to the client
        connection.connection.send(JSON.stringify({
          type: 'ai_response',
          data: result,
          timestamp: Date.now()
        }))
      }
    } catch (error) {
      console.error('Error processing text with AI:', error)
    }
  }

  // Public methods for external access
  public getSessionConnections(sessionId: string): WebSocketConnection[] {
    const connectionIds = this.sessionConnections.get(sessionId)
    if (!connectionIds) return []

    return Array.from(connectionIds)
      .map(id => this.connections.get(id))
      .filter(conn => conn !== undefined) as WebSocketConnection[]
  }

  public broadcastToSession(sessionId: string, message: any): void {
    const sessionConnections = this.sessionConnections.get(sessionId)
    if (!sessionConnections) return

    for (const connId of sessionConnections) {
      const conn = this.connections.get(connId)
      if (conn && conn.connection.readyState === WebSocket.OPEN) {
        conn.connection.send(JSON.stringify(message))
      }
    }
  }
}

// Global WebSocket manager instance
const wsManager = new WebSocketManager()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Handle WebSocket upgrade
  if (req.headers.get('upgrade') === 'websocket') {
    const { socket, response } = Deno.upgradeWebSocket(req)
    await wsManager.handleConnection(socket, req)
    return response
  }

  // Handle HTTP requests for WebSocket management
  const url = new URL(req.url)
  
  if (url.pathname === '/websocket-manager/session-info') {
    const sessionId = url.searchParams.get('sessionId')
    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const connections = wsManager.getSessionConnections(sessionId)
    return new Response(JSON.stringify({
      sessionId,
      connectionCount: connections.length,
      connections: connections.map(conn => ({
        id: conn.id,
        userId: conn.userId,
        callType: conn.callType,
        lastActivity: conn.lastActivity
      }))
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  if (url.pathname === '/websocket-manager/broadcast') {
    const { sessionId, message } = await req.json()
    
    if (!sessionId || !message) {
      return new Response(JSON.stringify({ error: 'Session ID and message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    wsManager.broadcastToSession(sessionId, message)
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }

  return new Response(JSON.stringify({ error: 'Not found' }), {
    status: 404,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
}) 