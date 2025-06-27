# Dokani Platform Function Reference

Complete API reference for all Supabase Edge Functions in the Dokani platform.

---

## Overview

The Dokani platform consists of **40+ serverless functions** organized into logical groups:

- **AI Core Functions** - AI agents and decision engines
- **MCP Servers** - Model Context Protocol implementations  
- **Streaming Functions** - Real-time audio/video processing
- **Communication Functions** - Voice/video call management
- **Management Functions** - Chat sessions, personas, file uploads
- **Utility Functions** - Analytics, WebSocket management, testing

---

## Authentication

All functions require a valid Supabase JWT token in the Authorization header:

```typescript
headers: {
  'Authorization': `Bearer ${supabase.auth.session()?.access_token}`,
  'Content-Type': 'application/json'
}
```

---

## AI Core Functions

### `triage-agent`

**Purpose**: AI-powered return request triage and decision making

**Endpoint**: `POST /functions/v1/triage-agent`

**Request Body**:
```typescript
{
  requestData: {
    orderId: string
    customerEmail: string
    reason: string
    orderValue: number
    daysSincePurchase: number
    evidenceUrls: string[]
    customerRiskScore: number
    returnHistory: number
    productCategory: string
  }
  policyRules: {
    return_window_days: number
    auto_approve_threshold: number
    required_evidence: string[]
    acceptable_reasons: string[]
    high_risk_categories: string[]
    fraud_flags: string[]
  }
  businessId: string
}
```

**Response**:
```typescript
{
  success: boolean
  decision: 'auto_approve' | 'auto_deny' | 'human_review'
  confidence: number
  reasoning: string
  riskFactors: string[]
  policyViolations: string[]
  nextSteps: string[]
}
```

**Example**:
```typescript
const response = await fetch('/functions/v1/triage-agent', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    requestData: {
      orderId: 'ORDER-12345',
      customerEmail: 'customer@example.com',
      reason: 'Defective product',
      orderValue: 99.99,
      daysSincePurchase: 5,
      evidenceUrls: ['https://example.com/photo.jpg'],
      customerRiskScore: 0.3,
      returnHistory: 1,
      productCategory: 'electronics'
    },
    policyRules: {
      return_window_days: 30,
      auto_approve_threshold: 100,
      required_evidence: ['photo'],
      acceptable_reasons: ['defective', 'wrong_item'],
      high_risk_categories: ['electronics'],
      fraud_flags: ['multiple_returns']
    },
    businessId: 'business-uuid'
  })
})
```

---

### `customer-service-agent`

**Purpose**: AI customer service agent for chat and call interactions

**Endpoint**: `POST /functions/v1/customer-service-agent`

**Request Body**:
```typescript
{
  message: string
  context: {
    businessId: string
    sessionId?: string
    callSessionId?: string
    customerEmail?: string
    timestamp: string
    provider?: string
    callType?: 'voice' | 'video'
  }
  conversationHistory?: Array<{
    role: 'user' | 'agent' | 'system'
    content: string
    timestamp: string
  }>
}
```

**Response**:
```typescript
{
  success: boolean
  message: string
  data: {
    model: string
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
    returnRequest?: {
      orderId: string
      reason: string
      confidence: number
    }
    nextAction?: string
    callContext?: {
      sessionId: string
      provider: string
      callType: string
    }
  }
}
```

**Example**:
```typescript
const response = await fetch('/functions/v1/customer-service-agent', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    message: 'I need to return my order ORDER-12345',
    context: {
      businessId: 'business-uuid',
      sessionId: 'session-uuid',
      customerEmail: 'customer@example.com',
      timestamp: new Date().toISOString()
    },
    conversationHistory: [
      { role: 'user', content: 'Hello', timestamp: '2024-01-01T10:00:00Z' },
      { role: 'agent', content: 'Hi! How can I help you today?', timestamp: '2024-01-01T10:00:01Z' }
    ]
  })
})
```

---

### `layered-decision-engine`

**Purpose**: Main decision engine integrating AI agents with MCP servers

