export interface UserProfile {
  id: string;
  business_name: string;
  website?: string;
  subscription_plan: string;
  onboarded: boolean;
  business_id: string;
  created_at: string;
}

export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  auto_escalate: boolean;
  voice_enabled: boolean;
  video_enabled: boolean;
  auto_transcript: boolean;
  call_history_enabled: boolean;
  preferred_chat_mode: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce';
  accessibility?: {
    high_contrast?: boolean;
    large_text?: boolean;
    screen_reader_optimized?: boolean;
  };
  keyboard_shortcuts_enabled?: boolean;
  data_saving_mode?: boolean;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
  } | null;
  profile?: UserProfile;
  preferences?: UserPreferences;
  isLoading: boolean;
  error: Error | null;
}