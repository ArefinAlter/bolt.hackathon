# Dokani Platform Integration Guide

This guide explains how to integrate with the Dokani platform backend, including authentication, calling Supabase Edge Functions, real-time streaming, WebSocket usage, error handling, and best practices.

---

## 1. Authentication

All API calls require a valid Supabase JWT token. Use the Supabase client to authenticate users and obtain the access token.

**Example (JavaScript/TypeScript):**
```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://your-project.supabase.co', 'your-anon-key')

// Sign in user
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'your-password',
})

const token = session?.access_token
```

---

## 2. Calling Supabase Edge Functions

All functions are available at `/functions/v1/{function-name}`. Use the `Authorization` header with the Bearer token.

**Example:**
```typescript
const response = await fetch('https://your-project.supabase.co/functions/v1/triage-agent', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    // function-specific payload
  })
})
const result = await response.json()
```

---

## 3. Real-Time Streaming (AI/Voice/Video)

Some functions (e.g., `stream-ai-response`, `stream-voice-call`, `audio-stream-processor`, `video-stream-processor`) support real-time streaming using Server-Sent Events (SSE) or WebSockets.

### a. Server-Sent Events (SSE)

**Example:**
```typescript
const eventSource = new EventSource('https://your-project.supabase.co/functions/v1/stream-ai-response?sessionId=abc123')
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data)
  console.log('AI Stream:', data)
}
```

### b. WebSockets

**Example:**
```typescript
const ws = new WebSocket('wss://your-project.supabase.co/functions/v1/websocket-manager?sessionId=abc123&userId=user1&callType=voice')
ws.onopen = () => {
  ws.send(JSON.stringify({ type: 'connect', sessionId: 'abc123', userId: 'user1' }))
}
ws.onmessage = (event) => {
  const message = JSON.parse(event.data)
  console.log('Received:', message)
}
```

---

## 4. File Uploads

Use the `upload-file` function for uploading evidence, voice, or video samples. Send a `FormData` object with the file and metadata.

**Example:**
```typescript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('businessId', 'business-uuid')
formData.append('fileType', 'evidence_photo')

const response = await fetch('https://your-project.supabase.co/functions/v1/upload-file', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${token}` },
  body: formData
})
const result = await response.json()
```

---

## 5. Error Handling

All functions return standardized error responses:
```typescript
{
  error: string
  details?: string
  code?: string
}
```
**Example:**
```typescript
if (!result.success) {
  alert(result.error || 'An error occurred')
}
```

---

## 6. Rate Limiting

Respect rate limits for each function group (see `function_reference.md`). Handle `429 Too Many Requests` errors by retrying after a delay.

---

## 7. Best Practices

- **Batch requests** where possible to reduce network overhead.
- **Cache** frequently accessed data (e.g., policies, user preferences).
- **Use WebSockets** for real-time features (calls, chat, streaming).
- **Validate** all user input before sending to backend.
- **Handle errors** gracefully and provide user feedback.
- **Secure** your API keys and tokens.

---

## 8. Integration Checklist

- [ ] Set up Supabase project and client
- [ ] Implement authentication and session management
- [ ] Integrate required Edge Functions (see `function_reference.md`)
- [ ] Handle real-time streaming and WebSocket events
- [ ] Implement file uploads and evidence management
- [ ] Handle errors and rate limits
- [ ] Test all integration flows (returns, calls, chat, analytics)

---

## 9. References

- [Function Reference](./function_reference.md)
- [Database Schema](./database_schema.md)
- [Backend Overview](./backend_overview.md)
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)

---

For further help, contact the backend team or consult the project documentation. 