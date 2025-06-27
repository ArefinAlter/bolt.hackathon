import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ReturnMetrics } from '@/types/analytics';

interface ReturnTrendChartProps {
  data: ReturnMetrics;
  isLoading: boolean;
}

export function ReturnTrendChart({ data, isLoading }: ReturnTrendChartProps) {
  // Generate mock trend data based on the metrics
  const chartData = useMemo(() => {
    if (isLoading || !data) {
      return Array(7).fill(0).map((_, i) => ({
        name: `Day ${i + 1}`,
        returns: 0,
        approved: 0,
        denied: 0,
      }));
    }

    // Create a 7-day trend with the total distributed across days
    const total = data.total_returns;
    const approved = data.approved_returns;
    const denied = data.denied_returns;
    
    return Array(7).fill(0).map((_, i) => {
      // Create a realistic distribution with some randomness
      const factor = 0.5 + Math.sin(i / 2) * 0.5;
      const dayTotal = Math.round((total / 7) * factor);
      const dayApproved = Math.round((approved / 7) * factor);
      const dayDenied = Math.round((denied / 7) * factor);
      
      return {
        name: `Day ${i + 1}`,
        returns: dayTotal,
        approved: dayApproved,
        denied: dayDenied,
      };
    });
  }, [data, isLoading]);

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle>Return Trends</CardTitle>
        <CardDescription>
          Return volume and approval rates over time
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
              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 30,
                  left: 0,
                  bottom: 0,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="returns" 
                  stackId="1"
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  name="Total Returns"
                />
                <Area 
                  type="monotone" 
                  dataKey="approved" 
                  stackId="2"
                  stroke="#82ca9d" 
                  fill="#82ca9d" 
                  name="Approved"
                />
                <Area 
                  type="monotone" 
                  dataKey="denied" 
                  stackId="2"
                  stroke="#ffc658" 
                  fill="#ffc658" 
                  name="Denied"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}