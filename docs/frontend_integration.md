# Frontend Integration Documentation

Complete guide for integrating the Dokani platform frontend with backend services and APIs.

---

## Integration Overview

The frontend integrates with multiple backend services through a **layered architecture**:

- **Supabase Client** - Database and authentication
- **Edge Functions** - Serverless API endpoints
- **WebSocket Connections** - Real-time communication
- **File Storage** - Evidence and media uploads
- **External APIs** - Third-party service integrations

---

## Supabase Integration

### Client Setup
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})
```

### Authentication Integration
```typescript
// src/lib/auth.ts
import { supabase } from './supabase'

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  })
  
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}
```

### Database Operations
```typescript
// src/lib/return.ts
import { supabase } from './supabase'
import { ReturnRequest, ReturnRequestFilter } from '@/types'

export async function fetchReturnRequests(
  businessId: string,
  filters?: ReturnRequestFilter
): Promise<ReturnRequest[]> {
  let query = supabase
    .from('return_requests')
    .select('*')
    .eq('business_id', businessId)
  
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.search) {
    query = query.or(`order_id.ilike.%${filters.search}%,customer_email.ilike.%${filters.search}%`)
  }
  
  if (filters?.dateRange) {
    query = query
      .gte('created_at', filters.dateRange.start.toISOString())
      .lte('created_at', filters.dateRange.end.toISOString())
  }
  
  const { data, error } = await query
    .order(filters?.sortBy || 'created_at', { ascending: filters?.sortDirection === 'asc' })
  
  if (error) throw error
  return data || []
}

export async function updateReturnStatus(
  id: string,
  status: ReturnRequest['status'],
  adminNotes?: string
): Promise<ReturnRequest> {
  const { data, error } = await supabase
    .from('return_requests')
    .update({
      status,
      admin_notes: adminNotes,
      admin_decision_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

---

## Edge Functions Integration

### Function Client
```typescript
// src/lib/functions.ts
import { supabase } from './supabase'

export async function callEdgeFunction<T = any>(
  functionName: string,
  data?: any
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession()
  
  const response = await fetch(`/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: data ? JSON.stringify(data) : undefined
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Function call failed')
  }
  
  return response.json()
}
```

### AI Agent Integration
```typescript
// src/lib/ai.ts
import { callEdgeFunction } from './functions'

export async function triageReturnRequest(requestData: any) {
  return callEdgeFunction('triage-agent', {
    requestData,
    businessId: requestData.businessId
  })
}

export async function processChatMessage(
  message: string,
  context: any,
  conversationHistory?: any[]
) {
  return callEdgeFunction('customer-service-agent', {
    message,
    context,
    conversationHistory
  })
}

export async function streamAIResponse(
  sessionId: string,
  message: string,
  context: any
) {
  const response = await fetch('/functions/v1/stream-ai-response', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sessionId,
      message,
      context
    })
  })
  
  return response.body
}
```

### Policy Management
```typescript
// src/lib/policy.ts
import { callEdgeFunction } from './functions'

export async function getActivePolicy(businessId: string) {
  return callEdgeFunction('policy-mcp-server', {
    method: 'getActivePolicy',
    data: { businessId }
  })
}

export async function updatePolicy(businessId: string, policyData: any) {
  return callEdgeFunction('policy-mcp-server', {
    method: 'updatePolicy',
    data: { businessId, policy: policyData }
  })
}

export async function testPolicy(businessId: string, testData: any) {
  return callEdgeFunction('policy-mcp-server', {
    method: 'testPolicy',
    data: { businessId, testData }
  })
}
```

---

## Real-time Integration

### WebSocket Setup
```typescript
// src/lib/websocket.ts
import { supabase } from './supabase'

export class WebSocketManager {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  
  constructor(
    private sessionId: string,
    private userId: string,
    private callType: 'voice' | 'video' | 'text'
  ) {}
  
