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
import { Button } from '@/components/ui/button';
import { DemoToggle } from '@/components/common/DemoToggle';
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
    <div className="space-y-4">
      {/* Demo Toggle */}
      <div className="flex justify-end">
        <DemoToggle 
          isDemoMode={isDemoMode} 
          onDemoModeChange={setIsDemoMode}
        />
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Returns</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalReturns}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingReturns}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Approved</p>
              <p className="text-2xl font-bold text-green-600">{stats.approvedReturns}</p>
            </div>
            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white border rounded-lg p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Denied</p>
              <p className="text-2xl font-bold text-red-600">{stats.deniedReturns}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button 
          onClick={() => router.push('/dashboard/requests')}
          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-blue-600">Return Requests</h3>
              <p className="text-sm text-gray-500">Manage returns</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/policy')}
          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-green-600">Policy Management</h3>
              <p className="text-sm text-gray-500">Configure policies</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/analytics')}
          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-purple-600">Analytics</h3>
              <p className="text-sm text-gray-500">View insights</p>
            </div>
          </div>
        </button>
        
        <button 
          onClick={() => router.push('/dashboard/risk-assessment')}
          className="bg-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 group-hover:text-orange-600">Risk Assessment</h3>
              <p className="text-sm text-gray-500">Monitor risk</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => router.push('/dashboard/requests')}
          >
            View All
          </Button>
        </div>
        
        {stats.totalReturns > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                <Package className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">New return request</p>
                <p className="text-xs text-gray-500">ORDER-12345 - Defective product</p>
              </div>
              <p className="text-xs text-gray-500">2h ago</p>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                <FileText className="w-4 h-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Policy updated</p>
                <p className="text-xs text-gray-500">Return window extended to 30 days</p>
              </div>
              <p className="text-xs text-gray-500">1d ago</p>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No recent activity</p>
            <p className="text-sm text-gray-400 mt-1">Activity will appear here as you use the platform</p>
          </div>
        )}
      </div>
    </div>
  );
}