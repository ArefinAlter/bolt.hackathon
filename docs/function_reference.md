# Function Reference Documentation

Complete reference for all Supabase Edge Functions and API endpoints in the Dokani platform.

---

## API Endpoints

### Return Management API

#### `POST /api/returns`
**Consolidated endpoint for all return operations**

**Description**: Single endpoint for creating, triaging, and managing return requests with action-based routing.

**Request Body**:
```typescript
// Create return request
{
  "action": "create",
  "business_id": "uuid",
  "customer_email": "string",
  "order_number": "string",
  "product_name": "string",
  "return_reason": "string",
  "evidence_files": ["string"]
}

// Triage return request
{
  "action": "triage",
  "public_id": "uuid"
}

// Update return request
{
  "action": "update",
  "public_id": "uuid",
  "status": "pending_triage" | "pending_review" | "approved" | "denied" | "completed",
  "admin_notes": "string",
  "decision_reason": "string"
}
```

**Response**:
```typescript
{
  "success": boolean,
  "data": ReturnRequest | ReturnRequest[],
  "message": "string",
  "error": "string"
}
```

**Features**:
- Action-based routing for different operations
- Comprehensive error handling
- UUID validation for all ID fields
- Automatic triage after creation
- Full CRUD operations

#### `GET /api/returns`
**Fetch return request by public_id**

**Query Parameters**:
- `public_id`: UUID of the return request

**Response**:
```typescript
{
  "success": boolean,
  "data": ReturnRequest
}
```

#### `PUT /api/returns`
**Update return request status and details**

**Request Body**:
```typescript
{
  "public_id": "uuid",
  "status": "pending_triage" | "pending_review" | "approved" | "denied" | "completed",
  "admin_notes": "string",
  "decision_reason": "string"
}
```

---

## Supabase Edge Functions

### Call Management Functions

#### `initiate-call`
**Enhanced with UUID validation and type safety**

**Endpoint**: `POST /functions/v1/initiate-call`

**Description**: Initiates voice or video calls with comprehensive streaming support and AI agent integration.

**Request Body**:
```typescript
{
  "chat_session_id": "uuid",  // Required, validated UUID
  "call_type": "voice" | "video" | "test",
  "provider": "elevenlabs" | "tavus" | "test",
  "config_override": {
    "voice_id": "string",           // Optional, validated UUID
    "replica_id": "string",         // Optional, validated UUID
    "persona_id": "string",
    "elevenlabs_agent_id": "string", // Optional, validated UUID
    "tavus_replica_id": "string",    // Optional, validated UUID
    "persona_config_id": "string"    // Optional, validated UUID
  },
  "enable_streaming": boolean
}
```

**Response**:
```typescript
{
  "success": boolean,
  "call_session_id": "uuid",
  "session_url": "string",
  "provider": "string",
  "call_type": "string",
  "status": "connecting",
  "message": "string",
  "streaming_url": "string",
  "ai_agent_ready": boolean,
  "streaming_enabled": boolean,
  "websocket_url": "string",
  "stream_processor_urls": {
    "audio": "string",
    "video": "string"
  }
}
```

**Key Features**:
- **UUID Validation**: All UUID fields are validated before database insertion
- **Type Safety**: Proper TypeScript interfaces for all provider responses
- **Streaming Support**: Real-time streaming infrastructure initialization
- **AI Integration**: Customer service agent integration for intelligent responses
- **Multi-Provider**: Support for ElevenLabs (voice) and Tavus (video)
- **Error Handling**: Comprehensive error handling with detailed messages

**Provider-Specific Features**:

**ElevenLabs (Voice)**:
- Real-time TTS with streaming
- AI agent conversation context
- Voice customization options
- Audio quality optimization

**Tavus (Video)**:
- Video call session creation
- Replica-based conversations
- Background and quality settings
- Webhook integration

**Error Handling**:
```typescript
// Invalid UUID
{
  "error": "Invalid UUID format",
  "details": ["chat_session_id must be a valid UUID format"]
}

// Missing required fields
{
  "error": "Missing required fields: chat_session_id, call_type, provider"
}

// Unsupported provider
{
  "error": "Unsupported provider: invalid_provider"
}
```

#### `stream-voice-call`
**Real-time voice call streaming**

**Endpoint**: `POST /functions/v1/stream-voice-call`

**Description**: Handles real-time voice call streaming with AI response generation.

**Request Body**:
```typescript
{
  "session_id": "string",
  "audio_data": "base64_encoded_audio",
  "timestamp": "string",
  "sequence": number
}
```

