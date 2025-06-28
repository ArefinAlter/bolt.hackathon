# Dokani Platform Database Schema

This document describes all tables, fields, types, and relationships in the Dokani backend database (PostgreSQL via Supabase).

---

## Authentication

### `auth.users`
Supabase-managed authentication table.
```sql
id uuid PRIMARY KEY
email text
created_at timestamp
```

---

## Core Business Tables

### `profiles`
Business and user profile data.
```sql
id uuid PRIMARY KEY REFERENCES auth.users(id)
created_at timestamp
business_name text NOT NULL
website text
subscription_plan text DEFAULT 'free'
onboarded boolean DEFAULT false
business_id uuid NOT NULL DEFAULT uuid_generate_v4()
```

### `businesses`
Business management table.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
business_name text NOT NULL
owner_id uuid NOT NULL REFERENCES auth.users(id)
subscription_plan text DEFAULT 'free'
settings jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
```

### `policies`
Return policy management with versioning.
```sql
id bigint PRIMARY KEY
created_at timestamp
business_id uuid NOT NULL REFERENCES profiles(business_id)
version text NOT NULL
is_active boolean DEFAULT false
effective_date timestamp DEFAULT now()
rules jsonb NOT NULL
policy_impact_score numeric DEFAULT 0
usage_statistics jsonb DEFAULT '{}'
compliance_metrics jsonb DEFAULT '{}'
```

### `policy_change_history`
Policy change tracking.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
policy_id bigint NOT NULL REFERENCES policies(id)
business_id uuid NOT NULL REFERENCES profiles(business_id)
change_type text NOT NULL CHECK (change_type IN ('created', 'modified', 'activated', 'deactivated', 'deleted'))
previous_rules jsonb
new_rules jsonb
impact_analysis jsonb DEFAULT '{}'
change_summary text
changed_by uuid NOT NULL REFERENCES auth.users(id)
created_at timestamp DEFAULT now()
```

### `return_requests`
Tracks all customer return requests.
```sql
id bigint PRIMARY KEY
public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE
created_at timestamp DEFAULT now()
business_id uuid NOT NULL REFERENCES profiles(business_id)
order_id text NOT NULL
customer_email text NOT NULL
reason_for_return text
status text NOT NULL DEFAULT 'pending_triage' CHECK (status IN ('pending_triage', 'pending_review', 'approved', 'denied', 'completed'))
evidence_urls ARRAY
conversation_log jsonb
ai_recommendation text
admin_notes text
risk_score numeric DEFAULT 0.5 CHECK (risk_score >= 0 AND risk_score <= 1)
fraud_flags jsonb DEFAULT '{}'
triage_agent_id text
customer_service_agent_id text
processing_time_ms integer
escalation_reason text
policy_version_used text
admin_decision_at timestamp
days_since_purchase integer
order_value numeric DEFAULT 0
product_category text
customer_satisfaction_score numeric CHECK (customer_satisfaction_score >= 0 AND customer_satisfaction_score <= 5)
ai_reasoning text
policy_violations jsonb DEFAULT '[]'
risk_factors jsonb DEFAULT '[]'
approved_at timestamp
denied_at timestamp
return_history integer DEFAULT 0
```

### `customer_risk_profiles`
Customer risk and behavior tracking.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
customer_email text NOT NULL
business_id uuid NOT NULL REFERENCES profiles(business_id)
risk_score numeric DEFAULT 0.5 CHECK (risk_score >= 0 AND risk_score <= 1)
return_frequency integer DEFAULT 0
fraud_indicators jsonb DEFAULT '{}'
behavior_patterns jsonb DEFAULT '{}'
last_updated timestamp DEFAULT now()
created_at timestamp DEFAULT now()
```

### `security_events`
Security and anomaly events.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
event_type text NOT NULL CHECK (event_type IN ('fraud_detected', 'circuit_breaker_triggered', 'anomaly_detected', 'policy_violation', 'suspicious_behavior', 'rate_limit_exceeded'))
business_id uuid NOT NULL REFERENCES profiles(business_id)
customer_email text
return_request_id bigint REFERENCES return_requests(id)
severity text DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical'))
event_data jsonb DEFAULT '{}'
resolved boolean DEFAULT false
resolved_by uuid REFERENCES auth.users(id)
resolved_at timestamp
created_at timestamp DEFAULT now()
```

