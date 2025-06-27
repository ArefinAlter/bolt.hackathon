'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle } from 'lucide-react';
import { ChatHeader } from '@/components/customer/ChatHeader';
import { ChatContainer } from '@/components/customer/ChatContainer';
import { CallInterface } from '@/components/customer/CallInterface';
import { ChatMessage, ChatSession } from '@/types/chat';
import { createChatSession, fetchChatMessages, startVoiceCall, startVideoCall } from '@/lib/chat';
import { supabase } from '@/lib/supabase';

export default function CustomerChatPage() {
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userName, setUserName] = useState('User');
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get current session
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (!authSession) {
          router.push('/auth/login');
          return;
        }
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name')
          .eq('id', authSession.user.id)
          .single();
        
        if (profile) {
          setUserName(profile.business_name);
        } else {
          setUserName(authSession.user.email?.split('@')[0] || 'User');
        }
        
        // Create or get chat session
        const chatSession = await createChatSession(authSession.user.id);
        setSession(chatSession);
        
        // Fetch messages
        const chatMessages = await fetchChatMessages(chatSession.id);
        setMessages(chatMessages);
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to initialize chat. Please try again.');
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [router]);
  
  const handleStartVoiceCall = async () => {
    if (!session) return;
    
    try {
      setIsCallActive(true);
      setCallType('voice');
      
      // Start voice call
      await startVoiceCall(session.id);
    } catch (error) {
      console.error('Error starting voice call:', error);
      setError('Failed to start voice call. Please try again.');
      setIsCallActive(false);
      setCallType(null);
    }
  };
  
  const handleStartVideoCall = async () => {
    if (!session) return;
    
    try {
      setIsCallActive(true);
      setCallType('video');
      
      // Start video call
      await startVideoCall(session.id);
    } catch (error) {
      console.error('Error starting video call:', error);
      setError('Failed to start video call. Please try again.');
      setIsCallActive(false);
      setCallType(null);
    }
  };
  
  const handleEndCall = () => {
    setIsCallActive(false);
    setCallType(null);
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Session Error</h2>
          <p className="text-gray-600 mb-4">
            {error || 'Failed to initialize chat session. Please try again.'}
          </p>
          <button 
            className="px-4 py-2 bg-primary text-black rounded-md hover:bg-primary/90"
            onClick={() => router.refresh()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <ChatHeader 
        userName={userName}
        onStartVoiceCall={handleStartVoiceCall}
        onStartVideoCall={handleStartVideoCall}
        isCallActive={isCallActive}
      />
      
      {/* Main chat area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md m-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                  <button 
                    className="text-sm text-red-700 underline"
                    onClick={() => setError(null)}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Chat container */}
          <ChatContainer 
            initialMessages={messages}
            session={session}
            onError={setError}
          />
        </div>
      </main>
      
      {/* Call interface */}
      {isCallActive && callType && (
        <CallInterface 
          callType={callType}
          onEndCall={handleEndCall}
        />
      )}
    </div>
  );
}