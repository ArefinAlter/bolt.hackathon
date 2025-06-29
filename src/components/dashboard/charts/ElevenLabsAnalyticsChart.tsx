'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Phone, MessageSquare, Clock, TrendingUp, Users } from 'lucide-react';
import { ElevenLabsAnalytics } from '@/types/analytics';

interface ElevenLabsAnalyticsChartProps {
  data: ElevenLabsAnalytics;
  isLoading?: boolean;
}

export function ElevenLabsAnalyticsChart({ data, isLoading = false }: ElevenLabsAnalyticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || isLoading || !data) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = 200;

    // Chart data
    const metrics = [
      { label: 'Conversations', value: data.conversations_count, color: '#3B82F6', icon: Phone },
      { label: 'Messages', value: data.messages_count, color: '#10B981', icon: MessageSquare },
      { label: 'Avg Response Time', value: data.average_response_time, color: '#F59E0B', icon: Clock },
      { label: 'Satisfaction', value: data.satisfaction_score, color: '#8B5CF6', icon: Users },
    ];

    const maxValue = Math.max(...metrics.map(m => m.value));
    const barWidth = (canvas.width - 100) / metrics.length;
    const barHeight = canvas.height - 60;

    // Draw bars
    metrics.forEach((metric, index) => {
      const x = 50 + index * barWidth + barWidth / 2;
      const height = (metric.value / maxValue) * barHeight;
      const y = canvas.height - 40 - height;

      // Draw bar
      ctx.fillStyle = metric.color;
      ctx.fillRect(x - barWidth / 3, y, barWidth / 1.5, height);

      // Draw value
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText(
        metric.label === 'Avg Response Time' 
          ? `${metric.value.toFixed(1)}s` 
          : metric.label === 'Satisfaction'
          ? `${metric.value.toFixed(1)}%`
          : metric.value.toString(),
        x,
        y - 10
      );

      // Draw label
      ctx.fillStyle = '#6B7280';
      ctx.font = '10px Inter';
      ctx.fillText(metric.label, x, canvas.height - 15);
    });

  }, [data, isLoading]);

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="mr-2 h-5 w-5 text-blue-600" />
            Voice Call Analytics
          </CardTitle>
          <CardDescription>
            ElevenLabs conversational AI performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Phone className="mr-2 h-5 w-5 text-blue-600" />
            Voice Call Analytics
          </CardTitle>
          <CardDescription>
            ElevenLabs conversational AI performance metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48 text-gray-500">
            <div className="text-center">
              <Phone className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No voice call data available</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Phone className="mr-2 h-5 w-5 text-blue-600" />
          Voice Call Analytics
        </CardTitle>
        <CardDescription>
          ElevenLabs conversational AI performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Chart */}
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-48"
              style={{ maxHeight: '200px' }}
            />
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {data.conversations_count}
              </div>
              <div className="text-sm text-gray-600">Conversations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {data.success_rate?.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-gray-600">Success Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {data.average_call_duration?.toFixed(1) || '0'}m
              </div>
              <div className="text-sm text-gray-600">Avg Duration</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {data.escalation_rate?.toFixed(1) || '0'}%
              </div>
              <div className="text-sm text-gray-600">Escalation Rate</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 