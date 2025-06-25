# Backend Documentation

## Database Structure

### Authentication Tables

#### `auth.users`
Built-in Supabase authentication table
- `id` (uuid) - Primary key, user identifier
- `email` (text) - User email address
- `created_at` (timestamp) - Account creation time

### Core Business Tables

#### `profiles`
User profile and business association
- `id` (uuid) - Primary key, references auth.users(id)
- `created_at` (timestamp) - Profile creation time
- `business_name` (text) - Name of the business
- `website` (text) - Business website URL
- `subscription_plan` (text) - Current subscription tier (default: 'free')
- `onboarded` (boolean) - Whether user completed onboarding (default: false)
- `business_id` (uuid) - Unique business identifier (default: generated)

#### `policies`
Return policy management with versioning
- `id` (bigint) - Primary key
- `created_at` (timestamp) - Policy creation time
- `business_id` (uuid) - Foreign key to profiles.business_id
- `version` (text) - Policy version identifier
- `is_active` (boolean) - Whether policy is currently active (default: false)
- `effective_date` (timestamp) - When policy becomes effective
- `rules` (jsonb) - Policy rules and configuration

#### `return_requests`
Customer return request management
- `id` (bigint) - Primary key
- `public_id` (uuid) - Public-facing unique identifier
- `created_at` (timestamp) - Request creation time
- `business_id` (uuid) - Foreign key to profiles.business_id
- `order_id` (text) - Order identifier from business system
- `customer_email` (text) - Customer email address
- `reason_for_return` (text) - Customer's stated reason
- `status` (text) - Request status: pending_triage, pending_review, approved, denied, completed
- `evidence_urls` (array) - URLs to uploaded evidence files
- `conversation_log` (jsonb) - Chat history and interactions
- `ai_recommendation` (text) - AI system recommendation
- `ai_confidence_score` (double precision) - AI confidence in recommendation (0-1)
- `admin_notes` (text) - Internal notes from business staff

### Chat System Tables

#### `chat_sessions`
Chat conversation management
- `id` (uuid) - Primary key
- `user_id` (uuid) - Foreign key to auth.users(id)
- `business_id` (uuid) - Foreign key to profiles.business_id
- `session_name` (text) - Display name for session (default: 'Test Session')
- `chat_mode` (text) - Communication channel: normal, messenger, whatsapp, shopify, woocommerce
- `session_type` (text) - Session purpose: test_mode, live_support
- `is_active` (boolean) - Whether session is currently active (default: true)
- `metadata` (jsonb) - Additional session configuration
- `created_at` (timestamp) - Session start time
- `updated_at` (timestamp) - Last activity time

#### `chat_messages`
Individual messages within chat sessions
- `id` (uuid) - Primary key
- `session_id` (uuid) - Foreign key to chat_sessions(id)
- `sender` (text) - Message sender: user, agent, system
- `message` (text) - Message content
- `message_type` (text) - Content type: text, image, file, audio, video
- `metadata` (jsonb) - Additional message data
- `created_at` (timestamp) - Message timestamp

### Voice/Video Communication Tables

#### `call_sessions`
Voice and video call management
- `id` (uuid) - Primary key
- `chat_session_id` (uuid) - Foreign key to chat_sessions(id)
- `call_type` (text) - Call type: voice, video, test
- `provider` (text) - Service provider: elevenlabs, tavus, test
- `external_session_id` (text) - Provider's session identifier
- `status` (text) - Call status: initiated, connecting, active, ended, failed
- `duration_seconds` (integer) - Call duration (default: 0)
- `provider_data` (jsonb) - Provider-specific configuration
- `created_at` (timestamp) - Call initiation time
- `ended_at` (timestamp) - Call end time
- `elevenlabs_agent_id` (text) - ElevenLabs agent identifier
- `elevenlabs_conversation_id` (text) - ElevenLabs conversation identifier
- `tavus_replica_id` (text) - Tavus avatar identifier
- `tavus_conversation_id` (text) - Tavus conversation identifier
- `session_url` (text) - Access URL for call
- `webhook_data` (jsonb) - Webhook payload data
- `is_active` (boolean) - Whether call is currently active (default: false)

#### `call_transcripts`
Voice call transcription
- `id` (uuid) - Primary key
- `call_session_id` (uuid) - Foreign key to call_sessions(id)
- `speaker` (text) - Speaker identifier: user, agent, system
- `message` (text) - Transcribed text
- `timestamp_seconds` (numeric) - Timestamp within call
- `confidence_score` (numeric) - Transcription confidence level
- `created_at` (timestamp) - Transcript creation time

#### `call_analytics`
Call performance metrics
- `id` (uuid) - Primary key
- `call_session_id` (uuid) - Foreign key to call_sessions(id)
- `provider` (text) - Service provider name
- `metrics` (jsonb) - Performance metrics data
- `events` (jsonb) - Call events log
- `created_at` (timestamp) - Analytics creation time

