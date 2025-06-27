'use client';

import { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AlertTriangle, Loader2, MessageSquare, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage as ChatMessageComponent } from '@/components/customer/ChatMessage';
import { ChatInput } from '@/components/customer/ChatInput';
import { FilePreview } from '@/components/customer/FilePreview';
import { ChatMessage, ChatSession, FileUpload } from '@/types/chat';
import { sendChatMessage, createLocalFileUpload, subscribeToChatUpdates } from '@/lib/chat';

interface ChatContainerProps {
  initialMessages: ChatMessage[];
  session: ChatSession;
  onError: (error: string) => void;
}

export function ChatContainer({ initialMessages, session, onError }: ChatContainerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [showFilePreview, setShowFilePreview] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ url: string; name: string } | null>(null);
  const [showFeedback, setShowFeedback] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = subscribeToChatUpdates(session.id, (newMessage) => {
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
    });
    
    return () => {
      unsubscribe();
    };
  }, [session.id]);
  
  const handleSendMessage = async () => {
    if (!newMessage.trim() && fileUploads.length === 0) return;
    
    setIsSending(true);
    
    try {
      // First, upload any files
      const fileUrls: string[] = [];
      const fileNames: string[] = [];
      const fileTypes: string[] = [];
      
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
            // In a real implementation, we would upload the file here
            // For demo purposes, we'll just simulate a successful upload
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            const fileUrl = fileUpload.preview_url;
            fileUrls.push(fileUrl);
            fileNames.push(fileUpload.file.name);
            fileTypes.push(fileUpload.file.type);
            
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
            file_names: fileNames,
            file_types: fileTypes
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
        metadata
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
      onError('Failed to send message. Please try again.');
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
    
    // Reset file input
    e.target.value = '';
  };
  
  const handleRemoveFile = (id: string) => {
    setFileUploads(prev => prev.filter(f => f.id !== id));
  };
  
  const handleViewFile = (url: string, fileName: string) => {
    setSelectedFile({ url, name: fileName });
    setShowFilePreview(true);
  };
  
  const handleFeedback = (messageId: string, isPositive: boolean) => {
    // In a real implementation, we would send feedback to the API
    setShowFeedback(messageId);
    
    // Show feedback message
    setTimeout(() => {
      setShowFeedback(null);
    }, 3000);
  };
  
  return (
    <>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to Customer Support</h2>
            <p className="text-gray-600 max-w-md mb-6">
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
            {messages.map(message => (
              <ChatMessageComponent 
                key={message.id}
                message={message}
                onFeedback={handleFeedback}
                onViewFile={handleViewFile}
                showFeedback={showFeedback}
              />
            ))}
            
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
      
      {/* File preview dialog */}
      {selectedFile && (
        <FilePreview 
          isOpen={showFilePreview}
          onClose={() => setShowFilePreview(false)}
          fileUrl={selectedFile.url}
          fileName={selectedFile.name}
        />
      )}
    </>
  );
}