---

## Chat & Conversation Tables

### `chat_sessions`
Chat session management.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
user_id uuid REFERENCES auth.users(id)
business_id uuid REFERENCES profiles(business_id)
session_name text DEFAULT 'Test Session'
chat_mode text DEFAULT 'normal' CHECK (chat_mode IN ('normal', 'messenger', 'whatsapp', 'shopify', 'woocommerce'))
session_type text DEFAULT 'test_mode' CHECK (session_type IN ('test_mode', 'live_support'))
is_active boolean DEFAULT true
metadata jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
customer_email text
```

### `chat_messages`
Individual chat messages.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
session_id uuid REFERENCES chat_sessions(id)
sender text NOT NULL CHECK (sender IN ('user', 'agent', 'system'))
message text NOT NULL
message_type text DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'audio', 'video'))
metadata jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
```

### `conversation_sessions`
Multi-modal conversation sessions.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
business_id uuid NOT NULL REFERENCES profiles(business_id)
customer_email text NOT NULL
channel text NOT NULL CHECK (channel IN ('chat', 'voice', 'video', 'hybrid'))
return_request_id bigint REFERENCES return_requests(id)
status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'archived'))
participants jsonb DEFAULT '[]'
conversation_history jsonb DEFAULT '[]'
current_intent text DEFAULT 'initial_contact'
escalation_level integer DEFAULT 0
ai_agent_type text DEFAULT 'triage' CHECK (ai_agent_type IN ('triage', 'customer_service', 'escalation'))
duration integer DEFAULT 0
archived_at timestamp
archive_reason text
metadata jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
```

### `conversation_messages`
Messages in conversation sessions.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id uuid NOT NULL REFERENCES conversation_sessions(id)
user_id uuid
content text
message_type text NOT NULL CHECK (message_type IN ('text', 'voice_transcription', 'voice_response', 'video_response', 'system', 'ai_response'))
metadata jsonb DEFAULT '{}'
timestamp timestamp NOT NULL
created_at timestamp DEFAULT now()
```

### `conversation_chunks`
Stores chunks of conversation data (audio, video, text, transcript).
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id uuid NOT NULL REFERENCES conversation_sessions(id)
chunk_type text NOT NULL CHECK (chunk_type IN ('audio', 'video', 'text', 'transcript'))
content text
binary_data bytea
sequence_number integer NOT NULL
timestamp timestamp NOT NULL
duration_ms integer
metadata jsonb DEFAULT '{}'
processing_status text DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed'))
ai_processed boolean DEFAULT false
ai_response_id uuid
created_at timestamp DEFAULT now()
```

### `ai_conversation_state`
Tracks the state and memory of AI-driven conversations.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id uuid NOT NULL REFERENCES conversation_sessions(id)
agent_type text NOT NULL CHECK (agent_type IN ('customer_service', 'triage', 'policy', 'conversation'))
conversation_context jsonb DEFAULT '{}'
current_intent text
intent_confidence numeric DEFAULT 0.0
conversation_flow jsonb DEFAULT '[]'
ai_memory jsonb DEFAULT '{}'
response_history jsonb DEFAULT '[]'
escalation_level integer DEFAULT 0
is_active boolean DEFAULT true
last_interaction timestamp DEFAULT now()
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
```

---

## Call & Media Tables

