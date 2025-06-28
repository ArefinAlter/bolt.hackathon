# Frontend Types Documentation

Complete TypeScript type definitions for the Dokani platform frontend.

---

## Type Overview

The frontend uses **TypeScript** for type safety and better developer experience. All types are organized by domain and feature.

### Type Categories

1. **Core Types** - Basic data structures
2. **API Types** - Backend integration types
3. **Component Types** - React component props
4. **State Types** - Application state management
5. **Utility Types** - Helper and utility types
6. **Database Types** - Centralized database schema types

---

## Core Types

### User Types
```typescript
// src/types/user.ts
export interface User {
  id: string
  email: string | undefined  // Updated to match Supabase auth
  role: 'admin' | 'customer'
  business_id?: string
  created_at: string
  updated_at: string
  metadata?: Record<string, any>
}

export interface UserProfile {
  id: string
  user_id: string
  first_name?: string
  last_name?: string
  avatar_url?: string
  preferences: UserPreferences
  created_at: string
  updated_at: string
}

export interface UserPreferences {
  language: string
  theme: 'light' | 'dark' | 'system'
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  auto_escalate: boolean
  video_enabled: boolean
  voice_enabled: boolean
  auto_transcript: boolean
  tavus_replica_id?: string
  elevenlabs_voice_id?: string
  preferred_chat_mode: 'text' | 'voice' | 'video'
  call_history_enabled: boolean
  notifications_enabled: boolean
}
```

### Business Types
```typescript
// src/types/business.ts
export interface Business {
  id: string
  name: string
  domain: string
  logo_url?: string
  settings: BusinessSettings
  created_at: string
  updated_at: string
}

export interface BusinessSettings {
  return_window_days: number
  auto_approval_enabled: boolean
  require_evidence: boolean
  max_return_value: number
  allowed_reasons: string[]
  high_risk_categories: string[]
  fraud_detection_enabled: boolean
  ai_agents_enabled: boolean
  voice_calls_enabled: boolean
  video_calls_enabled: boolean
}
```

---

## API Types

### Return Request Types
```typescript
// src/types/return.ts
export interface ReturnRequest {
  id: number
  public_id: string
  business_id: string
  order_number: string  // Updated from order_id
  customer_email: string
  product_name: string  // Added required field
  return_reason: string  // Updated from reason_for_return
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
  evidence_files?: string[]  // Updated from evidence_urls
  admin_notes?: string
  decision_reason?: string  // Added field
  created_at: string
  updated_at: string  // Added field
}

export interface ReturnRequestCreateData {
  business_id: string
  customer_email: string
  order_number: string
  product_name: string
  return_reason: string
  evidence_files?: string[]
}

export interface ReturnRequestUpdateData {
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
  admin_notes?: string
  decision_reason?: string
}

export interface ReturnRequestFilter {
  status?: string
  dateRange?: {
    start: Date
    end: Date
  }
  search?: string
  sortBy?: string
  sortDirection?: 'asc' | 'desc'
}

export interface EvidenceFile {
  id: string
  file: File
  preview_url: string
  upload_progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}

// API Response Types
export interface ReturnRequestsResponse {
  success: boolean
  data: ReturnRequest[]
}

export interface ReturnRequestResponse {
  success: boolean
  data: ReturnRequest
}
```

### Chat Types
```typescript
// src/types/chat.ts
export interface ChatSession {
  id: string
  user_id: string
  business_id: string
  session_name: string
  chat_mode: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'  // Updated enum
  session_type: 'test_mode' | 'live_support'  // Updated enum
  is_active: boolean
  metadata?: Record<string, any>
  created_at: string
  updated_at: string
  customer_email: string
}

export interface ChatMessage {
  id: string
  session_id: string
  sender: 'user' | 'agent' | 'system'  // Updated enum
  message: string
  message_type: 'text' | 'file' | 'system'  // Updated enum
  metadata?: Record<string, any>
  created_at: string
}

export interface ChatSessionCreateData {
  user_id: string
  business_id: string
  session_name?: string
  chat_mode?: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
  session_type?: 'test_mode' | 'live_support'
  customer_email: string
}

export interface ChatMessageCreateData {
  session_id: string
  sender: 'user' | 'agent' | 'system'
  message: string
  message_type?: 'text' | 'file' | 'system'
  metadata?: Record<string, any>
}
```

