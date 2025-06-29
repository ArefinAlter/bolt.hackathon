import { serve } from "https://deno.land/std@0.220.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { business_id, persona_name, voice_samples, voice_settings, system_prompt, knowledge_base } = await req.json()

    // Validate required fields
    if (!business_id || !persona_name) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: business_id and persona_name' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Step 1: Create voice using ElevenLabs Voice API
    const voiceResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: persona_name,
        files: voice_samples, // Array of base64 encoded audio files
        description: `Voice persona for ${persona_name}`,
        labels: {
          accent: voice_settings?.accent || 'neutral',
          age: voice_settings?.age || 'adult',
          gender: voice_settings?.gender || 'neutral'
        }
      })
    })

    if (!voiceResponse.ok) {
      const errorData = await voiceResponse.json()
      throw new Error(`ElevenLabs Voice API error: ${errorData.detail || voiceResponse.statusText}`)
    }

    const voiceData = await voiceResponse.json()

    // Step 2: Create or Update Conversational AI Agent
    const agentResponse = await fetch(`https://api.elevenlabs.io/v1/agents/${Deno.env.get('ELEVENLABS_CONVERSATIONAL_AGENT_ID') || 'agent_01jyy0m7raf6p9gmw9cvhzvm2f'}`, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'xi-api-key': Deno.env.get('ELEVENLABS_API_KEY') || '',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: `${persona_name} Agent`,
        description: `Conversational AI agent for ${persona_name}`,
        first_message: `Hello! I'm ${persona_name}, your customer service assistant. How can I help you today?`,
        system_prompt: system_prompt || `You are ${persona_name}, a friendly and efficient customer service agent for Dokani, an e-commerce platform. Your role is to assist customers with returns, refunds, and general inquiries.

Tasks:
- Answer customer questions about returns and refunds
- Process return requests when customers provide order numbers
- Handle common issues like damaged items, wrong sizes, etc.
- Escalate complex cases when needed
- Check policy compliance using the integrated policy system

Guidelines:
- Keep responses concise (1-2 sentences) for voice calls
- Be warm, professional, and empathetic
- Ask for order numbers when processing returns
- Confirm understanding before taking actions
- Use natural conversation flow
- When policy questions arise, use the policy check system

Integration:
- You have access to the Dokani policy system
- You can trigger policy checks for return requests
- You can escalate to human agents when needed
- You can access customer history and preferences`,
        voice_id: voiceData.voice_id,
        knowledge_base: knowledge_base || [],
        webhook_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/handle-call-webhook`,
        webhook_events: ['conversation_started', 'conversation_ended', 'message_received', 'message_sent', 'agent_response_generated']
      })
    })

    if (!agentResponse.ok) {
      const errorData = await agentResponse.json()
      throw new Error(`ElevenLabs Agent API error: ${errorData.detail || agentResponse.statusText}`)
    }

    const agentData = await agentResponse.json()

    // Store persona configuration in provider_configs
    const { data: personaConfig, error: configError } = await supabaseClient
      .from('provider_configs')
      .insert([
        {
          business_id,
          provider: 'elevenlabs',
          config_name: `voice_persona_${persona_name.toLowerCase().replace(/\s+/g, '_')}`,
          config_data: {
            voice_id: voiceData.voice_id,
            agent_id: agentData.agent_id,
            persona_name,
            voice_settings,
            system_prompt: system_prompt || '',
            knowledge_base: knowledge_base || [],
            created_at: new Date().toISOString(),
            is_default: false
          },
          is_active: true
        }
      ])
      .select()
      .single()

    if (configError) {
      throw configError
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        voice_id: voiceData.voice_id,
        agent_id: agentData.agent_id,
        persona_config: personaConfig,
        message: 'Voice persona and Conversational AI agent created successfully'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-voice-persona:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
}) 