-- ElevenLabs Analytics Setup for Live Mode
-- This script adds missing tables and updates for full ElevenLabs integration

-- 1. Add ElevenLabs specific analytics table
CREATE TABLE IF NOT EXISTS public.elevenlabs_analytics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  conversation_id text NOT NULL,
  agent_id text NOT NULL,
  call_session_id uuid,
  metrics jsonb NOT NULL DEFAULT '{}'::jsonb,
  transcript_summary text,
  call_successful text,
  satisfaction_score numeric CHECK (satisfaction_score >= 0 AND satisfaction_score <= 5),
  duration_seconds integer,
  messages_count integer DEFAULT 0,
  average_response_time numeric,
  escalation_rate numeric,
  success_rate numeric,
  analysis_results jsonb DEFAULT '{}'::jsonb,
  webhook_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elevenlabs_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT elevenlabs_analytics_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.profiles(business_id),
  CONSTRAINT elevenlabs_analytics_call_session_id_fkey FOREIGN KEY (call_session_id) REFERENCES public.call_sessions(id)
);

-- 2. Add ElevenLabs conversation tracking
CREATE TABLE IF NOT EXISTS public.elevenlabs_conversations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  conversation_id text NOT NULL UNIQUE,
  agent_id text NOT NULL,
  call_session_id uuid,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended', 'failed')),
  conversation_data jsonb DEFAULT '{}'::jsonb,
  dynamic_variables jsonb DEFAULT '{}'::jsonb,
  conversation_config jsonb DEFAULT '{}'::jsonb,
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elevenlabs_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT elevenlabs_conversations_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.profiles(business_id),
  CONSTRAINT elevenlabs_conversations_call_session_id_fkey FOREIGN KEY (call_session_id) REFERENCES public.call_sessions(id)
);

-- 3. Add ElevenLabs webhook events tracking
CREATE TABLE IF NOT EXISTS public.elevenlabs_webhook_events (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  event_type text NOT NULL,
  event_timestamp bigint NOT NULL,
  conversation_id text,
  agent_id text,
  payload jsonb NOT NULL,
  processed boolean DEFAULT false,
  processing_error text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elevenlabs_webhook_events_pkey PRIMARY KEY (id),
  CONSTRAINT elevenlabs_webhook_events_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.profiles(business_id)
);

-- 4. Add ElevenLabs agent configurations
CREATE TABLE IF NOT EXISTS public.elevenlabs_agents (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  business_id uuid NOT NULL,
  agent_id text NOT NULL UNIQUE,
  agent_name text NOT NULL,
  agent_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  voice_id text,
  language text DEFAULT 'en',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT elevenlabs_agents_pkey PRIMARY KEY (id),
  CONSTRAINT elevenlabs_agents_business_id_fkey FOREIGN KEY (business_id) REFERENCES public.profiles(business_id)
);

-- 5. Update business_analytics to include elevenlabs_analytics metric type
ALTER TABLE public.business_analytics 
DROP CONSTRAINT IF EXISTS business_analytics_metric_type_check;

ALTER TABLE public.business_analytics 
ADD CONSTRAINT business_analytics_metric_type_check 
CHECK (metric_type = ANY (ARRAY['returns'::text, 'ai_accuracy'::text, 'satisfaction'::text, 'policy'::text, 'personas'::text, 'elevenlabs_analytics'::text]));

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_elevenlabs_analytics_business_id ON public.elevenlabs_analytics(business_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_analytics_conversation_id ON public.elevenlabs_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_analytics_created_at ON public.elevenlabs_analytics(created_at);

CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_business_id ON public.elevenlabs_conversations(business_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_conversation_id ON public.elevenlabs_conversations(conversation_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_conversations_status ON public.elevenlabs_conversations(status);

CREATE INDEX IF NOT EXISTS idx_elevenlabs_webhook_events_business_id ON public.elevenlabs_webhook_events(business_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_webhook_events_event_type ON public.elevenlabs_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_webhook_events_created_at ON public.elevenlabs_webhook_events(created_at);

CREATE INDEX IF NOT EXISTS idx_elevenlabs_agents_business_id ON public.elevenlabs_agents(business_id);
CREATE INDEX IF NOT EXISTS idx_elevenlabs_agents_agent_id ON public.elevenlabs_agents(agent_id);

-- 7. Add RLS policies for new tables
ALTER TABLE public.elevenlabs_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elevenlabs_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elevenlabs_webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.elevenlabs_agents ENABLE ROW LEVEL SECURITY;

-- ElevenLabs Analytics RLS Policies
CREATE POLICY "Users can view their business elevenlabs analytics" ON public.elevenlabs_analytics
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their business elevenlabs analytics" ON public.elevenlabs_analytics
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ElevenLabs Conversations RLS Policies
CREATE POLICY "Users can view their business elevenlabs conversations" ON public.elevenlabs_conversations
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their business elevenlabs conversations" ON public.elevenlabs_conversations
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their business elevenlabs conversations" ON public.elevenlabs_conversations
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ElevenLabs Webhook Events RLS Policies
CREATE POLICY "Users can view their business webhook events" ON public.elevenlabs_webhook_events
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their business webhook events" ON public.elevenlabs_webhook_events
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- ElevenLabs Agents RLS Policies
CREATE POLICY "Users can view their business elevenlabs agents" ON public.elevenlabs_agents
  FOR SELECT USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their business elevenlabs agents" ON public.elevenlabs_agents
  FOR INSERT WITH CHECK (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their business elevenlabs agents" ON public.elevenlabs_agents
  FOR UPDATE USING (
    business_id IN (
      SELECT business_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 8. Add triggers for automatic updates
CREATE OR REPLACE FUNCTION update_elevenlabs_conversations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_elevenlabs_conversations_updated_at
  BEFORE UPDATE ON public.elevenlabs_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_elevenlabs_conversations_updated_at();

CREATE OR REPLACE FUNCTION update_elevenlabs_agents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_elevenlabs_agents_updated_at
  BEFORE UPDATE ON public.elevenlabs_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_elevenlabs_agents_updated_at();

-- 9. Add function to aggregate ElevenLabs analytics
CREATE OR REPLACE FUNCTION get_elevenlabs_analytics_summary(
  p_business_id uuid,
  p_start_date timestamp with time zone DEFAULT now() - interval '30 days',
  p_end_date timestamp with time zone DEFAULT now()
)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_build_object(
    'conversations_count', COUNT(DISTINCT conversation_id),
    'messages_count', COALESCE(SUM(messages_count), 0),
    'average_response_time', COALESCE(AVG(average_response_time), 0),
    'satisfaction_score', COALESCE(AVG(satisfaction_score), 0),
    'escalation_rate', COALESCE(AVG(escalation_rate), 0),
    'total_duration_minutes', COALESCE(SUM(duration_seconds) / 60.0, 0),
    'average_call_duration', COALESCE(AVG(duration_seconds) / 60.0, 0),
    'success_rate', COALESCE(AVG(success_rate), 0)
  ) INTO result
  FROM public.elevenlabs_analytics
  WHERE business_id = p_business_id
    AND created_at BETWEEN p_start_date AND p_end_date;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.elevenlabs_analytics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.elevenlabs_conversations TO authenticated;
GRANT SELECT, INSERT ON public.elevenlabs_webhook_events TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.elevenlabs_agents TO authenticated;

-- Grant execute permission on the analytics function
GRANT EXECUTE ON FUNCTION get_elevenlabs_analytics_summary(uuid, timestamp with time zone, timestamp with time zone) TO authenticated; 