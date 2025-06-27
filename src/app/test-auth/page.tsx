'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function TestAuth() {
  const [status, setStatus] = useState<string>('Testing...');
  const [session, setSession] = useState<any>(null);

  const testAuth = async () => {
    try {
      setStatus('Checking session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }
      
      if (session) {
        setSession(session);
        setStatus('Session found! User is authenticated.');
      } else {
        setStatus('No session found. User is not authenticated.');
      }
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setStatus('Signed out');
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Auth Test</h1>
      <div className="space-y-4">
        <button 
          onClick={testAuth}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Test Authentication
        </button>
        
        <button 
          onClick={signOut}
          className="px-4 py-2 bg-red-500 text-white rounded ml-2"
        >
          Sign Out
        </button>
        
        <div className="mt-4">
          <p><strong>Status:</strong> {status}</p>
        </div>
        
        {session && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <h3 className="font-bold">Session Info:</h3>
            <pre className="text-sm mt-2">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 