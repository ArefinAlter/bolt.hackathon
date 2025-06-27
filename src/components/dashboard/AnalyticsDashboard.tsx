import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart3, 
  Package, 
  Brain, 
  Users, 
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatCard } from './StatCard';
import { AnalyticsFilters } from './AnalyticsFilters';
import { ReturnTrendChart } from './charts/ReturnTrendChart';
import { AIAccuracyChart } from './charts/AIAccuracyChart';
import { SatisfactionChart } from './charts/SatisfactionChart';
import { PolicyComparisonChart } from './charts/PolicyComparisonChart';
import { fetchAnalytics, generatePDF } from '@/lib/analytics';
import { AnalyticsData, DateRangeFilter, MetricType } from '@/types/analytics';
import { supabase } from '@/lib/supabase';

export function AnalyticsDashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({});
  const [metricType, setMetricType] = useState<MetricType>('all');
  const [dateRange, setDateRange] = useState<DateRangeFilter>({ range: '30d' });
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
        
        // Load analytics data
        await loadAnalyticsData(profile.business_id);
      } catch (error) {
        console.error('Error loading user data:', error);
        setError('An error occurred while loading data');
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, [router]);

  const loadAnalyticsData = async (businessId: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetchAnalytics(businessId, metricType, dateRange);
      
      if (response.success) {
        setAnalyticsData(response.analytics);
      } else {
        setError('Failed to load analytics data');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('An error occurred while fetching analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMetricTypeChange = (type: MetricType) => {
    setMetricType(type);
    if (businessId) {
      loadAnalyticsData(businessId);
    }
  };

  const handleDateRangeChange = (range: DateRangeFilter) => {
    setDateRange(range);
    if (businessId) {
      loadAnalyticsData(businessId);
    }
  };

  const handleRefresh = () => {
    if (businessId) {
      loadAnalyticsData(businessId);
    }
  };

  const handleExport = () => {
    generatePDF(analyticsData, 'dokani-analytics-report.pdf');
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <AnalyticsFilters
        onMetricTypeChange={handleMetricTypeChange}
        onDateRangeChange={handleDateRangeChange}
        onRefresh={handleRefresh}
        onExport={handleExport}
        selectedMetricType={metricType}
        selectedDateRange={dateRange}
        isLoading={isLoading}
      />

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

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Returns"
          value={analyticsData.returns?.total_returns || 0}
          icon={<Package className="h-5 w-5 text-primary" />}
          trend={analyticsData.returns?.trend ? {
            value: `${analyticsData.returns.trend.change_percentage}%`,
            isPositive: parseFloat(analyticsData.returns.trend.change_percentage) > 0
          } : undefined}
          isLoading={isLoading}
        />
        
        <StatCard
          title="Approval Rate"
          value={`${analyticsData.returns?.approval_rate || 0}%`}
          icon={<CheckCircle className="h-5 w-5 text-green-600" />}
          description="Returns approved vs. total"
          isLoading={isLoading}
        />
        
        <StatCard
          title="AI Accuracy"
          value={`${analyticsData.ai_accuracy?.accuracy_rate || 0}%`}
          icon={<Brain className="h-5 w-5 text-blue-600" />}
          description="Correct AI decisions"
          isLoading={isLoading}
        />
        
        <StatCard
          title="Customer Satisfaction"
          value={`${analyticsData.satisfaction?.satisfaction_score || 0}%`}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          description="Based on sentiment analysis"
          isLoading={isLoading}
        />
      </div>

      {/* Return Status Breakdown */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Return Status Breakdown</CardTitle>
          <CardDescription>
            Current status of all return requests
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Pending Review</p>
                  <p className="text-2xl font-bold">{analyticsData.returns?.pending_review || 0}</p>
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
                  <p className="text-2xl font-bold">{analyticsData.returns?.approved_returns || 0}</p>
                </div>
                <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Denied</p>
                  <p className="text-2xl font-bold">{analyticsData.returns?.denied_returns || 0}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ReturnTrendChart 
          data={analyticsData.returns!} 
          isLoading={isLoading || !analyticsData.returns} 
        />
        
        <AIAccuracyChart 
          data={analyticsData.ai_accuracy!} 
          isLoading={isLoading || !analyticsData.ai_accuracy} 
        />
        
        <SatisfactionChart 
          data={analyticsData.satisfaction!} 
          isLoading={isLoading || !analyticsData.satisfaction} 
        />
        
        <PolicyComparisonChart 
          data={analyticsData.policy!} 
          isLoading={isLoading || !analyticsData.policy} 
        />
      </div>

      {/* Performance Indicators */}
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle>Performance Indicators</CardTitle>
          <CardDescription>
            Key metrics that indicate overall system performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Auto-Approval Rate</span>
                <span className="text-sm font-medium">{analyticsData.returns?.auto_approval_rate || '0%'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-primary h-2.5 rounded-full" 
                  style={{ width: analyticsData.returns?.auto_approval_rate || '0%' }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">AI Confidence</span>
                <span className="text-sm font-medium">{analyticsData.ai_accuracy?.average_confidence || '0'}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-500 h-2.5 rounded-full" 
                  style={{ width: `${parseFloat(analyticsData.ai_accuracy?.average_confidence || '0') * 100}%` }}
                ></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-500">Policy Effectiveness</span>
                <span className="text-sm font-medium">
                  {analyticsData.policy?.policy_effectiveness || 'Low'}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    analyticsData.policy?.policy_effectiveness === 'High' 
                      ? 'bg-green-500 w-[90%]' 
                      : analyticsData.policy?.policy_effectiveness === 'Medium'
                        ? 'bg-yellow-500 w-[60%]'
                        : 'bg-red-500 w-[30%]'
                  }`}
                ></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}