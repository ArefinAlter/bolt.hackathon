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

### `policies`
Return policy management with versioning.
```sql
id bigint PRIMARY KEY
created_at timestamp
business_id uuid NOT NULL REFERENCES profiles(business_id)
version text NOT NULL
is_active boolean DEFAULT false
effective_date timestamp
rules jsonb NOT NULL
policy_impact_score numeric DEFAULT 0
usage_statistics jsonb DEFAULT '{}'
compliance_metrics jsonb DEFAULT '{}'
```

### `return_requests`
Tracks all customer return requests.
```sql
id bigint PRIMARY KEY
public_id uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE
created_at timestamp
business_id uuid NOT NULL REFERENCES profiles(business_id)
order_id text NOT NULL
customer_email text NOT NULL
reason_for_return text
status text DEFAULT 'pending_triage'
evidence_urls array
conversation_log jsonb
ai_recommendation text
admin_notes text
risk_score numeric DEFAULT 0.5
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
customer_satisfaction_score numeric
ai_reasoning text
policy_violations jsonb DEFAULT '[]'
risk_factors jsonb DEFAULT '[]'
approved_at timestamp
denied_at timestamp
return_history integer DEFAULT 0
```

---

## Chat & Conversation Tables

### `chat_sessions`
Chat session management.
```sql
id uuid PRIMARY KEY
user_id uuid REFERENCES auth.users(id)
business_id uuid REFERENCES profiles(business_id)
session_name text DEFAULT 'Test Session'
chat_mode text DEFAULT 'normal'
session_type text DEFAULT 'test_mode'
is_active boolean DEFAULT true
metadata jsonb DEFAULT '{}'
created_at timestamp
updated_at timestamp
customer_email text
```

### `chat_messages`
Individual chat messages.
```sql
id uuid PRIMARY KEY
session_id uuid REFERENCES chat_sessions(id)
sender text NOT NULL
message text NOT NULL
message_type text DEFAULT 'text'
metadata jsonb DEFAULT '{}'
created_at timestamp
```

### `conversation_sessions`
Multi-modal conversation sessions.
```sql
id uuid PRIMARY KEY
business_id uuid NOT NULL REFERENCES profiles(business_id)
customer_email text NOT NULL
channel text NOT NULL
return_request_id bigint REFERENCES return_requests(id)
status text DEFAULT 'active'
participants jsonb DEFAULT '[]'
conversation_history jsonb DEFAULT '[]'
current_intent text DEFAULT 'initial_contact'
escalation_level integer DEFAULT 0
ai_agent_type text DEFAULT 'triage'
duration integer DEFAULT 0
archived_at timestamp
archive_reason text
metadata jsonb DEFAULT '{}'
created_at timestamp
updated_at timestamp
```

### `conversation_messages`
Messages in conversation sessions.
```sql
id uuid PRIMARY KEY
session_id uuid NOT NULL REFERENCES conversation_sessions(id)
user_id uuid
content text
message_type text NOT NULL
metadata jsonb DEFAULT '{}'
timestamp timestamp NOT NULL
created_at timestamp
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
Voice/video call management.
```sql
id uuid PRIMARY KEY
chat_session_id uuid REFERENCES chat_sessions(id)
call_type text NOT NULL
provider text NOT NULL
external_session_id text
status text DEFAULT 'initiated'
duration_seconds integer DEFAULT 0
provider_data jsonb DEFAULT '{}'
created_at timestamp
ended_at timestamp
elevenlabs_agent_id text
elevenlabs_conversation_id text
tavus_replica_id text
tavus_conversation_id text
session_url text
webhook_data jsonb DEFAULT '{}'
is_active boolean DEFAULT false
persona_config_id uuid REFERENCES provider_configs(id)
call_quality_score numeric
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
updated_at timestamp
```

### `call_transcripts`
Call transcription data.
```sql
id uuid PRIMARY KEY
call_session_id uuid REFERENCES call_sessions(id)
speaker text NOT NULL
message text NOT NULL
timestamp_seconds numeric
created_at timestamp
chunk_id uuid
is_real_time boolean DEFAULT false
processing_status text DEFAULT 'pending'
ai_processed boolean DEFAULT false
ai_response_generated boolean DEFAULT false
stream_sequence integer
audio_chunk_id uuid
video_frame_id uuid
metadata jsonb DEFAULT '{}'
```

### `call_analytics`
Call performance metrics.
```sql
id uuid PRIMARY KEY
call_session_id uuid REFERENCES call_sessions(id)
provider text NOT NULL
metrics jsonb DEFAULT '{}'
events jsonb DEFAULT '[]'
created_at timestamp
```

### `audio_chunks`
Audio data chunks for calls.
```sql
id uuid PRIMARY KEY
audio_data text NOT NULL
session_id uuid NOT NULL REFERENCES call_sessions(id)
user_id uuid
sequence integer NOT NULL
timestamp timestamp NOT NULL
is_final boolean DEFAULT false
duration_ms integer
sample_rate integer
channels integer
format text
metadata jsonb DEFAULT '{}'
created_at timestamp
```

### `video_frames`
Video frame data for calls.
```sql
id uuid PRIMARY KEY
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
created_at timestamp
```

### `streaming_sessions`
Tracks real-time streaming sessions for calls.
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
id uuid PRIMARY KEY
business_id uuid REFERENCES profiles(business_id)
provider text NOT NULL
config_name text NOT NULL
config_data jsonb NOT NULL DEFAULT '{}'
is_active boolean DEFAULT true
created_at timestamp
updated_at timestamp
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
id uuid PRIMARY KEY
business_id uuid NOT NULL REFERENCES profiles(business_id)
file_type text NOT NULL
file_name text NOT NULL
file_path text NOT NULL
file_url text NOT NULL
file_size bigint NOT NULL
metadata jsonb DEFAULT '{}'
uploaded_at timestamp
created_at timestamp
```

