'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Image as ImageIcon, 
  Send, 
  Paperclip, 
  X, 
  Loader2, 
  ThumbsUp, 
  ThumbsDown,
  Download,
  Package,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Grid, GridItem, Flex, Container } from '@/components/ui/grid';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ChatMessage, ChatSession, FileUpload } from '@/types/chat';
import { CallSession } from '@/types/call';
import { createChatSession, fetchChatMessages, sendChatMessage, subscribeToChatUpdates, createLocalFileUpload, uploadFile } from '@/lib/chat';
import { startVoiceCall, startVideoCall, endCall } from '@/lib/call';
import { VoiceCallInterface } from '@/components/customer/VoiceCallInterface';
import { VideoCallInterface } from '@/components/customer/VideoCallInterface';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';
import TextareaAutosize from 'react-textarea-autosize';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ChatInput } from '@/components/customer/ChatInput';

export default function CustomerChatPage() {
  const router = useRouter();
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Get current session
        const { data: { session: authSession } } = await supabase.auth.getSession();
        
        if (!authSession) {
          router.push('/auth/login');
          return;
        }
        
        // Create or get chat session
        const chatSession = await createChatSession(authSession.user.id, isDemoMode);
        setSession(chatSession);
        
        // Fetch messages
        const chatMessages = await fetchChatMessages(chatSession.id, isDemoMode);
        setMessages(chatMessages);
        
        // Subscribe to real-time updates
        const unsubscribe = subscribeToChatUpdates(chatSession.id, (newMessage) => {
          setMessages(prev => {
            // Check if message already exists
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          // If agent is typing, stop typing indicator
          if (newMessage.sender === 'agent') {
            setIsTyping(false);
          }
        }, isDemoMode);
        
        setIsLoading(false);
        
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing chat:', error);
        setError('Failed to initialize chat. Please try again.');
        setIsLoading(false);
      }
    };
    
    initializeChat();
  }, [router, isDemoMode]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() && fileUploads.length === 0) return;
    if (!session) return;
    
    setIsSending(true);
    
    try {
      // First, upload any files
      const fileUrls: string[] = [];
      
      for (const fileUpload of fileUploads) {
        if (fileUpload.status === 'pending' || fileUpload.status === 'error') {
          // Update file status
          setFileUploads(prev => 
            prev.map(f => 
              f.id === fileUpload.id 
                ? { ...f, status: 'uploading' } 
                : f
            )
          );
          
          try {
            // Upload file
            const fileUrl = await uploadFile(
              session.business_id || 'default',
              fileUpload.file,
              (progress) => {
                setFileUploads(prev => 
                  prev.map(f => 
                    f.id === fileUpload.id 
                      ? { ...f, upload_progress: progress } 
                      : f
                  )
                );
              },
              isDemoMode
            );
            
            fileUrls.push(fileUrl);
            
            // Update file status
            setFileUploads(prev => 
              prev.map(f => 
                f.id === fileUpload.id 
                  ? { ...f, status: 'success', upload_progress: 100 } 
                  : f
              )
            );
          } catch (error) {
            console.error('Error uploading file:', error);
            
            // Update file status
            setFileUploads(prev => 
              prev.map(f => 
                f.id === fileUpload.id 
                  ? { ...f, status: 'error', error: 'Failed to upload file' } 
                  : f
              )
            );
          }
        }
      }
      
      // Send message with file URLs
      const metadata = fileUrls.length > 0 
        ? { 
            file_urls: fileUrls,
            file_types: fileUploads.map(f => f.file.type),
            file_names: fileUploads.map(f => f.file.name)
          } 
        : undefined;
      
      // Add user message to state immediately for better UX
      const tempUserMessage: ChatMessage = {
        id: uuidv4(),
        session_id: session.id,
        sender: 'user',
        message: newMessage,
        message_type: 'text',
        metadata,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Show typing indicator
      setIsTyping(true);
      
      // Send message to API
      const { userMessage, agentResponse } = await sendChatMessage(
        session.id,
        newMessage,
        'user',
        'text',
        metadata,
        isDemoMode
      );
      
      // Clear input and file uploads
      setNewMessage('');
      setFileUploads([]);
      
      // If agent response was returned directly, add it to messages
      if (agentResponse) {
        setIsTyping(false);
        setMessages(prev => {
          // Replace temp message with actual message
          const filtered = prev.filter(msg => msg.id !== tempUserMessage.id);
          return [...filtered, userMessage, agentResponse];
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    // Create local file uploads
    const newUploads = Array.from(files).map(file => createLocalFileUpload(file));
    
    setFileUploads(prev => [...prev, ...newUploads]);
  };
  
  const handleRemoveFile = (id: string) => {
    setFileUploads(prev => prev.filter(f => f.id !== id));
  };
  
  const handleStartVoiceCall = async () => {
    if (!session) return;
    
    try {
      setIsCallActive(true);
      setCallType('voice');
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        session_id: session.id,
        sender: 'system',
        message: 'Voice call initiated. Connecting...',
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Start voice call
      const callSessionData = await startVoiceCall(session.id, undefined, isDemoMode);
      setCallSession(callSessionData);
      
    } catch (error) {
      console.error('Error starting voice call:', error);
      setError('Failed to start voice call. Please try again.');
      setIsCallActive(false);
      setCallType(null);
      setCallSession(null);
    }
  };
  
  const handleStartVideoCall = async () => {
    if (!session) return;
    
    try {
      setIsCallActive(true);
      setCallType('video');
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        session_id: session.id,
        sender: 'system',
        message: 'Video call initiated. Connecting...',
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Start video call
      const callSessionData = await startVideoCall(session.id, undefined, isDemoMode);
      setCallSession(callSessionData);
      
    } catch (error) {
      console.error('Error starting video call:', error);
      setError('Failed to start video call. Please try again.');
      setIsCallActive(false);
      setCallType(null);
      setCallSession(null);
    }
  };
  
  const handleEndCall = async () => {
    try {
      // End the call with the backend if we have a call session
      if (callSession) {
        await endCall(callSession.id, isDemoMode);
      }
      
      // Add system message
      if (session) {
        const systemMessage: ChatMessage = {
          id: uuidv4(),
          session_id: session.id,
          sender: 'system',
          message: `${callType === 'voice' ? 'Voice' : 'Video'} call ended.`,
          message_type: 'text',
          created_at: new Date().toISOString()
        };
        
        setMessages(prev => [...prev, systemMessage]);
      }
    } catch (error) {
      console.error('Error ending call:', error);
      // Still end the call locally even if backend call fails
    } finally {
      // Always clean up local state
      setIsCallActive(false);
      setCallType(null);
      setCallSession(null);
    }
  };
  
  const handleFeedback = (messageId: string, isPositive: boolean) => {
    // In a real implementation, we would send feedback to the API
    setShowFeedback(messageId);
    
    // Show feedback message
    setTimeout(() => {
      setShowFeedback(null);
    }, 3000);
  };
  
  const renderMessage = (message: ChatMessage) => {
    const isUser = message.sender === 'user';
    const isSystem = message.sender === 'system';
    const hasReturnDetection = Boolean(message.metadata?.return_detected);

    return (
      <div 
        key={message.id} 
        className={`flex ${isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'} mb-4`}
      >
        {isSystem ? (
          <div className="bg-gray-100 text-black rounded-lg px-4 py-2 max-w-[80%] text-sm">
            {message.message}
          </div>
        ) : (
          <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
            <div 
              className={`rounded-lg px-4 py-3 ${
                isUser 
                  ? 'bg-primary text-black' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.message}</p>
              
              {/* File attachments */}
              {message.metadata?.file_urls && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.isArray(message.metadata.file_urls) && message.metadata.file_urls.map((url: string, index: number) => {
                    const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                    const fileName = message.metadata?.file_names?.[index] || 'file';
                    return isImage ? (
                      <div 
                        key={index} 
                        className="relative w-20 h-20 rounded overflow-hidden border cursor-pointer"
                        onClick={() => {
                          setSelectedFile({
                            id: `file-${index}`,
                            file: new File([], fileName),
                            preview_url: url,
                            upload_progress: 100,
                            status: 'success'
                          });
                          setShowFilePreview(true);
                        }}
                      >
                        <img 
                          src={url} 
                          alt="Attachment" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Replace broken image with placeholder
                            e.currentTarget.src = 'https://via.placeholder.com/80x80/6B7280/FFFFFF?text=Image';
                          }}
                        />
                      </div>
                    ) : (
                      <a 
                        key={index}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-gray-100 rounded-md px-3 py-2 text-sm text-black hover:bg-gray-200"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        {fileName}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
            
            {/* Return detection indicator */}
            {!isUser && hasReturnDetection && (
              <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                <Package className="h-3 w-3 mr-1" />
                Return request detected
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3">
        <Container>
          <Grid cols={12} gap="md">
            <GridItem span={12} responsive={{ sm: 12, md: 8, lg: 8, xl: 8 }}>
              <Flex direction="row" gap="sm" align="center">
                <Link href="/" className="flex items-center space-x-3">
                  <Image
                    src="/main_logo.svg"
                    alt="Dokani"
                    width={120}
                    height={32}
                    className="h-8 w-auto dark:hidden"
                    style={{ width: 'auto' }}
                  />
                  <Image
                    src="/white_logo.svg"
                    alt="Dokani"
                    width={120}
                    height={32}
                    className="h-8 w-auto hidden dark:block"
                    style={{ width: 'auto' }}
                  />
                  <div className="ml-3">
                    <h1 className="text-lg font-semibold text-black">Customer Support</h1>
                    <p className="text-sm text-black">
                      {isCallActive 
                        ? `${callType === 'voice' ? 'Voice' : 'Video'} call in progress...` 
                        : 'Chat with our AI assistant'}
                    </p>
                  </div>
                </Link>
              </Flex>
            </GridItem>
            <GridItem span={12} responsive={{ sm: 12, md: 4, lg: 4, xl: 4 }}>
              <Flex direction="col" gap="sm" responsive={{ 
                sm: { direction: 'col' }, 
                md: { direction: 'row', justify: 'end' },
                lg: { direction: 'row', justify: 'end' },
                xl: { direction: 'row', justify: 'end' }
              }}>
                <Flex direction="row" gap="sm" align="center">
                  <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
                  <Badge variant={isDemoMode ? 'default' : 'secondary'}>{isDemoMode ? 'Demo' : 'Live'}</Badge>
                </Flex>
                <Flex direction="row" gap="sm" responsive={{ 
                  sm: { direction: 'col' }, 
                  md: { direction: 'row' },
                  lg: { direction: 'row' },
                  xl: { direction: 'row' }
                }}>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleStartVoiceCall}
                    disabled={isCallActive}
                    className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 w-full md:w-auto"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Voice Call
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={handleStartVideoCall}
                    disabled={isCallActive}
                    className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100 w-full md:w-auto"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Video Call
                  </Button>
                </Flex>
              </Flex>
            </GridItem>
          </Grid>
        </Container>
      </header>
      
      {/* Main chat area */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-4xl mx-auto h-full flex flex-col">
          {/* Error message */}
          {error && (
            <Grid cols={12} gap="sm">
              <GridItem span={12}>
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
              </GridItem>
            </Grid>
          )}
          
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-black mb-2">Welcome to Customer Support</h2>
                <p className="text-black max-w-md mb-6">
                  Our AI assistant is here to help with your return or refund requests. How can we assist you today?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center w-full"
                    onClick={() => setNewMessage("I need to return an item")}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Return an item
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center w-full"
                    onClick={() => setNewMessage("I have a question about my order")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Order question
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map(renderMessage)}
                
                {/* Typing indicator */}
                {isTyping && (
                  <div className="flex justify-start mb-4">
                    <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Anchor for scrolling to bottom */}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
          
          {/* Input area */}
          <ChatInput
            message={newMessage}
            setMessage={setNewMessage}
            onSendMessage={handleSendMessage}
            onFileUpload={handleFileUpload}
            onRemoveFile={handleRemoveFile}
            fileUploads={fileUploads}
            isSending={isSending}
          />
        </div>
      </main>
      
      {/* File preview dialog */}
      <Dialog open={showFilePreview} onOpenChange={setShowFilePreview}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>File Preview</DialogTitle>
            <DialogDescription>
              {selectedFile?.file.name}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 flex justify-center">
            {selectedFile && (
              <img 
                src={selectedFile.preview_url} 
                alt="Preview" 
                className="max-h-[60vh] max-w-full object-contain rounded-md"
                onError={(e) => {
                  // Replace broken image with placeholder
                  e.currentTarget.src = 'https://via.placeholder.com/400x300/6B7280/FFFFFF?text=Image+Not+Available';
                }}
              />
            )}
          </div>
          
          <div className="mt-4 flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowFilePreview(false)}>
              Close
            </Button>
            <Button 
              onClick={() => {
                if (selectedFile) {
                  const a = document.createElement('a');
                  a.href = selectedFile.preview_url;
                  a.download = selectedFile.file.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Call interfaces */}
      {isCallActive && callSession && (
        <>
          {callType === 'voice' ? (
            <VoiceCallInterface 
              callSession={callSession}
              isDemoMode={isDemoMode}
              onEndCall={handleEndCall}
              onError={setError}
            />
          ) : callType === 'video' ? (
            <VideoCallInterface 
              callSession={callSession}
              isDemoMode={isDemoMode}
              onEndCall={handleEndCall}
              onError={setError}
            />
          ) : null}
        </>
      )}
    </div>
  );
}