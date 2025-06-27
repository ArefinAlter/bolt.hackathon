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

---

## Core Types

### User Types
```typescript
// src/types/user.ts
export interface User {
  id: string
  email: string
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
  order_id: string
  customer_email: string
  reason_for_return?: string
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
  evidence_urls?: string[]
  conversation_log?: ConversationMessage[]
  ai_recommendation?: string
  admin_notes?: string
  risk_score?: number
  fraud_flags?: Record<string, boolean>
  triage_agent_id?: string
  customer_service_agent_id?: string
  processing_time_ms?: number
  escalation_reason?: string
  policy_version_used?: string
  admin_decision_at?: string
  days_since_purchase?: number
  order_value?: number
  product_category?: string
  customer_satisfaction_score?: number
  ai_reasoning?: string
  policy_violations?: string[]
  risk_factors?: string[]
  approved_at?: string
  denied_at?: string
  return_history?: number
  created_at: string
}

export interface OrderDetails {
  id: number
  order_id: string
  purchase_date: string
  customer_email: string
  product_name: string
  product_category: string
  purchase_price?: number
  order_status?: string
  quantity?: number
  order_value?: number
}

export interface ConversationMessage {
  sender: 'customer' | 'agent' | 'system'
  message: string
  timestamp: string
}

export interface ReturnRequestsResponse {
  success: boolean
  data: ReturnRequest[]
}

export interface ReturnRequestResponse {
  success: boolean
  data: ReturnRequest
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
```

### Chat Types
```typescript
// src/types/chat.ts
export interface ChatSession {
  id: string
  user_id: string
  business_id: string
  session_name: string
  chat_mode: 'normal' | 'return_request' | 'customer_service'
  session_type: 'test_mode' | 'production'
  is_active: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
  customer_email?: string
}

export interface ChatMessage {
  id: string
  session_id: string
  sender: 'user' | 'agent' | 'system'
  message: string
  message_type: 'text' | 'file' | 'system'
  metadata?: {
    file_urls?: string[]
    file_names?: string[]
    return_detected?: boolean
    ai_agent?: string
    next_action?: string
  }
  created_at: string
}

export interface ChatResponse {
  success: boolean
  message: ChatMessage
  ai_response?: {
    message: string
    next_action?: string
    return_detected?: boolean
  }
}
```

### Call Types
```typescript
// src/types/call.ts
export interface CallSession {
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
  streaming_enabled?: boolean
  websocket_url?: string
  stream_processor_urls?: {
    audio?: string
    video?: string
  }
}

export interface CallTranscript {
  id: string
  call_session_id: string
  speaker: 'user' | 'agent' | 'system'
  message: string
  timestamp_seconds: number
  created_at: string
}

export interface CallControls {
  isMuted: boolean
  isVideoOff: boolean
  isScreenSharing: boolean
  volume: number
}

export interface AudioChunk {
  data: string // base64 encoded audio
  timestamp: number
  sequence: number
  isFinal: boolean
}

export interface VideoFrame {
  data: string // base64 encoded video frame
  timestamp: number
  sequence: number
  isKeyFrame: boolean
  width: number
  height: number
}

export interface CallQualityMetrics {
  audioQuality: 'excellent' | 'good' | 'fair' | 'poor'
  videoQuality?: 'excellent' | 'good' | 'fair' | 'poor'
  latency: number // in milliseconds
  packetLoss: number // percentage
  jitter: number // in milliseconds
  bandwidth: number // in kbps
}

export interface WebSocketMessage {
  type: string
  data?: any
  timestamp: number
}
```

### Policy Types
```typescript
// src/types/policy.ts
export interface PolicyRule {
  return_window_days: number
  auto_approve_threshold: number
  required_evidence: string[]
  acceptable_reasons: string[]
  high_risk_categories: string[]
  fraud_flags: string[]
  allow_voice_calls?: boolean
  allow_video_calls?: boolean
  record_calls?: boolean
  max_call_duration?: number
  auto_escalation_threshold?: number
}

export interface Policy {
  id: number
  business_id: string
  version: string
  is_active: boolean
  effective_date: string
  created_at: string
  rules: PolicyRule
  policy_impact_score?: number
  usage_statistics?: Record<string, number>
  compliance_metrics?: PolicyComplianceMetrics
}

export interface PolicyChangeHistory {
  id: string
  policy_id: number
  business_id: string
  change_type: 'created' | 'modified' | 'activated' | 'deactivated' | 'deleted'
  previous_rules?: PolicyRule
  new_rules?: PolicyRule
  impact_analysis?: Record<string, unknown>
  change_summary?: string
  changed_by: string
  created_at: string
}

export interface PolicyComplianceMetrics {
  total_requests: number
  compliant_requests: number
  compliance_rate: number
  violations: {
    type: string
    count: number
  }[]
  top_violation_reasons: string[]
}

export interface PolicyTestResult {
  decision: 'auto_approve' | 'auto_deny' | 'human_review'
  reasoning: string
  policy_violations: string[]
  risk_factors: string[]
}

export interface PolicyABTest {
  id: string
  name: string
  policy_a_id: number
  policy_b_id: number
  start_date: string
  end_date?: string
  status: 'running' | 'completed' | 'scheduled'
  metrics: {
    policy_a: {
      approval_rate: number
      auto_approval_rate: number
      customer_satisfaction: number
    }
    policy_b: {
      approval_rate: number
      auto_approval_rate: number
      customer_satisfaction: number
    }
    winner?: 'a' | 'b' | 'tie'
  }
}
```

