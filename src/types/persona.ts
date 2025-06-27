export interface VoicePersona {
  id: string;
  business_id: string;
  provider: 'elevenlabs';
  config_name: string;
  config_data: {
    voice_id: string;
    persona_name: string;
    voice_settings?: {
      stability?: number;
      similarity_boost?: number;
      style?: number;
      accent?: string;
      age?: string;
      gender?: string;
    };
    created_at: string;
    is_default: boolean;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count?: number;
  last_used_at?: string;
}

export interface VideoPersona {
  id: string;
  business_id: string;
  provider: 'tavus';
  config_name: string;
  config_data: {
    replica_id: string;
    persona_id?: string;
    persona_name: string;
    train_video_url?: string;
    consent_video_url?: string;
    persona_settings?: {
      system_prompt?: string;
      context?: string;
    };
    created_at: string;
    is_default: boolean;
    status?: 'training' | 'ready' | 'failed';
    training_estimated_time?: string;
  };
  is_active: boolean;
  created_at: string;
  updated_at: string;
  usage_count?: number;
  last_used_at?: string;
}

export type Persona = VoicePersona | VideoPersona;

export interface PersonaTestResult {
  success: boolean;
  test_result: {
    audio_url?: string;
    video_id?: string;
    status?: string;
    duration?: string;
    voice_id?: string;
    model_used?: string;
    replica_id?: string;
    estimated_duration?: string;
    callback_url?: string;
  };
  persona_config: Persona;
  response_time_ms: number;
}

export interface VoiceSample {
  id: string;
  name: string;
  url: string;
  duration: number;
  size: number;
  format: string;
  uploaded_at: string;
}

export interface VideoSample {
  id: string;
  name: string;
  url: string;
  duration: number;
  size: number;
  format: string;
  uploaded_at: string;
}

export interface PersonaFormData {
  persona_name: string;
  voice_samples?: File[];
  video_samples?: File[];
  voice_settings?: {
    stability: number;
    similarity_boost: number;
    style: number;
    accent?: string;
    age?: string;
    gender?: string;
  };
  video_settings?: {
    system_prompt?: string;
    context?: string;
  };
  is_default: boolean;
}