# Integration Guide

Complete guide for integrating with the Dokani platform APIs and functions.

---

## Overview

The Dokani platform provides comprehensive APIs for return management, customer service, and real-time communication. This guide covers all integration points with updated endpoints and enhanced type safety.

---

## Authentication

### Supabase Auth Integration

All API calls require authentication via Supabase Auth:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Get session for API calls
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Use token in API calls
const response = await fetch('/api/returns', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
})
```

### Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Providers
OPENAI_API_KEY=your_openai_key
ELEVENLABS_API_KEY=your_elevenlabs_key
ELEVENLABS_DEFAULT_VOICE_ID=your_voice_id
TAVUS_API_KEY=your_tavus_key
TAVUS_DEFAULT_REPLICA_ID=your_replica_id

# Application
SITE_URL=your_site_url
```

---

## Return Management API

### Consolidated Return API

The return management API has been consolidated into a single endpoint with action-based routing:

#### Create Return Request

```typescript
// POST /api/returns
const createReturn = async (data: ReturnRequestCreateData) => {
  const response = await fetch('/api/returns', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'create',
      business_id: data.business_id,
      customer_email: data.customer_email,
      order_number: data.order_number,
      product_name: data.product_name,
      return_reason: data.return_reason,
      evidence_files: data.evidence_files || []
    })
  })

  return response.json()
}

// Usage
const result = await createReturn({
  business_id: '123e4567-e89b-12d3-a456-426614174000',
  customer_email: 'customer@example.com',
  order_number: 'ORDER-12345',
  product_name: 'Wireless Headphones',
  return_reason: 'Defective product',
  evidence_files: ['https://example.com/photo1.jpg']
})
```

#### Triage Return Request

```typescript
// POST /api/returns
const triageReturn = async (publicId: string) => {
  const response = await fetch('/api/returns', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'triage',
      public_id: publicId
    })
  })

  return response.json()
}
```

#### Update Return Request

```typescript
// PUT /api/returns
const updateReturn = async (publicId: string, data: ReturnRequestUpdateData) => {
  const response = await fetch('/api/returns', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      public_id: publicId,
      status: data.status,
      admin_notes: data.admin_notes,
      decision_reason: data.decision_reason
    })
  })

  return response.json()
}
```

#### Fetch Return Request

```typescript
// GET /api/returns?public_id=uuid
const fetchReturn = async (publicId: string) => {
  const response = await fetch(`/api/returns?public_id=${publicId}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  return response.json()
}
```

### Type Definitions

```typescript
interface ReturnRequestCreateData {
  business_id: string
  customer_email: string
  order_number: string
  product_name: string
  return_reason: string
  evidence_files?: string[]
}

interface ReturnRequestUpdateData {
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
  admin_notes?: string
  decision_reason?: string
}

interface ReturnRequest {
  id: number
  public_id: string
  business_id: string
  order_number: string
  customer_email: string
  product_name: string
  return_reason: string
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
  evidence_files: string[]
  admin_notes?: string
  decision_reason?: string
  created_at: string
  updated_at: string
}
```

---

## Call Management Integration

### Enhanced Call Initiation

The `initiate-call` function now includes comprehensive UUID validation and type safety:

```typescript
// POST /functions/v1/initiate-call
const initiateCall = async (data: CallInitiateData) => {
  const response = await fetch('/functions/v1/initiate-call', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_session_id: data.chat_session_id,
      call_type: data.call_type,
      provider: data.provider,
      config_override: data.config_override,
      enable_streaming: data.enable_streaming ?? true
    })
  })

  return response.json()
}

// Usage
const callSession = await initiateCall({
  chat_session_id: '123e4567-e89b-12d3-a456-426614174000',
  call_type: 'voice',
  provider: 'elevenlabs',
  enable_streaming: true,
  config_override: {
    voice_id: 'custom-voice-id'
  }
})
```

### Type Definitions

```typescript
interface CallInitiateData {
  chat_session_id: string
  call_type: 'voice' | 'video' | 'test'
  provider: 'elevenlabs' | 'tavus' | 'test'
  config_override?: {
    voice_id?: string
    replica_id?: string
    persona_id?: string
    elevenlabs_agent_id?: string
    tavus_replica_id?: string
    persona_config_id?: string
  }
  enable_streaming?: boolean
}