### `call_sessions`
Voice/video call management with comprehensive streaming support.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
chat_session_id uuid REFERENCES chat_sessions(id)
call_type text NOT NULL CHECK (call_type IN ('voice', 'video', 'test'))
provider text NOT NULL CHECK (provider IN ('elevenlabs', 'tavus', 'test'))
external_session_id text
status text DEFAULT 'initiated' CHECK (status IN ('initiated', 'connecting', 'active', 'ended', 'failed'))
duration_seconds integer DEFAULT 0
provider_data jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
ended_at timestamp
elevenlabs_agent_id text
elevenlabs_conversation_id text
tavus_replica_id text
tavus_conversation_id text
session_url text
webhook_data jsonb DEFAULT '{}'
is_active boolean DEFAULT false
persona_config_id uuid REFERENCES provider_configs(id)
call_quality_score numeric CHECK (call_quality_score >= 0 AND call_quality_score <= 1)
customer_feedback jsonb DEFAULT '{}'
streaming_enabled boolean DEFAULT false
websocket_url text
stream_processor_urls jsonb
streaming_config jsonb
real_time_events jsonb DEFAULT '[]'
connection_count integer DEFAULT 0
last_stream_activity timestamp
stream_quality_metrics jsonb
ai_conversation_state_id uuid REFERENCES ai_conversation_state(id)
updated_at timestamp DEFAULT now()
```

### `call_transcripts`
Call transcription data with real-time processing support.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
call_session_id uuid REFERENCES call_sessions(id)
speaker text NOT NULL CHECK (speaker IN ('user', 'agent', 'system'))
message text NOT NULL
timestamp_seconds numeric
created_at timestamp DEFAULT now()
chunk_id uuid
is_real_time boolean DEFAULT false
processing_status text DEFAULT 'pending'
ai_processed boolean DEFAULT false
ai_response_generated boolean DEFAULT false
stream_sequence integer
audio_chunk_id uuid REFERENCES audio_chunks(id)
video_frame_id uuid REFERENCES video_frames(id)
metadata jsonb DEFAULT '{}'
```

### `streaming_sessions`
Tracks real-time streaming sessions for calls with comprehensive metadata.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
call_session_id uuid NOT NULL REFERENCES call_sessions(id)
session_type text NOT NULL CHECK (session_type IN ('voice', 'video', 'hybrid'))
status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'ended', 'error'))
websocket_connections jsonb DEFAULT '[]'
participant_count integer DEFAULT 0
stream_quality text DEFAULT 'standard' CHECK (stream_quality IN ('low', 'standard', 'high', 'ultra'))
audio_config jsonb DEFAULT '{}'
video_config jsonb DEFAULT '{}'
ai_agent_config jsonb DEFAULT '{}'
real_time_events jsonb DEFAULT '[]'
performance_metrics jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
ended_at timestamp
```

### `call_analytics`
Call performance metrics.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
call_session_id uuid REFERENCES call_sessions(id)
provider text NOT NULL
metrics jsonb DEFAULT '{}'
events jsonb DEFAULT '[]'
created_at timestamp DEFAULT now()
```

### `audio_chunks`
Audio data chunks for calls.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id uuid NOT NULL REFERENCES call_sessions(id)
user_id uuid
audio_data text NOT NULL
sequence integer NOT NULL
timestamp timestamp NOT NULL
is_final boolean DEFAULT false
duration_ms integer
sample_rate integer
channels integer
format text
metadata jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
```

### `video_frames`
Video frame data for calls.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id uuid NOT NULL REFERENCES call_sessions(id)
user_id uuid
frame_data text NOT NULL
sequence integer NOT NULL
timestamp timestamp NOT NULL
is_key_frame boolean DEFAULT false
width integer
height integer
fps numeric
format text
metadata jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
```

### `video_analysis`
Stores analysis results for video frames.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id uuid NOT NULL REFERENCES call_sessions(id)
user_id uuid
frame_sequence integer
analysis_data jsonb NOT NULL
timestamp timestamp NOT NULL
analysis_type text CHECK (analysis_type IN ('emotion', 'gesture', 'content', 'quality'))
created_at timestamp DEFAULT now()
```

### `video_stream_analysis`
Stores analysis results for video streams.
```sql
id uuid PRIMARY KEY DEFAULT gen_random_uuid()
session_id uuid NOT NULL REFERENCES streaming_sessions(id)
analysis_data jsonb NOT NULL
timestamp timestamp NOT NULL
analysis_type text CHECK (analysis_type IN ('quality', 'performance', 'content', 'participants'))
created_at timestamp DEFAULT now()
```

---

## Configuration & File Tables

### `provider_configs`
AI/voice/video provider configurations.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
business_id uuid REFERENCES profiles(business_id)
provider text NOT NULL CHECK (provider IN ('elevenlabs', 'tavus'))
config_name text NOT NULL
config_data jsonb NOT NULL DEFAULT '{}'
is_active boolean DEFAULT true
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
usage_count integer DEFAULT 0
last_used_at timestamp
performance_metrics jsonb DEFAULT '{}'
is_default boolean DEFAULT false
streaming_settings jsonb DEFAULT '{}'
real_time_config jsonb DEFAULT '{}'
websocket_config jsonb DEFAULT '{}'
stream_processor_config jsonb DEFAULT '{}'
ai_integration_config jsonb DEFAULT '{}'
```

