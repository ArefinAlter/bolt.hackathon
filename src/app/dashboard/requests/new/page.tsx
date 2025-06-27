'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreateReturnForm } from '@/components/dashboard/requests/CreateReturnForm';
import { supabase } from '@/lib/supabase';

export default function NewRequestPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserData = async () => {
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
        
        // Get user profile to get business_id
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_id')
          .eq('id', session.user.id)
          .single();
        
        if (!profile) {
          console.error('Profile not found');
          setError('Unable to load profile data');
          setIsLoading(false);
          return;
        }
        
        setBusinessId(profile.business_id);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('An error occurred while loading data');
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [router]);

  const handleSuccess = () => {
    router.push('/dashboard/requests');
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
      <div className="flex items-center">
        <Button 
          variant="ghost" 
          className="mr-4"
          onClick={() => router.push('/dashboard/requests')}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Requests
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Manual Return</h1>
          <p className="text-gray-500">
            Create a return request on behalf of a customer
          </p>
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
      
      <CreateReturnForm 
        businessId={businessId}
        onSuccess={handleSuccess}
      />
    </div>
  );
}