### Configuration Tables

#### `provider_configs`
External service provider configurations
- `id` (uuid) - Primary key
- `business_id` (uuid) - Foreign key to profiles.business_id
- `provider` (text) - Provider name: elevenlabs, tavus
- `config_name` (text) - Configuration identifier
- `config_data` (jsonb) - Provider-specific settings
- `is_active` (boolean) - Whether configuration is active (default: true)
- `created_at` (timestamp) - Configuration creation time
- `updated_at` (timestamp) - Last modification time

#### `user_preferences`
User-specific application settings
- `id` (uuid) - Primary key
- `user_id` (uuid) - Foreign key to auth.users(id), unique
- `preferences` (jsonb) - User preference settings with defaults:
  - `language`: "en"
  - `auto_escalate`: false
  - `video_enabled`: true
  - `voice_enabled`: true
  - `auto_transcript`: true
  - `tavus_replica_id`: null
  - `elevenlabs_voice_id`: null
  - `preferred_chat_mode`: "normal"
  - `call_history_enabled`: true
  - `notifications_enabled`: true
- `created_at` (timestamp) - Preferences creation time
- `updated_at` (timestamp) - Last modification time

#### `file_uploads`
File upload management for personas and evidence
- `id` (uuid) - Primary key
- `business_id` (uuid) - Foreign key to profiles.business_id
- `file_type` (text) - Type: voice_sample, video_sample, evidence_photo, evidence_video
- `file_name` (text) - Original file name
- `file_path` (text) - Storage path in Supabase Storage
- `file_url` (text) - Public URL for file access
- `file_size` (bigint) - File size in bytes
- `metadata` (jsonb) - Additional file metadata
- `uploaded_at` (timestamp) - Upload timestamp
- `created_at` (timestamp) - Record creation time

### Risk Assessment Tables

#### `customer_risk_profiles`
Customer risk assessment and behavior tracking
- `id` (uuid) - Primary key
- `customer_email` (text) - Customer email address
- `business_id` (uuid) - Foreign key to profiles.business_id
- `risk_score` (numeric) - Calculated risk score (0-1)
- `return_frequency` (integer) - Number of returns by this customer
- `fraud_indicators` (jsonb) - Fraud detection flags
- `behavior_patterns` (jsonb) - Customer behavior analysis
- `last_updated` (timestamp) - Last profile update time
- `created_at` (timestamp) - Profile creation time

### Test Data Tables

#### `mock_orders`
Sample order data for testing and demonstrations
- `id` (bigint) - Primary key
- `order_id` (text) - Unique order identifier
- `purchase_date` (timestamp) - Order purchase date
- `customer_email` (text) - Customer email address
- `product_name` (text) - Product title
- `product_category` (text) - Product category
- `purchase_price` (numeric) - Order total (default: 99.99)
- `order_status` (text) - Order status (default: 'delivered')
- `quantity` (integer) - Quantity ordered (default: 1)

## Edge Functions API

### Chat Management Functions

#### `POST /functions/v1/create-chat-session`
Create a new chat session
- **Parameters**: 
  - `user_id` (required) - User identifier
  - `session_name` (optional) - Session display name (default: 'Test Session')
  - `chat_mode` (optional) - Communication mode (default: 'normal')
  - `session_type` (optional) - Session type (default: 'test_mode')
- **Returns**: Session object with ID and welcome message
- **Features**: Automatically adds welcome message and validates user access

#### `POST /functions/v1/send-chat-message`
Send a message in a chat session with AI response generation
- **Parameters**:
  - `session_id` (required) - Chat session identifier
  - `message` (required) - Message content
  - `sender` (required) - Message sender (user, agent, system)
  - `message_type` (optional) - Content type (default: 'text')
  - `metadata` (optional) - Additional message data
- **Returns**: User message and AI agent response
- **Features**: 
  - Automatic return request detection and creation
  - Order lookup and validation
  - AI-powered response generation
  - Integration with return request system

### Return Request Management Functions

#### `POST /functions/v1/init-return`
Initialize a new return request
- **Parameters**:
  - `order_id` (required) - Order identifier
  - `business_id` (required) - Business identifier
- **Returns**: Return request with public ID and portal URL
- **Features**: Order validation and automatic return request creation

#### `POST /functions/v1/triage-return`
AI-powered return request triage and decision making
- **Parameters**:
  - `public_id` (required) - Return request public identifier
  - `reason_for_return` (required) - Customer's return reason
  - `evidence_urls` (optional) - Array of evidence file URLs
  - `conversation_log` (optional) - Chat conversation history
- **Returns**: AI decision with confidence score and reasoning
- **Features**:
  - OpenAI GPT-4 integration for intelligent decision making
  - Policy compliance checking
  - Automatic status updates (approved/denied/pending_review)
  - Risk assessment integration