**Endpoint**: `POST /functions/v1/layered-decision-engine`

**Request Body**:
```typescript
{
  businessId: string
  action: 'process_return_request' | 'escalate_case' | 'update_policy'
  data: {
    orderId?: string
    customerEmail?: string
    reason?: string
    evidenceUrls?: string[]
    policyRules?: any
  }
  context: {
    userRole: 'admin' | 'agent' | 'customer'
    sessionId?: string
    callSessionId?: string
  }
}
```

**Response**:
```typescript
{
  success: boolean
  decision: {
    action: string
    confidence: number
    reasoning: string
    policyCompliance: boolean
    auditTrail: Array<{
      layer: string
      decision: string
      timestamp: string
      metadata: any
    }>
  }
  data: any
  errors: string[]
  warnings: string[]
}
```

---

### `risk-assessment`

**Purpose**: Customer risk assessment and fraud detection

**Endpoint**: `POST /functions/v1/risk-assessment`

**Actions**:
- `calculate` - Calculate risk score for customer
- `update` - Update customer risk profile
- `profile` - Get customer risk profile

**Request Body** (calculate):
```typescript
{
  customer_email: string
  business_id: string
  order_value: number
  reason_for_return: string
}
```

**Response**:
```typescript
{
  success: boolean
  risk_score: number
  risk_factors: string[]
  fraud_indicators: string[]
  recommendations: string[]
}
```

---

## MCP Servers

### `request-mcp-server`

**Purpose**: MCP server for return request management

**Endpoint**: `POST /functions/v1/request-mcp-server`

**Available Methods**:
- `createReturnRequest`
- `getReturnRequest`
- `updateReturnStatus`
- `getCustomerHistory`
- `initiateCall`
- `logCallInteraction`
- `logCallCompletion`

**Example**:
```typescript
const response = await fetch('/functions/v1/request-mcp-server', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    method: 'createReturnRequest',
    data: {
      businessId: 'business-uuid',
      orderId: 'ORDER-12345',
      customerEmail: 'customer@example.com',
      reason: 'Defective product',
      evidenceUrls: ['https://example.com/photo.jpg']
    }
  })
})
```

---

### `policy-mcp-server`

**Purpose**: MCP server for policy management and validation

**Endpoint**: `POST /functions/v1/policy-mcp-server`

**Available Methods**:
- `getActivePolicy`
- `getPolicyRules`
- `getCallPolicy`
- `subscribePolicyUpdates`
- `unsubscribePolicyUpdates`
- `getPolicyAnalytics`
- `getPolicyCallAnalytics`

**Example**:
```typescript
const response = await fetch('/functions/v1/policy-mcp-server', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: JSON.stringify({
    method: 'getActivePolicy',
    data: {
      businessId: 'business-uuid'
    }
  })
})
```

---

### `call-mcp-server`

**Purpose**: MCP server for call session management

**Endpoint**: `POST /functions/v1/call-mcp-server`

**Available Methods**:
- `createCallSession`
- `updateCallStatus`
- `storeTranscript`
- `storeVideoFrame`
- `getCallAnalytics`

---

### `conversation-mcp-server`

**Purpose**: MCP server for conversation management

**Endpoint**: `POST /functions/v1/conversation-mcp-server`

**Available Methods**:
- `createConversationSession`
- `addMessage`
- `updateConversationState`
- `getConversationHistory`

---

## Streaming Functions

### `stream-ai-response`

**Purpose**: Stream AI responses in real-time

**Endpoint**: `POST /functions/v1/stream-ai-response`

**Request Body**:
```typescript
{
  sessionId: string
  message: string
  context: {
    businessId: string
    customerEmail?: string
    callType?: 'voice' | 'video'
  }
}
```

**Response**: Server-Sent Events (SSE) stream

---

### `stream-voice-call`

**Purpose**: Stream voice call audio in real-time

**Endpoint**: `POST /functions/v1/stream-voice-call`

**Request Body**:
```typescript
{
  callSessionId: string
  audioData: string // base64 encoded
  timestamp: number
  isFinal: boolean
}
```

