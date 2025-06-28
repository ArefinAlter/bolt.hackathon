// Database types for Supabase tables
// This file centralizes all database schema types to ensure consistency

export interface Database {
  public: {
    Tables: {
      call_sessions: {
        Row: {
          id: string
          chat_session_id: string
          call_type: 'voice' | 'video' | 'test'
          provider: 'elevenlabs' | 'tavus' | 'test'
          external_session_id?: string
          status: 'initiated' | 'connecting' | 'active' | 'ended' | 'failed'
          duration_seconds?: number
          provider_data?: any
          created_at: string
          ended_at?: string
          elevenlabs_agent_id?: string
          elevenlabs_conversation_id?: string
          tavus_replica_id?: string
          tavus_conversation_id?: string
          session_url?: string
          webhook_data?: any
          is_active: boolean
          persona_config_id?: string
          call_quality_score?: number
          customer_feedback?: any
          streaming_enabled?: boolean
          websocket_url?: string
          stream_processor_urls?: {
            audio?: string
            video?: string
          }
          streaming_config?: any
          real_time_events?: any[]
          connection_count?: number
          last_stream_activity?: string
          stream_quality_metrics?: any
          ai_conversation_state_id?: string
          updated_at?: string
        }
        Insert: {
          id?: string
          chat_session_id: string
          call_type: 'voice' | 'video' | 'test'
          provider: 'elevenlabs' | 'tavus' | 'test'
          external_session_id?: string
          status?: 'initiated' | 'connecting' | 'active' | 'ended' | 'failed'
          duration_seconds?: number
          provider_data?: any
          created_at?: string
          ended_at?: string
          elevenlabs_agent_id?: string
          elevenlabs_conversation_id?: string
          tavus_replica_id?: string
          tavus_conversation_id?: string
          session_url?: string
          webhook_data?: any
          is_active?: boolean
          persona_config_id?: string
          call_quality_score?: number
          customer_feedback?: any
          streaming_enabled?: boolean
          websocket_url?: string
          stream_processor_urls?: {
            audio?: string
            video?: string
          }
          streaming_config?: any
          real_time_events?: any[]
          connection_count?: number
          last_stream_activity?: string
          stream_quality_metrics?: any
          ai_conversation_state_id?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chat_session_id?: string
          call_type?: 'voice' | 'video' | 'test'
          provider?: 'elevenlabs' | 'tavus' | 'test'
          external_session_id?: string
          status?: 'initiated' | 'connecting' | 'active' | 'ended' | 'failed'
          duration_seconds?: number
          provider_data?: any
          created_at?: string
          ended_at?: string
          elevenlabs_agent_id?: string
          elevenlabs_conversation_id?: string
          tavus_replica_id?: string
          tavus_conversation_id?: string
          session_url?: string
          webhook_data?: any
          is_active?: boolean
          persona_config_id?: string
          call_quality_score?: number
          customer_feedback?: any
          streaming_enabled?: boolean
          websocket_url?: string
          stream_processor_urls?: {
            audio?: string
            video?: string
          }
          streaming_config?: any
          real_time_events?: any[]
          connection_count?: number
          last_stream_activity?: string
          stream_quality_metrics?: any
          ai_conversation_state_id?: string
          updated_at?: string
        }
      }
      call_transcripts: {
        Row: {
          id: string
          call_session_id: string
          speaker: 'user' | 'agent' | 'system'
          message: string
          timestamp_seconds: number
          created_at: string
          chunk_id?: string
          is_real_time?: boolean
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processed?: boolean
          ai_response_generated?: boolean
          stream_sequence?: number
          audio_chunk_id?: string
          video_frame_id?: string
          metadata?: any
        }
        Insert: {
          id?: string
          call_session_id: string
          speaker: 'user' | 'agent' | 'system'
          message: string
          timestamp_seconds: number
          created_at?: string
          chunk_id?: string
          is_real_time?: boolean
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processed?: boolean
          ai_response_generated?: boolean
          stream_sequence?: number
          audio_chunk_id?: string
          video_frame_id?: string
          metadata?: any
        }
        Update: {
          id?: string
          call_session_id?: string
          speaker?: 'user' | 'agent' | 'system'
          message?: string
          timestamp_seconds?: number
          created_at?: string
          chunk_id?: string
          is_real_time?: boolean
          processing_status?: 'pending' | 'processing' | 'completed' | 'failed'
          ai_processed?: boolean
          ai_response_generated?: boolean
          stream_sequence?: number
          audio_chunk_id?: string
          video_frame_id?: string
          metadata?: any
        }
      }
      chat_sessions: {
        Row: {
          id: string
          user_id: string
          business_id: string
          session_name: string
          chat_mode: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
          session_type: 'test_mode' | 'live_support'
          is_active: boolean
          metadata?: any
          created_at: string
          updated_at: string
          customer_email: string
        }
        Insert: {
          id?: string
          user_id: string
          business_id: string
          session_name?: string
          chat_mode?: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
          session_type?: 'test_mode' | 'live_support'
          is_active?: boolean
          metadata?: any
          created_at?: string
          updated_at?: string
          customer_email: string
        }
        Update: {
          id?: string
          user_id?: string
          business_id?: string
          session_name?: string
          chat_mode?: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
          session_type?: 'test_mode' | 'live_support'
          is_active?: boolean
          metadata?: any
          created_at?: string
          updated_at?: string
          customer_email?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          sender: 'user' | 'agent' | 'system'
          message: string
          message_type: 'text' | 'file' | 'system'
          metadata?: any
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          sender: 'user' | 'agent' | 'system'
          message: string
          message_type?: 'text' | 'file' | 'system'
          metadata?: any
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          sender?: 'user' | 'agent' | 'system'
          message?: string
          message_type?: 'text' | 'file' | 'system'
          metadata?: any
          created_at?: string
        }
      }
      return_requests: {
        Row: {
          id: number
          public_id: string
          business_id: string
          customer_email: string
          order_number: string
          product_name: string
          return_reason: string
          status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
          evidence_files: string[]
          admin_notes?: string
          decision_reason?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          public_id: string
          business_id: string
          customer_email: string
          order_number: string
          product_name: string
          return_reason: string
          status?: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
          evidence_files?: string[]
          admin_notes?: string
          decision_reason?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          public_id?: string
          business_id?: string
          customer_email?: string
          order_number?: string
          product_name?: string
          return_reason?: string
          status?: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
          evidence_files?: string[]
          admin_notes?: string
          decision_reason?: string
          created_at?: string
          updated_at?: string
        }
      }
      streaming_sessions: {
        Row: {
          id: string
          session_id: string
          stream_type: 'voice' | 'video' | 'audio'
          provider: string
          status: 'initialized' | 'active' | 'ended' | 'failed'
          created_at: string
          ended_at?: string
          metadata?: any
        }
        Insert: {
          id?: string
          session_id: string
          stream_type: 'voice' | 'video' | 'audio'
          provider: string
          status?: 'initialized' | 'active' | 'ended' | 'failed'
          created_at?: string
          ended_at?: string
          metadata?: any
        }
        Update: {
          id?: string
          session_id?: string
          stream_type?: 'voice' | 'video' | 'audio'
          provider?: string
          status?: 'initialized' | 'active' | 'ended' | 'failed'
          created_at?: string
          ended_at?: string
          metadata?: any
        }
      }
      provider_configs: {
        Row: {
          id: string
          business_id: string
          provider: string
          config_name: string
          config_data: any
          is_active: boolean
          created_at: string
          updated_at: string
          usage_count: number
          last_used_at?: string
          performance_metrics?: any
          is_default: boolean
          streaming_settings?: any
          real_time_config?: any
          websocket_config?: any
          stream_processor_config?: any
        }
        Insert: {
          id?: string
          business_id: string
          provider: string
          config_name: string
          config_data?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
          usage_count?: number
          last_used_at?: string
          performance_metrics?: any
          is_default?: boolean
          streaming_settings?: any
          real_time_config?: any
          websocket_config?: any
          stream_processor_config?: any
        }
        Update: {
          id?: string
          business_id?: string
          provider?: string
          config_name?: string
          config_data?: any
          is_active?: boolean
          created_at?: string
          updated_at?: string
          usage_count?: number
          last_used_at?: string
          performance_metrics?: any
          is_default?: boolean
          streaming_settings?: any
          real_time_config?: any
          websocket_config?: any
          stream_processor_config?: any
        }
      }
    }
  }
}

// Helper function to validate UUID format
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

// Helper function to validate required UUID fields
export function validateUUIDFields(fields: Record<string, string | undefined>): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  for (const [fieldName, value] of Object.entries(fields)) {
    if (value && !isValidUUID(value)) {
      errors.push(`${fieldName} must be a valid UUID format`)
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
} 