#### `GET /functions/v1/get-return-request`
Retrieve return request details
- **Parameters**: `public_id` (query parameter) - Return request public identifier
- **Returns**: Complete return request with order details
- **Features**: Public access for customer portals

#### `PUT /functions/v1/update-return-status`
Update return request status (admin function)
- **Parameters**:
  - `public_id` (required) - Return request public identifier
  - `status` (required) - New status
  - `admin_notes` (optional) - Administrative notes
- **Returns**: Updated return request
- **Features**: Status validation and audit trail

### Policy Management Functions

#### `GET /functions/v1/policies`
Retrieve all policies for a business
- **Parameters**: `business_id` (query parameter) - Business identifier
- **Access Control**: User must belong to specified business
- **Returns**: Array of policy objects ordered by creation date

#### `POST /functions/v1/policies`
Create new policy version
- **Parameters**: 
  - `business_id` (required) - Business identifier
  - `version` (required) - Policy version name
  - `rules` (required) - Policy rules configuration
  - `effective_date` (required) - Policy effective date
- **Access Control**: User must belong to specified business
- **Validation**: Prevents duplicate version names
- **Returns**: Created policy object

#### `PUT /functions/v1/policies/:id`
Update existing policy version
- **Parameters**: 
  - `policy_id` (URL parameter) - Policy identifier
  - Policy data (request body)
- **Access Control**: User must belong to policy's business
- **Restrictions**: Cannot edit active policies
- **Returns**: Updated policy object

#### `PUT /functions/v1/policies/:id/activate`
Activate a policy version
- **Parameters**: 
  - `policy_id` (URL parameter) - Policy identifier
  - `business_id` (request body) - Business identifier
- **Access Control**: User must belong to specified business
- **Behavior**: Deactivates all other policies, activates selected one
- **Returns**: Activated policy object

### Voice/Video Communication Functions

#### `POST /functions/v1/initiate-call`
Initialize voice or video call session
- **Parameters**:
  - `chat_session_id` (required) - Associated chat session
  - `call_type` (required) - Call type (voice, video)
  - `provider` (required) - Service provider (elevenlabs, tavus)
  - `config_override` (optional) - Provider-specific configuration
- **Returns**: Call session with provider integration details
- **Features**:
  - Active ElevenLabs Conversational AI integration
  - Active Tavus CVI integration
  - Call session tracking
  - Automatic chat integration
  - Real-time provider API calls

#### `GET /functions/v1/get-call-session`
Retrieve call session details
- **Parameters**: `call_session_id` (query parameter) - Call session identifier
- **Returns**: Complete call session with provider data
- **Features**: Real-time call status and analytics

#### `POST /functions/v1/handle-call-webhook`
Process call provider webhooks
- **Parameters**: Webhook payload from call providers
- **Returns**: Webhook processing confirmation
- **Features**: 
  - Call status updates
  - Transcript processing
  - Analytics collection
  - Provider-specific webhook handling

### Persona Management Functions

#### `POST /functions/v1/create-voice-persona`
Create a new voice persona using ElevenLabs
- **Parameters**:
  - `business_id` (required) - Business identifier
  - `persona_name` (required) - Name for the voice persona
  - `voice_samples` (required) - Array of base64 encoded audio files
  - `voice_settings` (optional) - Voice configuration (accent, age, gender)
- **Returns**: Voice persona with ElevenLabs voice ID
- **Features**: 
  - ElevenLabs API integration
  - Voice cloning and training
  - Configuration storage in provider_configs

#### `POST /functions/v1/create-video-persona`
Create a new video persona using Tavus
- **Parameters**:
  - `business_id` (required) - Business identifier
  - `persona_name` (required) - Name for the video persona
  - `video_samples` (required) - Array of video file URLs
  - `avatar_settings` (optional) - Avatar configuration (quality, style, background)
- **Returns**: Video persona with Tavus replica ID
- **Features**: 
  - Tavus API integration
  - Avatar creation and training
  - Configuration storage in provider_configs

#### `GET /functions/v1/list-personas`
Retrieve all personas for a business
- **Parameters**: 
  - `business_id` (required) - Business identifier
  - `provider` (optional) - Filter by provider (elevenlabs, tavus)
- **Returns**: Voice and video personas organized by provider
- **Features**: 
  - Filtered by provider type
  - Active personas only
  - Complete configuration data

#### `POST /functions/v1/test-persona`
Test a persona with sample content
- **Parameters**:
  - `config_id` (required) - Persona configuration ID
  - `test_content` (required) - Content to test with
  - `test_type` (optional) - Test type specification
- **Returns**: Test results with generated audio/video
- **Features**:
  - Voice persona text-to-speech testing
  - Video persona generation testing
  - Real-time API integration

