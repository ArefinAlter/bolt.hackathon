'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Package, 
  MessageSquare, 
  Phone, 
  Video, 
  ArrowLeft,
  Send,
  Image as ImageIcon,
  AlertTriangle,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  Upload,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnRequest, EvidenceFile } from '@/types/return';
import { fetchReturnRequestById } from '@/lib/return';
import { StatusTimeline } from '@/components/return/StatusTimeline';
import { ConversationLog } from '@/components/return/ConversationLog';
import { EvidenceGallery } from '@/components/return/EvidenceGallery';
import { EvidenceUploader } from '@/components/return/EvidenceUploader';
import { WebSocketManager } from '@/components/return/WebSocketManager';
import { supabase } from '@/lib/supabase';
import TextareaAutosize from 'react-textarea-autosize';

export default function ReturnDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [isUploadingEvidence, setIsUploadingEvidence] = useState(false);
  const [showEvidenceUploader, setShowEvidenceUploader] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRequestData = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Fetch return request
        if (params.public_id) {
          const requestData = await fetchReturnRequestById(params.public_id as string);
          setRequest(requestData);
        } else {
          setError('Return request ID not found');
        }
      } catch (error) {
        console.error('Error loading request data:', error);
        setError('Failed to load return request');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRequestData();
  }, [router, params.public_id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [request?.conversation_log]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !request) return;
    
    setIsSendingMessage(true);
    
    try {
      // Create a new message
      const newConversationMessage = {
        sender: 'customer' as const,
        message: newMessage,
        timestamp: new Date().toISOString()
      };
      
      // Update the request with the new message
      const updatedConversationLog = [
        ...(request.conversation_log || []),
        newConversationMessage
      ];
      
      setRequest({
        ...request,
        conversation_log: updatedConversationLog
      });
      
      // Clear the input
      setNewMessage('');
      
      // Update the request in the database
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          public_id: request.public_id,
          reason_for_return: request.reason_for_return || newMessage,
          evidence_urls: request.evidence_urls || [],
          conversation_log: updatedConversationLog
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update return request');
      }
      
      const data = await response.json();
      
      // Simulate AI response after a delay
      setTimeout(() => {
        const aiResponse = {
          sender: 'agent' as const,
          message: getAIResponse(newMessage, request, data),
          timestamp: new Date().toISOString()
        };
        
        setRequest(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            conversation_log: [
              ...(prev.conversation_log || []),
              aiResponse
            ],
            status: data.status || prev.status
          };
        });
        
        setIsSendingMessage(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsSendingMessage(false);
    }
  };

  const handleRefresh = async () => {
    if (!params.public_id) return;
    
    setIsRefreshing(true);
    
    try {
      const requestData = await fetchReturnRequestById(params.public_id as string);
      setRequest(requestData);
    } catch (error) {
      console.error('Error refreshing request data:', error);
      setError('Failed to refresh return request');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEvidenceUpload = async (files: File[]) => {
    if (!request) return;
    
    // Create evidence files
    const newEvidenceFiles: EvidenceFile[] = files.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview_url: URL.createObjectURL(file),
      upload_progress: 0,
      status: 'pending'
    }));
    
    setEvidenceFiles(prev => [...prev, ...newEvidenceFiles]);
    setIsUploadingEvidence(true);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('No active session');
      }
      
      // Upload each file
      const uploadedUrls: string[] = [];
      
      for (const evidenceFile of newEvidenceFiles) {
        // Update file status
        setEvidenceFiles(prev => 
          prev.map(f => 
            f.id === evidenceFile.id 
              ? { ...f, status: 'uploading' } 
              : f
          )
        );
        
        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setEvidenceFiles(prev => 
            prev.map(f => 
              f.id === evidenceFile.id && f.status === 'uploading'
                ? { 
                    ...f, 
                    upload_progress: Math.min(f.upload_progress + 10, 90) 
                  } 
                : f
            )
          );
        }, 300);
        
        try {
          // Convert file to base64
          const base64 = await fileToBase64(evidenceFile.file);
          
          // Call the upload-file function
          const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/upload-file`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              business_id: request.business_id,
              file_type: 'evidence_photo',
              file_name: evidenceFile.file.name,
              file_data: base64,
              file_metadata: {
                size: evidenceFile.file.size,
                type: evidenceFile.file.type,
                last_modified: evidenceFile.file.lastModified
              }
            })
          });
          
          clearInterval(progressInterval);
          
          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to upload file');
          }
          
          const data = await response.json();
          uploadedUrls.push(data.file_url);
          
          // Update file status
          setEvidenceFiles(prev => 
            prev.map(f => 
              f.id === evidenceFile.id 
                ? { ...f, status: 'success', upload_progress: 100 } 
                : f
            )
          );
        } catch (error) {
          clearInterval(progressInterval);
          console.error('Error uploading file:', error);
          
          // Update file status
          setEvidenceFiles(prev => 
            prev.map(f => 
              f.id === evidenceFile.id 
                ? { ...f, status: 'error', error: 'Failed to upload file' } 
                : f
            )
          );
        }
      }
      
      // Update the request with the new evidence URLs
      if (uploadedUrls.length > 0) {
        const updatedEvidenceUrls = [
          ...(request.evidence_urls || []),
          ...uploadedUrls
        ];
        
        // Update the request in the database
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-return`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            public_id: request.public_id,
            reason_for_return: request.reason_for_return,
            evidence_urls: updatedEvidenceUrls,
            conversation_log: request.conversation_log
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update return request');
        }
        
        const data = await response.json();
        
        // Update the local request state
        setRequest(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            evidence_urls: updatedEvidenceUrls,
            status: data.status || prev.status
          };
        });
        
        // Add system message about evidence upload
        const systemMessage = {
          sender: 'system' as const,
          message: `${uploadedUrls.length} evidence file(s) uploaded successfully.`,
          timestamp: new Date().toISOString()
        };
        
        setRequest(prev => {
          if (!prev) return prev;
          
          return {
            ...prev,
            conversation_log: [
              ...(prev.conversation_log || []),
              systemMessage
            ]
          };
        });
        
        // Simulate AI response after a delay
        setTimeout(() => {
          const aiResponse = {
            sender: 'agent' as const,
            message: `Thank you for providing evidence for your return request. This will help us process your request more efficiently. Is there anything else you'd like to add?`,
            timestamp: new Date().toISOString()
          };
          
          setRequest(prev => {
            if (!prev) return prev;
            
            return {
              ...prev,
              conversation_log: [
                ...(prev.conversation_log || []),
                aiResponse
              ]
            };
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error uploading evidence:', error);
      setError('Failed to upload evidence files');
    } finally {
      setIsUploadingEvidence(false);
      setShowEvidenceUploader(false);
    }
  };

  // Helper function to generate AI responses based on the message and request status
  const getAIResponse = (message: string, request: ReturnRequest, triageData: any): string => {
    const lowerMessage = message.toLowerCase();
    
    // If we have triage data with a decision, use that
    if (triageData && triageData.decision) {
      switch (triageData.decision) {
        case 'auto_approve':
          return `Great news! Your return request for order ${request.order_id} has been automatically approved. ${triageData.reasoning}\n\nNext steps:\n${triageData.next_steps.join('\n')}`;
        case 'auto_deny':
          return `I'm sorry, but your return request for order ${request.order_id} has been denied. ${triageData.reasoning}\n\nIf you believe this is an error, please provide additional information or contact our support team.`;
        case 'human_review':
          return `Thank you for providing the details for your return request. Your case requires additional review by our team. ${triageData.reasoning}\n\nWe'll get back to you as soon as possible. You can check the status of your request anytime by returning to this page.`;
      }
    }
    
    // Default responses based on request status
    if (request.status === 'approved') {
      return "Your return has been approved! You should receive your refund within 3-5 business days. Is there anything else I can help you with?";
    } else if (request.status === 'denied') {
      return "I understand you may have questions about your denied return. The reason provided was that the return window has expired. If you believe this is incorrect, please let me know and I can escalate this to our support team.";
    } else if (request.status === 'pending_review') {
      return "Your return request is currently under review by our team. We typically complete reviews within 24-48 hours. I'll notify you as soon as a decision is made.";
    }
    
    // Generic responses based on message content
    if (lowerMessage.includes('status') || lowerMessage.includes('update')) {
      return `Your return request for order ${request.order_id} is currently ${request.status.replace('_', ' ')}. I'll keep you updated on any changes.`;
    } else if (lowerMessage.includes('refund') || lowerMessage.includes('money')) {
      return "Once your return is approved, refunds typically process within 3-5 business days, depending on your payment method.";
    } else if (lowerMessage.includes('evidence') || lowerMessage.includes('photo') || lowerMessage.includes('picture')) {
      return "You can upload photos or videos as evidence by clicking the 'Upload Evidence' button below the chat. This helps us process your return more quickly.";
    } else if (lowerMessage.includes('thank')) {
      return "You're welcome! I'm here to help with any other questions you might have about your return.";
    } else {
      return "Thank you for your message. I'm here to help with your return request for order " + request.order_id + ". Is there anything specific you'd like to know about your return?";
    }
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
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
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="space-y-6">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => router.push('/return')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Return Portal
        </Button>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || 'The return request you are looking for could not be found.'}
            </p>
            <Button 
              onClick={() => router.push('/return')}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              Return to Portal
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => router.push('/return')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Return Portal
        </Button>
        
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Request</h1>
          <p className="text-gray-500">
            Order {request.order_id}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button 
            variant="outline" 
            className="flex items-center"
          >
            <Phone className="mr-2 h-4 w-4" />
            Voice Call
          </Button>
          <Button 
            variant="outline" 
            className="flex items-center"
          >
            <Video className="mr-2 h-4 w-4" />
            Video Call
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Chat and timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat interface */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Chat with Support
              </CardTitle>
              <CardDescription>
                Get help with your return request
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 overflow-y-auto border-t border-b p-4">
                {request.conversation_log && request.conversation_log.length > 0 ? (
                  <ConversationLog messages={request.conversation_log} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500">No messages yet</p>
                      <p className="text-sm text-gray-400 mt-1">
                        Start the conversation by sending a message
                      </p>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </CardContent>
            <CardFooter className="p-4">
              <div className="flex w-full space-x-2">
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
                  className="flex-1 border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none max-h-32"
                  minRows={1}
                  maxRows={5}
                  disabled={isSendingMessage}
                />
                <Button 
                  className="bg-primary hover:bg-primary/90 text-black"
                  onClick={handleSendMessage}
                  disabled={isSendingMessage || !newMessage.trim()}
                >
                  {isSendingMessage ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardFooter>
          </Card>
          
          {/* Evidence gallery */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center">
                  <ImageIcon className="mr-2 h-5 w-5" />
                  Evidence Files
                </CardTitle>
                <CardDescription>
                  Photos and documents related to your return
                </CardDescription>
              </div>
              <Button 
                variant="outline"
                onClick={() => setShowEvidenceUploader(true)}
                disabled={isUploadingEvidence}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Evidence
              </Button>
            </CardHeader>
            <CardContent>
              {request.evidence_urls && request.evidence_urls.length > 0 ? (
                <EvidenceGallery evidenceUrls={request.evidence_urls} />
              ) : (
                <div className="text-center py-6">
                  <ImageIcon className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No evidence files uploaded</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
                    onClick={() => setShowEvidenceUploader(true)}
                  >
                    Upload Evidence
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Status and details */}
        <div className="space-y-6">
          {/* Status card */}
          <Card className={`border-0 shadow-md ${
            request.status === 'approved' 
              ? 'bg-green-50 border-green-200' 
              : request.status === 'denied'
                ? 'bg-red-50 border-red-200'
                : request.status === 'pending_review' || request.status === 'pending_triage'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-purple-50 border-purple-200'
          }`}>
            <CardHeader>
              <CardTitle>Return Status</CardTitle>
              <CardDescription>
                Current status of your return request
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusTimeline request={request} />
            </CardContent>
          </Card>
          
          {/* Order details */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">{request.order_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{request.order_details?.product_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purchase Date</p>
                  <p className="font-medium">
                    {request.order_details?.purchase_date 
                      ? new Date(request.order_details.purchase_date).toLocaleDateString()
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Return Reason</p>
                  <p className="font-medium">{request.reason_for_return || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Support options */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle>Support Options</CardTitle>
              <CardDescription>
                Additional ways to get help
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
              >
                <Phone className="mr-2 h-4 w-4" />
                Start Voice Call
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
              >
                <Video className="mr-2 h-4 w-4" />
                Start Video Call
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center justify-center"
                onClick={() => setShowEvidenceUploader(true)}
              >
                <ImageIcon className="mr-2 h-4 w-4" />
                Upload Evidence
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Evidence uploader dialog */}
      {showEvidenceUploader && (
        <EvidenceUploader
          onClose={() => setShowEvidenceUploader(false)}
          onUpload={handleEvidenceUpload}
          isUploading={isUploadingEvidence}
          evidenceFiles={evidenceFiles}
          setEvidenceFiles={setEvidenceFiles}
        />
      )}
      
      {/* WebSocket manager for real-time updates */}
      <WebSocketManager 
        publicId={request.public_id}
        onUpdate={(updatedRequest) => setRequest(updatedRequest)}
      />
    </div>
  );
}