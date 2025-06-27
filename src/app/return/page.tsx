'use client';

import { useEffect, useState } from 'react';
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
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ReturnRequest } from '@/types/return';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';

export default function ReturnPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [messages, setMessages] = useState<{ sender: string; message: string; timestamp: Date }[]>([
    { sender: 'agent', message: 'Hello! I\'m your AI assistant. How can I help you with your return today?', timestamp: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const checkUserRole = async () => {
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
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error checking user role:', error);
        router.push('/auth/login');
      }
    };
    
    checkUserRole();
  }, [router]);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;
    
    // Add user message
    setMessages(prev => [...prev, { 
      sender: 'user', 
      message: newMessage, 
      timestamp: new Date() 
    }]);
    
    // Clear input
    setNewMessage('');
    
    // Simulate AI response
    setTimeout(() => {
      let responseMessage = "I'll help you with your return request. Could you please provide your order number?";
      
      // Check if message contains order number
      if (newMessage.includes('ORDER-')) {
        responseMessage = "Thanks for providing your order number. Can you tell me the reason for your return?";
        
        // Extract order number
        const match = newMessage.match(/ORDER-\d+/i);
        if (match) {
          setOrderNumber(match[0]);
        }
      }
      
      // Check if message mentions a reason
      if (newMessage.toLowerCase().includes('defective') || 
          newMessage.toLowerCase().includes('broken') || 
          newMessage.toLowerCase().includes('wrong')) {
        responseMessage = "I understand you received a defective/wrong item. I'll need to process this return. Would you like to provide any photos of the issue?";
      }
      
      setMessages(prev => [...prev, { 
        sender: 'agent', 
        message: responseMessage, 
        timestamp: new Date() 
      }]);
    }, 1000);
  };

  const handleStartReturn = async () => {
    if (!orderNumber.trim()) return;
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      // Check if order exists
      const { data: order, error: orderError } = await supabase
        .from('mock_orders')
        .select('*')
        .eq('order_id', orderNumber)
        .single();
      
      if (orderError || !order) {
        setSearchError(`Order ${orderNumber} not found. Please check the order number and try again.`);
        setIsSearching(false);
        return;
      }
      
      // Check if return request already exists
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
        // Return request already exists, redirect to it
        router.push(`/return/${existingRequests[0].public_id}`);
        return;
      }
      
      // Create new return request
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/init-return`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          business_id: 'default', // This would normally be the business ID
          order_id: orderNumber
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create return request');
      }
      
      const data = await response.json();
      
      // Redirect to return detail page
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

      {/* Chat Interface */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Chat with AI Support</CardTitle>
          <CardDescription>
            Our AI agent can help process your return request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4 h-80 overflow-y-auto flex flex-col space-y-4">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.sender === 'user' 
                      ? 'bg-primary text-black' 
                      : 'bg-white border border-gray-200'
                  }`}
                >
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
        <CardFooter>
          <div className="flex w-full space-x-2">
            <Input
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              className="bg-primary hover:bg-primary/90 text-black"
              onClick={handleSendMessage}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}