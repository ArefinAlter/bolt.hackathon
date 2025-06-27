import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface AudioChunk {
  sessionId: string
  userId: string
  audioData: string // Base64 encoded audio
  timestamp: number
  sequence: number
  isFinal: boolean
}

interface AudioStream {
  sessionId: string
  chunks: AudioChunk[]
  isActive: boolean
  lastActivity: number
  processingQueue: AudioChunk[]
}

class AudioStreamProcessor {
  private streams: Map<string, AudioStream> = new Map()
  private supabase: any
  private processingInterval: number = 100 // Process chunks every 100ms

  constructor() {
    this.supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )
    this.startProcessingLoop()
  }

  private startProcessingLoop(): void {
    setInterval(() => {
      this.processQueuedChunks()
    }, this.processingInterval)
  }

  async processAudioChunk(chunk: AudioChunk): Promise<void> {
    const stream = this.getOrCreateStream(chunk.sessionId)
    
    // Add chunk to processing queue
    stream.processingQueue.push(chunk)
    stream.lastActivity = Date.now()

    // Store chunk in database for transcription
    await this.storeAudioChunk(chunk)

    // If this is the final chunk, trigger immediate processing
    if (chunk.isFinal) {
      await this.processStreamChunks(chunk.sessionId)
    }
  }

  private getOrCreateStream(sessionId: string): AudioStream {
    if (!this.streams.has(sessionId)) {
      this.streams.set(sessionId, {
        sessionId,
        chunks: [],
        isActive: true,
        lastActivity: Date.now(),
        processingQueue: []
      })
    }
    return this.streams.get(sessionId)!
  }

  private async processQueuedChunks(): Promise<void> {
    for (const [sessionId, stream] of this.streams) {
      if (stream.processingQueue.length > 0) {
        await this.processStreamChunks(sessionId)
      }
    }
  }

  private async processStreamChunks(sessionId: string): Promise<void> {
    const stream = this.streams.get(sessionId)
    if (!stream || stream.processingQueue.length === 0) return

    // Get chunks from queue
    const chunks = stream.processingQueue.splice(0)
    
    // Combine audio data if needed
    const combinedAudio = await this.combineAudioChunks(chunks)
    
    // Process with speech-to-text
    if (combinedAudio) {
      await this.processSpeechToText(sessionId, combinedAudio, chunks)
    }

    // Update stream chunks
    stream.chunks.push(...chunks)
  }

  private async combineAudioChunks(chunks: AudioChunk[]): Promise<string | null> {
    if (chunks.length === 0) return null

    // For now, we'll process each chunk individually
    // In a production system, you might want to combine chunks for better STT accuracy
    return chunks[0].audioData
  }

  private async processSpeechToText(sessionId: string, audioData: string, chunks: AudioChunk[]): Promise<void> {
    try {
      // Call the process-voice-input function
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/process-voice-input`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          userId: chunks[0].userId,
          audioData,
          callType: 'voice',
          isStreaming: true,
          chunkCount: chunks.length
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Store transcription result
        await this.storeTranscription(sessionId, chunks[0].userId, result.transcription, chunks)
        
        // If there's an AI response, trigger text-to-speech
        if (result.aiResponse) {
          await this.generateAudioResponse(sessionId, result.aiResponse)
        }
      }
    } catch (error) {
      console.error('Error processing speech to text:', error)
    }
  }

  private async generateAudioResponse(sessionId: string, text: string): Promise<void> {
    try {
      // Call the stream-voice-call function
      const response = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/stream-voice-call`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          text,
          voiceId: 'default', // This should come from the call session
          isResponse: true
        })
      })

      if (response.ok) {
        const result = await response.json()
        
        // Store the audio response
        await this.storeAudioResponse(sessionId, text, result.audioUrl)
        
        // Broadcast to WebSocket connections
        await this.broadcastAudioResponse(sessionId, result.audioUrl, text)
      }
    } catch (error) {
      console.error('Error generating audio response:', error)
    }
  }

  private async storeAudioChunk(chunk: AudioChunk): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('audio_chunks')
        .insert({
          session_id: chunk.sessionId,
          user_id: chunk.userId,
          audio_data: chunk.audioData,
          sequence: chunk.sequence,
          timestamp: new Date(chunk.timestamp).toISOString(),
          is_final: chunk.isFinal
        })

      if (error) {
        console.error('Error storing audio chunk:', error)
      }
    } catch (error) {
      console.error('Error storing audio chunk:', error)
    }
  }

  private async storeTranscription(sessionId: string, userId: string, transcription: string, chunks: AudioChunk[]): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          user_id: userId,
          content: transcription,
          message_type: 'voice_transcription',
          metadata: {
            chunkCount: chunks.length,
            startTime: chunks[0].timestamp,
            endTime: chunks[chunks.length - 1].timestamp
          },
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing transcription:', error)
      }
    } catch (error) {
      console.error('Error storing transcription:', error)
    }
  }

  private async storeAudioResponse(sessionId: string, text: string, audioUrl: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('conversation_messages')
        .insert({
          session_id: sessionId,
          user_id: 'ai_system',
          content: text,
          message_type: 'voice_response',
          metadata: {
            audioUrl,
            isAIResponse: true
          },
          timestamp: new Date().toISOString()
        })

      if (error) {
        console.error('Error storing audio response:', error)
      }
    } catch (error) {
      console.error('Error storing audio response:', error)
    }
  }

  private async broadcastAudioResponse(sessionId: string, audioUrl: string, text: string): Promise<void> {
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
            type: 'audio_response',
            audioUrl,
            text,
            timestamp: Date.now()
          }
        })
      })

      if (!response.ok) {
        console.error('Error broadcasting audio response')
      }
    } catch (error) {
      console.error('Error broadcasting audio response:', error)
    }
  }

  async endStream(sessionId: string): Promise<void> {
    const stream = this.streams.get(sessionId)
    if (stream) {
      stream.isActive = false
      
      // Process any remaining chunks
      if (stream.processingQueue.length > 0) {
        await this.processStreamChunks(sessionId)
      }

      // Clean up after a delay
      setTimeout(() => {
        this.streams.delete(sessionId)
      }, 5000) // Keep for 5 seconds after ending
    }
  }

  getStreamInfo(sessionId: string): any {
    const stream = this.streams.get(sessionId)
    if (!stream) return null

    return {
      sessionId: stream.sessionId,
      isActive: stream.isActive,
      chunkCount: stream.chunks.length,
      queueLength: stream.processingQueue.length,
      lastActivity: stream.lastActivity
    }
  }
}

// Global audio processor instance
const audioProcessor = new AudioStreamProcessor()

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { sessionId, userId, audioData, sequence, isFinal } = await req.json()

    if (!sessionId || !userId || !audioData) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    const chunk: AudioChunk = {
      sessionId,
      userId,
      audioData,
      timestamp: Date.now(),
      sequence: sequence || 0,
      isFinal: isFinal || false
    }

    await audioProcessor.processAudioChunk(chunk)

    return new Response(JSON.stringify({ 
      success: true, 
      processed: true,
      timestamp: Date.now()
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error processing audio chunk:', error)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
}) 