### `file_uploads`
Uploaded files for evidence/personas.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
business_id uuid NOT NULL REFERENCES profiles(business_id)
file_type text NOT NULL CHECK (file_type IN ('voice_sample', 'video_sample', 'evidence_photo', 'evidence_video'))
file_name text NOT NULL
file_path text NOT NULL
file_url text NOT NULL
file_size bigint NOT NULL
metadata jsonb DEFAULT '{}'
uploaded_at timestamp DEFAULT now()
created_at timestamp DEFAULT now()
```

### `user_preferences`
User-specific settings.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
user_id uuid UNIQUE REFERENCES auth.users(id)
preferences jsonb DEFAULT '{"language": "en", "auto_escalate": false, "video_enabled": true, "voice_enabled": true, "auto_transcript": true, "tavus_replica_id": null, "elevenlabs_voice_id": null, "preferred_chat_mode": "normal", "call_history_enabled": true, "notifications_enabled": true}'
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
```

---

## Analytics, Logging, and Security

### `agent_performance_logs`
Logs AI agent performance.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
agent_type text NOT NULL CHECK (agent_type IN ('customer_service', 'triage', 'system'))
business_id uuid NOT NULL REFERENCES profiles(business_id)
interaction_id uuid
session_id uuid REFERENCES chat_sessions(id)
performance_metrics jsonb DEFAULT '{}'
behavioral_flags jsonb DEFAULT '{}'
decision_quality_score numeric
response_time_ms integer
customer_satisfaction_score numeric
created_at timestamp DEFAULT now()
```

### `business_analytics`
Business-level analytics.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
business_id uuid NOT NULL REFERENCES profiles(business_id)
metric_type text NOT NULL CHECK (metric_type IN ('returns', 'ai_accuracy', 'satisfaction', 'policy', 'personas'))
metric_data jsonb NOT NULL DEFAULT '{}'
calculated_at timestamp DEFAULT now()
period_start timestamp
period_end timestamp
created_at timestamp DEFAULT now()
```

### `persona_test_logs`
Logs persona (voice/video) test results.
```sql
id uuid PRIMARY KEY DEFAULT uuid_generate_v4()
business_id uuid NOT NULL REFERENCES profiles(business_id)
config_id uuid NOT NULL REFERENCES provider_configs(id)
test_type text NOT NULL CHECK (test_type IN ('voice', 'video'))
test_content text NOT NULL
test_result jsonb DEFAULT '{}'
success boolean DEFAULT false
error_message text
test_duration_ms integer
created_at timestamp DEFAULT now()
```

### `security_audit_logs`
Security and access audit trail.
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users(id)
action text NOT NULL
resource_type text NOT NULL
resource_id text
ip_address inet
user_agent text
metadata jsonb DEFAULT '{}'
created_at timestamp DEFAULT now()
```

### `api_usage_logs`
API usage tracking and rate limiting.
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users(id)
endpoint text NOT NULL
method text NOT NULL
status_code integer NOT NULL
response_time_ms integer
request_size_bytes integer
response_size_bytes integer
ip_address inet
user_agent text
created_at timestamp DEFAULT now()
```

---

## Social Media Integration

### `facebook_user_tokens`
Facebook user authentication tokens.
```sql
user_id text PRIMARY KEY
access_token text NOT NULL
expires_at timestamp
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
```

### `facebook_pages`
Facebook page configurations.
```sql
page_id text PRIMARY KEY
page_access_token text NOT NULL
page_name text
user_id text REFERENCES facebook_user_tokens(user_id)
created_at timestamp DEFAULT now()
updated_at timestamp DEFAULT now()
```

