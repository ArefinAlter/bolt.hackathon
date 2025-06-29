export interface CallSession {
  id: string;
  chat_session_id: string;
  call_type: 'voice' | 'video' | 'test';
  provider: 'elevenlabs' | 'tavus' | 'test';
  external_session_id?: string;
  status: 'initiated' | 'connecting' | 'active' | 'ended' | 'failed';
  duration_seconds?: number;
  provider_data?: any;
  created_at: string;
  ended_at?: string;
  elevenlabs_agent_id?: string;
  elevenlabs_conversation_id?: string;
  tavus_replica_id?: string;
  tavus_conversation_id?: string;
  session_url?: string;
  webhook_data?: any;
  is_active: boolean;
  streaming_enabled?: boolean;
  websocket_url?: string;
  stream_processor_urls?: {
    audio?: string;
    video?: string;
  };
  demo_mode?: boolean;
}

export interface CallTranscript {
  id: string;
  call_session_id: string;
  speaker: 'user' | 'agent' | 'system';
  message: string;
  timestamp_seconds: number;
  created_at: string;
}

export interface CallControls {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  volume: number;
}

export interface AudioChunk {
  data: string; // base64 encoded audio
  timestamp: number;
  sequence: number;
  isFinal: boolean;
}

export interface VideoFrame {
  data: string; // base64 encoded video frame
  timestamp: number;
  sequence: number;
  isKeyFrame: boolean;
  width: number;
  height: number;
}

export interface CallQualityMetrics {
  audioQuality: 'excellent' | 'good' | 'fair' | 'poor';
  videoQuality?: 'excellent' | 'good' | 'fair' | 'poor';
  latency: number; // in milliseconds
  packetLoss: number; // percentage
  jitter: number; // in milliseconds
  bandwidth: number; // in kbps
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
}