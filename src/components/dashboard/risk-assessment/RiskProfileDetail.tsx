'use client';

import { useState, useEffect } from 'react';
import { X, RefreshCw, AlertTriangle, Shield, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

interface RiskProfileDetailProps {
  isOpen: boolean;
  onClose: () => void;
  customerEmail: string;
  businessId: string;
  onRecalculate: (customerEmail: string) => void;
}

export function RiskProfileDetail({ 
  isOpen, 
  onClose, 
  customerEmail, 
  businessId,
  onRecalculate 
}: RiskProfileDetailProps) {
  const [profile, setProfile] = useState<RiskProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && customerEmail) {
      fetchProfile();
    }
  }, [isOpen, customerEmail]);

  const fetchProfile = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/risk-assessment/profile?customer_email=${encodeURIComponent(customerEmail)}&business_id=${businessId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }
      
      const data = await response.json();
      setProfile(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskLevel = (score: number) => {
    if (score >= 0.7) return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-50' };
    if (score >= 0.3) return { level: 'Medium', color: 'text-orange-600', bgColor: 'bg-orange-50' };
    return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-50' };
  };

  const handleRecalculate = async () => {
    try {
      await onRecalculate(customerEmail);
      await fetchProfile(); // Refresh the profile data
    } catch (err) {
      setError('Failed to recalculate risk score');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Risk Profile: {customerEmail}</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
            <Button onClick={fetchProfile} className="mt-2">
              Retry
            </Button>
          </div>
        ) : profile ? (
          <div className="space-y-4">
            {/* Risk Score Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Risk Score: {(profile.risk_score * 100).toFixed(1)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          profile.risk_score < 0.3 
                            ? 'bg-green-500' 
                            : profile.risk_score < 0.7
                              ? 'bg-orange-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${profile.risk_score * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {getRiskLevel(profile.risk_score).level} risk
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Return Frequency</p>
                      <p className="text-lg font-bold">{profile.return_frequency}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Last Updated</p>
                      <p className="text-sm">{new Date(profile.last_updated).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Behavior Patterns */}
            {profile.behavior_patterns && Object.keys(profile.behavior_patterns).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Behavior Patterns</CardTitle>
                  <CardDescription>Customer behavior analysis</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(profile.behavior_patterns).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-sm font-medium capitalize">
                          {key.replace(/_/g, ' ')}:
                        </span>
                        <span className="text-sm">
                          {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Fraud Indicators */}
            {profile.fraud_indicators && Object.keys(profile.fraud_indicators).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <AlertTriangle className="mr-2 h-5 w-5" />
                    Fraud Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Object.entries(profile.fraud_indicators)
                      .filter(([_, value]) => value)
                      .map(([key, value]) => (
                        <div key={key} className="flex items-center text-red-600">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          <span className="text-sm capitalize">
                            {key.replace(/_/g, ' ')}
                          </span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleRecalculate}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Recalculate Risk
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No profile found for this customer.
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
} 