  connect() {
    const wsUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/websocket-manager?sessionId=${this.sessionId}&userId=${this.userId}&callType=${this.callType}`
    
    this.ws = new WebSocket(wsUrl)
    
    this.ws.onopen = () => {
      console.log('WebSocket connected')
      this.reconnectAttempts = 0
    }
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }
    
    this.ws.onclose = () => {
      console.log('WebSocket disconnected')
      this.handleReconnect()
    }
    
    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error)
    }
  }
  
  private handleMessage(message: any) {
    switch (message.type) {
      case 'ai_response':
        // Handle AI response
        break
      case 'call_status':
        // Handle call status update
        break
      case 'audio_data':
        // Handle audio data
        break
      case 'video_data':
        // Handle video data
        break
    }
  }
  
  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        this.connect()
      }, 1000 * this.reconnectAttempts)
    }
  }
  
  sendMessage(type: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type,
        data,
        timestamp: Date.now()
      }))
    }
  }
  
  disconnect() {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}
```

### Real-time Subscriptions
```typescript
// src/lib/realtime.ts
import { supabase } from './supabase'

export function subscribeToReturnRequests(
  businessId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('return_requests')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'return_requests',
      filter: `business_id=eq.${businessId}`
    }, callback)
    .subscribe()
}

export function subscribeToChatMessages(
  sessionId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('chat_messages')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'chat_messages',
      filter: `session_id=eq.${sessionId}`
    }, callback)
    .subscribe()
}

export function subscribeToCallSessions(
  sessionId: string,
  callback: (payload: any) => void
) {
  return supabase
    .channel('call_sessions')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'call_sessions',
      filter: `id=eq.${sessionId}`
    }, callback)
    .subscribe()
}
```

---

## File Storage Integration

### File Upload
```typescript
// src/lib/storage.ts
import { supabase } from './supabase'

export async function uploadFile(
  file: File,
  bucket: string,
  path: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false
    })
  
  if (error) throw error
  
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}

export async function uploadEvidence(
  file: File,
  businessId: string,
  returnRequestId: string
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`
  const path = `${businessId}/${returnRequestId}/${fileName}`
  
  return uploadFile(file, 'evidence', path)
}

export async function uploadPersonaFile(
  file: File,
  businessId: string,
  personaId: string,
  type: 'voice' | 'video'
): Promise<string> {
  const fileName = `${Date.now()}-${file.name}`
  const path = `${businessId}/personas/${personaId}/${type}/${fileName}`
  
  return uploadFile(file, 'personas', path)
}
```

### File Management
```typescript
// src/lib/files.ts
import { supabase } from './supabase'

export async function listFiles(
  bucket: string,
  path: string
): Promise<string[]> {
  const { data, error } = await supabase.storage
    .from(bucket)
    .list(path)
  
  if (error) throw error
  return data.map(file => file.name)
}

export async function deleteFile(
  bucket: string,
  path: string
): Promise<void> {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) throw error
}

export async function getFileUrl(
  bucket: string,
  path: string
): Promise<string> {
  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(path)
  
  return publicUrl
}
```

---

## External API Integration

### ElevenLabs Integration
```typescript
// src/lib/elevenlabs.ts
export async function generateVoice(
  text: string,
  voiceId: string
): Promise<ArrayBuffer> {
  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'Accept': 'audio/mpeg',
      'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_flash_v2.5',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0,
        use_speaker_boost: true
      }
    })
  })
  
  if (!response.ok) {
    throw new Error('Voice generation failed')
  }
  
  return response.arrayBuffer()
}

export async function transcribeAudio(
  audioData: ArrayBuffer
): Promise<string> {
  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'xi-api-key': process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audio: btoa(String.fromCharCode(...new Uint8Array(audioData))),
      model_id: 'eleven_scribev2'
    })
  })
  
  if (!response.ok) {
    throw new Error('Audio transcription failed')
  }
  
  const result = await response.json()
  return result.text
}
```

### Tavus Integration
```typescript
// src/lib/tavus.ts
export async function createVideo(
  replicaId: string,
  script: string,
  callbackUrl?: string
): Promise<string> {
  const response = await fetch('https://api.tavus.com/v2/videos', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_TAVUS_API_KEY!,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      replica_id: replicaId,
      script,
      callback_url: callbackUrl,
      settings: {
        background: 'transparent',
        quality: 'standard'
      }
    })
  })
  
  if (!response.ok) {
    throw new Error('Video creation failed')
  }
  
  const result = await response.json()
  return result.video_id
}

export async function getVideoStatus(
  videoId: string
): Promise<any> {
  const response = await fetch(`https://api.tavus.com/v2/videos/${videoId}`, {
    headers: {
      'Accept': 'application/json',
      'x-api-key': process.env.NEXT_PUBLIC_TAVUS_API_KEY!
    }
  })
  
  if (!response.ok) {
    throw new Error('Failed to get video status')
  }
  
  return response.json()
}
```

---

## Error Handling

### API Error Handling
```typescript
// src/lib/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function handleApiError(error: any): never {
  if (error instanceof ApiError) {
    throw error
  }
  
  if (error.response) {
    throw new ApiError(
      error.response.data?.error || 'API request failed',
      error.response.status,
      error.response.data?.code
    )
  }
  
  throw new ApiError(
    error.message || 'Network error',
    500
  )
}
```

### Retry Logic
```typescript
// src/lib/retry.ts
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error as Error
      
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
      }
    }
  }
  
  throw lastError!
}
```

---

## Performance Optimization

### Request Caching
```typescript
// src/lib/cache.ts
class RequestCache {
  private cache = new Map<string, { data: any; timestamp: number }>()
  private ttl = 5 * 60 * 1000 // 5 minutes
  
  async get<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key)
    
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.data
    }
    
    const data = await fetcher()
    this.cache.set(key, { data, timestamp: Date.now() })
    
    return data
  }
  
  invalidate(key: string) {
    this.cache.delete(key)
  }
  
  clear() {
    this.cache.clear()
  }
}