### File Upload Functions

#### `POST /functions/v1/upload-file`
Upload files for personas or evidence
- **Parameters**:
  - `business_id` (required) - Business identifier
  - `file_type` (required) - Type: voice_sample, video_sample, evidence_photo, evidence_video
  - `file_name` (required) - Original file name
  - `file_data` (required) - File content (base64 or binary)
  - `file_metadata` (optional) - Additional file metadata
- **Returns**: File upload details with public URL
- **Features**:
  - Supabase Storage integration
  - Multiple file type support
  - Metadata tracking
  - Public URL generation

### Analytics Functions

#### `GET /functions/v1/get-analytics`
Retrieve business analytics and metrics
- **Parameters**: 
  - `business_id` (required) - Business identifier
  - `metric_type` (optional) - Specific metrics: all, returns, ai_accuracy, satisfaction, policy
- **Returns**: Comprehensive analytics data
- **Features**:
  - Return request metrics and trends
  - AI decision accuracy analysis
  - Customer satisfaction scoring
  - Policy effectiveness evaluation
  - Real-time data aggregation

### User Management Functions

#### `GET /functions/v1/get-user-preferences`
Retrieve user preferences with automatic defaults
- **Parameters**: `user_id` (query parameter) - User identifier
- **Returns**: User preferences object with defaults if none exist
- **Features**: Automatic preference creation with sensible defaults

### Risk Assessment Functions

#### `POST /functions/v1/risk-assessment/calculate`
Calculate customer risk score for return requests
- **Parameters**:
  - `customer_email` (required) - Customer email
  - `business_id` (required) - Business identifier
  - `order_value` (required) - Order value
  - `return_reason` (required) - Return reason
- **Returns**: Risk score, factors, and recommendation
- **Features**:
  - Multi-factor risk calculation
  - Customer behavior pattern analysis
  - Return frequency tracking
  - Fraud indicator detection

#### `POST /functions/v1/risk-assessment/update`
Update customer risk profile
- **Parameters**:
  - `customer_email` (required) - Customer email
  - `business_id` (required) - Business identifier
  - `fraud_indicator` (optional) - Fraud detection flag
  - `behavior_data` (optional) - Behavior pattern data
- **Returns**: Updated customer profile
- **Features**: Profile creation/update with fraud tracking

#### `GET /functions/v1/risk-assessment/profile`
Retrieve customer risk profile
- **Parameters**: 
  - `customer_email` (query parameter) - Customer email
  - `business_id` (query parameter) - Business identifier
- **Returns**: Customer risk profile or null
- **Features**: Complete risk assessment history

## Authentication & Authorization

### Access Control Patterns

#### User-Business Relationship
- Users belong to a single business via profiles.business_id
- All business-scoped operations verify user access through profiles table
- Service role used for AI agent access to policies

#### Business Data Isolation
- All business data filtered by business_id
- Foreign key constraints ensure data integrity
- Users cannot access other businesses' data

#### Authentication Methods
- JWT tokens for user authentication
- Service role key for AI agent operations
- Row Level Security (RLS) policies enforce access control

### Data Security

#### Sensitive Data Handling
- API keys stored in provider_configs table
- User preferences encrypted in jsonb format
- Conversation logs sanitized before storage
- OpenAI API integration for AI-powered decisions
- ElevenLabs and Tavus API integration for voice/video

#### Audit Trail
- All policy changes tracked with timestamps
- Return request status changes logged
- Chat session activity monitored 
- Risk assessment calculations recorded
- Persona creation and testing logged

## Environment Configuration

### Required Environment Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for edge functions
- `SUPABASE_ANON_KEY` - Anonymous key for client access
- `OPENAI_API_KEY` - OpenAI API key for AI decision making
- `ELEVENLABS_API_KEY` - ElevenLabs API key for voice generation
- `TAVUS_API_KEY` - Tavus API key for video generation
- `ELEVENLABS_DEFAULT_VOICE_ID` - Default voice ID for calls
- `TAVUS_DEFAULT_REPLICA_ID` - Default replica ID for calls
- `SITE_URL` - Frontend application URL

### Provider Integration Status
- **ElevenLabs**: ✅ Active integration for voice personas and calls
- **Tavus**: ✅ Active integration for video personas and calls
- **OpenAI**: ✅ Active integration for return request triage
- **Mock Orders**: ✅ Active for testing and demonstration

## Error Handling

### Standard Error Responses
All edge functions return consistent error responses:
```json
{
  "error": "Error message description",
  "success": false
}
```

### CORS Support
All functions include CORS headers for cross-origin requests:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Headers: authorization, x-client-info, apikey, content-type`

### Validation
- Required field validation on all endpoints
- Business access control verification
- Data integrity checks
- Graceful fallbacks for missing data
- Provider API error handling with fallbacks 