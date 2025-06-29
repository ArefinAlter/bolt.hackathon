'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Package, 
  ArrowUpRight,
  Send,
  Search,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  AlertTriangle,
  Paperclip,
  Image as ImageIcon,
  X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ReturnRequest } from '@/types/return';
import { ChatMessage, ChatSession, FileUpload } from '@/types/chat';
import { CallSession } from '@/types/call';
import { supabase } from '@/lib/supabase';
import { createChatSession, fetchChatMessages, sendChatMessage, subscribeToChatUpdates, createLocalFileUpload, uploadFile } from '@/lib/chat';
import { startVoiceCall, startVideoCall } from '@/lib/call';
import { VoiceCallInterface } from '@/components/customer/VoiceCallInterface';
import { VideoCallInterface } from '@/components/customer/VideoCallInterface';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import TextareaAutosize from 'react-textarea-autosize';

export default function ReturnPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  
  // Chat state
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<FileUpload | null>(null);
  
  // Call state
  const [isCallActive, setIsCallActive] = useState(false);
  const [callType, setCallType] = useState<'voice' | 'video' | null>(null);
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initializePage = async () => {
      try {
        // Check if user has selected a role
        const userRole = localStorage.getItem('userRole');
        
        if (!userRole) {
          router.push('/dashboard/role-selection');
          return;
        } else if (userRole !== 'customer') {
          router.push('/dashboard');
          return;
        }
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Fetch user's return requests
        const { data: requests, error } = await supabase
          .from('return_requests')
          .select('*')
          .eq('customer_email', session.user.email)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Error fetching return requests:', error);
        } else {
          setReturnRequests(requests || []);
        }
        
        // Initialize chat session
        const sessionData = await createChatSession(session.user.id);
        setChatSession(sessionData);
        
        // Fetch existing messages
        const chatMessages = await fetchChatMessages(sessionData.id);
        setMessages(chatMessages);
        
        // Subscribe to real-time updates
        const unsubscribe = subscribeToChatUpdates(sessionData.id, (newMessage) => {
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
          
          if (newMessage.sender === 'agent') {
            setIsTyping(false);
          }
        });
        
        setIsLoading(false);
        
        return () => {
          unsubscribe();
        };
      } catch (error) {
        console.error('Error initializing page:', error);
        setError('Failed to initialize. Please try again.');
        setIsLoading(false);
      }
    };
    
    initializePage();
  }, [router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() && fileUploads.length === 0) return;
    if (!chatSession) return;
    
    setIsSending(true);
    
    try {
      // First, upload any files
      const fileUrls: string[] = [];
      
      for (const fileUpload of fileUploads) {
        if (fileUpload.status === 'pending' || fileUpload.status === 'error') {
          setFileUploads(prev => 
            prev.map(f => 
              f.id === fileUpload.id 
                ? { ...f, status: 'uploading' } 
                : f
            )
          );
          
          try {
            const fileUrl = await uploadFile(
              chatSession.business_id || 'default',
              fileUpload.file,
              (progress) => {
                setFileUploads(prev => 
                  prev.map(f => 
                    f.id === fileUpload.id 
                      ? { ...f, upload_progress: progress } 
                      : f
                  )
                );
              }
            );
            
            fileUrls.push(fileUrl);
            
            setFileUploads(prev => 
              prev.map(f => 
                f.id === fileUpload.id 
                  ? { ...f, status: 'success', upload_progress: 100 } 
                  : f
              )
            );
          } catch (error) {
            console.error('Error uploading file:', error);
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
      
      // Add user message to state immediately
      const tempUserMessage: ChatMessage = {
        id: uuidv4(),
        session_id: chatSession.id,
        sender: 'user',
        message: newMessage,
        message_type: 'text',
        metadata,
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempUserMessage]);
      
      // Send message to AI
      const result = await sendChatMessage(
        chatSession.id,
        newMessage,
        'user',
        'text',
        metadata
      );
      
      // Clear input and file uploads
      setNewMessage('');
      setFileUploads([]);
      
      // Add AI response if available
      if (result.agentResponse) {
        setMessages(prev => [...prev, result.agentResponse!]);
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newUploads = files.map(file => createLocalFileUpload(file));
    setFileUploads(prev => [...prev, ...newUploads]);
    e.target.value = '';
  };

  const handleRemoveFile = (id: string) => {
    setFileUploads(prev => prev.filter(f => f.id !== id));
  };

  const handleStartVoiceCall = async () => {
    if (!chatSession) return;
    
    try {
      setIsCallActive(true);
      setCallType('voice');
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        session_id: chatSession.id,
        sender: 'system',
        message: 'Voice call initiated. Connecting...',
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Start voice call
      const callSessionData = await startVoiceCall(chatSession.id);
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
    if (!chatSession) return;
    
    try {
      setIsCallActive(true);
      setCallType('video');
      
      // Add system message
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        session_id: chatSession.id,
        sender: 'system',
        message: 'Video call initiated. Connecting...',
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMessage]);
      
      // Start video call
      const callSessionData = await startVideoCall(chatSession.id);
      setCallSession(callSessionData);
      
    } catch (error) {
      console.error('Error starting video call:', error);
      setError('Failed to start video call. Please try again.');
      setIsCallActive(false);
      setCallType(null);
      setCallSession(null);
    }
  };

  const handleEndCall = () => {
    if (chatSession) {
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        session_id: chatSession.id,
        sender: 'system',
        message: `${callType === 'voice' ? 'Voice' : 'Video'} call ended.`,
        message_type: 'text',
        created_at: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, systemMessage]);
    }
    
    setIsCallActive(false);
    setCallType(null);
    setCallSession(null);
  };

  const handleStartReturn = async () => {
    if (!orderNumber.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('business_id')
        .eq('id', session.user.id)
        .single();
      
      if (profileError || !profile) {
        console.error('Profile not found:', profileError);
        setSearchError('Unable to load your profile. Please try logging out and back in.');
        setIsSearching(false);
        return;
      }
      
      const orderResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-order?order_id=${orderNumber}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!orderResponse.ok) {
        setSearchError(`Order ${orderNumber} not found. Please check the order number and try again.`);
        setIsSearching(false);
        return;
      }
      
      const orderData = await orderResponse.json();
      const order = orderData.data;
      
      if (!order) {
        setSearchError(`Order ${orderNumber} not found. Please check the order number and try again.`);
        setIsSearching(false);
        return;
      }
      
      const { data: existingRequests, error: requestError } = await supabase
        .from('return_requests')
        .select('public_id')
        .eq('order_id', orderNumber)
        .eq('customer_email', session.user.email);
      
      if (requestError) {
        console.error('Error checking existing return requests:', requestError);
        setSearchError('An error occurred while checking for existing return requests.');
        setIsSearching(false);
        return;
      }
      
      if (existingRequests && existingRequests.length > 0) {
        router.push(`/return/${existingRequests[0].public_id}`);
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/init-return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_id: profile.business_id,
          order_id: orderNumber
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create return request');
      }
      
      const data = await response.json();
      router.push(`/return/${data.public_id}`);
    } catch (error) {
      console.error('Error starting return:', error);
      setSearchError('An error occurred while creating your return request. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Welcome card */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Return Portal</CardTitle>
          <CardDescription>
            Easily manage your returns and get instant support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium">Chat Support</p>
                <p className="text-sm text-gray-500">Text with our AI agent</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium">Voice Support</p>
                <p className="text-sm text-gray-500">Talk to our AI agent</p>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium">Video Support</p>
                <p className="text-sm text-gray-500">Face-to-face with AI</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Start Return */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Start a New Return</CardTitle>
          <CardDescription>
            Enter your order number to begin the return process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Enter order number (e.g., ORDER-12345)"
                value={orderNumber}
                onChange={(e) => {
                  setOrderNumber(e.target.value);
                  setSearchError(null);
                }}
                className="pl-10"
              />
            </div>
            <Button 
              className="bg-primary hover:bg-primary/90 text-black"
              onClick={handleStartReturn}
              disabled={isSearching || !orderNumber.trim()}
            >
              {isSearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Package className="mr-2 h-4 w-4" />
              )}
              Start Return
            </Button>
          </div>
          
          {searchError && (
            <div className="mt-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{searchError}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 bg-gray-50 p-4 rounded-md">
            <h3 className="font-medium text-gray-900 mb-2">Demo Instructions</h3>
            <p className="text-sm text-gray-600">
              For this demo, you can use any of the following order numbers:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mt-2">
              <li>ORDER-12345 - Standard return</li>
              <li>ORDER-67890 - High-value return</li>
              <li>ORDER-24680 - Return outside window</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Return History */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Your Return History</CardTitle>
          <CardDescription>
            Track the status of your return requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          {returnRequests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 text-left">
                  <tr>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Order ID</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Reason</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {returnRequests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">{request.order_id}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {format(new Date(request.created_at), 'MMM d, yyyy')}
                      </td>
                      <td className="px-4 py-4 text-sm">
                        {request.status === 'approved' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Approved
                          </span>
                        ) : request.status === 'denied' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <XCircle className="w-3 h-3 mr-1" />
                            Denied
                          </span>
                        ) : request.status === 'completed' ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            {request.status === 'pending_triage' ? 'Pending Triage' : 'Pending Review'}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        {request.reason_for_return || 'Not specified'}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <Link href={`/return/${request.public_id}`}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                          >
                            View Details
                            <ArrowUpRight className="ml-1 h-3 w-3" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-6">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No return history yet</p>
              <p className="text-sm text-gray-400 mt-1">
                Your return requests will appear here
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Enhanced Chat Interface */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Chat with AI Support</CardTitle>
              <CardDescription>
                Our AI agent can help process your return request
              </CardDescription>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStartVoiceCall}
                disabled={isCallActive}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Phone className="h-4 w-4 mr-2" />
                Voice Call
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleStartVideoCall}
                disabled={isCallActive}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Video className="h-4 w-4 mr-2" />
                Video Call
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
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

          {/* Messages */}
          <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto flex flex-col space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="h-8 w-8 text-primary" />
                </div>
                <h2 className="text-xl font-semibold text-black mb-2">Welcome to AI Support</h2>
                <p className="text-black max-w-md mb-6">
                  Our AI assistant is here to help with your return or refund requests. How can we assist you today?
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md">
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center"
                    onClick={() => setNewMessage("I need to return an item")}
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Return an item
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex items-center justify-center"
                    onClick={() => setNewMessage("I have a question about my order")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Order question
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const isUser = message.sender === 'user';
                  const isSystem = message.sender === 'system';
                  const hasReturnDetection = Boolean(message.metadata?.return_detected);

                  return (
                    <div 
                      key={message.id} 
                      className={`flex ${isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'}`}
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
                })}
                
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
          
          {/* File uploads preview */}
          {fileUploads.length > 0 && (
            <div className="bg-gray-50 border-t p-2 flex flex-wrap gap-2 mt-4">
              {fileUploads.map(file => (
                <div 
                  key={file.id} 
                  className="relative bg-white rounded-md border p-2 flex items-center"
                >
                  {file.status === 'uploading' ? (
                    <div className="w-6 h-6 mr-2 flex items-center justify-center">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  ) : file.status === 'error' ? (
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                  ) : (
                    <Paperclip className="h-4 w-4 mr-2 text-black" />
                  )}
                  
                  <span className="text-sm truncate max-w-[150px]">{file.file.name}</span>
                  
                  <button 
                    className="ml-2 text-black hover:text-gray-600"
                    onClick={() => handleRemoveFile(file.id)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                  
                  {file.status === 'uploading' && (
                    <div className="absolute bottom-0 left-0 h-1 bg-primary" style={{ width: `${file.upload_progress}%` }}></div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
        <CardFooter>
          <div className="flex w-full space-x-2">
            <div className="flex-1 relative">
              <TextareaAutosize
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none max-h-32"
                minRows={1}
                maxRows={5}
                disabled={isSending}
              />
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" disabled={isSending}>
                  <Paperclip className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  <span>Upload Image</span>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileUpload}
                    multiple
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4 mr-2" />
                  <span>Upload File</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              className="bg-primary hover:bg-primary/90 text-black"
              onClick={handleSendMessage}
              disabled={isSending || (!newMessage.trim() && fileUploads.length === 0)}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* File preview dialog */}
      {showFilePreview && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">File Preview</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowFilePreview(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <img 
                src={selectedFile.preview_url} 
                alt="Preview" 
                className="max-h-[60vh] max-w-full object-contain rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* Call interfaces */}
      {isCallActive && callSession && (
        <>
          {callType === 'voice' ? (
            <VoiceCallInterface 
              callSession={callSession}
              onEndCall={handleEndCall}
              onError={setError}
            />
          ) : callType === 'video' ? (
            <VideoCallInterface 
              callSession={callSession}
              onEndCall={handleEndCall}
              onError={setError}
            />
          ) : null}
        </>
      )}
    </div>
  );
}