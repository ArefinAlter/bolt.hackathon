'use client';

import { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  BarChart3, 
  Calendar,
  ArrowRight,
  TrendingUp,
  Users,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Policy, PolicyABTest } from '@/types/policy';
import { createABTest } from '@/lib/policy';

interface PolicyABTestPanelProps {
  policies: Policy[];
  businessId: string;
}

export function PolicyABTestPanel({ policies, businessId }: PolicyABTestPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testName, setTestName] = useState('');
  const [policyAId, setPolicyAId] = useState<number | null>(null);
  const [policyBId, setPolicyBId] = useState<number | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [activeTests, setActiveTests] = useState<PolicyABTest[]>([]);
  const [completedTests, setCompletedTests] = useState<PolicyABTest[]>([]);

  const handleCreateTest = async () => {
    if (!testName || !policyAId || !policyBId || !startDate || !endDate) {
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await createABTest(
        businessId,
        testName,
        policyAId,
        policyBId,
        startDate,
        endDate
      );
      
      // Add the new test to active tests
      setActiveTests([...activeTests, result]);
      
      // Reset form
      setTestName('');
      setPolicyAId(null);
      setPolicyBId(null);
      setStartDate(new Date().toISOString().split('T')[0]);
      setEndDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    } catch (error) {
      console.error('Error creating A/B test:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // For demo purposes, add a mock completed test if none exist
  if (completedTests.length === 0 && policies.length >= 2) {
    const mockTest: PolicyABTest = {
      id: 'abtest-mock-1',
      name: 'Extended Return Window Test',
      policy_a_id: policies[0].id,
      policy_b_id: policies[1].id,
      start_date: '2023-11-01',
      end_date: '2023-11-15',
      status: 'completed',
      metrics: {
        policy_a: {
          approval_rate: 72.5,
          auto_approval_rate: 58.3,
          customer_satisfaction: 85.2
        },
        policy_b: {
          approval_rate: 78.9,
          auto_approval_rate: 65.1,
          customer_satisfaction: 89.7
        },
        winner: 'b'
      }
    };
    
    setCompletedTests([mockTest]);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Create A/B Test
          </CardTitle>
          <CardDescription>
            Compare two policy versions to see which performs better
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Test Name
                </label>
                <Input 
                  value={testName}
                  onChange={(e) => setTestName(e.target.value)}
                  placeholder="e.g., Extended Return Window Test"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy A
                </label>
                <select
                  value={policyAId || ''}
                  onChange={(e) => setPolicyAId(parseInt(e.target.value))}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Policy A</option>
                  {policies.map((policy) => (
                    <option key={`a-${policy.id}`} value={policy.id}>
                      {policy.version} {policy.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Policy B
                </label>
                <select
                  value={policyBId || ''}
                  onChange={(e) => setPolicyBId(parseInt(e.target.value))}
                  className="w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select Policy B</option>
                  {policies.map((policy) => (
                    <option key={`b-${policy.id}`} value={policy.id}>
                      {policy.version} {policy.is_active ? '(Active)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div className="pt-4">
                <Button 
                  onClick={handleCreateTest}
                  className="w-full bg-primary hover:bg-primary/90 text-black"
                  disabled={isLoading || !testName || !policyAId || !policyBId || !startDate || !endDate}
                >
                  <Play className="mr-2 h-4 w-4" />
                  {isLoading ? 'Creating Test...' : 'Create A/B Test'}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {activeTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Tests</CardTitle>
            <CardDescription>
              Currently running A/B tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeTests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Play className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(test.start_date).toLocaleDateString()} - {new Date(test.end_date || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Running
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className="border rounded p-3">
                      <p className="text-sm font-medium">Policy A: {policies.find(p => p.id === test.policy_a_id)?.version}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Traffic:</span>
                          <span>50%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full w-1/2"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border rounded p-3">
                      <p className="text-sm font-medium">Policy B: {policies.find(p => p.id === test.policy_b_id)?.version}</p>
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span>Traffic:</span>
                          <span>50%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full w-1/2"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {completedTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Tests</CardTitle>
            <CardDescription>
              Results from previous A/B tests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedTests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div className="ml-3">
                        <h3 className="font-medium">{test.name}</h3>
                        <p className="text-sm text-gray-500">
                          {new Date(test.start_date).toLocaleDateString()} - {new Date(test.end_date || '').toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Completed
                    </span>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div className={`border rounded p-3 ${test.metrics.winner === 'a' ? 'bg-green-50 border-green-200' : ''}`}>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Policy A: {policies.find(p => p.id === test.policy_a_id)?.version}</p>
                        {test.metrics.winner === 'a' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                            Approval Rate:
                          </span>
                          <span>{test.metrics.policy_a.approval_rate}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-blue-600" />
                            Auto-Approval:
                          </span>
                          <span>{test.metrics.policy_a.auto_approval_rate}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1 text-purple-600" />
                            Satisfaction:
                          </span>
                          <span>{test.metrics.policy_a.customer_satisfaction}%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className={`border rounded p-3 ${test.metrics.winner === 'b' ? 'bg-green-50 border-green-200' : ''}`}>
                      <div className="flex justify-between items-center">
                        <p className="text-sm font-medium">Policy B: {policies.find(p => p.id === test.policy_b_id)?.version}</p>
                        {test.metrics.winner === 'b' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Winner
                          </span>
                        )}
                      </div>
                      <div className="mt-2 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center">
                            <CheckCircle className="h-3 w-3 mr-1 text-green-600" />
                            Approval Rate:
                          </span>
                          <span>{test.metrics.policy_b.approval_rate}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center">
                            <TrendingUp className="h-3 w-3 mr-1 text-blue-600" />
                            Auto-Approval:
                          </span>
                          <span>{test.metrics.policy_b.auto_approval_rate}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1 text-purple-600" />
                            Satisfaction:
                          </span>
                          <span>{test.metrics.policy_b.customer_satisfaction}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 flex justify-end space-x-2">
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                    {test.metrics.winner && (
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-black"
                        size="sm"
                        onClick={() => {
                          const winnerId = test.metrics.winner === 'a' ? test.policy_a_id : test.policy_b_id;
                          const winnerPolicy = policies.find(p => p.id === winnerId);
                          if (winnerPolicy && !winnerPolicy.is_active) {
                            // This would activate the winning policy
                            alert(`This would activate the winning policy: ${winnerPolicy.version}`);
                          }
                        }}
                      >
                        Activate Winner
                      </Button>
                    )}
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