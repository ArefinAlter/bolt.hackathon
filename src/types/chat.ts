export interface ChatMessage {
  id: string;
  session_id: string;
  sender: 'user' | 'agent' | 'system';
  message: string;
  message_type: 'text' | 'image' | 'file' | 'audio' | 'video';
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  user_id: string;
  business_id: string;
  session_name: string;
  chat_mode: 'normal' | 'messenger' | 'whatsapp' | 'shopify' | 'woocommerce';
  session_type: 'test_mode' | 'live_support';
  is_active: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  customer_email: string;
}

export interface FileUpload {
  id: string;
  file: File;
  preview_url: string;
  upload_progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface ChatState {
  messages: ChatMessage[];
  session: ChatSession | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
  fileUploads: FileUpload[];
}

export interface ReturnDetection {
  orderId: string;
  reason: string;
  confidence: number;
}