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

## API Functions

### Policy Management Functions

#### `GET /policies`
Retrieve all policy versions for a business
- **Parameters**: business_id (query parameter)
- **Access Control**: User must belong to specified business
- **Returns**: Array of policy objects ordered by creation date

#### `POST /policies`
Create new policy version
- **Parameters**: business_id, version, rules, effective_date (request body)
- **Access Control**: User must belong to specified business
- **Validation**: Prevents duplicate version names
- **Returns**: Created policy object

#### `PUT /policies/:id`
Update existing policy version
- **Parameters**: policy_id (URL parameter), policy data (request body)
- **Access Control**: User must belong to policy's business
- **Restrictions**: Cannot edit active policies
- **Returns**: Updated policy object

#### `PUT /policies/:id/activate`
Activate a policy version
- **Parameters**: policy_id (URL parameter), business_id (request body)
- **Access Control**: User must belong to specified business
- **Behavior**: Deactivates all other policies, activates selected one
- **Returns**: Activated policy object

#### `GET /policies/active`
Retrieve currently active policy for a business
- **Parameters**: business_id (query parameter)
- **Access Control**: Public read access for AI agents
- **Returns**: Active policy object or null

### AI Policy Helper Functions

#### `GET /ai-policy-helper/active`
Get active policy for AI decision making
- **Parameters**: business_id (query parameter)
- **Access Control**: Service role authentication
- **Fallback**: Returns default policy if none active
- **Returns**: Policy object with default flag

#### `POST /ai-policy-helper/evaluate-return`
Evaluate return request against business policy
- **Parameters**: business_id, order_id, customer_email, reason_for_return, purchase_date, product_category (request body)
- **Access Control**: Service role authentication
- **Processing**: Calculates eligibility based on policy rules
- **Returns**: Evaluation object with recommendation and confidence score

### Chat Management Functions

#### `GET /chat-sessions`
Retrieve chat sessions for a business or user
- **Parameters**: business_id or user_id (query parameters)
- **Access Control**: User must belong to specified business
- **Returns**: Array of chat session objects

#### `POST /chat-sessions`
Create new chat session
- **Parameters**: user_id, business_id, session_name, chat_mode, session_type (request body)
- **Access Control**: User must belong to specified business
- **Returns**: Created chat session object

#### `GET /chat-messages/:session_id`
Retrieve messages for a specific chat session
- **Parameters**: session_id (URL parameter)
- **Access Control**: User must have access to session's business
- **Returns**: Array of message objects ordered by timestamp

#### `POST /chat-messages`
Send new message in chat session
- **Parameters**: session_id, sender, message, message_type, metadata (request body)
- **Access Control**: User must have access to session's business
- **Returns**: Created message object

### Return Request Management Functions

#### `GET /return-requests`
Retrieve return requests for a business
- **Parameters**: business_id (query parameter)
- **Access Control**: User must belong to specified business
- **Returns**: Array of return request objects

#### `POST /return-requests`
Create new return request
- **Parameters**: business_id, order_id, customer_email, reason_for_return (request body)
- **Access Control**: Public endpoint for customer use
- **Returns**: Created return request with public_id

#### `PUT /return-requests/:id/status`
Update return request status
- **Parameters**: request_id (URL parameter), status, admin_notes (request body)
- **Access Control**: User must belong to request's business
- **Returns**: Updated return request object

### User Management Functions

#### `GET /profiles`
Retrieve user profile information
- **Parameters**: user_id (from authentication)
- **Access Control**: Users can only access their own profile
- **Returns**: Profile object with business information

#### `PUT /profiles`
Update user profile
- **Parameters**: business_name, website (request body)
- **Access Control**: Users can only update their own profile
- **Returns**: Updated profile object

#### `GET /user-preferences`
Retrieve user preferences
- **Parameters**: user_id (from authentication)
- **Access Control**: Users can only access their own preferences
- **Returns**: Preferences object

#### `PUT /user-preferences`
Update user preferences
- **Parameters**: preferences object (request body)
- **Access Control**: Users can only update their own preferences
- **Returns**: Updated preferences object

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

#### Audit Trail
- All policy changes tracked with timestamps
- Return request status changes logged
- Chat session activity monitored 