---

### `audio-stream-processor`

**Purpose**: Process real-time audio streams

**Endpoint**: `POST /functions/v1/audio-stream-processor`

**Request Body**:
```typescript
{
  sessionId: string
  audioChunk: string // base64 encoded
  sequence: number
  timestamp: number
  sampleRate: number
  channels: number
}
```

---

### `video-stream-processor`

**Purpose**: Process real-time video streams

**Endpoint**: `POST /functions/v1/video-stream-processor`

**Request Body**:
```typescript
{
  sessionId: string
  videoFrame: string // base64 encoded
  sequence: number
  timestamp: number
  width: number
  height: number
  fps: number
}
```

---

## Communication Functions

### `initiate-call`

**Purpose**: Initiate voice or video calls

**Endpoint**: `POST /functions/v1/initiate-call`

**Request Body**:
```typescript
{
  businessId: string
  customerEmail: string
  callType: 'voice' | 'video'
  provider: 'elevenlabs' | 'tavus'
  personaConfigId?: string
  returnRequestId?: string
}
```

**Response**:
```typescript
{
  success: boolean
  callSessionId: string
  sessionUrl: string
  websocketUrl?: string
  providerData: {
    external_session_id: string
    agent_id?: string
    replica_id?: string
  }
}
```

---

### `initiate-video-conversation`

**Purpose**: Initiate video conversations with AI personas

**Endpoint**: `POST /functions/v1/initiate-video-conversation`

**Request Body**:
```typescript
{
  businessId: string
  customerEmail: string
  personaConfigId: string
  returnRequestId?: string
  videoSettings?: {
    quality: 'standard' | 'high' | 'ultra'
    background: 'transparent' | 'blur' | 'custom'
  }
}
```

---

### `handle-call-webhook`

**Purpose**: Handle webhooks from call providers

**Endpoint**: `POST /functions/v1/handle-call-webhook`

**Request Body**: Provider-specific webhook data

---

### `process-voice-input`

**Purpose**: Process voice input and generate AI responses

**Endpoint**: `POST /functions/v1/process-voice-input`

**Request Body**:
```typescript
{
  sessionId: string
  userId: string
  audioData: string // base64 encoded
  callType: 'voice' | 'video'
  timestamp: number
}
```

---

## Management Functions

### `create-chat-session`

**Purpose**: Create new chat sessions

**Endpoint**: `POST /functions/v1/create-chat-session`

**Request Body**:
```typescript
{
  businessId: string
  customerEmail?: string
  sessionName?: string
  chatMode?: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
  sessionType?: 'test_mode' | 'live_support'
}
```

**Response**:
```typescript
{
  success: boolean
  sessionId: string
  sessionName: string
  chatMode: string
  sessionType: string
  isActive: boolean
  createdAt: string
}
```

---

### `send-chat-message`

**Purpose**: Send messages in chat sessions

**Endpoint**: `POST /functions/v1/send-chat-message`

**Request Body**:
```typescript
{
  sessionId: string
  sender: 'user' | 'agent' | 'system'
  message: string
  messageType?: 'text' | 'image' | 'file' | 'audio' | 'video'
  metadata?: any
}
```

**Response**:
```typescript
{
  success: boolean
  messageId: string
  timestamp: string
  aiResponse?: {
    message: string
    confidence: number
    nextAction?: string
  }
}
```

---

### `create-tavus-persona`

**Purpose**: Create Tavus video personas

**Endpoint**: `POST /functions/v1/create-tavus-persona`

**Request Body**:
```typescript
{
  businessId: string
  configName: string
  replicaId: string
  personaSettings: {
    voice_id?: string
    background?: string
    quality?: string
  }
}
```

---

### `create-voice-persona`

**Purpose**: Create ElevenLabs voice personas

**Endpoint**: `POST /functions/v1/create-voice-persona`

**Request Body**:
```typescript
{
  businessId: string
  configName: string
  voiceId: string
  voiceSettings: {
    stability: number
    similarity_boost: number
    style: number
  }
}
```

