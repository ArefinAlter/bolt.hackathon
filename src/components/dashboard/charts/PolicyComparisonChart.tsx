import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { PolicyMetrics } from '@/types/analytics';

interface PolicyComparisonChartProps {
  data: PolicyMetrics;
  isLoading: boolean;
}

export function PolicyComparisonChart({ data, isLoading }: PolicyComparisonChartProps) {
  // Generate chart data based on the metrics
  const chartData = useMemo(() => {
    if (isLoading || !data) {
      return [];
    }

    // Create mock data for policy comparison
    // In a real app, this would come from the API
    return [
      {
        name: 'Previous Policy',
        approvalRate: parseFloat(data.current_approval_rate) - 5,
        autoApprovalRate: parseFloat(data.current_approval_rate) - 8,
        manualReviewRate: 100 - (parseFloat(data.current_approval_rate) - 5),
      },
      {
        name: 'Current Policy',
        approvalRate: parseFloat(data.current_approval_rate),
        autoApprovalRate: parseFloat(data.current_approval_rate) - 3,
        manualReviewRate: 100 - parseFloat(data.current_approval_rate),
      },
    ];
  }, [data, isLoading]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Policy Comparison</CardTitle>
        <CardDescription>
          Compare metrics between policy versions
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="h-80 w-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="h-80 w-full p-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
                <Tooltip formatter={(value) => [`${value}%`, '']} />
                <Legend />
                <Bar dataKey="approvalRate" name="Approval Rate" fill="#10b981" />
                <Bar dataKey="autoApprovalRate" name="Auto-Approval Rate" fill="#3b82f6" />
                <Bar dataKey="manualReviewRate" name="Manual Review Rate" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}