export const requestCache = new RequestCache()
```

### Request Batching
```typescript
// src/lib/batch.ts
class RequestBatcher<T> {
  private batch: Array<{ id: string; resolve: (value: T) => void; reject: (error: Error) => void }> = []
  private timeout: NodeJS.Timeout | null = null
  private batchSize: number
  private batchDelay: number
  
  constructor(
    private processor: (ids: string[]) => Promise<Record<string, T>>,
    batchSize: number = 10,
    batchDelay: number = 50
  ) {
    this.batchSize = batchSize
    this.batchDelay = batchDelay
  }
  
  async request(id: string): Promise<T> {
    return new Promise((resolve, reject) => {
      this.batch.push({ id, resolve, reject })
      
      if (this.batch.length >= this.batchSize) {
        this.processBatch()
      } else if (!this.timeout) {
        this.timeout = setTimeout(() => this.processBatch(), this.batchDelay)
      }
    })
  }
  
  private async processBatch() {
    if (this.timeout) {
      clearTimeout(this.timeout)
      this.timeout = null
    }
    
    const currentBatch = this.batch.splice(0, this.batchSize)
    const ids = currentBatch.map(item => item.id)
    
    try {
      const results = await this.processor(ids)
      
      currentBatch.forEach(item => {
        const result = results[item.id]
        if (result !== undefined) {
          item.resolve(result)
        } else {
          item.reject(new Error(`No result for id: ${item.id}`))
        }
      })
    } catch (error) {
      currentBatch.forEach(item => {
        item.reject(error as Error)
      })
    }
  }
}
```

---

## Security

### Input Validation
```typescript
// src/lib/validation.ts
import { z } from 'zod'

export const returnRequestSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  reason: z.string().min(1, 'Reason is required'),
  customerEmail: z.string().email('Invalid email address'),
  evidenceFiles: z.array(z.instanceof(File)).optional()
})

export const policySchema = z.object({
  return_window_days: z.number().min(1).max(365),
  auto_approve_threshold: z.number().min(0),
  required_evidence: z.array(z.string()),
  acceptable_reasons: z.array(z.string()),
  high_risk_categories: z.array(z.string()),
  fraud_flags: z.array(z.string())
})

export function validateInput<T>(schema: z.ZodSchema<T>, data: any): T {
  return schema.parse(data)
}
```

### CSRF Protection
```typescript
// src/lib/csrf.ts
export function getCsrfToken(): string {
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
}

export function addCsrfHeader(headers: Headers): void {
  const token = getCsrfToken()
  if (token) {
    headers.set('X-CSRF-Token', token)
  }
}
```

---

## Testing Integration

### Mock API Responses
```typescript
// src/lib/mocks.ts
export const mockReturnRequest: ReturnRequest = {
  id: 1,
  public_id: 'req_123',
  business_id: 'business_123',
  order_id: 'ORDER-12345',
  customer_email: 'customer@example.com',
  reason_for_return: 'Defective product',
  status: 'pending_review',
  evidence_urls: ['https://example.com/photo.jpg'],
  created_at: new Date().toISOString()
}

export const mockUser: User = {
  id: 'user_123',
  email: 'admin@example.com',
  role: 'admin',
  business_id: 'business_123',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
}

export function createMockApiResponse<T>(data: T): ApiResponse<T> {
  return {
    success: true,
    data
  }
}
```

### Test Utilities
```typescript
// src/lib/test-utils.ts
import { render } from '@testing-library/react'
import { ThemeProvider } from '@/providers/theme-provider'

export function renderWithProviders(ui: React.ReactElement) {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  )
}

export function mockSupabase() {
  return {
    auth: {
      getSession: jest.fn(),
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signOut: jest.fn()
    },
    from: jest.fn(() => ({
      select: jest.fn(),
      insert: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      eq: jest.fn(),
      order: jest.fn()
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        download: jest.fn(),
        remove: jest.fn(),
        getPublicUrl: jest.fn()
      }))
    }
  }
}
```

---

## Environment Configuration

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ELEVENLABS_API_KEY=your-elevenlabs-key
NEXT_PUBLIC_TAVUS_API_KEY=your-tavus-key
```

### Configuration Management
```typescript
// src/lib/config.ts
export const config = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  },
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL!,
    name: 'Dokani Platform'
  },
  apis: {
    elevenlabs: {
      apiKey: process.env.NEXT_PUBLIC_ELEVENLABS_API_KEY!
    },
    tavus: {
      apiKey: process.env.NEXT_PUBLIC_TAVUS_API_KEY!
    }
  }
}
```

---

**See also:**
- `frontend_overview.md` for architecture overview
- `frontend_components.md` for component documentation
- `frontend_types.md` for TypeScript definitions
- `frontend_deployment.md` for deployment guidelines 