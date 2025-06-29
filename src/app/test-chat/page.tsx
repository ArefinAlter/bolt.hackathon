'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestChatPage() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testChatMessage = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // First, create a chat session
      const sessionResponse = await fetch('/api/chat/test-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!sessionResponse.ok) {
        throw new Error(`Failed to create session: ${sessionResponse.status}`);
      }

      const sessionData = await sessionResponse.json();
      console.log('Session created:', sessionData);

      // Then send a message
      const messageResponse = await fetch('/api/chat/test-message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: sessionData.session.id,
          message: message || 'Hello, this is a test message'
        })
      });

      if (!messageResponse.ok) {
        const errorData = await messageResponse.json();
        throw new Error(`Failed to send message: ${messageResponse.status} - ${errorData.error || 'Unknown error'}`);
      }

      const messageData = await messageResponse.json();
      setResult(messageData);
      console.log('Message sent successfully:', messageData);

    } catch (err: any) {
      setError(err.message);
      console.error('Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testEnvironment = () => {
    const envVars = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
    };
    
    setResult({ type: 'environment', data: envVars });
    console.log('Environment variables:', envVars);
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Chat Connection Test</h1>
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Environment Test</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={testEnvironment} className="mb-4">
              Test Environment Variables
            </Button>
            {result?.type === 'environment' && (
              <pre className="bg-gray-100 p-4 rounded text-sm">
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chat Message Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Enter test message..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button 
                onClick={testChatMessage} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing...' : 'Test Chat Message'}
              </Button>
            </div>
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded">
                <h3 className="font-semibold text-red-800">Error:</h3>
                <p className="text-red-700">{error}</p>
              </div>
            )}
            
            {result && result.type !== 'environment' && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
                <h3 className="font-semibold text-green-800">Success:</h3>
                <pre className="text-sm text-green-700">
                  {JSON.stringify(result, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 