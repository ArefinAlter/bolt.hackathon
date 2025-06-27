-- Fix Security Definer Views
-- This migration recreates views that were flagged by Supabase security advisor
-- to remove the SECURITY DEFINER property and ensure proper RLS enforcement

-- Drop existing views if they exist
DROP VIEW IF EXISTS public.real_time_conversation_flow;
DROP VIEW IF EXISTS public.streaming_session_analytics;

-- Recreate real_time_conversation_flow view without SECURITY DEFINER
CREATE VIEW public.real_time_conversation_flow AS
SELECT 
    cs.id as session_id,
    cs.business_id,
    cs.customer_email,
    cs.channel,
    cs.status,
    cs.current_intent,
    cs.escalation_level,
    cs.ai_agent_type,
    cs.duration,
    cs.created_at,
    cs.updated_at,
    -- Add conversation metrics
    COUNT(cm.id) as message_count,
    MAX(cm.timestamp) as last_message_at,
    -- Add participant info
    cs.participants,
    -- Add conversation history summary
    cs.conversation_history
FROM public.conversation_sessions cs
LEFT JOIN public.conversation_messages cm ON cs.id = cm.session_id
WHERE cs.status = 'active'
GROUP BY cs.id, cs.business_id, cs.customer_email, cs.channel, cs.status, 
         cs.current_intent, cs.escalation_level, cs.ai_agent_type, cs.duration,
         cs.created_at, cs.updated_at, cs.participants, cs.conversation_history;

-- Recreate streaming_session_analytics view without SECURITY DEFINER
CREATE VIEW public.streaming_session_analytics AS
SELECT 
    ss.id as session_id,
    ss.call_session_id,
    ss.session_type,
    ss.status,
    ss.participant_count,
    ss.stream_quality,
    ss.created_at,
    ss.updated_at,
    ss.ended_at,
    -- Add call session info
    cs.call_type,
    cs.provider,
    cs.duration_seconds,
    cs.call_quality_score,
    -- Add performance metrics
    ss.performance_metrics,
    -- Add real-time events count
    jsonb_array_length(ss.real_time_events) as event_count,
    -- Calculate session duration
    EXTRACT(EPOCH FROM (COALESCE(ss.ended_at, NOW()) - ss.created_at)) as session_duration_seconds
FROM public.streaming_sessions ss
LEFT JOIN public.call_sessions cs ON ss.call_session_id = cs.id
WHERE ss.status IN ('active', 'ended');

-- Enable RLS on the views (if needed)
ALTER VIEW public.real_time_conversation_flow SET (security_invoker = true);
ALTER VIEW public.streaming_session_analytics SET (security_invoker = true);

-- Add comments for documentation
COMMENT ON VIEW public.real_time_conversation_flow IS 'View for real-time conversation flow analytics without SECURITY DEFINER';
COMMENT ON VIEW public.streaming_session_analytics IS 'View for streaming session analytics without SECURITY DEFINER'; 