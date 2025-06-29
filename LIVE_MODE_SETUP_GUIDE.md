# 🚀 Live Mode Setup Guide

This guide will set up your database and backend for full live mode operation with ElevenLabs analytics.

## 📋 Prerequisites

1. **Supabase Project**: Ensure your Supabase project is set up
2. **Environment Variables**: Configure all required API keys
3. **Database Access**: Admin access to run SQL scripts

## 🗄️ Database Setup

### Step 1: Run ElevenLabs Analytics Setup

```bash
# Run the ElevenLabs analytics setup script
psql -h your-supabase-host -U postgres -d postgres -f elevenlabs_analytics_setup.sql
```

This creates:
- `elevenlabs_analytics` - Detailed conversation analytics
- `elevenlabs_conversations` - Conversation tracking
- `elevenlabs_webhook_events` - Webhook event logging
- `elevenlabs_agents` - Agent configurations
- RLS policies and indexes for performance

### Step 2: Verify Database Schema

Your database now supports:
✅ **Call Management**: `call_sessions`, `call_transcripts`, `call_analytics`
✅ **ElevenLabs Integration**: `elevenlabs_analytics`, `elevenlabs_conversations`
✅ **Business Analytics**: `business_analytics`, `agent_performance_logs`
✅ **Real-time Processing**: `streaming_sessions`, `audio_chunks`, `video_frames`
✅ **Return Management**: `return_requests`, `conversation_sessions`
✅ **Security**: `security_events`, RLS policies

## 🔧 Backend Function Deployment

### Core Functions (Required for Live Mode)

```bash
# Deploy core functions
supabase functions deploy process-voice-input
supabase functions deploy customer-service-agent
supabase functions deploy initiate-call
supabase functions deploy call-mcp-server
supabase functions deploy conversation-mcp-server
supabase functions deploy policy-mcp-server
supabase functions deploy triage-agent
supabase functions deploy layered-decision-engine
supabase functions deploy handle-call-webhook
supabase functions deploy websocket-manager
```

### ElevenLabs Integration Functions

```bash
# Deploy ElevenLabs specific functions
supabase functions deploy create-voice-persona
supabase functions deploy get-analytics
supabase functions deploy update-user-preferences
```

## 🔑 Environment Variables Setup

### Required for Live Mode

```bash
# Core APIs
supabase secrets set OPENAI_API_KEY=your_openai_key
supabase secrets set ELEVENLABS_API_KEY=your_elevenlabs_key
supabase secrets set ELEVENLABS_WORKSPACE_ID=your_workspace_id

# Database (auto-configured)
supabase secrets set SUPABASE_URL=your_supabase_url
supabase secrets set SUPABASE_ANON_KEY=your_anon_key
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Optional: Additional APIs
supabase secrets set TAVUS_API_KEY=your_tavus_key
supabase secrets set SHOPIFY_API_KEY=your_shopify_key
supabase secrets set WOOCOMMERCE_API_KEY=your_woocommerce_key
```

### ElevenLabs Conversational AI Setup

1. **Create Agent in ElevenLabs Dashboard**:
   - Go to ElevenLabs Dashboard → Conversational AI
   - Create new agent with your business logic
   - Note the `agent_id` and `voice_id`

2. **Configure Webhooks**:
   - Set post-call webhook URL: `https://your-project.supabase.co/functions/v1/handle-call-webhook`
   - Enable conversation initiation webhook for client data

3. **Update Agent Configuration**:
   ```sql
   INSERT INTO public.elevenlabs_agents (
     business_id, 
     agent_id, 
     agent_name, 
     agent_config, 
     voice_id
   ) VALUES (
     'your-business-id',
     'your-elevenlabs-agent-id',
     'Customer Service Agent',
     '{"system_prompt": "You are a helpful customer service agent..."}',
     'your-voice-id'
   );
   ```

## 🧪 Testing Live Mode

### 1. Test Database Connection

```bash
# Test analytics function
curl -X POST https://your-project.supabase.co/functions/v1/get-analytics \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"business_id": "your-business-id"}'
```

### 2. Test Voice Call Initiation

```bash
# Test call initiation
curl -X POST https://your-project.supabase.co/functions/v1/initiate-call \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "your-business-id",
    "call_type": "voice",
    "provider": "elevenlabs",
    "demo_mode": false
  }'
```

### 3. Test Webhook Handler

```bash
# Test webhook endpoint
curl -X POST https://your-project.supabase.co/functions/v1/handle-call-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "conversation_ended",
    "conversation_id": "test-conversation-id",
    "agent_id": "test-agent-id"
  }'
```

## 📊 Analytics Dashboard Setup

### Frontend Integration

Your analytics dashboard can now display:

1. **ElevenLabs Metrics**:
   - Conversation success rates
   - Average response times
   - Customer satisfaction scores
   - Call duration analytics

2. **Real-time Data**:
   - Active conversations
   - Webhook events
   - Performance metrics

3. **Business Intelligence**:
   - Agent performance comparison
   - Policy effectiveness
   - Risk assessment trends

### API Endpoints Available

```typescript
// Get ElevenLabs analytics summary
GET /api/analytics/elevenlabs?business_id=xxx&start_date=xxx&end_date=xxx

// Get conversation history
GET /api/conversations?business_id=xxx&status=active

// Get webhook events
GET /api/webhook-events?business_id=xxx&event_type=conversation_ended
```

## 🔒 Security & Compliance

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their business data
- Webhook endpoints validate business ownership

### Data Privacy
- Sensitive data encrypted at rest
- API keys stored in Supabase secrets
- Audit trails for all operations

## 🚨 Troubleshooting

### Common Issues

1. **Webhook Not Receiving Events**:
   - Check ElevenLabs webhook URL configuration
   - Verify HMAC signature validation
   - Check function logs for errors

2. **Analytics Not Updating**:
   - Verify RLS policies are correct
   - Check business_id matches in all tables
   - Ensure webhook events are being processed

3. **Call Initiation Fails**:
   - Verify ElevenLabs API key is valid
   - Check agent_id exists in ElevenLabs
   - Ensure voice_id is configured correctly

### Debug Commands

```bash
# Check function logs
supabase functions logs process-voice-input --follow

# Test database connection
supabase db reset

# Verify RLS policies
psql -h your-supabase-host -U postgres -d postgres -c "SELECT * FROM pg_policies WHERE schemaname = 'public';"
```

## ✅ Live Mode Checklist

- [ ] Database schema updated with ElevenLabs tables
- [ ] RLS policies configured
- [ ] Core functions deployed
- [ ] Environment variables set
- [ ] ElevenLabs agent created and configured
- [ ] Webhooks configured
- [ ] Analytics function tested
- [ ] Frontend updated for live mode
- [ ] Security policies verified

## 🎯 Next Steps

1. **Deploy Frontend Updates**: Update your frontend to use live mode APIs
2. **Configure Monitoring**: Set up alerts for webhook failures
3. **Performance Optimization**: Monitor and optimize database queries
4. **Scale Testing**: Test with multiple concurrent conversations

Your database is now fully ready for live mode with comprehensive ElevenLabs analytics support! 🚀 