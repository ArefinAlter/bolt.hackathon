'use client';

import { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Save, 
  Clock, 
  CheckCircle, 
  Settings, 
  AlertCircle,
  Edit,
  Trash,
  Copy
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Mock policy data
const mockPolicies = [
  {
    id: 1,
    version: 'v1.0',
    isActive: true,
    effectiveDate: '2023-12-01',
    createdAt: '2023-11-15',
    rules: {
      return_window_days: 30,
      auto_approve_threshold: 100,
      required_evidence: ['photo'],
      acceptable_reasons: ['defective', 'wrong_item', 'damaged', 'not_as_described'],
      high_risk_categories: ['electronics', 'jewelry'],
      fraud_flags: ['multiple_returns', 'high_value', 'suspicious_pattern']
    }
  },
  {
    id: 2,
    version: 'v1.1',
    isActive: false,
    effectiveDate: '2024-01-01',
    createdAt: '2023-12-10',
    rules: {
      return_window_days: 45,
      auto_approve_threshold: 150,
      required_evidence: ['photo', 'video'],
      acceptable_reasons: ['defective', 'wrong_item', 'damaged', 'not_as_described', 'changed_mind'],
      high_risk_categories: ['electronics', 'jewelry', 'luxury'],
      fraud_flags: ['multiple_returns', 'high_value', 'suspicious_pattern', 'address_mismatch']
    }
  }
];

export default function PolicyPage() {
  const [policies, setPolicies] = useState(mockPolicies);
  const [activeTab, setActiveTab] = useState<'active' | 'all' | 'editor'>('active');
  const [editingPolicy, setEditingPolicy] = useState<any>(null);

  const handleEditPolicy = (policy: any) => {
    setEditingPolicy({...policy});
    setActiveTab('editor');
  };

  const handleCreateNewPolicy = () => {
    const latestPolicy = [...policies].sort((a, b) => b.id - a.id)[0];
    
    const newPolicy = {
      id: latestPolicy.id + 1,
      version: `v${parseFloat(latestPolicy.version.substring(1)) + 0.1}`,
      isActive: false,
      effectiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
      rules: {...latestPolicy.rules}
    };
    
    setEditingPolicy(newPolicy);
    setActiveTab('editor');
  };

  const handleDuplicatePolicy = (policy: any) => {
    const newPolicy = {
      ...policy,
      id: Math.max(...policies.map(p => p.id)) + 1,
      version: `v${parseFloat(policy.version.substring(1)) + 0.1}`,
      isActive: false,
      effectiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString().split('T')[0],
    };
    
    setEditingPolicy(newPolicy);
    setActiveTab('editor');
  };

  const handleActivatePolicy = (policyId: number) => {
    setPolicies(policies.map(policy => ({
      ...policy,
      isActive: policy.id === policyId
    })));
  };

  const handleSavePolicy = () => {
    if (!editingPolicy) return;
    
    const existingIndex = policies.findIndex(p => p.id === editingPolicy.id);
    
    if (existingIndex >= 0) {
      // Update existing policy
      const updatedPolicies = [...policies];
      updatedPolicies[existingIndex] = editingPolicy;
      setPolicies(updatedPolicies);
    } else {
      // Add new policy
      setPolicies([...policies, editingPolicy]);
    }
    
    setActiveTab('all');
    setEditingPolicy(null);
  };

  const handleCancelEdit = () => {
    setEditingPolicy(null);
    setActiveTab('all');
  };

  const handleUpdateRule = (path: string, value: any) => {
    if (!editingPolicy) return;
    
    const pathParts = path.split('.');
    const newPolicy = {...editingPolicy};
    
    let current: any = newPolicy;
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]];
    }
    
    current[pathParts[pathParts.length - 1]] = value;
    setEditingPolicy(newPolicy);
  };

  const filteredPolicies = activeTab === 'active'
    ? policies.filter(policy => policy.isActive)
    : policies;

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
            <div className="mt-4 md:mt-0 flex space-x-2">
              <Button 
                variant={activeTab === 'active' ? 'default' : 'outline'}
                className={activeTab === 'active' ? 'bg-primary text-black' : ''}
                onClick={() => setActiveTab('active')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Active Policy
              </Button>
              <Button 
                variant={activeTab === 'all' ? 'default' : 'outline'}
                className={activeTab === 'all' ? 'bg-primary text-black' : ''}
                onClick={() => setActiveTab('all')}
              >
                <FileText className="mr-2 h-4 w-4" />
                All Policies
              </Button>
              <Button 
                className="bg-primary hover:bg-primary/90 text-black"
                onClick={handleCreateNewPolicy}
              >
                <Plus className="mr-2 h-4 w-4" />
                New Policy
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'editor' && editingPolicy ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">
                  {editingPolicy.id ? `Editing Policy ${editingPolicy.version}` : 'Create New Policy'}
                </h2>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="bg-primary hover:bg-primary/90 text-black"
                    onClick={handleSavePolicy}
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Policy
                  </Button>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Policy Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Version
                      </label>
                      <Input
                        value={editingPolicy.version}
                        onChange={(e) => setEditingPolicy({...editingPolicy, version: e.target.value})}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Effective Date
                      </label>
                      <Input
                        type="date"
                        value={editingPolicy.effectiveDate}
                        onChange={(e) => setEditingPolicy({...editingPolicy, effectiveDate: e.target.value})}
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-4">Return Rules</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Return Window (days)
                      </label>
                      <Input
                        type="number"
                        value={editingPolicy.rules.return_window_days}
                        onChange={(e) => handleUpdateRule('rules.return_window_days', parseInt(e.target.value))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Auto-Approve Threshold ($)
                      </label>
                      <Input
                        type="number"
                        value={editingPolicy.rules.auto_approve_threshold}
                        onChange={(e) => handleUpdateRule('rules.auto_approve_threshold', parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Advanced Rules</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Required Evidence
                    </label>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="evidence-photo"
                          checked={editingPolicy.rules.required_evidence.includes('photo')}
                          onChange={(e) => {
                            const newEvidence = e.target.checked
                              ? [...editingPolicy.rules.required_evidence, 'photo']
                              : editingPolicy.rules.required_evidence.filter((item: string) => item !== 'photo');
                            handleUpdateRule('rules.required_evidence', newEvidence);
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="evidence-photo" className="ml-2 text-sm text-gray-700">
                          Photo
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="evidence-video"
                          checked={editingPolicy.rules.required_evidence.includes('video')}
                          onChange={(e) => {
                            const newEvidence = e.target.checked
                              ? [...editingPolicy.rules.required_evidence, 'video']
                              : editingPolicy.rules.required_evidence.filter((item: string) => item !== 'video');
                            handleUpdateRule('rules.required_evidence', newEvidence);
                          }}
                          className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                        <label htmlFor="evidence-video" className="ml-2 text-sm text-gray-700">
                          Video
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Acceptable Reasons
                    </label>
                    <div className="space-y-2">
                      {['defective', 'wrong_item', 'damaged', 'not_as_described', 'changed_mind'].map((reason) => (
                        <div key={reason} className="flex items-center">
                          <input
                            type="checkbox"
                            id={`reason-${reason}`}
                            checked={editingPolicy.rules.acceptable_reasons.includes(reason)}
                            onChange={(e) => {
                              const newReasons = e.target.checked
                                ? [...editingPolicy.rules.acceptable_reasons, reason]
                                : editingPolicy.rules.acceptable_reasons.filter((item: string) => item !== reason);
                              handleUpdateRule('rules.acceptable_reasons', newReasons);
                            }}
                            className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                          />
                          <label htmlFor={`reason-${reason}`} className="ml-2 text-sm text-gray-700">
                            {reason.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 rounded-tl-lg">Version</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Effective Date</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Return Window</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500">Auto-Approve Threshold</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 rounded-tr-lg">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 text-sm text-gray-900">{policy.version}</td>
                      <td className="px-4 py-4 text-sm">
                        {policy.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700">
                            <Clock className="w-3 h-3 mr-1" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">{policy.effectiveDate}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">{policy.rules.return_window_days} days</td>
                      <td className="px-4 py-4 text-sm text-gray-900">${policy.rules.auto_approve_threshold}</td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => handleEditPolicy(policy)}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-xs"
                            onClick={() => handleDuplicatePolicy(policy)}
                          >
                            <Copy className="h-3 w-3 mr-1" />
                            Duplicate
                          </Button>
                          
                          {!policy.isActive && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => handleActivatePolicy(policy.id)}
                            >
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Activate
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredPolicies.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                        No policies found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {activeTab !== 'editor' && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle>Policy Impact Analysis</CardTitle>
            <CardDescription>
              Understand how your policies affect return rates and customer satisfaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Auto-Approval Rate</h3>
                  <div className="w-8 h-8 bg-green-50 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold">65%</p>
                <p className="text-sm text-gray-500 mt-1">
                  +5% from previous policy
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Manual Review Rate</h3>
                  <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold">25%</p>
                <p className="text-sm text-gray-500 mt-1">
                  -3% from previous policy
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">Denial Rate</h3>
                  <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  </div>
                </div>
                <p className="text-2xl font-bold">10%</p>
                <p className="text-sm text-gray-500 mt-1">
                  -2% from previous policy
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}