### Analytics Types
```typescript
// src/types/analytics.ts
export interface BusinessAnalytics {
  business_id: string
  metric_type: string
  metric_data: Record<string, any>
  calculated_at: string
  period_start: string
  period_end: string
  created_at: string
}

export interface ReturnAnalytics {
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

export interface AIAccuracyAnalytics {
  total_ai_decisions: number
  correct_decisions: number
  accuracy_rate: string
}

export interface SatisfactionAnalytics {
  total_interactions: number
  satisfaction_score: string
  response_time_avg: string
}

export interface PolicyAnalytics {
  total_policies: number
  active_policy: string
  current_approval_rate: string
}

export interface AnalyticsResponse {
  success: boolean
  businessId: string
  analytics: {
    returns?: ReturnAnalytics
    ai_accuracy?: AIAccuracyAnalytics
    satisfaction?: SatisfactionAnalytics
    policy?: PolicyAnalytics
  }
}
```

---

## Component Types

### Auth Component Types
```typescript
// src/components/auth/types.ts
export interface AuthFormData {
  email: string
  password: string
  confirmPassword?: string
}

export interface AuthFormProps {
  mode: 'login' | 'signup'
  onSubmit: (data: AuthFormData) => void
  isLoading?: boolean
  error?: string
}

export interface AuthGuardProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'customer'
  fallback?: React.ReactNode
}

export interface RoleSelectionCardProps {
  role: 'admin' | 'customer'
  title: string
  description: string
  icon: React.ReactNode
  onSelect: (role: 'admin' | 'customer') => void
  isSelected?: boolean
}
```

### Customer Component Types
```typescript
// src/components/customer/types.ts
export interface ChatContainerProps {
  sessionId: string
  businessId: string
  customerEmail?: string
  onMessageSent?: (message: ChatMessage) => void
}

export interface ChatMessageProps {
  message: ChatMessage
  onFeedback?: (messageId: string, isPositive: boolean) => void
  onViewFile?: (url: string, fileName: string) => void
  showFeedback?: string | null
}

export interface VoiceCallInterfaceProps {
  callSessionId: string
  onCallEnd?: () => void
  onCallStart?: () => void
}

export interface VideoCallInterfaceProps {
  callSessionId: string
  onCallEnd?: () => void
  onCallStart?: () => void
}

export interface FilePreviewProps {
  file: FileUpload
  onClose: () => void
  onDownload?: (file: FileUpload) => void
}

export interface FileUpload {
  id: string
  file: File
  preview_url: string
  upload_progress: number
  status: 'pending' | 'uploading' | 'success' | 'error'
  error?: string
}
```

### Dashboard Component Types
```typescript
// src/components/dashboard/types.ts
export interface DashboardLayoutProps {
  children: React.ReactNode
  title?: string
  description?: string
}

export interface SidebarProps {
  isOpen: boolean
  onClose: () => void
  user: User
}

export interface AnalyticsDashboardProps {
  businessId: string
  dateRange?: {
    start: Date
    end: Date
  }
}

export interface ReturnsTableProps {
  businessId: string
  filters?: ReturnRequestFilter
  onRequestClick?: (request: ReturnRequest) => void
}

export interface RequestDetailProps {
  request: ReturnRequest
  onClose: () => void
  onRequestUpdated: (updatedRequest: ReturnRequest) => void
}

export interface PolicyEditorProps {
  businessId: string
  policy?: Policy
  onSave: (policy: Policy) => void
}

export interface PersonaCreatorProps {
  businessId: string
  provider: 'elevenlabs' | 'tavus'
  onSave: (config: ProviderConfig) => void
}
```

---

## State Types

### Zustand Store Types
```typescript
// src/store/types.ts
export interface UserStore {
  user: User | null
  isAuthenticated: boolean
  role: 'admin' | 'customer' | null
  setUser: (user: User | null) => void
  setRole: (role: 'admin' | 'customer') => void
  logout: () => void
}

export interface ChatStore {
  messages: ChatMessage[]
  isTyping: boolean
  sessionId: string | null
  addMessage: (message: ChatMessage) => void
  setTyping: (typing: boolean) => void
  setSessionId: (id: string) => void
  clearMessages: () => void
}

export interface CallStore {
  currentCall: CallSession | null
  isInCall: boolean
  callType: 'voice' | 'video' | null
  setCurrentCall: (call: CallSession | null) => void
  setIsInCall: (inCall: boolean) => void
  setCallType: (type: 'voice' | 'video' | null) => void
}

export interface UIStore {
  sidebarOpen: boolean
  theme: 'light' | 'dark' | 'system'
  setSidebarOpen: (open: boolean) => void
  setTheme: (theme: 'light' | 'dark' | 'system') => void
  toggleSidebar: () => void
}
```

