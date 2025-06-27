'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  Package, 
  ArrowUpRight,
  Send
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';

export default function ReturnPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [orderNumber, setOrderNumber] = useState('');
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

  const handleStartReturn = () => {
    if (!orderNumber.trim()) return;
    
    // Add user message with order number
    setMessages(prev => [...prev, { 
      sender: 'user', 
      message: `I'd like to return my order ${orderNumber}`, 
      timestamp: new Date() 
    }]);
    
    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [...prev, { 
        sender: 'agent', 
        message: `Thanks for providing your order number ${orderNumber}. Can you tell me the reason for your return?`, 
        timestamp: new Date() 
      }]);
    }, 1000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <div className="flex space-x-4">
            <Input
              placeholder="Enter order number (e.g., ORDER-12345)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="flex-1"
            />
            <Button 
              className="bg-primary hover:bg-primary/90 text-black"
              onClick={handleStartReturn}
            >
              Start Return
            </Button>
          </div>
          
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
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardFooter>
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
          <div className="text-center py-6">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500">No return history yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Your return requests will appear here
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}