---

### `list-personas`

**Purpose**: List available personas for a business

**Endpoint**: `GET /functions/v1/list-personas?businessId=${businessId}`

**Response**:
```typescript
{
  success: boolean
  personas: Array<{
    id: string
    configName: string
    provider: 'elevenlabs' | 'tavus'
    isActive: boolean
    usageCount: number
    lastUsedAt?: string
    configData: any
  }>
}
```

---

### `upload-file`

**Purpose**: Upload files for evidence or personas

**Endpoint**: `POST /functions/v1/upload-file`

**Request Body**: FormData with file and metadata

**Parameters**:
- `businessId` (required)
- `fileType` (required): 'voice_sample' | 'video_sample' | 'evidence_photo' | 'evidence_video'
- `file` (required): File object
- `metadata` (optional): Additional metadata

**Response**:
```typescript
{
  success: boolean
  fileId: string
  fileUrl: string
  filePath: string
  fileSize: number
  message: string
}
```

---

### `update-return-status`

**Purpose**: Update return request status

**Endpoint**: `POST /functions/v1/update-return-status`

**Request Body**:
```typescript
{
  public_id: string
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
  admin_notes?: string
  decision_reason?: string
}
```

---

## Utility Functions

### `get-analytics`

**Purpose**: Get business analytics and metrics

**Endpoint**: `GET /functions/v1/get-analytics?businessId=${businessId}&metricType=${metricType}`

**Parameters**:
- `businessId` (required)
- `metricType` (optional): 'all' | 'returns' | 'ai_accuracy' | 'satisfaction' | 'policy'

**Response**:
```typescript
{
  success: boolean
  businessId: string
  analytics: {
    returns?: {
      total_returns: number
      approved_returns: number
      denied_returns: number
      auto_approval_rate: string
      approval_rate: string
      trend: {
        recent_period: number
        previous_period: number
        change_percentage: string
      }
    }
    ai_accuracy?: {
      total_ai_decisions: number
      correct_decisions: number
      accuracy_rate: string
      average_confidence: string
    }
    satisfaction?: {
      total_interactions: number
      satisfaction_score: string
      response_time_avg: string
    }
    policy?: {
      total_policies: number
      active_policy: string
      current_approval_rate: string
    }
  }
}
```

---

### `websocket-manager`

**Purpose**: Manage WebSocket connections for real-time communication

**Endpoint**: WebSocket connection

**Connection URL**: `wss://your-project.supabase.co/functions/v1/websocket-manager?sessionId=${sessionId}&userId=${userId}&callType=${callType}`

**Message Types**:
- `connect` - Establish connection
- `audio_data` - Send audio data
- `video_data` - Send video data
- `text_message` - Send text message
- `call_status` - Update call status

