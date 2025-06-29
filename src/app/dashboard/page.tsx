'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Package, 
  FileText, 
  Users, 
  ArrowUpRight,
  TrendingUp,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [stats, setStats] = useState({
    totalReturns: 0,
    pendingReturns: 0,
    approvedReturns: 0,
    deniedReturns: 0
  });

  useEffect(() => {
    const loadDashboardData = async () => {
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
        
        if (isDemoMode) {
          // Use demo data
          setStats({
            totalReturns: 45,
            pendingReturns: 12,
            approvedReturns: 28,
            deniedReturns: 5
          });
        } else {
          // Get user profile to get business_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('id', session.user.id)
            .single();
          
          if (!profile) {
            console.error('Profile not found');
            setIsLoading(false);
            return;
          }
          
          // Get analytics data using the function
          const response = await fetch(`/api/get-analytics?business_id=${profile.business_id}&metric_type=all&demo_mode=false`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.data) {
              setStats({
                totalReturns: data.data.total_returns || 0,
                pendingReturns: data.data.pending_returns || 0,
                approvedReturns: data.data.approved_returns || 0,
                deniedReturns: data.data.denied_returns || 0
              });
            }
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        setIsLoading(false);
      }
    };
    
    loadDashboardData();
  }, [router, isDemoMode]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Demo Mode Toggle */}
      <div className="flex items-center space-x-4 mb-4">
        <Switch checked={isDemoMode} onCheckedChange={setIsDemoMode} />
        <Badge variant={isDemoMode ? 'default' : 'secondary'}>{isDemoMode ? 'Demo' : 'Live'}</Badge>
      </div>

      {/* Welcome card */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl">Welcome to your Dashboard</CardTitle>
          <CardDescription>
            Manage your return requests, policies, and analytics all in one place
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Returns</p>
                  <p className="text-2xl font-bold">{stats.totalReturns}</p>
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                  <Package className="w-5 h-5 text-blue-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold">{stats.pendingReturns}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                  <Clock className="w-5 h-5 text-orange-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Approved</p>
                  <p className="text-2xl font-bold">{stats.approvedReturns}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Denied</p>
                  <p className="text-2xl font-bold">{stats.deniedReturns}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick actions */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-0 shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-4">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
            <CardTitle>Return Requests</CardTitle>
            <CardDescription>
              View and manage customer return requests
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-black"
              onClick={() => router.push('/dashboard/requests')}
            >
              View Requests
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Policy Management</CardTitle>
            <CardDescription>
              Configure and update return policies
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-black"
              onClick={() => router.push('/dashboard/policy')}
            >
              Manage Policies
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-4">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>
              View detailed analytics and insights
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-black"
              onClick={() => router.push('/dashboard/analytics')}
            >
              View Analytics
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-0 shadow-md hover:shadow-lg transition-all">
          <CardHeader>
            <div className="w-12 h-12 bg-orange-50 rounded-lg flex items-center justify-center mb-4">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>
              Monitor customer risk profiles
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button 
              className="w-full bg-primary hover:bg-primary/90 text-black"
              onClick={() => router.push('/dashboard/risk-assessment')}
            >
              View Risk Profiles
              <ArrowUpRight className="ml-2 h-4 w-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* Recent activity */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Your latest return requests and policy changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {stats.totalReturns > 0 ? (
            <div className="space-y-4">
              {/* This would be populated with actual data in a real implementation */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">New return request</p>
                    <p className="text-sm text-gray-500">ORDER-12345 - Defective product</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">2 hours ago</p>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">Policy updated</p>
                    <p className="text-sm text-gray-500">Return window extended to 30 days</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500">Yesterday</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-gray-500">No recent activity to display</p>
              <p className="text-sm text-gray-400 mt-1">
                Activity will appear here as you use the platform
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => router.push('/dashboard/requests')}
          >
            View All Activity
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}