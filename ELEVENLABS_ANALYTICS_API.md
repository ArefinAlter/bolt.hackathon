# 📊 ElevenLabs Analytics API Reference

## Overview

This document provides the API endpoints for accessing ElevenLabs analytics data in live mode.

## 🔗 Base URL

```
https://your-project.supabase.co/functions/v1/
```

## 📈 Analytics Endpoints

### 1. Get ElevenLabs Analytics Summary

**Endpoint:** `GET /get-analytics`

**Parameters:**
- `business_id` (required): UUID of the business
- `start_date` (optional): Start date for analytics (ISO 8601)
- `end_date` (optional): End date for analytics (ISO 8601)
- `metric_type` (optional): Filter by metric type

**Example Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/get-analytics \
  -H "Authorization: Bearer your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{
    "business_id": "your-business-id",
    "start_date": "2024-01-01T00:00:00Z",
    "end_date": "2024-01-31T23:59:59Z",
    "metric_type": "elevenlabs_analytics"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "conversations_count": 150,
    "messages_count": 1250,
    "average_response_time": 2.3,
    "satisfaction_score": 4.2,
    "escalation_rate": 0.15,
    "total_duration_minutes": 450.5,
    "average_call_duration": 3.0,
    "success_rate": 0.92
  }
}
```

### 2. Get Conversation History

**Endpoint:** `GET /conversations`

**Parameters:**
- `business_id` (required): UUID of the business
- `status` (optional): Filter by status (active, ended, failed)
- `limit` (optional): Number of records to return (default: 50)
- `offset` (optional): Number of records to skip

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/rest/v1/elevenlabs_conversations?business_id=eq.your-business-id&status=eq.ended&limit=10" \
  -H "Authorization: Bearer your_anon_key" \
  -H "apikey: your_anon_key"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "business_id": "uuid",
    "conversation_id": "elevenlabs-conversation-id",
    "agent_id": "elevenlabs-agent-id",
    "call_session_id": "uuid",
    "status": "ended",
    "conversation_data": {},
    "started_at": "2024-01-15T10:30:00Z",
    "ended_at": "2024-01-15T10:35:00Z",
    "created_at": "2024-01-15T10:30:00Z"
  }
]
```

### 3. Get Webhook Events

**Endpoint:** `GET /webhook-events`

**Parameters:**
- `business_id` (required): UUID of the business
- `event_type` (optional): Filter by event type
- `processed` (optional): Filter by processing status
- `limit` (optional): Number of records to return

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/rest/v1/elevenlabs_webhook_events?business_id=eq.your-business-id&event_type=eq.conversation_ended&limit=20" \
  -H "Authorization: Bearer your_anon_key" \
  -H "apikey: your_anon_key"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "business_id": "uuid",
    "event_type": "conversation_ended",
    "event_timestamp": 1705312200000,
    "conversation_id": "elevenlabs-conversation-id",
    "agent_id": "elevenlabs-agent-id",
    "payload": {
      "conversation_id": "elevenlabs-conversation-id",
      "duration": 300,
      "messages_count": 25,
      "satisfaction_score": 4.5
    },
    "processed": true,
    "created_at": "2024-01-15T10:35:00Z"
  }
]
```

### 4. Get Agent Configurations

**Endpoint:** `GET /agents`

**Parameters:**
- `business_id` (required): UUID of the business
- `is_active` (optional): Filter by active status

**Example Request:**
```bash
curl -X GET "https://your-project.supabase.co/rest/v1/elevenlabs_agents?business_id=eq.your-business-id&is_active=eq.true" \
  -H "Authorization: Bearer your_anon_key" \
  -H "apikey: your_anon_key"
```

**Response:**
```json
[
  {
    "id": "uuid",
    "business_id": "uuid",
    "agent_id": "elevenlabs-agent-id",
    "agent_name": "Customer Service Agent",
    "agent_config": {
      "system_prompt": "You are a helpful customer service agent...",
      "voice_settings": {}
    },
    "voice_id": "elevenlabs-voice-id",
    "language": "en",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00Z"
  }
]
```

## 📊 Database Functions

### Get Analytics Summary Function

**Function:** `get_elevenlabs_analytics_summary(business_id, start_date, end_date)`

**Example Usage:**
```sql
SELECT get_elevenlabs_analytics_summary(
  'your-business-id'::uuid,
  '2024-01-01'::timestamp with time zone,
  '2024-01-31'::timestamp with time zone
);
```

**Returns:**
```json
{
  "conversations_count": 150,
  "messages_count": 1250,
  "average_response_time": 2.3,
  "satisfaction_score": 4.2,
  "escalation_rate": 0.15,
  "total_duration_minutes": 450.5,
  "average_call_duration": 3.0,
  "success_rate": 0.92
}
```

## 🔍 Query Examples

### Get Recent Analytics (Last 7 Days)

```sql
SELECT 
  ea.conversation_id,
  ea.satisfaction_score,
  ea.duration_seconds,
  ea.messages_count,
  ea.created_at
FROM public.elevenlabs_analytics ea
WHERE ea.business_id = 'your-business-id'
  AND ea.created_at >= now() - interval '7 days'
ORDER BY ea.created_at DESC;
```

### Get Agent Performance Comparison

```sql
SELECT 
  ea.agent_id,
  COUNT(*) as total_conversations,
  AVG(ea.satisfaction_score) as avg_satisfaction,
  AVG(ea.duration_seconds) as avg_duration,
  AVG(ea.success_rate) as avg_success_rate
FROM public.elevenlabs_analytics ea
WHERE ea.business_id = 'your-business-id'
  AND ea.created_at >= now() - interval '30 days'
GROUP BY ea.agent_id
ORDER BY avg_satisfaction DESC;
```

### Get Webhook Processing Status

```sql
SELECT 
  event_type,
  COUNT(*) as total_events,
  COUNT(*) FILTER (WHERE processed = true) as processed_events,
  COUNT(*) FILTER (WHERE processed = false) as pending_events
FROM public.elevenlabs_webhook_events
WHERE business_id = 'your-business-id'
  AND created_at >= now() - interval '24 hours'
GROUP BY event_type;
```

## 🚨 Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "error": "Unauthorized",
  "message": "Invalid or missing authorization token"
}
```

**403 Forbidden:**
```json
{
  "error": "Forbidden",
  "message": "Access denied to this business data"
}
```

**404 Not Found:**
```json
{
  "error": "Not Found",
  "message": "Business or resource not found"
}
```

**500 Internal Server Error:**
```json
{
  "error": "Internal Server Error",
  "message": "Database connection or processing error"
}
```

## 📝 Notes

1. **Authentication**: All endpoints require valid Supabase JWT token
2. **RLS**: Row Level Security ensures users only access their business data
3. **Rate Limiting**: Standard Supabase rate limits apply
4. **Data Retention**: Analytics data is retained according to your Supabase plan
5. **Real-time**: Webhook events are processed in real-time as they arrive

## 🔧 Integration Tips

1. **Frontend Integration**: Use Supabase client for real-time subscriptions
2. **Caching**: Cache analytics data for better performance
3. **Error Handling**: Always handle API errors gracefully
4. **Monitoring**: Set up alerts for webhook processing failures
5. **Backup**: Regularly backup analytics data for compliance 