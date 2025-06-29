import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface VideoFrame {
  sessionId: string
  userId: string
  frameData: string // Base64 encoded video frame
  timestamp: number
  sequence: number
  isKeyFrame: boolean
  metadata?: any
}

interface VideoStream {
  sessionId: string
  frames: VideoFrame[]
  isActive: boolean
  lastActivity: number
  processingQueue: VideoFrame[]
  participantCount: number
}

class VideoStreamProcessor {
  private streams: Map<string, VideoStream> = new Map()
  private supabase: any
  private processingInterval: number = 200 // Process frames every 200ms

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    this.startProcessingLoop()
  }

  private startProcessingLoop(): void {
    setInterval(() => {
      this.processQueuedFrames()
    }, this.processingInterval)
  }

  async processVideoFrame(frame: VideoFrame): Promise<void> {
    const stream = this.getOrCreateStream(frame.sessionId)
    
    // Add frame to processing queue
    stream.processingQueue.push(frame)
    stream.lastActivity = Date.now()

    // Store frame metadata in database
    await this.storeVideoFrame(frame)

    // Process key frames immediately for AI analysis
    if (frame.isKeyFrame) {
      await this.processKeyFrame(frame)
    }
  }

  private getOrCreateStream(sessionId: string): VideoStream {
    if (!this.streams.has(sessionId)) {
      this.streams.set(sessionId, {
        sessionId,
        frames: [],
        isActive: true,
        lastActivity: Date.now(),
        processingQueue: [],
        participantCount: 0
      })
    }
    return this.streams.get(sessionId)!
  }

  private async processQueuedFrames(): Promise<void> {
    for (const [sessionId, stream] of this.streams) {
      if (stream.processingQueue.length > 0) {
        await this.processStreamFrames(sessionId)
      }
    }
  }

  private async processStreamFrames(sessionId: string): Promise<void> {
    const stream = this.streams.get(sessionId)
    if (!stream || stream.processingQueue.length === 0) return

    // Get frames from queue
    const frames = stream.processingQueue.splice(0)
    
    // Update stream frames
    stream.frames.push(...frames)

    // Analyze video content if needed
    if (frames.some(f => f.isKeyFrame)) {
      await this.analyzeVideoContent(sessionId, frames)
    }
  }

  private async processKeyFrame(frame: VideoFrame): Promise<void> {
    try {
      // Analyze the key frame for content, emotions, or gestures
      const analysis = await this.analyzeFrame(frame)
      
      if (analysis) {
        await this.storeFrameAnalysis(frame, analysis)
        
        // If analysis indicates something important, trigger AI response
        if (analysis.requiresResponse) {
          await this.triggerAIResponse(frame.sessionId, analysis)
        }
      }
    } catch (error) {
      console.error('Error processing key frame:', error)
    }
  }

  private async analyzeFrame(frame: VideoFrame): Promise<any> {
    // This would integrate with computer vision APIs
    // For now, we'll do basic analysis
    return {
      hasFace: true,
      emotion: 'neutral',
      gesture: null,
      requiresResponse: false,
      confidence: 0.8
    }
  }

  private async analyzeVideoContent(sessionId: string, frames: VideoFrame[]): Promise<void> {
    try {
      // Get recent frames for analysis
      const recentFrames = frames.filter(f => f.timestamp > Date.now() - 5000) // Last 5 seconds
      
      if (recentFrames.length === 0) return

      // Analyze video patterns
      const analysis = {
        frameRate: recentFrames.length / 5, // frames per second
        hasMovement: recentFrames.some(f => f.metadata?.hasMovement),
        participantCount: this.getParticipantCount(sessionId),
        quality: this.assessVideoQuality(recentFrames)
      }

      // Store analysis
      await this.storeVideoAnalysis(sessionId, analysis)

      // Trigger AI response if needed
      if (analysis.hasMovement && analysis.participantCount > 0) {
        await this.triggerVideoAIResponse(sessionId, analysis)
      }
    } catch (error) {
      console.error('Error analyzing video content:', error)
    }
  }

  private getParticipantCount(sessionId: string): number {
    const stream = this.streams.get(sessionId)
    return stream?.participantCount || 0
  }

  private assessVideoQuality(frames: VideoFrame[]): string {
    // Basic quality assessment
    const keyFrameCount = frames.filter(f => f.isKeyFrame).length
    const totalFrames = frames.length
    
    if (keyFrameCount / totalFrames > 0.3) {
      return 'high'
    } else if (keyFrameCount / totalFrames > 0.1) {
      return 'medium'
    } else {
      return 'low'
    }
  }

  private async triggerAIResponse(sessionId: string, analysis: any): Promise<void> {
    try {
      // Call the call-ai-processor function with video context
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/call-ai-processor`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: 'Video analysis triggered',
          callType: 'video',
          videoContext: analysis,
          isVideoTriggered: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        if (result.aiResponse) {
          // Generate video response using Tavus
          await this.generateVideoResponse(sessionId, result.aiResponse)
        }
      }
    } catch (error) {
      console.error('Error triggering AI response:', error)
    }
  }

  private async triggerVideoAIResponse(sessionId: string, analysis: any): Promise<void> {
    try {
      // Call the initiate-video-conversation function
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/initiate-video-conversation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          context: analysis,
          isStreaming: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Store video response
        await this.storeVideoResponse(sessionId, result.videoUrl, result.script)
        
        // Broadcast to WebSocket connections
        await this.broadcastVideoResponse(sessionId, result.videoUrl, result.script)
      }
    } catch (error) {
      console.error('Error triggering video AI response:', error)
    }
  }

  private async generateVideoResponse(sessionId: string, script: string): Promise<void> {
    try {
      // Call the create-video-persona function to generate a response
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/test-persona`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          script,
          personaId: 'default', // This should come from the call session
          isResponse: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Store the video response
        await this.storeVideoResponse(sessionId, result.videoUrl, script)
        
        // Broadcast to WebSocket connections
        await this.broadcastVideoResponse(sessionId, result.videoUrl, script)
      }
    } catch (error) {
      console.error('Error generating video response:', error)
    }
  }

  private async storeVideoFrame(frame: VideoFrame): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('video_frames')
        .insert({
          session_id: frame.sessionId,
          user_id: frame.userId,
          frame_data: frame.frameData,
          sequence: frame.sequence,
          timestamp: new Date(frame.timestamp).toISOString(),
          is_key_frame: frame.isKeyFrame,
          metadata: frame.metadata || {}
        })

      if (error) {
        console.error('Error storing video frame:', error)
      }
    } catch (error) {
      console.error('Error storing video frame:', error)
    }
  }

  private async storeFrameAnalysis(frame: VideoFrame, analysis: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('video_analysis')
        .insert({
          session_id: frame.sessionId,
          user_id: frame.userId,
          frame_sequence: frame.sequence,
          analysis_data: analysis,
          timestamp: new Date(frame.timestamp).toISOString()
        })

      if (error) {
        console.error('Error storing frame analysis:', error)
      }
    } catch (error) {
      console.error('Error storing frame analysis:', error)
    }
  }

  private async storeVideoAnalysis(sessionId: string, analysis: any): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('video_stream_analysis')
        .insert({
          session_id: sessionId,
          analysis_data: analysis,
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing video analysis:', error)
      }
    } catch (error) {
      console.error('Error storing video analysis:', error)
    }
  }

  private async storeVideoResponse(sessionId: string, videoUrl: string, script: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          user_id: 'ai_system',
          content: script,
          message_type: 'video_response',
          metadata: {
            videoUrl,
            isAIResponse: true
          },
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing video response:', error)
      }
    } catch (error) {
      console.error('Error storing video response:', error)
    }
  }

  private async broadcastVideoResponse(sessionId: string, videoUrl: string, script: string): Promise<void> {
    try {
      // Call the websocket-manager to broadcast the response
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/websocket-manager/broadcast`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          message: {
            type: 'video_response',
            videoUrl,
            script,
            timestamp: Date.now()
          }
        })
      })

      if (!response.ok) {
        console.error('Error broadcasting video response')
      }
    } catch (error) {
      console.error('Error broadcasting video response:', error)
    }
  }

  async updateParticipantCount(sessionId: string, count: number): Promise<void> {
    const stream = this.streams.get(sessionId)
    if (stream) {
      stream.participantCount = count
    }
  }

  async endStream(sessionId: string): Promise<void> {
    const stream = this.streams.get(sessionId)
    if (stream) {
      stream.isActive = false
      
      // Process any remaining frames
      if (stream.processingQueue.length > 0) {
        await this.processStreamFrames(sessionId)
      }

      // Clean up after a delay
      setTimeout(() => {
        this.streams.delete(sessionId)
      }, 10000) // Keep for 10 seconds after ending
    }
  }

  getStreamInfo(sessionId: string): any {
    const stream = this.streams.get(sessionId)
    if (!stream) return null

    return {
      sessionId: stream.sessionId,
      isActive: stream.isActive,
      frameCount: stream.frames.length,
      queueLength: stream.processingQueue.length,
      participantCount: stream.participantCount,
      lastActivity: stream.lastActivity
    }
  }
}

// Global video processor instance
const videoProcessor = new VideoStreamProcessor()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, userId, frameData, sequence, isKeyFrame, metadata, demo_mode } = await req.json()

    // Demo mode - return mock processed data
    if (demo_mode) {
      const mockProcessedVideo = {
        session_id: sessionId || 'demo-session-123',
        user_id: userId || 'demo-user-123',
        processed: true,
        frame_quality: 0.95,
        participant_detected: true,
        analysis: {
          participant_count: 1,
          video_quality: 'high',
          frame_rate: 30,
          resolution: '1920x1080'
        },
        timestamp: new Date().toISOString(),
        demo_mode: true
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: mockProcessedVideo
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!sessionId || !userId || !frameData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const frame: VideoFrame = {
      sessionId,
      userId,
      frameData,
      timestamp: Date.now(),
      sequence: sequence || 0,
      isKeyFrame: isKeyFrame || false,
      metadata
    }

    await videoProcessor.processVideoFrame(frame)

    return new Response(JSON.stringify({ 
      success: true, 
      processed: true,
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing video frame:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 