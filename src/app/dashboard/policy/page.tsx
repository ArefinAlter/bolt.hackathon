'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FileText, 
  Plus, 
  History, 
  BarChart3, 
  ShieldCheck,
  Layers,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PolicyEditor } from '@/components/dashboard/policy/PolicyEditor';
import { PolicyTimeline } from '@/components/dashboard/policy/PolicyTimeline';
import { PolicyTestPanel } from '@/components/dashboard/policy/PolicyTestPanel';
import { PolicyABTestPanel } from '@/components/dashboard/policy/PolicyABTestPanel';
import { PolicyComplianceMonitor } from '@/components/dashboard/policy/PolicyComplianceMonitor';
import { Policy, PolicyRule } from '@/types/policy';
import { fetchPolicies, createPolicy, updatePolicy, activatePolicy } from '@/lib/policy';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'

export default function PolicyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('timeline');
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [activePolicy, setActivePolicy] = useState<Policy | null>(null);
  const [editingPolicy, setEditingPolicy] = useState<Policy | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(true)

  const fetchPolicies = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth/login');
        return;
      }
      
      let currentBusinessId: string;
      
      if (isDemoMode) {
        // Always use demo business ID in demo mode
        currentBusinessId = '550e8400-e29b-41d4-a716-446655440000';
        setBusinessId('550e8400-e29b-41d4-a716-446655440000');
      } else {
        // Get user profile to get business_id for live mode
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
        
        currentBusinessId = profile.business_id;
        setBusinessId(profile.business_id);
      }
      
      // Use the correct API endpoint
      const response = await fetch(`/api/policies?demo_mode=${isDemoMode}&business_id=${currentBusinessId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }
      
      const data = await response.json();
      setPolicies(data.data || []);
      
      // Set active policy in demo mode
      if (isDemoMode) {
        const activePolicyFromData = (data.data || []).find((policy: Policy) => policy.is_active);
        setActivePolicy(activePolicyFromData || null);
      }
    } catch (error) {
      console.error('Error fetching policies:', error);
      setError('Failed to load policies');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, [router, isDemoMode]);

  const handleCreateNewPolicy = () => {
    setIsCreatingNew(true);
    setEditingPolicy(null);
    setActiveTab('editor');
  };

  const handleEditPolicy = (policy: Policy) => {
    setEditingPolicy(policy);
    setIsCreatingNew(false);
    setActiveTab('editor');
  };

  const handleDuplicatePolicy = (policy: Policy) => {
    // Create a new policy based on the selected one
    const newVersion = `v${parseFloat(policy.version.substring(1)) + 0.1}`;
    
    const duplicatedPolicy: Policy = {
      ...policy,
      id: -1, // Temporary ID
      version: newVersion,
      is_active: false,
      effective_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    };
    
    setEditingPolicy(duplicatedPolicy);
    setIsCreatingNew(true);
    setActiveTab('editor');
  };

  const handleActivatePolicy = async (policyId: number) => {
    if (!businessId) return;
    
    try {
      const updatedPolicy = await activatePolicy(policyId, businessId);
      
      // Update policies list
      setPolicies(policies.map(policy => ({
        ...policy,
        is_active: policy.id === policyId
      })));
      
      // Update active policy
      setActivePolicy(updatedPolicy);
    } catch (error) {
      console.error('Error activating policy:', error);
      setError('Failed to activate policy');
    }
  };

  const handleRollbackPolicy = (policy: Policy) => {
    handleActivatePolicy(policy.id);
  };

  const handleSavePolicy = async (formValues: any) => {
    if (!businessId) return;
    
    try {
      let savedPolicy;
      
      if (isCreatingNew) {
        // Create new policy
        savedPolicy = await createPolicy(
          businessId,
          formValues.version,
          formValues.rules,
          formValues.effective_date
        );
      } else if (editingPolicy) {
        // Update existing policy
        savedPolicy = await updatePolicy(
          editingPolicy.id,
          businessId,
          formValues.version,
          formValues.rules,
          formValues.effective_date
        );
      }
      
      // Reload policies
      await fetchPolicies();
      
      // Reset editing state
      setEditingPolicy(null);
      setIsCreatingNew(false);
      
      // Switch back to timeline view
      setActiveTab('timeline');
    } catch (error) {
      console.error('Error saving policy:', error);
      setError('Failed to save policy');
    }
  };

  const handleCancelEdit = () => {
    setEditingPolicy(null);
    setIsCreatingNew(false);
    setActiveTab('timeline');
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
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">Policy Management</CardTitle>
              <CardDescription>
                Configure and manage your return policies
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <Button 
                className="bg-primary hover:bg-primary/90 text-black"
                onClick={handleCreateNewPolicy}
                disabled={activeTab === 'editor'}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create New Policy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4 mb-4">
            <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
            <Badge variant={isDemoMode ? 'default' : 'secondary'}>{isDemoMode ? 'Demo' : 'Live'}</Badge>
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
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
          
          {activeTab === 'editor' ? (
            <PolicyEditor 
              policy={editingPolicy || undefined}
              businessId={businessId || ''}
              onSave={handleSavePolicy}
              onCancel={handleCancelEdit}
              isNew={isCreatingNew}
            />
          ) : (
            <Tabs defaultValue="timeline" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-2 md:grid-cols-4 mb-6">
                <TabsTrigger value="timeline" className="flex items-center">
                  <Layers className="mr-2 h-4 w-4" />
                  Policy Timeline
                </TabsTrigger>
                <TabsTrigger value="test" className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Test Policy
                </TabsTrigger>
                <TabsTrigger value="abtest" className="flex items-center">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  A/B Testing
                </TabsTrigger>
                <TabsTrigger value="compliance" className="flex items-center">
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Compliance
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="timeline">
                {policies.length > 0 ? (
                  <PolicyTimeline 
                    policies={policies}
                    onEdit={handleEditPolicy}
                    onDuplicate={handleDuplicatePolicy}
                    onActivate={handleActivatePolicy}
                    onRollback={handleRollbackPolicy}
                  />
                ) : (
                  <div className="text-center py-10">
                    <FileText className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">No policies found</p>
                    <Button 
                      className="mt-4 bg-primary hover:bg-primary/90 text-black"
                      onClick={handleCreateNewPolicy}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create Your First Policy
                    </Button>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="test">
                {activePolicy ? (
                  <PolicyTestPanel 
                    policy={activePolicy}
                    businessId={businessId || ''}
                  />
                ) : (
                  <div className="text-center py-10">
                    <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-500">No active policy to test</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Activate a policy first to use the test simulator
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="abtest">
                {policies.length >= 2 ? (
                  <PolicyABTestPanel 
                    policies={policies}
                    businessId={businessId || ''}
                  />
                ) : (
                  <div className="text-center py-10">
                    <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-500">Need at least two policies for A/B testing</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Create another policy version to compare performance
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="compliance">
                {activePolicy ? (
                  <PolicyComplianceMonitor 
                    policy={activePolicy}
                    businessId={businessId || ''}
                  />
                ) : (
                  <div className="text-center py-10">
                    <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-2" />
                    <p className="text-gray-500">No active policy to monitor</p>
                    <p className="text-sm text-gray-400 mt-1">
                      Activate a policy first to monitor compliance
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}