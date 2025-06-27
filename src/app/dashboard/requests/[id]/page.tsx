'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { 
  Package, 
  ArrowLeft,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequestDetail } from '@/components/dashboard/requests/RequestDetail';
import { ReturnRequest } from '@/types/return';
import { fetchReturnRequestById } from '@/lib/return';
import { supabase } from '@/lib/supabase';

export default function RequestDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);
  const [request, setRequest] = useState<ReturnRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRequestData = async () => {
      try {
        // Check if user has selected a role
        const userRole = localStorage.getItem('userRole');
        
        if (!userRole) {
          router.push('/dashboard/role-selection');
          return;
        } else if (userRole !== 'business') {
          router.push('/return');
          return;
        }
        
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Fetch return request
        if (params.id) {
          const requestData = await fetchReturnRequestById(params.id as string);
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
  }, [router, params.id]);

  const handleRequestUpdated = (updatedRequest: ReturnRequest) => {
    setRequest(updatedRequest);
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
          onClick={() => router.push('/dashboard/requests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Request Not Found</h2>
            <p className="text-gray-600 mb-4">
              {error || 'The return request you are looking for could not be found.'}
            </p>
            <Button 
              onClick={() => router.push('/dashboard/requests')}
              className="bg-primary hover:bg-primary/90 text-black"
            >
              View All Requests
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
        onClick={() => router.push('/dashboard/requests')}
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Requests
      </Button>
      
      <RequestDetail 
        request={request}
        onClose={() => router.push('/dashboard/requests')}
        onRequestUpdated={handleRequestUpdated}
      />
    </div>
  );
}