### Form Types
```typescript
// src/types/forms.ts
export interface ReturnRequestFormData {
  orderId: string
  reason: string
  evidenceFiles: File[]
  customerEmail: string
}

export interface PolicyFormData {
  return_window_days: number
  auto_approve_threshold: number
  required_evidence: string[]
  acceptable_reasons: string[]
  high_risk_categories: string[]
  fraud_flags: string[]
  allow_voice_calls: boolean
  allow_video_calls: boolean
  record_calls: boolean
  max_call_duration?: number
  auto_escalation_threshold?: number
}

export interface PersonaFormData {
  configName: string
  provider: 'elevenlabs' | 'tavus'
  voiceId?: string
  replicaId?: string
  voiceSettings?: {
    stability: number
    similarity_boost: number
    style: number
  }
  personaSettings?: {
    voice_id?: string
    background?: string
    quality?: string
  }
}
```

---

## Utility Types

### API Response Types
```typescript
// src/types/api.ts
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface ApiError {
  message: string
  code: string
  details?: any
}
```

### Event Types
```typescript
// src/types/events.ts
export interface WebSocketEvent {
  type: string
  data: any
  timestamp: number
}

export interface ChatEvent {
  type: 'message' | 'typing' | 'file_upload' | 'status_change'
  data: any
  sessionId: string
}

export interface CallEvent {
  type: 'call_started' | 'call_ended' | 'audio_data' | 'video_data'
  data: any
  sessionId: string
}
```

### Navigation Types
```typescript
// src/types/navigation.ts
export interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  children?: NavigationItem[]
  badge?: string | number
}

export interface BreadcrumbItem {
  label: string
  href?: string
  current?: boolean
}
```

---

## Type Guards

### Type Checking Functions
```typescript
// src/types/guards.ts
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string'
}

export function isReturnRequest(obj: any): obj is ReturnRequest {
  return obj && typeof obj.id === 'number' && typeof obj.order_id === 'string'
}

export function isChatMessage(obj: any): obj is ChatMessage {
  return obj && typeof obj.id === 'string' && typeof obj.message === 'string'
}

export function isCallSession(obj: any): obj is CallSession {
  return obj && typeof obj.id === 'string' && typeof obj.call_type === 'string'
}
```

---

## Generic Types

### Utility Types
```typescript
// src/types/utils.ts
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

export type Required<T, K extends keyof T> = T & Required<Pick<T, K>>

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

export type NonNullable<T> = T extends null | undefined ? never : T

export type AsyncReturnType<T extends (...args: any) => Promise<any>> =
  T extends (...args: any) => Promise<infer R> ? R : any
```

### Component Props Types
```typescript
// src/types/components.ts
export type ComponentProps<T> = T extends React.ComponentType<infer P> ? P : never

export type ForwardedRef<T> = T extends React.ForwardRefExoticComponent<infer P>
  ? P extends { ref?: infer R }
    ? R
    : never
  : never
```

---

## Type Exports

### Main Type Exports
```typescript
// src/types/index.ts
export * from './user'
export * from './business'
export * from './return'
export * from './chat'
export * from './call'
export * from './policy'
export * from './analytics'
export * from './api'
export * from './events'
export * from './navigation'
export * from './guards'
export * from './utils'
export * from './components'
```

---

## Type Usage Examples

### Component Props
```tsx
import { User, ReturnRequest } from '@/types'

interface UserProfileProps {
  user: User
  onUpdate: (user: User) => void
}

interface ReturnRequestCardProps {
  request: ReturnRequest
  onApprove: (id: string) => void
  onDeny: (id: string) => void
}
```

### API Functions
```tsx
import { ReturnRequest, ApiResponse } from '@/types'

async function fetchReturnRequests(
  businessId: string,
  filters?: ReturnRequestFilter
): Promise<ApiResponse<ReturnRequest[]>> {
  // Implementation
}

async function updateReturnStatus(
  id: string,
  status: ReturnRequest['status']
): Promise<ApiResponse<ReturnRequest>> {
  // Implementation
}
```

### State Management
```tsx
import { UserStore, ChatStore } from '@/store/types'

const useUserStore = create<UserStore>((set) => ({
  user: null,
  isAuthenticated: false,
  role: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setRole: (role) => set({ role }),
  logout: () => set({ user: null, isAuthenticated: false, role: null })
}))
```

---

## Type Safety Best Practices

### Strict Type Checking
```typescript
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noImplicitThis": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

### Type Assertions
```typescript
// Safe type assertion
const user = response.data as User

// Type guard usage
if (isUser(response.data)) {
  const user = response.data // TypeScript knows this is User
}
```

### Generic Constraints
```typescript
function processData<T extends { id: string }>(data: T[]): T[] {
  return data.filter(item => item.id)
}
```

---

**See also:**
- `frontend_overview.md` for architecture overview
- `frontend_components.md` for component documentation
- `frontend_integration.md` for API integration
- `frontend_deployment.md` for deployment guidelines 