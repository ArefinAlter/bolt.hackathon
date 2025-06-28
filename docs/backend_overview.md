# Dokani Platform Backend Overview

## Purpose

Dokani is an AI-powered return management and customer service platform for e-commerce businesses. The backend leverages Supabase Edge Functions, PostgreSQL, and real-time technologies to provide:
- Automated return triage and fraud detection
- AI-driven customer service (chat, voice, video)
- Real-time analytics and business insights
- Secure, scalable, and extensible APIs for frontend and integrations

## Architecture

- **Supabase**: Managed PostgreSQL, authentication, storage, and real-time engine
- **Edge Functions**: TypeScript serverless functions for all business logic
- **AI Providers**: OpenAI (chat), ElevenLabs (voice), Tavus (video)
- **WebSockets**: Real-time communication for chat, voice, and video
- **Row Level Security (RLS)**: Strict data access control
- **Type Safety**: Comprehensive TypeScript types with centralized database definitions

## Key Features

### Type Safety & Validation
- **Centralized Database Types**: All database schema types defined in `src/lib/supabase/db.ts`
- **UUID Validation**: Comprehensive validation for all UUID fields to prevent invalid database insertions
- **Type Guards**: Proper type checking for provider responses and API data
- **Error Handling**: Improved error handling with proper type guards and detailed error messages

### API Consolidation
- **Unified Return API**: Single endpoint (`/api/returns`) for all return operations (create, triage, update, fetch)
- **Action-Based Routing**: Uses `action` parameter to determine operation type
- **Comprehensive CRUD**: Full Create, Read, Update operations with proper error handling

### Real-Time Streaming
- **Streaming Sessions**: New `streaming_sessions` table for tracking real-time call sessions
- **Multi-Provider Support**: ElevenLabs (voice) and Tavus (video) integration
- **WebSocket Management**: Real-time communication for voice and video calls
- **Stream Processing**: Audio and video stream processors for real-time AI integration

## Directory Structure

```
├── ai-core/                   # AI Agent Functions
│   ├── triage-agent/
│   ├── customer-service-agent/
│   ├── layered-decision-engine/
│   └── risk-assessment/
├── mcp-servers/               # MCP Server Components
│   ├── mcp-base/
│   ├── request-mcp-server/
│   ├── policy-mcp-server/
│   ├── call-mcp-server/
│   └── conversation-mcp-server/
├── streaming/                 # Real-time Processing
│   ├── stream-ai-response/
│   ├── stream-voice-call/
│   ├── audio-stream-processor/
│   └── video-stream-processor/
├── communication/             # Voice/Video Functions
│   ├── initiate-call/         # Enhanced with UUID validation & type safety
│   ├── initiate-video-conversation/
│   ├── handle-call-webhook/
│   └── process-voice-input/
├── management/                # Core Management
│   ├── create-chat-session/
│   ├── send-chat-message/
│   ├── create-tavus-persona/
│   ├── create-voice-persona/
│   └── list-personas/
└── utilities/                 # Support Functions
    ├── upload-file/
    ├── get-analytics/
    ├── websocket-manager/
    └── test-ai-agents/
```

## Recent Improvements

### Type Safety Enhancements
- **Database Types**: Created comprehensive `src/lib/supabase/db.ts` with all table definitions
- **UUID Validation**: Added validation functions to prevent invalid UUID insertions
- **Provider Types**: Defined proper interfaces for ElevenLabs and Tavus responses
- **Error Handling**: Improved error handling with proper type guards

### API Improvements
- **Consolidated Routes**: Merged redundant return API routes into single endpoint
- **Action-Based Operations**: Unified API with action parameter for different operations
- **Library Updates**: Updated `src/lib/return.ts` to use consolidated API
- **Backward Compatibility**: Maintained existing function signatures for compatibility

### Database Schema Updates
- **Streaming Sessions**: Added `streaming_sessions` table for real-time call tracking
- **Enhanced Constraints**: Added CHECK constraints for enum fields
- **Improved Indexes**: Added performance indexes for common queries
- **Security**: Enhanced Row Level Security policies

## API Endpoints

### Return Management
```
POST /api/returns          # Create or triage return requests
GET /api/returns          # Fetch return request by public_id
PUT /api/returns          # Update return request status
```

### Call Management
```
POST /functions/v1/initiate-call     # Start voice/video calls
POST /functions/v1/stream-voice-call # Real-time voice streaming
POST /functions/v1/stream-ai-response # AI response streaming
```

### Chat & Messaging
```
POST /functions/v1/create-chat-session    # Create new chat session
POST /functions/v1/send-chat-message      # Send chat message
GET /functions/v1/get-analytics           # Get analytics data
```

## Type Definitions

### Core Types
```typescript
// Call Session Types
type CallSessionStatus = 'initiated' | 'connecting' | 'active' | 'ended' | 'failed'
type CallType = 'voice' | 'video' | 'test'
type Provider = 'elevenlabs' | 'tavus' | 'test'

// Return Request Types
type ReturnRequestStatus = 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'

// Chat Session Types
type ChatMode = 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
type SessionType = 'test_mode' | 'live_support'
```

### Database Types
All database types are centralized in `src/lib/supabase/db.ts`:
- Complete table definitions with Row, Insert, and Update types
- Proper foreign key relationships
- Enum constraints for status fields
- JSONB types for metadata and configuration

## Security Features

### Row Level Security (RLS)
- **Business Isolation**: Users can only access their own business data
- **Session Security**: Chat and call sessions are isolated by user
- **Return Privacy**: Return requests are isolated by business
- **Streaming Security**: Streaming sessions are user-specific

### Input Validation
- **UUID Validation**: All UUID fields are validated before database insertion
- **Type Checking**: Comprehensive TypeScript type checking
- **Input Sanitization**: All user inputs are sanitized
- **Error Handling**: Proper error responses without information leakage

### API Security
- **Authentication**: Supabase Auth integration
- **Rate Limiting**: Built-in rate limiting for all endpoints
- **CORS**: Proper CORS headers for cross-origin requests
- **Audit Logging**: Security audit logs for all operations

## Performance Optimizations

### Database Indexes
- **Return Requests**: Indexed by business_id, status, and created_at
- **Chat Sessions**: Indexed by business_id and user_id
- **Call Sessions**: Indexed by chat_session_id, status, and provider
- **Streaming Sessions**: Indexed by session_id and status

### Caching Strategy
- **Session Caching**: Chat and call session data cached in memory
- **Provider Configs**: AI provider configurations cached for performance
- **Analytics**: Aggregated analytics data cached with TTL

### Real-Time Performance
- **WebSocket Optimization**: Efficient WebSocket connections for real-time data
- **Stream Processing**: Optimized audio/video stream processing
- **AI Response Streaming**: Real-time AI response generation and streaming

---

**Next:** See `database_schema.md` for a full breakdown of all tables and relationships, or `function_reference.md` for detailed API documentation. 