interface CallInitiateResponse {
  success: boolean
  call_session_id: string
  session_url: string
  provider: string
  call_type: string
  status: string
  message: string
  streaming_url?: string
  ai_agent_ready: boolean
  streaming_enabled: boolean
  websocket_url?: string
  stream_processor_urls?: {
    audio: string
    video: string
  }
}
```

### Real-Time Streaming

#### WebSocket Connection

```typescript
const connectWebSocket = (callSessionId: string, userId: string, callType: string) => {
  const ws = new WebSocket(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/websocket-manager?sessionId=${callSessionId}&userId=${userId}&callType=${callType}`
  )

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    
    switch (data.type) {
      case 'call_started':
        console.log('Call started:', data.data)
        break
      case 'transcript_update':
        console.log('Transcript update:', data.data)
        break
      case 'ai_response':
        console.log('AI response:', data.data)
        break
    }
  }

  return ws
}
```

#### Audio Stream Processing

```typescript
// POST /functions/v1/audio-stream-processor
const processAudioStream = async (sessionId: string, audioData: string) => {
  const response = await fetch('/functions/v1/audio-stream-processor', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'process',
      sessionId,
      provider: 'elevenlabs',
      callType: 'voice',
      audio_data: audioData
    })
  })

  return response.json()
}
```

---

## Chat Integration

### Chat Session Management

```typescript
// POST /functions/v1/create-chat-session
const createChatSession = async (data: ChatSessionCreateData) => {
  const response = await fetch('/functions/v1/create-chat-session', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      user_id: data.user_id,
      business_id: data.business_id,
      session_name: data.session_name,
      chat_mode: data.chat_mode || 'normal',
      session_type: data.session_type || 'test_mode',
      customer_email: data.customer_email
    })
  })

  return response.json()
}

// POST /functions/v1/send-chat-message
const sendChatMessage = async (data: ChatMessageCreateData) => {
  const response = await fetch('/functions/v1/send-chat-message', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      session_id: data.session_id,
      message: data.message,
      sender: data.sender,
      message_type: data.message_type || 'text'
    })
  })

  return response.json()
}
```

### Type Definitions

```typescript
interface ChatSessionCreateData {
  user_id: string
  business_id: string
  session_name?: string
  chat_mode?: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
  session_type?: 'test_mode' | 'live_support'
  customer_email: string
}

interface ChatMessageCreateData {
  session_id: string
  sender: 'user' | 'agent' | 'system'
  message: string
  message_type?: 'text' | 'file' | 'system'
  metadata?: Record<string, any>
}
```

---

## AI Agent Integration

### Customer Service Agent

```typescript
// POST /functions/v1/customer-service-agent
const processWithAIAgent = async (message: string, context: AgentContext) => {
  const response = await fetch('/functions/v1/customer-service-agent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message,
      context,
      conversation_history: []
    })
  })

  return response.json()
}

// Usage
const aiResponse = await processWithAIAgent(
  "I need to return my order ORDER-12345",
  {
    business_id: '123e4567-e89b-12d3-a456-426614174000',
    customer_email: 'customer@example.com',
    session_id: 'session-uuid',
    user_role: 'customer',
    timestamp: new Date().toISOString()
  }
)
```

### Triage Agent

```typescript
// POST /functions/v1/triage-agent
const triageWithAI = async (returnRequest: ReturnRequest, businessContext: BusinessSettings) => {
  const response = await fetch('/functions/v1/triage-agent', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      return_request: returnRequest,
      business_context: businessContext
    })
  })

  return response.json()
}
```

### Type Definitions

```typescript
interface AgentContext {
  business_id: string
  customer_email?: string
  session_id?: string
  request_id?: string
  user_role: 'customer' | 'business' | 'system'
  timestamp: string
  call_session_id?: string
  provider?: string
  call_type?: string
  is_call_interaction?: boolean
  call_transcripts?: any[]
}

interface AgentResponse {
  success: boolean
  message: string
  data?: any
  confidence?: number
  next_action?: string
  requires_human_review?: boolean
  security_flags?: string[]
}
```

---

## Persona Management

### Voice Persona Creation

```typescript
// POST /functions/v1/create-voice-persona
const createVoicePersona = async (data: VoicePersonaData) => {
  const response = await fetch('/functions/v1/create-voice-persona', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      business_id: data.business_id,
      config_name: data.config_name,
      voice_id: data.voice_id,
      voice_settings: data.voice_settings
    })
  })

  return response.json()
}
```

### Video Persona Creation

```typescript
// POST /functions/v1/create-tavus-persona
const createVideoPersona = async (data: VideoPersonaData) => {
  const response = await fetch('/functions/v1/create-tavus-persona', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      business_id: data.business_id,
      config_name: data.config_name,
      replica_id: data.replica_id,
      persona_settings: data.persona_settings
    })
  })

  return response.json()
}
```

---

## Analytics Integration

### Business Analytics

```typescript
// GET /functions/v1/get-analytics
const getAnalytics = async (businessId: string, dateRange?: string, metricType?: string) => {
  const params = new URLSearchParams({
    business_id: businessId,
    ...(dateRange && { date_range: dateRange }),
    ...(metricType && { metric_type: metricType })
  })

  const response = await fetch(`/functions/v1/get-analytics?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  })

  return response.json()
}
```

---

## Error Handling

### Comprehensive Error Handling

```typescript
const handleApiError = (error: any) => {
  if (error.status === 400) {
    // Validation errors
    console.error('Validation error:', error.details)
    return { type: 'validation', errors: error.details }
  }
  
  if (error.status === 401) {
    // Authentication error
    console.error('Authentication required')
    return { type: 'auth', message: 'Please log in again' }
  }
  
  if (error.status === 403) {
    // Permission error
    console.error('Insufficient permissions')
    return { type: 'permission', message: 'You do not have permission for this action' }
  }
  
  // Generic error
  console.error('API error:', error.message)
  return { type: 'generic', message: error.message }
}

