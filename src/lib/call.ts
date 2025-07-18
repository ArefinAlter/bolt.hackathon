import { supabase } from './supabase';
import { CallSession, CallTranscript, AudioChunk, VideoFrame, WebSocketMessage } from '@/types/call';

// Start a voice call
export async function startVoiceCall(
  chatSessionId: string,
  configOverride?: { voice_id?: string },
  demoMode = false
): Promise<CallSession> {
  try {
    // Call the initiate-call function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/initiate-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_session_id: chatSessionId,
        call_type: 'voice',
        provider: 'elevenlabs',
        config_override: configOverride,
        enable_streaming: true,
        demo_mode: demoMode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start voice call');
    }
    
    const data = await response.json();
    return {
      id: data.call_session_id,
      chat_session_id: chatSessionId,
      call_type: 'voice',
      provider: 'elevenlabs',
      status: data.status || 'initiated',
      created_at: new Date().toISOString(),
      is_active: true,
      streaming_enabled: data.streaming_enabled,
      websocket_url: data.websocket_url,
      stream_processor_urls: data.stream_processor_urls,
      external_session_id: data.provider?.external_session_id,
      session_url: data.provider?.session_url,
      elevenlabs_agent_id: data.provider?.agent_id,
      elevenlabs_conversation_id: data.provider?.conversation_id,
      provider_data: data.provider,
      demo_mode: data.demo_mode || demoMode
    };
  } catch (error) {
    console.error('Error starting voice call:', error);
    throw error;
  }
}

// Start a video call
export async function startVideoCall(
  chatSessionId: string,
  configOverride?: { replica_id?: string },
  demoMode = false
): Promise<CallSession> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    let callSession: any;

    if (demoMode) {
      // In demo mode, create a mock call session without database
      console.log('🎭 Demo mode: Creating mock video call session');
      callSession = {
        id: `demo-video-${Date.now()}`,
        chat_session_id: chatSessionId,
        call_type: 'video',
        provider: 'tavus',
        status: 'initializing',
        started_at: new Date().toISOString(),
        provider_data: {
          replica_id: configOverride?.replica_id || 'demo-replica-123',
          persona_id: 'demo-persona-123',
          config_override: configOverride
        }
      };
    } else {
      // Create call session in database for live mode
      const { data: dbCallSession, error: callError } = await supabase
        .from('call_sessions')
        .insert([
          {
            chat_session_id: chatSessionId,
            call_type: 'video',
            provider: 'tavus',
            status: 'initializing',
            started_at: new Date().toISOString(),
            provider_data: {
              replica_id: configOverride?.replica_id,
              persona_id: undefined,
              config_override: configOverride
            }
          }
        ])
        .select()
        .single();

      if (callError) {
        throw callError;
      }
      callSession = dbCallSession;
    }

    // Initialize video conversation
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/initiate-video-conversation`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call_session_id: callSession.id,
        replica_id: configOverride?.replica_id || undefined,
        persona_id: undefined,
        conversation_settings: {
          background: 'transparent',
          quality: 'standard'
        },
        demo_mode: demoMode
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initiate video conversation');
    }

    const conversationData = await response.json();

    // Update call session with conversation details
    if (demoMode) {
      // In demo mode, just update the local object
      callSession.status = 'active';
      callSession.external_session_id = conversationData.conversation_id;
      callSession.session_url = conversationData.conversation_url;
      callSession.websocket_url = conversationData.websocket_url;
      callSession.provider_data = {
        ...callSession.provider_data,
        conversation_id: conversationData.conversation_id,
        conversation_url: conversationData.conversation_url,
        websocket_url: conversationData.websocket_url,
        ai_agent_ready: conversationData.ai_agent_ready
      };
    } else {
      // Update call session in database for live mode
      const { data: updatedCallSession, error: updateError } = await supabase
        .from('call_sessions')
        .update({
          status: 'active',
          external_session_id: conversationData.conversation_id,
          session_url: conversationData.conversation_url,
          websocket_url: conversationData.websocket_url,
          provider_data: {
            ...callSession.provider_data,
            conversation_id: conversationData.conversation_id,
            conversation_url: conversationData.conversation_url,
            websocket_url: conversationData.websocket_url,
            ai_agent_ready: conversationData.ai_agent_ready
          }
        })
        .eq('id', callSession.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }
      callSession = updatedCallSession;
    }

    return {
      id: callSession.id,
      chat_session_id: callSession.chat_session_id,
      call_type: callSession.call_type,
      provider: callSession.provider,
      status: callSession.status,
      external_session_id: callSession.external_session_id,
      session_url: callSession.session_url,
      websocket_url: callSession.websocket_url,
      provider_data: callSession.provider_data,
      created_at: callSession.created_at || new Date().toISOString(),
      is_active: callSession.status === 'active',
      demo_mode: demoMode
    };

  } catch (error) {
    console.error('Error starting video call:', error);
    throw error;
  }
}

// End a call
export async function endCall(callSessionId: string, demoMode = false): Promise<void> {
  try {
    // Call the update-call-status function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/call-mcp-server`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'end_call',
        data: {
          callSessionId,
          reason: 'user_ended',
          duration: Math.floor((Date.now() - new Date().getTime()) / 1000),
          demo_mode: demoMode
        },
        context: { userRole: 'customer' }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to end call');
    }
  } catch (error) {
    console.error('Error ending call:', error);
    throw error;
  }
}

