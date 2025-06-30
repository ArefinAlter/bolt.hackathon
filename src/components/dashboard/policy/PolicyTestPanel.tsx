'use client';

import { useState } from 'react';
import { 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  FileText,
  DollarSign,
  Calendar,
  Package,
  User,
  Tag,
  Image,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Policy, PolicyRule, PolicyTestResult } from '@/types/policy';
import { testPolicy } from '@/lib/policy';

interface PolicyTestPanelProps {
  policy: Policy;
  businessId: string;
}

export function PolicyTestPanel({ policy, businessId }: PolicyTestPanelProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<PolicyTestResult | null>(null);
  const [testCase, setTestCase] = useState({
    orderId: 'ORDER-12345',
    customerEmail: 'test@example.com',
    reason: 'defective',
    orderValue: 99.99,
    daysSincePurchase: 15,
    evidenceUrls: ['https://example.com/photo.jpg'],
    customerRiskScore: 0.3,
    returnHistory: 1,
    productCategory: 'electronics'
  });

  const handleInputChange = (field: string, value: string | number | string[]) => {
    setTestCase({
      ...testCase,
      [field]: value
    });
  };

  const handleRunTest = async () => {
    setIsLoading(true);
    try {
      const result = await testPolicy(businessId, policy.rules, testCase);
      setTestResult(result);
    } catch (error) {
      console.error('Error testing policy:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Policy Test Simulator
          </CardTitle>
          <CardDescription>
            Test how your policy would handle different return scenarios
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order ID
                </label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    value={testCase.orderId}
                    onChange={(e) => handleInputChange('orderId', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    value={testCase.customerEmail}
                    onChange={(e) => handleInputChange('customerEmail', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Return Reason
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    value={testCase.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Category
                </label>
                <div className="relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    value={testCase.productCategory}
                    onChange={(e) => handleInputChange('productCategory', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Order Value ($)
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="number"
                    value={testCase.orderValue}
                    onChange={(e) => handleInputChange('orderValue', parseFloat(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Days Since Purchase
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="number"
                    value={testCase.daysSincePurchase}
                    onChange={(e) => handleInputChange('daysSincePurchase', parseInt(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Evidence Provided
                </label>
                <div className="relative">
                  <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    value={testCase.evidenceUrls.join(', ')}
                    onChange={(e) => handleInputChange('evidenceUrls', e.target.value.split(', '))}
                    placeholder="URL(s) separated by commas"
                    className="pl-10"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Risk Score (0-1)
                </label>
                <div className="relative">
                  <BarChart className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input 
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={testCase.customerRiskScore}
                    onChange={(e) => handleInputChange('customerRiskScore', parseFloat(e.target.value))}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-center">
            <Button 
              onClick={handleRunTest}
              className="bg-primary hover:bg-primary/90 text-black"
              disabled={isLoading}
            >
              <Play className="mr-2 h-4 w-4" />
              {isLoading ? 'Running Test...' : 'Run Policy Test'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {testResult && (
        <Card className={`border-0 shadow-md ${
          testResult.decision === 'auto_approve' 
            ? 'bg-green-50 border-green-200' 
            : testResult.decision === 'auto_deny'
              ? 'bg-red-50 border-red-200'
              : 'bg-orange-50 border-orange-200'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {testResult.decision === 'auto_approve' ? (
                <>
                  <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                  Auto-Approved
                </>
              ) : testResult.decision === 'auto_deny' ? (
                <>
                  <XCircle className="mr-2 h-5 w-5 text-red-600" />
                  Auto-Denied
                </>
              ) : (
                <>
                  <Clock className="mr-2 h-5 w-5 text-orange-600" />
                  Human Review Required
                </>
              )}
            </CardTitle>
            <CardDescription>
              Confidence: {(testResult.confidence * 100).toFixed(1)}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-1">Reasoning</h3>
                <p className="text-sm text-gray-700">{testResult.reasoning}</p>
              </div>
              
              {testResult.policy_violations && testResult.policy_violations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Policy Violations</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {testResult.policy_violations.map((violation, index) => (
                      <li key={index}>{violation}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {testResult.risk_factors && testResult.risk_factors.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">Risk Factors</h3>
                  <ul className="list-disc list-inside text-sm text-gray-700">
                    {testResult.risk_factors.map((factor, index) => (
                      <li key={index}>{factor}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}