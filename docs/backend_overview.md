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
│   ├── initiate-call/
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

---

**Next:** See `database_schema.md` for a full breakdown of all tables and relationships. 