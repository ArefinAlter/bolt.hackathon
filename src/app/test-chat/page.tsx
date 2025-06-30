'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/common/Logo';

export default function TestChatPage() {
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <Logo />
              <span className="text-sm text-gray-500">Chat Testing</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-900"
            >
              Back to Home
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Chat Connection Test</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">
              Test chat functionality and environment variables
            </p>
          </div>
          
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
      </main>
    </div>
  );
} 