# ElevenLabs Conversational AI Integration Setup Guide

## Overview
This guide covers the complete integration of ElevenLabs Conversational AI with your existing Dokani system, including webhook configuration, MCP server integration, persona creation, and analytics.

## 1. ElevenLabs Dashboard Configuration

### 1.1 Webhook Setup
1. **Login to ElevenLabs Dashboard**: Visit [elevenlabs.io](https://elevenlabs.io)
2. **Navigate to your agent**: Find agent `agent_01jyy0m7raf6p9gmw9cvhzvm2f`
3. **Edit Agent Settings**: Click on your agent to edit it
4. **Configure Webhook**:
   - **Webhook URL**: `https://your-project.supabase.co/functions/v1/handle-call-webhook`
   - **Enable Events**:
     - `conversation_started`
     - `conversation_ended`
     - `message_received`
     - `message_sent`
     - `agent_response_generated`

### 1.2 Agent Configuration
- **Name**: `Dokani Customer Service Agent`
- **Description**: `AI-powered customer service agent for Dokani e-commerce platform`
- **Voice ID**: Use your preferred voice ID
- **System Prompt**: See the updated system prompt in `create-voice-persona/index.ts`

## 2. Environment Variables Setup

### 2.1 Supabase Secrets
Run these commands in your Supabase dashboard or CLI:

```bash
supabase secrets set ELEVENLABS_API_KEY=your_api_key_here
supabase secrets set ELEVENLABS_CONVERSATIONAL_AGENT_ID=agent_01jyy0m7raf6p9gmw9cvhzvm2f
```

### 2.2 Frontend Environment Variables
Add to your `.env.local`:

```env
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=agent_01jyy0m7raf6p9gmw9cvhzvm2f
NEXT_PUBLIC_ELEVENLABS_WIDGET_URL=https://unpkg.com/@elevenlabs/convai-widget-embed
```

## 3. Function Deployment

### 3.1 Deploy Updated Functions
```bash
# Deploy the new ElevenLabs MCP server
supabase functions deploy elevenlabs-mcp-server

# Deploy updated functions
supabase functions deploy initiate-call
supabase functions deploy process-voice-input
supabase functions deploy create-voice-persona
supabase functions deploy get-analytics
supabase functions deploy handle-call-webhook
```

### 3.2 Function Dependencies
The following functions work together:
- `initiate-call`: Starts ElevenLabs conversations
- `process-voice-input`: Handles voice processing
- `elevenlabs-mcp-server`: Manages ElevenLabs integration
- `handle-call-webhook`: Processes webhook events
- `get-analytics`: Includes ElevenLabs analytics

## 4. Frontend Integration

### 4.1 Voice Call Interface Updates
The voice call interface now:
- Uses ElevenLabs Conversational AI for real-time voice conversations
- Integrates with your existing policy system
- Provides analytics integration
- Supports escalation to human agents

### 4.2 Widget Integration
Add the ElevenLabs widget to your voice call page:

```tsx
// In your voice call component
useEffect(() => {
  // Load ElevenLabs widget
  const script = document.createElement('script')
  script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed'
  script.async = true
  document.head.appendChild(script)

  return () => {
    document.head.removeChild(script)
  }
}, [])
```

## 5. Policy Integration

### 5.1 MCP Server Communication
The ElevenLabs agent can:
- Trigger policy checks using your existing `policy-mcp-server`
- Access customer data and preferences
- Escalate complex cases to human agents
- Update knowledge base based on policy changes

### 5.2 Policy Check Flow
1. Customer asks about return policy
2. ElevenLabs agent triggers policy check
3. Policy MCP server returns current policy
4. Agent provides accurate policy information
5. Analytics track policy usage and effectiveness

## 6. Analytics Integration

### 6.1 ElevenLabs Analytics
The system now tracks:
- **Conversation Count**: Total conversations handled
- **Message Count**: Total messages exchanged
- **Average Response Time**: Agent response performance
- **Satisfaction Score**: Customer satisfaction metrics
- **Escalation Rate**: Cases escalated to humans

### 6.2 Dashboard Integration
Analytics are automatically:
- Fetched from ElevenLabs API
- Stored in your `business_analytics` table
- Displayed in your existing dashboard
- Used for performance optimization

## 7. Persona Creation Integration

### 7.1 Voice Persona Updates
When creating voice personas:
1. **Voice Creation**: Uses ElevenLabs voice cloning
2. **Agent Configuration**: Updates your existing agent
3. **Knowledge Base**: Integrates with your policy system
4. **Webhook Setup**: Automatically configures webhooks

### 7.2 Persona Management
- Personas are stored in your database
- Voice settings are managed through ElevenLabs
- Knowledge base updates are synchronized
- Analytics track persona performance

## 8. Testing and Validation

### 8.1 Test Voice Calls
1. **Start a voice call** in your application
2. **Verify ElevenLabs integration** is working
3. **Test policy integration** by asking about returns
4. **Check webhook events** in Supabase logs
5. **Validate analytics** in your dashboard

### 8.2 Common Issues and Solutions

#### Issue: No audio in voice calls
**Solution**: Check ElevenLabs API key and agent configuration

#### Issue: Webhook not receiving events
**Solution**: Verify webhook URL and event configuration

#### Issue: Policy checks not working
**Solution**: Ensure MCP server communication is properly configured

#### Issue: Analytics not updating
**Solution**: Check ElevenLabs API permissions and data format

## 9. Production Deployment

### 9.1 Pre-deployment Checklist
- [ ] ElevenLabs agent configured with webhook
- [ ] All environment variables set
- [ ] Functions deployed and tested
- [ ] Frontend integration completed
- [ ] Analytics integration verified
- [ ] Policy integration tested

### 9.2 Monitoring
- Monitor webhook events in Supabase logs
- Track ElevenLabs API usage and costs
- Monitor conversation quality and escalation rates
- Review analytics dashboard regularly

## 10. Advanced Features

### 10.1 Custom Knowledge Base
- Upload business-specific documents
- Train agent on your return policies
- Add FAQ and common scenarios
- Update knowledge base dynamically

### 10.2 Multi-language Support
- Configure multiple voice personas
- Support different languages
- Localize responses and policies
- Track language-specific analytics

### 10.3 Advanced Analytics
- Conversation sentiment analysis
- Customer journey tracking
- Policy effectiveness metrics
- Agent performance optimization

## Benefits of This Integration

1. **Seamless Voice Experience**: Real-time, natural voice conversations
2. **Policy Integration**: Accurate, up-to-date policy information
3. **Analytics Insights**: Comprehensive performance tracking
4. **Scalability**: Handles multiple concurrent conversations
5. **Cost Efficiency**: Optimized API usage and resource management
6. **Quality Assurance**: Built-in monitoring and escalation
7. **Customization**: Flexible persona and knowledge base management

## Support and Maintenance

- **ElevenLabs Documentation**: [docs.elevenlabs.io](https://docs.elevenlabs.io)
- **API Reference**: [api.elevenlabs.io](https://api.elevenlabs.io)
- **Community Support**: ElevenLabs Discord and forums
- **Your System**: Monitor Supabase logs and analytics dashboard

This integration provides a complete, production-ready voice AI solution that seamlessly connects with your existing Dokani platform. 