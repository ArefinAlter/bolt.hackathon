# Live Mode Test Guide

## Quick Test Steps

Since you already have a comprehensive database schema, let's test if live mode works:

### 1. Deploy the Updated Functions
```bash
supabase functions deploy create-chat-session
supabase functions deploy send-chat-message
supabase functions deploy customer-service-agent
supabase functions deploy agent-config
```

### 2. Test Live Mode
1. Go to your app
2. Sign up/login (this should create a profile automatically)
3. Toggle OFF demo mode
4. Try to create a chat session
5. Send a message

### 3. Check for Errors
If you get errors, check:

#### Browser Console
- Look for specific error messages
- Check network requests to see which API calls are failing

#### Supabase Function Logs
```bash
supabase functions logs create-chat-session --follow
supabase functions logs send-chat-message --follow
```

### 4. Common Issues & Fixes

#### "Profile not found" Error
Your schema has a trigger that should create profiles automatically. If it's not working:

```sql
-- Manually create a profile for testing
INSERT INTO profiles (id, business_name, business_id, subscription_plan, onboarded)
VALUES ('your-user-id', 'Test Business', '123e4567-e89b-12d3-a456-426614174000', 'free', false);
```

#### "Chat session not found" Error
Check if the chat_sessions table exists and has the right structure:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'chat_sessions';
```

#### RLS Policy Issues
Your schema should have RLS policies. If not, run:

```sql
-- Enable RLS on chat_sessions
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for users to access their own sessions
CREATE POLICY "Users can view own chat sessions" ON chat_sessions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions" ON chat_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 5. Expected Behavior

#### Successful Live Mode
- Chat sessions are created in the database
- Messages are stored in chat_messages table
- AI responses are generated using OpenAI
- Return requests are created in return_requests table
- All data persists between sessions

#### Demo Mode (for comparison)
- Uses mock data
- No database writes
- Still uses real AI responses
- Good for testing without affecting database

### 6. Database Tables Used in Live Mode

- `profiles` - User profiles and business info
- `chat_sessions` - Chat session metadata
- `chat_messages` - Individual chat messages
- `return_requests` - Return request data
- `mock_orders` - Demo order data (for testing)

### 7. Troubleshooting Commands

```bash
# Check if functions are deployed
supabase functions list

# View function logs
supabase functions logs create-chat-session
supabase functions logs send-chat-message

# Redeploy if needed
supabase functions deploy create-chat-session
supabase functions deploy send-chat-message
```

### 8. Test Data

If you need test data:

```sql
-- Insert a test order
INSERT INTO mock_orders (order_id, purchase_date, customer_email, product_name, product_category)
VALUES ('ORDER-12345', NOW(), 'test@example.com', 'Test Product', 'Electronics');
```

## Success Indicators

✅ Live mode works if:
- Chat sessions are created without errors
- Messages are sent and received
- AI responses are generated
- Data persists in the database
- No "failed to initialize chat" errors

❌ Still broken if:
- "Failed to initialize chat" error persists
- Database errors in function logs
- Authentication issues
- RLS policy violations 