### `user_preferences`
User-specific settings.
```sql
id uuid PRIMARY KEY
user_id uuid UNIQUE REFERENCES auth.users(id)
preferences jsonb DEFAULT '{...}'
created_at timestamp
updated_at timestamp
```

---

## Analytics, Logging, and Security

### `agent_performance_logs`
Logs AI agent performance.
```sql
id uuid PRIMARY KEY
agent_type text NOT NULL
business_id uuid NOT NULL REFERENCES profiles(business_id)
interaction_id uuid
session_id uuid REFERENCES chat_sessions(id)
performance_metrics jsonb DEFAULT '{}'
decision_quality_score numeric
response_time_ms integer
customer_satisfaction_score numeric
created_at timestamp
```

### `business_analytics`
Business-level analytics.
```sql
id uuid PRIMARY KEY
business_id uuid NOT NULL REFERENCES profiles(business_id)
metric_type text NOT NULL
metric_data jsonb NOT NULL DEFAULT '{}'
calculated_at timestamp
period_start timestamp
period_end timestamp
created_at timestamp
```

### `customer_risk_profiles`
Customer risk and behavior.
```sql
id uuid PRIMARY KEY
customer_email text NOT NULL
business_id uuid NOT NULL REFERENCES profiles(business_id)
risk_score numeric DEFAULT 0.5
return_frequency integer DEFAULT 0
fraud_indicators jsonb DEFAULT '{}'
behavior_patterns jsonb DEFAULT '{}'
last_updated timestamp
created_at timestamp
```

### `security_events`
Security and anomaly events.
```sql
id uuid PRIMARY KEY
event_type text NOT NULL
business_id uuid NOT NULL REFERENCES profiles(business_id)
customer_email text
return_request_id bigint REFERENCES return_requests(id)
severity text DEFAULT 'medium'
event_data jsonb DEFAULT '{}'
resolved boolean DEFAULT false
resolved_by uuid
resolved_at timestamp
created_at timestamp
```

### `persona_test_logs`
Logs persona (voice/video) test results.
```sql
id uuid PRIMARY KEY
business_id uuid NOT NULL REFERENCES profiles(business_id)
config_id uuid NOT NULL REFERENCES provider_configs(id)
test_type text NOT NULL
test_content text NOT NULL
test_result jsonb DEFAULT '{}'
success boolean DEFAULT false
error_message text
test_duration_ms integer
created_at timestamp
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

## Relationships
- All `business_id` fields reference `profiles.business_id`.
- All `user_id` fields reference `auth.users.id`.
- All session and request tables are linked by foreign keys for traceability.
- RLS (Row Level Security) is enabled on all tables for strict access control.

---

**See also:**
- `backend_overview.md` for architecture
- `function_reference.md` for API/function details
- `integration_guide.md` for frontend/API usage
- `security_and_deployment.md` for security and deployment practices 