"use client";

import { useState, useEffect } from 'react';
import { 
  Video, 
  PhoneOff, 
  Loader2,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CallSession } from '@/types/call';
import { endCall } from '@/lib/call';

interface VideoCallInterfaceProps {
  callSession: CallSession;
  onEndCall: () => void;
  onError: (error: string) => void;
  isDemoMode?: boolean;
}

export function VideoCallInterface({ 
  callSession, 
  onEndCall,
  onError,
  isDemoMode = false
}: VideoCallInterfaceProps) {
  const [isConnecting, setIsConnecting] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [tavusUrl, setTavusUrl] = useState<string | null>(null);
  
  // Start call timer
  useEffect(() => {
    const interval = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);
  
  // Initialize Tavus conversation
  useEffect(() => {
    const initializeTavusCall = async () => {
      try {
        // Get the Tavus conversation URL
        const conversationUrl = callSession.conversation_url || callSession.session_url;
        if (!conversationUrl) {
          onError('No video conversation URL available');
          return;
        }
        setTavusUrl(conversationUrl);
        setIsConnecting(false);
        // Open Tavus CVI in a new window/tab
        const tavusWindow = window.open(
          conversationUrl, 
          'tavus_conversation', 
          'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
        if (!tavusWindow) {
          onError('Popup blocked. Please click the "Open Conversation" button below.');
        }
      } catch (error) {
        onError('Failed to initialize video conversation');
      }
    };
    initializeTavusCall();
  }, [callSession.conversation_url, callSession.session_url, onError]);
  
  // Handle end call
  const handleEndCall = async () => {
    try {
      await endCall(callSession.id);
      onEndCall();
    } catch (error) {
      onError('Failed to end call properly');
      onEndCall();
    }
  };
  
  // Format call duration
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
  };
  
  // Open Tavus conversation manually
  const openTavusConversation = () => {
    if (tavusUrl) {
      window.open(tavusUrl, '_blank', 'width=1200,height=800');
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
        <div className="text-center">
          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Video Conversation
            </h2>
            <p className="text-gray-600">
              Your AI conversation is ready to begin
            </p>
          </div>
          {/* Loading State */}
          {isConnecting ? (
            <div className="flex flex-col items-center space-y-4 mb-6">
              <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
              <p className="text-gray-600">Initializing Tavus conversation...</p>
            </div>
          ) : (
            <div className="mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <div className="flex items-center justify-center mb-4">
                  <Video className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Tavus CVI Conversation
                </h3>
                <p className="text-gray-600 mb-4">
                  Your AI conversation should have opened in a new window. 
                  If it didn't open automatically, click the button below.
                </p>
                <p className="text-sm text-blue-600 mb-4">
                  💡 <strong>Note:</strong> Tavus CVI provides a complete video conversation interface 
                  with its own controls, camera access, and conversation flow.
                </p>
                <Button 
                  onClick={openTavusConversation}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  Open Tavus Conversation
                </Button>
              </div>
            </div>
          )}
          {/* Call Info */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Call Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Call Type:</span>
                <span className="font-medium">Video (Tavus CVI)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status:</span>
                <span className="font-medium">{isConnecting ? 'Connecting' : 'Active'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration:</span>
                <span className="font-medium">{formatDuration(callDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Provider:</span>
                <span className="font-medium">Tavus</span>
              </div>
            </div>
          </div>
          {/* Call Controls */}
          <div className="flex justify-center space-x-4">
            <Button 
              variant="outline" 
              onClick={openTavusConversation}
              className="flex items-center"
            >
              <ExternalLink className="h-5 w-5 mr-2" />
              Open Conversation
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleEndCall}
              className="flex items-center"
            >
              <PhoneOff className="h-5 w-5 mr-2" />
              End Call
            </Button>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            <p>
              💡 <strong>How it works:</strong> Tavus CVI opens in a new window and handles the entire 
              video conversation interface. You can interact with the AI directly in that window.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}