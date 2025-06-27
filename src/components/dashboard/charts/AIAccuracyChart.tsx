import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AIAccuracyMetrics } from '@/types/analytics';

interface AIAccuracyChartProps {
  data: AIAccuracyMetrics;
  isLoading: boolean;
}

export function AIAccuracyChart({ data, isLoading }: AIAccuracyChartProps) {
  // Generate chart data based on the metrics
  const chartData = useMemo(() => {
    if (isLoading || !data) {
      return [];
    }

    const accuracyRate = parseFloat(data.accuracy_rate);
    const confidenceScore = parseFloat(data.average_confidence) * 100;
    
    return [
      {
        name: 'Accuracy Rate',
        value: accuracyRate,
        fill: '#10b981', // success color
      },
      {
        name: 'Confidence Score',
        value: confidenceScore,
        fill: '#3b82f6', // primary blue
      },
    ];
  }, [data, isLoading]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>AI Decision Accuracy</CardTitle>
        <CardDescription>
          Accuracy rate and confidence scores for AI decisions
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
                <Bar dataKey="value" name="Percentage">
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}