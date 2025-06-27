import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { SatisfactionMetrics } from '@/types/analytics';

interface SatisfactionChartProps {
  data: SatisfactionMetrics;
  isLoading: boolean;
}

export function SatisfactionChart({ data, isLoading }: SatisfactionChartProps) {
  // Generate chart data based on the metrics
  const chartData = useMemo(() => {
    if (isLoading || !data) {
      return [];
    }

    return [
      {
        name: 'Positive',
        value: data.positive_interactions,
        color: '#10b981', // success color
      },
      {
        name: 'Negative',
        value: data.negative_interactions,
        color: '#ef4444', // danger color
      },
      {
        name: 'Neutral',
        value: data.total_interactions - data.positive_interactions - data.negative_interactions,
        color: '#9ca3af', // gray color
      },
    ];
  }, [data, isLoading]);

  const COLORS = ['#10b981', '#ef4444', '#9ca3af'];

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Customer Satisfaction</CardTitle>
        <CardDescription>
          Sentiment analysis of customer interactions
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
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Interactions']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}