**Response**:
```typescript
{
  "success": boolean,
  "ai_response": "string",
  "audio_response": "base64_encoded_audio",
  "next_action": "string"
}
```

#### `stream-ai-response`
**AI response streaming**

**Endpoint**: `POST /functions/v1/stream-ai-response`

**Description**: Streams AI-generated responses for real-time conversation.

**Request Body**:
```typescript
{
  "session_id": "string",
  "message": "string",
  "context": {
    "business_id": "string",
    "customer_email": "string",
    "session_id": "string",
    "user_role": "customer" | "business"
  }
}
```

### Chat Management Functions

#### `create-chat-session`
**Create new chat session**

**Endpoint**: `POST /functions/v1/create-chat-session`

**Request Body**:
```typescript
{
  "user_id": "uuid",
  "business_id": "uuid",
  "session_name": "string",
  "chat_mode": "normal" | "messenger" | "whatsapp" | "shopify" | "woocommerce",
  "session_type": "test_mode" | "live_support",
  "customer_email": "string"
}
```

**Response**:
```typescript
{
  "success": boolean,
  "session_id": "uuid",
  "session_url": "string"
}
```

#### `send-chat-message`
**Send chat message with AI processing**

**Endpoint**: `POST /functions/v1/send-chat-message`

**Request Body**:
```typescript
{
  "session_id": "uuid",
  "message": "string",
  "sender": "user" | "agent" | "system",
  "message_type": "text" | "file" | "system"
}
```

**Response**:
```typescript
{
  "success": boolean,
  "message_id": "uuid",
  "ai_response": "string",
  "next_action": "string"
}
```

### AI Agent Functions

#### `customer-service-agent`
**Enhanced customer service AI agent**

**Endpoint**: `POST /functions/v1/customer-service-agent`

**Description**: AI agent for customer service with return request detection and intelligent responses.

**Request Body**:
```typescript
{
  "message": "string",
  "context": {
    "business_id": "string",
    "customer_email": "string",
    "session_id": "string",
    "user_role": "customer" | "business",
    "call_session_id": "string",
    "provider": "string",
    "call_type": "string"
  },
  "conversation_history": ChatMessage[]
}
```

**Response**:
```typescript
{
  "success": boolean,
  "message": "string",
  "data": {
    "return_request": ReturnRequest | null,
    "next_action": "string",
    "confidence": number
  }
}
```

#### `triage-agent`
**Return request triage agent**

**Endpoint**: `POST /functions/v1/triage-agent`

**Description**: AI agent for automatically triaging return requests.

**Request Body**:
```typescript
{
  "return_request": ReturnRequest,
  "business_context": BusinessSettings
}
```

**Response**:
```typescript
{
  "success": boolean,
  "recommendation": "auto_approve" | "auto_deny" | "human_review",
  "reasoning": "string",
  "risk_score": number,
  "fraud_flags": string[]
}
```

### Streaming Functions

#### `audio-stream-processor`
**Real-time audio stream processing**

**Endpoint**: `POST /functions/v1/audio-stream-processor`

**Description**: Processes real-time audio streams for voice calls.

**Request Body**:
```typescript
{
  "action": "initialize" | "process" | "end",
  "sessionId": "string",
  "provider": "string",
  "callType": "voice",
  "audio_data": "base64_encoded_audio"
}
```

#### `video-stream-processor`
**Real-time video stream processing**

**Endpoint**: `POST /functions/v1/video-stream-processor`

**Description**: Processes real-time video streams for video calls.

**Request Body**:
```typescript
{
  "action": "initialize" | "process" | "end",
  "sessionId": "string",
  "provider": "string",
  "callType": "video",
  "video_data": "base64_encoded_video"
}
```

#### `websocket-manager`
**WebSocket connection management**

**Endpoint**: `GET /functions/v1/websocket-manager`

**Description**: Manages WebSocket connections for real-time communication.

**Query Parameters**:
- `sessionId`: Call session ID
- `userId`: User ID
- `callType`: Voice or video

**WebSocket Events**:
```typescript
// Call events
{
  "type": "call_started" | "call_ended" | "user_joined" | "user_left" | "transcript_update",
  "data": any,
  "timestamp": "string",
  "callSessionId": "string"
}

// Stream events
{
  "type": "stream_started" | "stream_ended" | "audio_chunk" | "video_frame" | "ai_response",
  "data": any,
  "timestamp": "string",
  "streamingSessionId": "string"
}
```

