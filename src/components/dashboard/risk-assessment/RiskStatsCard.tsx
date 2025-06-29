'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Users, AlertTriangle, Shield } from 'lucide-react';

interface RiskStats {
  total: number;
  high: number;
  medium: number;
  low: number;
  avgScore: number;
}

interface RiskStatsCardProps {
  stats: RiskStats;
}

export function RiskStatsCard({ stats }: RiskStatsCardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Customers</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">High Risk</p>
              <p className="text-2xl font-bold text-red-600">{stats.high}</p>
            </div>
            <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Medium Risk</p>
              <p className="text-2xl font-bold text-orange-600">{stats.medium}</p>
            </div>
            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Risk Score</p>
              <p className="text-2xl font-bold">{(stats.avgScore * 100).toFixed(1)}%</p>
            </div>
            <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 