**Example**:
```typescript
const ws = new WebSocket(`wss://your-project.supabase.co/functions/v1/websocket-manager?sessionId=${sessionId}&userId=${userId}&callType=voice`)

ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'connect',
    sessionId: sessionId,
    userId: userId,
    timestamp: Date.now()
  }))
}

ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log('Received:', message)
}
```

---

### `get-call-session`

**Purpose**: Get call session details

**Endpoint**: `GET /functions/v1/get-call-session?sessionId=${sessionId}`

**Response**:
```typescript
{
  success: boolean
  session: {
    id: string
    callType: string
    provider: string
    status: string
    duration_seconds: number
    sessionUrl: string
    websocketUrl?: string
    providerData: any
    createdAt: string
    endedAt?: string
  }
}
```

---

### `get-return-request`

**Purpose**: Get return request details

**Endpoint**: `GET /functions/v1/get-return-request?publicId=${publicId}`

**Response**:
```typescript
{
  success: boolean
  request: {
    id: number
    public_id: string
    order_id: string
    customer_email: string
    reason_for_return: string
    status: string
    ai_recommendation: string
    ai_confidence_score: number
    risk_score: number
    created_at: string
    mock_orders: {
      purchase_date: string
      product_name: string
      product_category: string
      purchase_price: number
    }
  }
}
```

---

### `get-user-preferences`

**Purpose**: Get user preferences

**Endpoint**: `GET /functions/v1/get-user-preferences?userId=${userId}`

**Response**:
```typescript
{
  success: boolean
  preferences: {
    language: string
    auto_escalate: boolean
    video_enabled: boolean
    voice_enabled: boolean
    auto_transcript: boolean
    tavus_replica_id?: string
    elevenlabs_voice_id?: string
    preferred_chat_mode: string
    call_history_enabled: boolean
    notifications_enabled: boolean
  }
}
```

---

## Testing Functions

### `test-ai-agents`

**Purpose**: Test AI agents and MCP servers

**Endpoint**: `POST /functions/v1/test-ai-agents`

**Request Body**:
```typescript
{
  testType: 'customer_service' | 'triage' | 'policy_mcp'
  data: {
    message?: string
    requestData?: any
    policyRules?: any
    businessId?: string
    request?: any
  }
}
```

**Response**:
```typescript
{
  success: boolean
  result: any
}
```

---

### `test-persona`

**Purpose**: Test voice and video personas

**Endpoint**: `POST /functions/v1/test-persona`

**Request Body**:
```typescript
{
  config_id: string
  test_content: string
  test_type?: 'voice' | 'video'
}
```

**Response**:
```typescript
{
  success: boolean
  test_result: {
    audio_url?: string
    video_id?: string
    status?: string
    duration?: string
  }
  persona_config: any
  response_time_ms: number
}
```

---

## Error Handling

All functions return standardized error responses:

```typescript
{
  error: string
  details?: string
  code?: string
}
```

**Common Error Codes**:
- `400` - Bad Request (missing required fields)
- `401` - Unauthorized (invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource doesn't exist)
- `500` - Internal Server Error

---

## Rate Limiting

Functions have built-in rate limiting:
- **AI Functions**: 60 requests/minute, 1000 requests/hour
- **Streaming Functions**: 100 requests/minute
- **Management Functions**: 200 requests/minute
- **Utility Functions**: 300 requests/minute

---

## Webhooks

Functions that support webhooks:
- `handle-call-webhook` - Call provider webhooks
- `stream-ai-response` - AI response streaming
- `websocket-manager` - Real-time communication

---

## Integration Examples

### Frontend Integration

```typescript
// Initialize Supabase client
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://your-project.supabase.co',
  'your-anon-key'
)

// Get auth token
const { data: { session } } = await supabase.auth.getSession()
const token = session?.access_token

// Call function
const response = await fetch('/functions/v1/triage-agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    // function-specific data
  })
})

const result = await response.json()
```

### Real-time Communication

```typescript
// WebSocket connection
const ws = new WebSocket(`wss://your-project.supabase.co/functions/v1/websocket-manager?sessionId=${sessionId}&userId=${userId}&callType=voice`)

// Send audio data
ws.send(JSON.stringify({
  type: 'audio_data',
  data: {
    audio: base64AudioData,
    timestamp: Date.now(),
    isFinal: false
  }
}))

// Handle AI responses
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  if (message.type === 'ai_response') {
    // Handle AI response
    console.log('AI Response:', message.data)
  }
}
```

---

## Security Considerations

1. **Authentication**: All functions require valid JWT tokens
2. **Authorization**: Row Level Security (RLS) enforced on database
3. **Input Validation**: All inputs validated and sanitized
4. **Rate Limiting**: Built-in rate limiting prevents abuse
5. **Error Handling**: No sensitive data exposed in error messages

---

## Performance Tips

1. **Batch Operations**: Use batch endpoints when available
2. **Caching**: Cache frequently accessed data (policies, user preferences)
3. **WebSockets**: Use WebSockets for real-time features
4. **Streaming**: Use streaming for large data transfers
5. **Connection Pooling**: Reuse connections when possible

---

**See also:**
- `database_schema.md` for database structure
- `integration_guide.md` for detailed integration examples
- `security_and_deployment.md` for security and deployment 