'use client';

import { useState } from 'react';
import { Search, Eye, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface RiskProfile {
  id: string;
  customer_email: string;
  business_id: string;
  risk_score: number;
  return_frequency: number;
  fraud_indicators: any;
  behavior_patterns: any;
  last_updated: string;
  created_at: string;
}

interface RiskProfileTableProps {
  riskProfiles: RiskProfile[];
  onViewProfile: (profile: RiskProfile) => void;
  onRecalculateRisk: (customerEmail: string) => void;
}

export function RiskProfileTable({ 
  riskProfiles, 
  onViewProfile, 
  onRecalculateRisk 
}: RiskProfileTableProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredProfiles = riskProfiles.filter(profile =>
    profile.customer_email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (score >= 0.3) return { level: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Customer Risk Profiles</CardTitle>
        <CardDescription>Monitor individual customer risk scores and return patterns</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by customer email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 max-w-sm"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-black">Customer Email</th>
                <th className="text-left py-3 px-4 font-medium text-black">Risk Score</th>
                <th className="text-left py-3 px-4 font-medium text-black">Risk Level</th>
                <th className="text-left py-3 px-4 font-medium text-black">Return Frequency</th>
                <th className="text-left py-3 px-4 font-medium text-black">Last Updated</th>
                <th className="text-left py-3 px-4 font-medium text-black">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => {
                const riskInfo = getRiskLevel(profile.risk_score);
                return (
                  <tr key={profile.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-black">{profile.customer_email}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{(profile.risk_score * 100).toFixed(1)}%</span>
                        <div className="w-16 h-2 bg-gray-200 rounded-full">
                          <div 
                            className={`h-2 rounded-full ${
                              profile.risk_score >= 0.7 
                                ? 'bg-red-500' 
                                : profile.risk_score >= 0.3
                                  ? 'bg-orange-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${profile.risk_score * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${riskInfo.bgColor} ${riskInfo.color}`}>
                        {riskInfo.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-black">{profile.return_frequency}</td>
                    <td className="py-3 px-4 text-black">
                      {new Date(profile.last_updated).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onViewProfile(profile)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onRecalculateRisk(profile.customer_email)}
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Recalc
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? 'No customers found matching your search.' : 'No risk profiles found.'}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 