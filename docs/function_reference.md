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
```