### Persona Management Functions

#### `create-voice-persona`
**Create ElevenLabs voice persona**

**Endpoint**: `POST /functions/v1/create-voice-persona`

**Request Body**:
```typescript
{
  "business_id": "uuid",
  "config_name": "string",
  "voice_id": "string",
  "voice_settings": {
    "stability": number,
    "similarity_boost": number,
    "style": number
  }
}
```

#### `create-tavus-persona`
**Create Tavus video persona**

**Endpoint**: `POST /functions/v1/create-tavus-persona`

**Request Body**:
```typescript
{
  "business_id": "uuid",
  "config_name": "string",
  "replica_id": "string",
  "persona_settings": {
    "background": "string",
    "quality": "string",
    "auto_respond": boolean
  }
}
```

#### `list-personas`
**List available personas**

**Endpoint**: `GET /functions/v1/list-personas`

**Query Parameters**:
- `business_id`: UUID of the business
- `provider`: Filter by provider (elevenlabs, tavus)

**Response**:
```typescript
{
  "success": boolean,
  "personas": ProviderConfig[]
}
```

### Analytics Functions

#### `get-analytics`
**Get business analytics**

**Endpoint**: `GET /functions/v1/get-analytics`

**Query Parameters**:
- `business_id`: UUID of the business
- `date_range`: Date range for analytics
- `metric_type`: Type of analytics to retrieve

**Response**:
```typescript
{
  "success": boolean,
  "analytics": {
    "returns": ReturnAnalytics,
    "ai_accuracy": AIAccuracyAnalytics,
    "satisfaction": SatisfactionAnalytics,
    "policy": PolicyAnalytics
  }
}
```

### Utility Functions

#### `upload-file`
**File upload handler**

**Endpoint**: `POST /functions/v1/upload-file`

**Description**: Handles file uploads for evidence and persona creation.

**Request Body**: FormData with file and metadata

**Response**:
```typescript
{
  "success": boolean,
  "file_url": "string",
  "file_id": "uuid"
}
```

#### `test-ai-agents`
**Test AI agent functionality**

**Endpoint**: `POST /functions/v1/test-ai-agents`

**Description**: Test endpoint for AI agent functionality and configuration.

**Request Body**:
```typescript
{
  "agent_type": "customer_service" | "triage" | "policy",
  "test_message": "string",
  "context": AgentContext
}
```

---

## Database Integration

### New Streaming Sessions Table
```sql
CREATE TABLE streaming_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  stream_type text NOT NULL CHECK (stream_type IN ('voice', 'video', 'audio')),
  provider text NOT NULL,
  status text NOT NULL DEFAULT 'initialized' CHECK (status IN ('initialized', 'active', 'ended', 'failed')),
  created_at timestamp DEFAULT now(),
  ended_at timestamp,
  metadata jsonb DEFAULT '{}'
);
```

### Enhanced Call Sessions
The `call_sessions` table now includes:
- Streaming support fields
- Real-time event tracking
- Quality metrics
- AI conversation state integration

### Type Safety Improvements
- All functions now use centralized database types from `src/lib/supabase/db.ts`
- UUID validation for all ID fields
- Proper error handling with type guards
- Enhanced response types

---

## Error Handling

### Common Error Responses
```typescript
// Validation errors
{
  "error": "Validation failed",
  "details": ["Field validation errors"]
}

// Authentication errors
{
  "error": "Unauthorized",
  "status": 401
}

// Database errors
{
  "error": "Database operation failed",
  "details": "Specific error message"
}

// Provider errors
{
  "error": "Provider API error",
  "details": "Provider-specific error message"
}
```

### Error Codes
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (authentication required)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found (resource not found)
- `500`: Internal Server Error (server error)

---

## Performance Considerations

### Caching
- Session data cached in memory
- Provider configurations cached
- Analytics data cached with TTL

### Rate Limiting
- Built-in rate limiting for all endpoints
- Per-user and per-business limits
- Exponential backoff for retries

### Database Optimization
- Indexed queries for common operations
- Connection pooling
- Query optimization

---

## Security Features

### Authentication
- Supabase Auth integration
- JWT token validation
- Role-based access control

### Input Validation
- UUID validation for all ID fields
- Input sanitization
- Type checking

### Row Level Security (RLS)
- Business data isolation
- User-specific access control
- Session-based permissions

---

This function reference reflects the latest improvements including enhanced type safety, consolidated API routes, and comprehensive streaming support.