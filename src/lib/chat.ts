import { v4 as uuidv4 } from 'uuid';
import { supabase } from './supabase';
import { ChatMessage, ChatSession, FileUpload } from '@/types/chat';

// Create a new chat session
export async function createChatSession(userId: string, demoMode = false): Promise<ChatSession> {
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
        session_type: 'test_mode',
        demo_mode: demoMode
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create chat session');
    }
    
    const data = await response.json();
    
    // Handle demo mode response
    if (data.demo_mode) {
      return {
        id: data.data.id,
        user_id: userId,
        business_id: data.data.business_id || '',
        session_name: 'Customer Support',
        chat_mode: data.data.chat_mode || 'normal',
        session_type: 'test_mode',
        is_active: true,
        created_at: data.data.created_at,
        updated_at: data.data.updated_at,
        customer_email: data.data.customer_email || ''
      };
    }
    
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
export async function fetchChatMessages(sessionId: string, demoMode = false): Promise<ChatMessage[]> {
  try {
    // If in demo mode, return mock messages
    if (demoMode) {
      const mockMessages: ChatMessage[] = [
        {
          id: 'demo-msg-1',
          session_id: sessionId,
          sender: 'system',
          message: 'Welcome to Dokani AI Customer Support! How can I help you today?',
          message_type: 'text',
          created_at: new Date(Date.now() - 60000).toISOString()
        },
        {
          id: 'demo-msg-2',
          session_id: sessionId,
          sender: 'user',
          message: 'Hi, I need help with a return request',
          message_type: 'text',
          created_at: new Date(Date.now() - 30000).toISOString()
        },
        {
          id: 'demo-msg-3',
          session_id: sessionId,
          sender: 'agent',
          message: 'Hello! I\'d be happy to help you with your return request. Could you please provide your order ID and the reason for the return?',
          message_type: 'text',
          created_at: new Date(Date.now() - 15000).toISOString()
        }
      ];
      return mockMessages;
    }

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
  metadata?: Record<string, any>,
  demoMode = false
): Promise<{ userMessage: ChatMessage; agentResponse?: ChatMessage }> {
  try {
    // Call the send-chat-message function (even in demo mode to use real AI)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session - please log in again');
    }
    
    console.log('Sending chat message:', {
      sessionId,
      message: message.substring(0, 50) + '...',
      sender,
      messageType,
      hasMetadata: !!metadata,
      demoMode
    });
    
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
        metadata,
        demo_mode: demoMode
      })
    });
    
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('Chat API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Provide more specific error messages
      if (response.status === 401) {
        throw new Error('Authentication failed - please log in again');
      } else if (response.status === 404) {
        throw new Error('Chat session not found - please refresh the page');
      } else if (response.status === 500) {
        throw new Error('Server error - please try again in a moment');
      } else {
        throw new Error(errorData.error || `Failed to send message (${response.status})`);
      }
    }
    
    const data = await response.json();
    console.log('Chat message sent successfully:', data);
    
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
  onNewMessage: (message: ChatMessage) => void,
  demoMode = false
) {
  // If in demo mode, return a no-op function since we don't need real-time updates
  if (demoMode) {
    return () => {};
  }

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