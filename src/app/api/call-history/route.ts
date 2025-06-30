import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Mock data for demo mode - matches the call_sessions table schema exactly
const mockCallHistory = [
  {
    id: "550e8400-e29b-41d4-a716-446655440101",
    chat_session_id: "550e8400-e29b-41d4-a716-446655440201",
    call_type: "voice",
    provider: "elevenlabs",
    external_session_id: "elevenlabs_conv_001",
    status: "ended",
    duration_seconds: 245,
    provider_data: {
      agent_id: "elevenlabs_agent_001",
      voice_id: "voice_001",
      conversation_id: "conv_001"
    },
    created_at: "2024-12-01T10:00:00Z",
    ended_at: "2024-12-01T10:04:05Z",
    elevenlabs_agent_id: "elevenlabs_agent_001",
    elevenlabs_conversation_id: "conv_001",
    tavus_replica_id: null,
    tavus_conversation_id: null,
    session_url: "https://demo.elevenlabs.io/session/conv_001",
    webhook_data: {
      satisfaction_score: 4.2,
      call_successful: "success",
      duration_seconds: 245,
      messages_count: 12
    },
    is_active: false,
    persona_config_id: "550e8400-e29b-41d4-a716-446655440301",
    call_quality_score: 0.85,
    customer_feedback: {
      satisfaction: 4.2,
      comments: "Very helpful agent, resolved my issue quickly"
    },
    streaming_enabled: true,
    websocket_url: "wss://demo.elevenlabs.io/ws/conv_001",
    stream_processor_urls: ["https://processor1.demo.com", "https://processor2.demo.com"],
    streaming_config: {
      audio_quality: "high",
      real_time_processing: true
    },
    real_time_events: [
      { timestamp: "2024-12-01T10:01:00Z", event: "call_connected" },
      { timestamp: "2024-12-01T10:04:05Z", event: "call_ended" }
    ],
    connection_count: 1,
    last_stream_activity: "2024-12-01T10:04:05Z",
    stream_quality_metrics: {
      audio_latency: 150,
      packet_loss: 0.01,
      jitter: 5
    },
    ai_conversation_state_id: "550e8400-e29b-41d4-a716-446655440401",
    updated_at: "2024-12-01T10:04:05Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440102",
    chat_session_id: "550e8400-e29b-41d4-a716-446655440202",
    call_type: "voice",
    provider: "elevenlabs",
    external_session_id: "elevenlabs_conv_002",
    status: "ended",
    duration_seconds: 180,
    provider_data: {
      agent_id: "elevenlabs_agent_001",
      voice_id: "voice_001",
      conversation_id: "conv_002"
    },
    created_at: "2024-12-01T11:00:00Z",
    ended_at: "2024-12-01T11:03:00Z",
    elevenlabs_agent_id: "elevenlabs_agent_001",
    elevenlabs_conversation_id: "conv_002",
    tavus_replica_id: null,
    tavus_conversation_id: null,
    session_url: "https://demo.elevenlabs.io/session/conv_002",
    webhook_data: {
      satisfaction_score: 3.8,
      call_successful: "success",
      duration_seconds: 180,
      messages_count: 8
    },
    is_active: false,
    persona_config_id: "550e8400-e29b-41d4-a716-446655440301",
    call_quality_score: 0.78,
    customer_feedback: {
      satisfaction: 3.8,
      comments: "Agent was helpful but took time to understand my request"
    },
    streaming_enabled: true,
    websocket_url: "wss://demo.elevenlabs.io/ws/conv_002",
    stream_processor_urls: ["https://processor1.demo.com", "https://processor2.demo.com"],
    streaming_config: {
      audio_quality: "high",
      real_time_processing: true
    },
    real_time_events: [
      { timestamp: "2024-12-01T11:01:00Z", event: "call_connected" },
      { timestamp: "2024-12-01T11:03:00Z", event: "call_ended" }
    ],
    connection_count: 1,
    last_stream_activity: "2024-12-01T11:03:00Z",
    stream_quality_metrics: {
      audio_latency: 180,
      packet_loss: 0.02,
      jitter: 8
    },
    ai_conversation_state_id: "550e8400-e29b-41d4-a716-446655440402",
    updated_at: "2024-12-01T11:03:00Z"
  },
  {
    id: "550e8400-e29b-41d4-a716-446655440103",
    chat_session_id: "550e8400-e29b-41d4-a716-446655440203",
    call_type: "video",
    provider: "tavus",
    external_session_id: "tavus_conv_001",
    status: "failed",
    duration_seconds: 45,
    provider_data: {
      replica_id: "tavus_replica_001",
      conversation_id: "tavus_conv_001"
    },
    created_at: "2024-12-01T12:00:00Z",
    ended_at: "2024-12-01T12:00:45Z",
    elevenlabs_agent_id: null,
    elevenlabs_conversation_id: null,
    tavus_replica_id: "tavus_replica_001",
    tavus_conversation_id: "tavus_conv_001",
    session_url: "https://demo.tavus.com/session/tavus_conv_001",
    webhook_data: {
      satisfaction_score: 1.5,
      call_successful: "failed",
      duration_seconds: 45,
      messages_count: 3
    },
    is_active: false,
    persona_config_id: "550e8400-e29b-41d4-a716-446655440302",
    call_quality_score: 0.25,
    customer_feedback: {
      satisfaction: 1.5,
      comments: "Call disconnected due to poor connection"
    },
    streaming_enabled: true,
    websocket_url: "wss://demo.tavus.com/ws/tavus_conv_001",
    stream_processor_urls: ["https://tavus-processor1.demo.com", "https://tavus-processor2.demo.com"],
    streaming_config: {
      video_quality: "high",
      audio_quality: "high",
      real_time_processing: true
    },
    real_time_events: [
      { timestamp: "2024-12-01T12:00:00Z", event: "call_connected" },
      { timestamp: "2024-12-01T12:00:45Z", event: "call_failed" }
    ],
    connection_count: 1,
    last_stream_activity: "2024-12-01T12:00:45Z",
    stream_quality_metrics: {
      video_latency: 500,
      audio_latency: 300,
      packet_loss: 0.15,
      jitter: 25
    },
    ai_conversation_state_id: "550e8400-e29b-41d4-a716-446655440403",
    updated_at: "2024-12-01T12:00:45Z"
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const demoMode = searchParams.get('demo_mode') === 'true'
    const businessId = searchParams.get('business_id')
    
    console.log('Call history API called with:', { demoMode, businessId });

    if (demoMode) {
      // Return mock data for demo mode
      console.log('Returning mock call history data, count:', mockCallHistory.length);
      const response = {
        success: true,
        data: mockCallHistory,
        demo_mode: true
      };
      console.log('Response data:', JSON.stringify(response, null, 2));
      return NextResponse.json(response);
    }

    // Live mode - call Supabase Edge Function
    const supabase = getSupabaseClient()
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Call the appropriate Supabase function for live mode
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-call-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        action: 'list_calls'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch call history')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      data: result.data || [],
      demo_mode: false
    })

  } catch (error) {
    console.error('Error in call history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 