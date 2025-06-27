'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Package, 
  MessageSquare, 
  Phone, 
  Video, 
  ArrowLeft,
  Send,
  Image,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnRequest } from '@/types/return';
import { fetchReturnRequestById } from '@/lib/return';
import { StatusTimeline } from '@/components/dashboard/requests/StatusTimeline';
import { ConversationLog } from '@/components/dashboard/requests/ConversationLog';
import { EvidenceGallery } from '@/components/dashboard/requests/EvidenceGallery';
import { supabase } from '@/lib/supabase';

export default function ReturnDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isSendingMessage, setIsSendingMessage] = useState(false);

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

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !request) return;
    
    setIsSendingMessage(true);
    
    try {
      // In a real implementation, this would call an API to send the message
      // For demo purposes, we'll just update the local state
      
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
      
      // Simulate AI response after a delay
      setTimeout(() => {
        const aiResponse = {
          sender: 'agent' as const,
          message: getAIResponse(newMessage, request),
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
        
        setIsSendingMessage(false);
      }, 1500);
    } catch (error) {
      console.error('Error sending message:', error);
      setIsSendingMessage(false);
    }
  };

  // Helper function to generate AI responses based on the message and request status
  const getAIResponse = (message: string, request: ReturnRequest): string => {
    const lowerMessage = message.toLowerCase();
    
    if (request.status === 'approved') {
      return "Your return has been approved! You should receive your refund within 3-5 business days. Is there anything else I can help you with?";
    } else if (request.status === 'denied') {
      return "I understand you may have questions about your denied return. The reason provided was that the return window has expired. If you believe this is incorrect, please let me know and I can escalate this to our support team.";
    } else if (request.status === 'pending_review') {
      return "Your return request is currently under review by our team. We typically complete reviews within 24-48 hours. I'll notify you as soon as a decision is made.";
    }
    
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
    <div className="space-y-6">
      <Button 
        variant="ghost" 
        className="mb-4"
        onClick={() => router.push('/return')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Return Portal
      </Button>
      
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
              </div>
            </CardContent>
            <CardFooter className="p-4">
              <div className="flex w-full space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1"
                  disabled={isSendingMessage}
                />
                <Button 
                  className="bg-primary hover:bg-primary/90 text-black"
                  onClick={handleSendMessage}
                  disabled={isSendingMessage}
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
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="mr-2 h-5 w-5" />
                Evidence Files
              </CardTitle>
              <CardDescription>
                Photos and documents related to your return
              </CardDescription>
            </CardHeader>
            <CardContent>
              {request.evidence_urls && request.evidence_urls.length > 0 ? (
                <EvidenceGallery evidenceUrls={request.evidence_urls} />
              ) : (
                <div className="text-center py-6">
                  <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No evidence files uploaded</p>
                  <Button 
                    variant="outline" 
                    className="mt-2"
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
              >
                <Image className="mr-2 h-4 w-4" />
                Upload Evidence
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}