// Usage in API calls
try {
  const result = await createReturn(returnData)
  return result
} catch (error) {
  const errorInfo = handleApiError(error)
  // Handle error based on type
  throw errorInfo
}
```

### UUID Validation

```typescript
import { isValidUUID, validateUUIDFields } from '@/lib/supabase/db'

// Validate single UUID
if (!isValidUUID(userId)) {
  throw new Error('Invalid user ID format')
}

// Validate multiple UUID fields
const validation = validateUUIDFields({
  business_id: businessId,
  chat_session_id: sessionId,
  persona_config_id: configId
})

if (!validation.valid) {
  throw new Error(`UUID validation failed: ${validation.errors.join(', ')}`)
}
```

---

## Database Integration

### Using Centralized Types

```typescript
import { Database } from '@/lib/supabase/db'

// Use database types directly
type CallSessionRow = Database['public']['Tables']['call_sessions']['Row']
type CallSessionInsert = Database['public']['Tables']['call_sessions']['Insert']
type StreamingSessionRow = Database['public']['Tables']['streaming_sessions']['Row']

// Type-safe database operations
const createCallSession = async (data: CallSessionInsert): Promise<CallSessionRow> => {
  const { data: session, error } = await supabase
    .from('call_sessions')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return session
}
```

### New Streaming Sessions

```typescript
// Create streaming session
const createStreamingSession = async (data: {
  session_id: string
  stream_type: 'voice' | 'video' | 'audio'
  provider: string
}) => {
  const { data: session, error } = await supabase
    .from('streaming_sessions')
    .insert({
      session_id: data.session_id,
      stream_type: data.stream_type,
      provider: data.provider,
      status: 'initialized'
    })
    .select()
    .single()

  if (error) throw error
  return session
}
```

---

## Best Practices

### 1. Type Safety
- Always use TypeScript interfaces for API requests and responses
- Import types from centralized database schema
- Use type guards for runtime validation

### 2. Error Handling
- Implement comprehensive error handling for all API calls
- Use proper error types and messages
- Log errors for debugging

### 3. Authentication
- Always include authentication tokens in API calls
- Handle token expiration gracefully
- Use proper CORS headers

### 4. Performance
- Implement caching for frequently accessed data
- Use pagination for large datasets
- Optimize API calls to minimize latency

### 5. Security
- Validate all input data
- Use UUID validation for ID fields
- Implement proper access control

---

## Migration Guide

### From Old API Routes

If you're migrating from the old separate API routes:

```typescript
// Old way
const createReturn = async (data) => {
  const response = await fetch('/api/create-return', {
    method: 'POST',
    body: JSON.stringify(data)
  })
  return response.json()
}

// New way
const createReturn = async (data) => {
  const response = await fetch('/api/returns', {
    method: 'POST',
    body: JSON.stringify({
      action: 'create',
      ...data
    })
  })
  return response.json()
}
```

### Type Updates

Update your type definitions to match the new schema:

```typescript
// Old types
interface ReturnRequest {
  order_id: string
  reason_for_return: string
  evidence_urls: string[]
}

// New types
interface ReturnRequest {
  order_number: string
  return_reason: string
  evidence_files: string[]
  product_name: string
  decision_reason?: string
  updated_at: string
}
```

---

This integration guide reflects the latest improvements including enhanced type safety, consolidated API routes, and comprehensive streaming support. 