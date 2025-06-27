'use client';

import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  BarChart3, 
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getPolicyCompliance } from '@/lib/policy';
import { Policy } from '@/types/policy';

interface PolicyComplianceMonitorProps {
  policy: Policy;
  businessId: string;
}

export function PolicyComplianceMonitor({ policy, businessId }: PolicyComplianceMonitorProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [complianceData, setComplianceData] = useState<any>(null);
  const [recentViolations, setRecentViolations] = useState<any[]>([]);

  useEffect(() => {
    loadComplianceData();
  }, [policy.id]);

  const loadComplianceData = async () => {
    setIsLoading(true);
    try {
      const data = await getPolicyCompliance(businessId, policy.id);
      setComplianceData(data);
      
      // Generate mock recent violations for demo
      const mockViolations = [
        {
          id: 'v1',
          orderId: 'ORDER-67890',
          customer: 'jane.smith@example.com',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          violation: 'outside_return_window',
          description: 'Return requested 45 days after purchase (limit: 30 days)'
        },
        {
          id: 'v2',
          orderId: 'ORDER-24680',
          customer: 'bob.johnson@example.com',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
          violation: 'missing_evidence',
          description: 'No photo evidence provided for defective item claim'
        }
      ];
      
      setRecentViolations(mockViolations);
    } catch (error) {
      console.error('Error loading compliance data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <ShieldCheck className="mr-2 h-5 w-5" />
                Policy Compliance Monitor
              </CardTitle>
              <CardDescription>
                Real-time monitoring of policy compliance
              </CardDescription>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={loadComplianceData}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-40 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : complianceData ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Compliance Rate</p>
                      <p className="text-2xl font-bold">{complianceData.compliance_rate.toFixed(1)}%</p>
                    </div>
                    <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Total Requests</p>
                      <p className="text-2xl font-bold">{complianceData.total_requests}</p>
                    </div>
                    <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500">Policy Violations</p>
                      <p className="text-2xl font-bold">{complianceData.total_requests - complianceData.compliant_requests}</p>
                    </div>
                    <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-5 h-5 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Top Violation Types</h3>
                <div className="space-y-3">
                  {complianceData.violations.map((violation: any, index: number) => (
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between items-center text-sm">
                        <span>{violation.type.split('_').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</span>
                        <span className="font-medium">{violation.count} occurrences</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${(violation.count / (complianceData.total_requests - complianceData.compliant_requests)) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <AlertTriangle className="h-10 w-10 text-orange-500 mx-auto mb-2" />
              <p className="text-gray-500">Failed to load compliance data</p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadComplianceData}
                className="mt-2"
              >
                Try Again
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {recentViolations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Policy Violations</CardTitle>
            <CardDescription>
              Latest detected violations of the current policy
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentViolations.map((violation) => (
                <div key={violation.id} className="flex items-start space-x-4 p-3 bg-red-50 rounded-lg">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
                      <h3 className="font-medium text-gray-900">{violation.orderId}</h3>
                      <span className="text-xs text-gray-500">
                        {new Date(violation.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      <span className="font-medium">Customer:</span> {violation.customer}
                    </p>
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Violation:</span> {violation.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}