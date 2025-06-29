'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestAIPage() {
  const [testMessage, setTestMessage] = useState('Hello, I need help with a return');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const testAI = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: testMessage
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('AI Test Result:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('AI Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const testEnvironment = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/test-environment', {
        method: 'GET'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
      console.log('Environment Test Result:', data);

    } catch (err: any) {
      setError(err.message);
      console.error('Environment Test failed:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">AI Agent Test</h1>
      
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
            <CardTitle>AI Agent Test</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                placeholder="Enter test message..."
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
              <Button 
                onClick={testAI} 
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Testing AI...' : 'Test AI Agent'}
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