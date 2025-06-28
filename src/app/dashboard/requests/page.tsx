'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Plus,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnsTable } from '@/components/dashboard/requests/ReturnsTable';
import { ReviewQueue } from '@/components/dashboard/requests/ReviewQueue';
import { RequestDetailModal } from '@/components/dashboard/requests/RequestDetailModal';
import { ReturnRequest } from '@/types/return';
import { supabase } from '@/lib/supabase';

export default function RequestsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ReturnRequest | null>(null);
  const [requests, setRequests] = useState<ReturnRequest[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }
        
        // Get user profile to get business_id
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', session.user.id)
          .single();
        
        if (profileError || !profile) {
          console.error('Profile not found:', profileError);
          setError('Unable to load your profile. Please try logging out and back in.');
          setIsLoading(false);
          return;
        }
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/get-return-request?business_id=${profile.business_id}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch return requests');
        }
        
        const data = await response.json();
        setRequests(data.data || []);
      } catch (error) {
        console.error('Error fetching requests:', error);
        setError('Failed to load return requests');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [router]);

  const handleViewRequest = (request: ReturnRequest) => {
    setSelectedRequest(request);
  };

  const handleCloseModal = () => {
    setSelectedRequest(null);
  };

  const handleRequestUpdated = (updatedRequest: ReturnRequest) => {
    // Close the modal and refresh the data
    setSelectedRequest(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!businessId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Business ID Not Found</h2>
          <p className="text-gray-600 mb-4">
            We couldn't find your business profile. Please try logging out and back in.
          </p>
          <Button 
            onClick={() => router.push('/dashboard')}
            className="bg-primary hover:bg-primary/90 text-black"
          >
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
          <p className="text-gray-500">
            Manage and process customer return requests
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button 
            variant="outline" 
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-black"
            onClick={() => router.push('/dashboard/requests/new')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Manual Return
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Review Queue */}
      <ReviewQueue 
        businessId={businessId} 
        onViewRequest={handleViewRequest}
      />
      
      {/* All Returns Table */}
      <ReturnsTable 
        businessId={businessId}
        onViewRequest={handleViewRequest}
      />
      
      {/* Request Detail Modal */}
      {selectedRequest && (
        <RequestDetailModal 
          request={selectedRequest}
          onClose={handleCloseModal}
          onRequestUpdated={handleRequestUpdated}
        />
      )}
    </div>
  );
}