# Live Mode Setup Guide

## Overview
Live mode requires proper database setup and edge function deployment. The "failed to initialize chat" error occurs when the database tables don't exist or the user profile isn't set up.

## Quick Setup Steps

### 1. Set Up Database Tables
Run the SQL script in your Supabase SQL Editor:

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `database_setup.sql`
4. Click "Run" to execute

This will create:
- `profiles` table (for user profiles)
- `chat_sessions` table (for chat sessions)
- `chat_messages` table (for chat messages)
- `call_sessions` table (for voice/video calls)
- `call_transcripts` table (for call transcripts)
- Row Level Security (RLS) policies
- Automatic profile creation trigger

### 2. Deploy Required Edge Functions
Deploy these edge functions to Supabase:

```bash
# Deploy core functions
supabase functions deploy create-chat-session
supabase functions deploy send-chat-message
supabase functions deploy customer-service-agent
supabase functions deploy agent-config

# Deploy voice call functions
supabase functions deploy process-voice-input
supabase functions deploy initiate-call
supabase functions deploy call-mcp-server

# Deploy supporting functions
supabase functions deploy create-profile
supabase functions deploy get-user-preferences
supabase functions deploy update-user-preferences
```

### 3. Set Environment Variables
Make sure these are set in your Supabase Dashboard > Settings > Edge Functions:

```
OPENAI_API_KEY=your_openai_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_AGENT_ID=your_elevenlabs_agent_id
TAVUS_API_KEY=your_tavus_api_key
TAVUS_REPLICA_ID=your_tavus_replica_id
```

### 4. Test Live Mode
1. Sign up/login to your app
2. Toggle off demo mode
3. Try creating a chat session
4. Send a message

## Troubleshooting

### "Profile not found" Error
- The database setup should automatically create profiles for new users
- If you're still getting this error, manually create a profile:

```sql
INSERT INTO profiles (id, email, business_id, role)
VALUES ('your-user-id', 'your-email', '123e4567-e89b-12d3-a456-426614174000', 'customer');
```

### "Chat session not found" Error
- Make sure the `chat_sessions` table exists
- Check that RLS policies are properly set up
- Verify the user has permission to access the session

### "Failed to initialize chat" Error
- Check browser console for specific error messages
- Verify all edge functions are deployed
- Check Supabase function logs for errors

### Authentication Issues
- Make sure you're logged in
- Check that the auth token is valid
- Verify RLS policies allow the user to access their data

## Database Schema Overview

### Profiles Table
- Stores user information and business association
- Automatically created when user signs up
- Links to auth.users table

### Chat Sessions Table
- Stores chat session metadata
- Links to user and business
- Tracks session status and type

### Chat Messages Table
- Stores individual chat messages
- Links to chat sessions
- Supports different message types (text, image, file, audio, video)

### Call Sessions Table
- Stores voice/video call metadata
- Links to chat sessions
- Tracks call status and provider information

## Security Features

- Row Level Security (RLS) enabled on all tables
- Users can only access their own data
- Automatic profile creation for new users
- Secure API key storage in Supabase secrets

## Demo Mode vs Live Mode

### Demo Mode
- Uses mock data
- No database required
- Real AI responses via OpenAI
- Real audio processing via ElevenLabs
- Good for testing and demos

### Live Mode
- Uses real database
- Stores all chat history
- Real AI responses via OpenAI
- Real audio processing via ElevenLabs
- Full functionality with persistence

## Next Steps

After setting up live mode:
1. Test chat functionality
2. Test voice calls
3. Test video calls
4. Monitor function logs for any issues
5. Set up monitoring and analytics 