### Call Types
```typescript
// src/types/call.ts
export interface CallSession {
  id: string
  chat_session_id: string
  call_type: 'voice' | 'video' | 'test'  // Updated enum
  provider: 'elevenlabs' | 'tavus' | 'test'  // Updated enum
  external_session_id?: string
  status: 'initiated' | 'connecting' | 'active' | 'ended' | 'failed'  // Updated enum
  duration_seconds?: number
  provider_data?: Record<string, any>
  created_at: string
  ended_at?: string
  elevenlabs_agent_id?: string
  elevenlabs_conversation_id?: string
  tavus_replica_id?: string
  tavus_conversation_id?: string
  session_url?: string
  webhook_data?: Record<string, any>
  is_active: boolean
  persona_config_id?: string
  call_quality_score?: number
  customer_feedback?: Record<string, any>
  streaming_enabled?: boolean
  websocket_url?: string
  stream_processor_urls?: {
    audio?: string
    video?: string
  }
  streaming_config?: Record<string, any>
  real_time_events?: any[]
  connection_count?: number
  last_stream_activity?: string
  stream_quality_metrics?: Record<string, any>
  ai_conversation_state_id?: string
  updated_at?: string
}

export interface CallTranscript {
  id: string
  call_session_id: string
  speaker: 'user' | 'agent' | 'system'  // Updated enum
  message: string
  timestamp_seconds: number
  created_at: string
  chunk_id?: string
  is_real_time?: boolean
  processing_status?: 'pending' | 'processing' | 'completed' | 'failed'  // Updated enum
  ai_processed?: boolean
  ai_response_generated?: boolean
  stream_sequence?: number
  audio_chunk_id?: string
  video_frame_id?: string
  metadata?: Record<string, any>
}

// New: Streaming Sessions
export interface StreamingSession {
  id: string
  session_id: string
  stream_type: 'voice' | 'video' | 'audio'  // New enum
  provider: string
  status: 'initialized' | 'active' | 'ended' | 'failed'  // New enum
  created_at: string
  ended_at?: string
  metadata?: Record<string, any>
}

export interface CallInitiateData {
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

export interface CallInitiateResponse {
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

---

## Database Types

### Centralized Database Schema
All database types are now centralized in `src/lib/supabase/db.ts`:

```typescript
// src/lib/supabase/db.ts
export interface Database {
  public: {
    Tables: {
      call_sessions: {
        Row: {
          id: string
          chat_session_id: string
          call_type: 'voice' | 'video' | 'test'
          provider: 'elevenlabs' | 'tavus' | 'test'
          status: 'initiated' | 'connecting' | 'active' | 'ended' | 'failed'
          // ... all other fields
        }
        Insert: {
          // Insert-specific types
        }
        Update: {
          // Update-specific types
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
          // Insert-specific types
        }
        Update: {
          // Update-specific types
        }
      }
      return_requests: {
        Row: {
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
        Insert: {
          // Insert-specific types
        }
        Update: {
          // Update-specific types
        }
      }
      // ... all other tables
    }
  }
}
```

### Helper Functions
```typescript
// UUID validation functions
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

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
```

---

## Component Types

### Return Management Components
```typescript
// src/components/dashboard/requests/ReturnsTable.tsx
export interface ReturnsTableProps {
  returns: ReturnRequest[]
  onStatusUpdate: (publicId: string, status: ReturnRequest['status']) => void
  onViewDetails: (publicId: string) => void
  loading?: boolean
  error?: string
}

// src/components/dashboard/requests/CreateReturnForm.tsx
export interface CreateReturnFormProps {
  businessId: string
  onSubmit: (data: ReturnRequestCreateData) => Promise<void>
  onCancel: () => void
  loading?: boolean
}

// src/components/dashboard/requests/RequestDetail.tsx
export interface RequestDetailProps {
  returnRequest: ReturnRequest
  onUpdate: (data: ReturnRequestUpdateData) => Promise<void>
  onClose: () => void
}
```

### Call Management Components
```typescript
// src/components/customer/CallInterface.tsx
export interface CallInterfaceProps {
  callSession: CallSession
  onEndCall: () => void
  onMuteToggle: () => void
  onVideoToggle: () => void
  streamingSession?: StreamingSession
}

// src/components/customer/VoiceCallInterface.tsx
export interface VoiceCallInterfaceProps {
  callSession: CallSession
  onEndCall: () => void
  onMuteToggle: () => void
  audioStream?: MediaStream
}

// src/components/customer/VideoCallInterface.tsx
export interface VideoCallInterfaceProps {
  callSession: CallSession
  onEndCall: () => void
  onMuteToggle: () => void
  onVideoToggle: () => void
  audioStream?: MediaStream
  videoStream?: MediaStream
}
```

### Chat Components
```typescript
// src/components/customer/ChatContainer.tsx
export interface ChatContainerProps {
  sessionId: string
  messages: ChatMessage[]
  onSendMessage: (message: string) => Promise<void>
  onStartCall: (callType: 'voice' | 'video') => Promise<void>
  loading?: boolean
}

// src/components/customer/ChatMessage.tsx
export interface ChatMessageProps {
  message: ChatMessage
  isOwnMessage: boolean
  showTimestamp?: boolean
}
```

---

## State Types

### User Store
```typescript
// src/store/useUserStore.ts
export interface UserState {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
}

export interface UserActions {
  setUser: (user: User | null) => void
  setProfile: (profile: UserProfile | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  logout: () => void
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>
}
```

### Return Store
```typescript
// src/store/useReturnStore.ts
export interface ReturnState {
  returns: ReturnRequest[]
  currentReturn: ReturnRequest | null
  loading: boolean
  error: string | null
  filters: ReturnRequestFilter
}

export interface ReturnActions {
  fetchReturns: (filters?: ReturnRequestFilter) => Promise<void>
  createReturn: (data: ReturnRequestCreateData) => Promise<ReturnRequest>
  updateReturn: (publicId: string, data: ReturnRequestUpdateData) => Promise<void>
  setCurrentReturn: (returnRequest: ReturnRequest | null) => void
  setFilters: (filters: ReturnRequestFilter) => void
}
```

### Call Store
```typescript
// src/store/useCallStore.ts
export interface CallState {
  currentCall: CallSession | null
  streamingSession: StreamingSession | null
  transcripts: CallTranscript[]
  isConnected: boolean
  isMuted: boolean
  isVideoEnabled: boolean
  loading: boolean
  error: string | null
}

export interface CallActions {
  initiateCall: (data: CallInitiateData) => Promise<CallSession>
  endCall: () => Promise<void>
  toggleMute: () => void
  toggleVideo: () => void
  sendTranscript: (transcript: Omit<CallTranscript, 'id' | 'created_at'>) => Promise<void>
  setStreamingSession: (session: StreamingSession | null) => void
}
```

---

## Utility Types

### API Response Types
```typescript
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
```

### Form Types
```typescript
export interface FormField {
  name: string
  label: string
  type: 'text' | 'email' | 'password' | 'select' | 'textarea' | 'file'
  required?: boolean
  validation?: (value: any) => string | null
  options?: { label: string; value: any }[]
}

export interface FormState<T = any> {
  values: T
  errors: Record<string, string>
  touched: Record<string, boolean>
  isSubmitting: boolean
  isValid: boolean
}
```

### Event Types
```typescript
export interface WebSocketEvent {
  type: string
  data: any
  timestamp: string
  sessionId?: string
}

export interface CallEvent extends WebSocketEvent {
  type: 'call_started' | 'call_ended' | 'user_joined' | 'user_left' | 'transcript_update'
  callSessionId: string
}

export interface StreamEvent extends WebSocketEvent {
  type: 'stream_started' | 'stream_ended' | 'audio_chunk' | 'video_frame' | 'ai_response'
  streamingSessionId: string
}
```

---

## Type Guards

### Validation Functions
```typescript
// src/lib/utils.ts
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}

export function isReturnRequestStatus(status: string): status is ReturnRequest['status'] {
  return ['pending_triage', 'pending_review', 'approved', 'denied', 'completed'].includes(status)
}

export function isCallSessionStatus(status: string): status is CallSession['status'] {
  return ['initiated', 'connecting', 'active', 'ended', 'failed'].includes(status)
}

export function isCallType(type: string): type is CallSession['call_type'] {
  return ['voice', 'video', 'test'].includes(type)
}

export function isProvider(provider: string): provider is CallSession['provider'] {
  return ['elevenlabs', 'tavus', 'test'].includes(provider)
}
```

---

## Recent Type Updates

### 1. Database Types Centralization
- **New File**: `src/lib/supabase/db.ts` contains all database schema types
- **Benefits**: Single source of truth for all database types
- **Usage**: Import types directly from the centralized file

### 2. Return Request Type Updates
- **Field Changes**: `order_id` → `order_number`, `reason_for_return` → `return_reason`
- **New Fields**: `product_name` (required), `decision_reason`, `updated_at`
- **Status Enum**: Updated to match database constraints

### 3. Call Session Type Updates
- **Status Enum**: Added 'connecting' status
- **Provider Enum**: Added 'test' provider option
- **New Fields**: Enhanced streaming and real-time features

### 4. New Streaming Sessions Type
- **New Interface**: `StreamingSession` for real-time call tracking
- **Status Enum**: 'initialized', 'active', 'ended', 'failed'
- **Stream Types**: 'voice', 'video', 'audio'

### 5. Enhanced Type Safety
- **UUID Validation**: Helper functions for UUID validation
- **Type Guards**: Functions to validate enum values
- **Error Handling**: Improved error types and handling

---

## Usage Examples

### Creating a Return Request
```typescript
import { createReturnRequest } from '@/lib/return'

const returnData: ReturnRequestCreateData = {
  business_id: '123e4567-e89b-12d3-a456-426614174000',
  customer_email: 'customer@example.com',
  order_number: 'ORDER-12345',
  product_name: 'Wireless Headphones',
  return_reason: 'Defective product',
  evidence_files: ['https://example.com/photo1.jpg']
}

const result = await createReturnRequest(returnData)
```

### Initiating a Call
```typescript
import { initiateCall } from '@/lib/call'

const callData: CallInitiateData = {
  chat_session_id: '123e4567-e89b-12d3-a456-426614174000',
  call_type: 'voice',
  provider: 'elevenlabs',
  enable_streaming: true,
  config_override: {
    voice_id: 'custom-voice-id'
  }
}

const callSession = await initiateCall(callData)
```

### Using Database Types
```typescript
import { Database } from '@/lib/supabase/db'

type CallSessionRow = Database['public']['Tables']['call_sessions']['Row']
type CallSessionInsert = Database['public']['Tables']['call_sessions']['Insert']

const newCall: CallSessionInsert = {
  chat_session_id: '123e4567-e89b-12d3-a456-426614174000',
  call_type: 'voice',
  provider: 'elevenlabs',
  status: 'initiated',
  is_active: true
}
```

---

This documentation reflects the latest type system improvements and should be used as the authoritative reference for all frontend type definitions. 
- `frontend_deployment.md` for deployment guidelines 