---

## Test Data Tables

### `mock_orders`
Demo order data for hackathon/testing.
```sql
id bigint PRIMARY KEY
order_id text NOT NULL UNIQUE
purchase_date timestamp NOT NULL
customer_email text NOT NULL
product_name text NOT NULL
product_category text NOT NULL
purchase_price numeric DEFAULT 99.99
order_status text DEFAULT 'delivered'
quantity integer DEFAULT 1
order_value numeric DEFAULT 99.99
```

---

## Type Definitions

### Call Session Status Types
```typescript
type CallSessionStatus = 'initiated' | 'connecting' | 'active' | 'ended' | 'failed'
type CallType = 'voice' | 'video' | 'test'
type Provider = 'elevenlabs' | 'tavus' | 'test'
```

### Return Request Status Types
```typescript
type ReturnRequestStatus = 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed'
```

### Chat Session Types
```typescript
type ChatMode = 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce'
type SessionType = 'test_mode' | 'live_support'
```

### Message Types
```typescript
type MessageSender = 'user' | 'agent' | 'system'
type MessageType = 'text' | 'image' | 'file' | 'audio' | 'video'
```

### Streaming Session Types
```typescript
type StreamingSessionType = 'voice' | 'video' | 'hybrid'
type StreamingStatus = 'active' | 'paused' | 'ended' | 'error'
type StreamQuality = 'low' | 'standard' | 'high' | 'ultra'
```

---

## Relationships

### Primary Relationships
- `profiles.business_id` → `return_requests.business_id`
- `chat_sessions.business_id` → `profiles.business_id`
- `call_sessions.chat_session_id` → `chat_sessions.id`
- `call_transcripts.call_session_id` → `call_sessions.id`
- `streaming_sessions.call_session_id` → `call_sessions.id`
- `conversation_sessions.business_id` → `profiles.business_id`
- `ai_conversation_state.session_id` → `conversation_sessions.id`

### Foreign Key Constraints
- All foreign keys have proper CASCADE/RESTRICT rules
- UUID fields use proper validation
- Check constraints ensure data integrity

---

## Indexes

### Performance Indexes
```sql
-- Return requests
CREATE INDEX idx_return_requests_business_status ON return_requests(business_id, status);
CREATE INDEX idx_return_requests_customer_email ON return_requests(customer_email);
CREATE INDEX idx_return_requests_created_at ON return_requests(created_at);

-- Chat sessions
CREATE INDEX idx_chat_sessions_business_id ON chat_sessions(business_id);
CREATE INDEX idx_chat_sessions_user_id ON chat_sessions(user_id);

-- Call sessions
CREATE INDEX idx_call_sessions_chat_session_id ON call_sessions(chat_session_id);
CREATE INDEX idx_call_sessions_status ON call_sessions(status);
CREATE INDEX idx_call_sessions_provider ON call_sessions(provider);

-- Streaming sessions
CREATE INDEX idx_streaming_sessions_call_session_id ON streaming_sessions(call_session_id);
CREATE INDEX idx_streaming_sessions_status ON streaming_sessions(status);

-- Messages
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_call_transcripts_call_session_id ON call_transcripts(call_session_id);

-- Analytics
CREATE INDEX idx_business_analytics_business_metric ON business_analytics(business_id, metric_type);
CREATE INDEX idx_agent_performance_logs_business_agent ON agent_performance_logs(business_id, agent_type);
```

---

## Row Level Security (RLS)

### Policies
- **profiles**: Users can only access their own business data
- **return_requests**: Business users can only access their business's returns
- **chat_sessions**: Users can only access their own chat sessions
- **call_sessions**: Users can only access calls from their chat sessions
- **streaming_sessions**: Users can only access their own streaming sessions
- **conversation_sessions**: Users can only access their business's conversations

### Security Features
- UUID validation for all ID fields
- Input sanitization for all text fields
- JSONB validation for metadata fields
- Timestamp validation for all date fields
- Check constraints for enum values
- Risk score validation (0-1 range)
- Satisfaction score validation (0-5 range) 