// Get call session details
export async function getCallSession(callSessionId: string): Promise<CallSession> {
  try {
    // Call the get-call-session function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-call-session?call_session_id=${callSessionId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to get call session');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error getting call session:', error);
    throw error;
  }
}

// Get call transcripts
export async function getCallTranscripts(callSessionId: string): Promise<CallTranscript[]> {
  try {
    const { data, error } = await supabase
      .from('call_transcripts')
      .select('*')
      .eq('call_session_id', callSessionId)
      .order('timestamp_seconds', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error getting call transcripts:', error);
    throw error;
  }
}

// Send audio data
export async function sendAudioData(
  callSessionId: string,
  audioChunk: AudioChunk
): Promise<void> {
  try {
    // Call the audio-stream-processor function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/audio-stream-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        userId: session.user.id,
        audioData: audioChunk.data,
        sequence: audioChunk.sequence,
        isFinal: audioChunk.isFinal
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send audio data');
    }
  } catch (error) {
    console.error('Error sending audio data:', error);
    throw error;
  }
}

// Send video frame
export async function sendVideoFrame(
  callSessionId: string,
  videoFrame: VideoFrame
): Promise<void> {
  try {
    // Call the video-stream-processor function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/video-stream-processor`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: callSessionId,
        userId: session.user.id,
        frameData: videoFrame.data,
        sequence: videoFrame.sequence,
        isKeyFrame: videoFrame.isKeyFrame,
        width: videoFrame.width,
        height: videoFrame.height,
        timestamp: videoFrame.timestamp
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send video frame');
    }
  } catch (error) {
    console.error('Error sending video frame:', error);
    throw error;
  }
}

// Connect to WebSocket for real-time communication
export function connectToCallWebSocket(
  websocketUrl: string,
  onMessage: (message: WebSocketMessage) => void,
  onOpen?: () => void,
  onClose?: () => void,
  onError?: (error: Event) => void
): WebSocket {
  const ws = new WebSocket(websocketUrl);
  
  ws.onopen = () => {
    console.log('WebSocket connection established');
    if (onOpen) onOpen();
  };
  
  ws.onmessage = (event) => {
    try {
      const message = JSON.parse(event.data);
      onMessage(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };
  
  ws.onclose = () => {
    console.log('WebSocket connection closed');
    if (onClose) onClose();
  };
  
  ws.onerror = (error) => {
    console.error('WebSocket error:', error);
    if (onError) onError(error);
  };
  
  return ws;
}

// Process voice input
export async function processVoiceInput(
  callSessionId: string,
  audioData: string,
  userMessage?: string,
  demoMode = false
): Promise<{
  success: boolean;
  ai_response?: string;
  audio_data?: string;
}> {
  try {
    // Call the process-voice-input function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/process-voice-input`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        call_session_id: callSessionId,
        audio_data: audioData,
        user_message: userMessage,
        demo_mode: demoMode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process voice input');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error processing voice input:', error);
    throw error;
  }
}

// Stream AI response
export async function streamAIResponse(
  callSessionId: string,
  userMessage: string,
  streamType: 'voice' | 'video'
): Promise<{
  success: boolean;
  response_type: string;
  text_response: string;
  audio_chunks?: string[];
  video_id?: string;
}> {
  try {
    // Call the stream-ai-response function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stream-ai-response`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        call_session_id: callSessionId,
        user_message: userMessage,
        stream_type: streamType
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to stream AI response');
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error streaming AI response:', error);
    throw error;
  }
}

// Get call quality metrics
export function calculateCallQualityMetrics(
  audioLevel: number,
  networkLatency: number,
  packetLoss: number
): { quality: string; color: string; message: string } {
  // Calculate overall quality score (0-100)
  const audioScore = Math.min(100, audioLevel * 100);
  const latencyScore = Math.max(0, 100 - (networkLatency / 10));
  const packetLossScore = Math.max(0, 100 - (packetLoss * 100));
  
  const overallScore = (audioScore + latencyScore + packetLossScore) / 3;
  
  if (overallScore >= 80) {
    return {
      quality: 'Excellent',
      color: 'text-green-500',
      message: 'Call quality is excellent'
    };
  } else if (overallScore >= 60) {
    return {
      quality: 'Good',
      color: 'text-blue-500',
      message: 'Call quality is good'
    };
  } else if (overallScore >= 40) {
    return {
      quality: 'Fair',
      color: 'text-yellow-500',
      message: 'Call quality is fair'
    };
  } else {
    return {
      quality: 'Poor',
      color: 'text-red-500',
      message: 'Call quality is poor'
    };
  }
}

export async function initiateCall(params: {
  business_id: string
  call_type: 'voice' | 'video'
  provider: 'elevenlabs' | 'tavus' | 'test'
  demo_mode?: boolean
  session_id?: string
  persona_config_id?: string
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }

    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/initiate-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to initiate call');
    }

    return await response.json()
  } catch (error) {
    console.error('Error initiating call:', error)
    throw error
  }
}