import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { ChatMessage, ChatSession, FileUpload } from '@/types/chat';

// Create a new chat session
export async function createChatSession(userId: string): Promise<ChatSession> {
  try {
    // Call the create-chat-session function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-chat-session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_id: userId,
        session_name: 'Customer Support',
        chat_mode: 'normal',
        session_type: 'test_mode'
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create chat session');
    }
    
    const data = await response.json();
    return {
      id: data.session_id,
      user_id: userId,
      business_id: data.business_id || '',
      session_name: 'Customer Support',
      chat_mode: data.chat_mode || 'normal',
      session_type: 'test_mode',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      customer_email: data.customer_email || ''
    };
  } catch (error) {
    console.error('Error creating chat session:', error);
    throw error;
  }
}

// Fetch chat messages for a session
export async function fetchChatMessages(sessionId: string): Promise<ChatMessage[]> {
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });
    
    if (error) {
      throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    throw error;
  }
}

// Send a chat message
export async function sendChatMessage(
  sessionId: string,
  message: string,
  sender: 'user' | 'agent' | 'system' = 'user',
  messageType: 'text' | 'image' | 'file' | 'audio' | 'video' = 'text',
  metadata?: Record<string, any>
): Promise<{ userMessage: ChatMessage; agentResponse?: ChatMessage }> {
  try {
    // Call the send-chat-message function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-chat-message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        session_id: sessionId,
        message,
        sender,
        message_type: messageType,
        metadata
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to send message');
    }
    
    const data = await response.json();
    
    return {
      userMessage: data.user_message,
      agentResponse: data.agent_response
    };
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

// Subscribe to real-time chat updates
export function subscribeToChatUpdates(
  sessionId: string,
  onNewMessage: (message: ChatMessage) => void
) {
  const channel = supabase
    .channel(`chat_${sessionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        onNewMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}

// Upload a file for evidence
export async function uploadFile(
  businessId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    // Convert file to base64
    const base64 = await fileToBase64(file);
    
    // Call the upload-file function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    // Simulate progress updates
    if (onProgress) {
      const interval = setInterval(() => {
        const progress = Math.random() * 30 + 10;
        onProgress(Math.min(progress, 90));
      }, 300);
      
      // Clear interval after 2 seconds
      setTimeout(() => {
        clearInterval(interval);
      }, 2000);
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-file`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        file_type: 'evidence_photo',
        file_name: file.name,
        file_data: base64,
        file_metadata: {
          size: file.size,
          type: file.type,
          last_modified: file.lastModified
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to upload file');
    }
    
    if (onProgress) {
      onProgress(100);
    }
    
    const data = await response.json();
    return data.file_url;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
}

// Create a local file upload object
export function createLocalFileUpload(file: File): FileUpload {
  return {
    id: uuidv4(),
    file,
    preview_url: URL.createObjectURL(file),
    upload_progress: 0,
    status: 'pending'
  };
}

// Convert file to base64
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // Remove the data URL prefix (e.g., "data:image/png;base64,")
      const base64Data = base64.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}

// Start a voice call
export async function startVoiceCall(chatSessionId: string): Promise<{ callSessionId: string; websocketUrl: string }> {
  try {
    // Call the initiate-call function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/initiate-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_session_id: chatSessionId,
        call_type: 'voice',
        provider: 'elevenlabs',
        enable_streaming: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start voice call');
    }
    
    const data = await response.json();
    return {
      callSessionId: data.call_session_id,
      websocketUrl: data.websocket_url
    };
  } catch (error) {
    console.error('Error starting voice call:', error);
    throw error;
  }
}

// Start a video call
export async function startVideoCall(chatSessionId: string): Promise<{ callSessionId: string; websocketUrl: string }> {
  try {
    // Call the initiate-call function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/initiate-call`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        chat_session_id: chatSessionId,
        call_type: 'video',
        provider: 'tavus',
        enable_streaming: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to start video call');
    }
    
    const data = await response.json();
    return {
      callSessionId: data.call_session_id,
      websocketUrl: data.websocket_url
    };
  } catch (error) {
    console.error('Error starting video call:', error);
    throw error;
  }
}