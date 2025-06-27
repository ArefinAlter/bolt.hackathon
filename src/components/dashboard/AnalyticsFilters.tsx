import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Download, Filter, RefreshCw } from 'lucide-react';
import { DateRangeFilter, MetricType } from '@/types/analytics';

interface AnalyticsFiltersProps {
  onMetricTypeChange: (type: MetricType) => void;
  onDateRangeChange: (range: DateRangeFilter) => void;
  onRefresh: () => void;
  onExport: () => void;
  selectedMetricType: MetricType;
  selectedDateRange: DateRangeFilter;
  isLoading: boolean;
}

export function AnalyticsFilters({
  onMetricTypeChange,
  onDateRangeChange,
  onRefresh,
  onExport,
  selectedMetricType,
  selectedDateRange,
  isLoading
}: AnalyticsFiltersProps) {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

  const handleDateRangeClick = (range: '7d' | '30d' | '90d') => {
    onDateRangeChange({ range });
    setIsDatePickerOpen(false);
  };

  return (
    <Card className="border-0 shadow-md">
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* Metric Type Filters */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedMetricType === 'all' ? 'default' : 'outline'}
              className={selectedMetricType === 'all' ? 'bg-primary text-black' : ''}
              onClick={() => onMetricTypeChange('all')}
              size="sm"
            >
              All Metrics
            </Button>
            <Button
              variant={selectedMetricType === 'returns' ? 'default' : 'outline'}
              className={selectedMetricType === 'returns' ? 'bg-primary text-black' : ''}
              onClick={() => onMetricTypeChange('returns')}
              size="sm"
            >
              Returns
            </Button>
            <Button
              variant={selectedMetricType === 'ai_accuracy' ? 'default' : 'outline'}
              className={selectedMetricType === 'ai_accuracy' ? 'bg-primary text-black' : ''}
              onClick={() => onMetricTypeChange('ai_accuracy')}
              size="sm"
            >
              AI Accuracy
            </Button>
            <Button
              variant={selectedMetricType === 'satisfaction' ? 'default' : 'outline'}
              className={selectedMetricType === 'satisfaction' ? 'bg-primary text-black' : ''}
              onClick={() => onMetricTypeChange('satisfaction')}
              size="sm"
            >
              Satisfaction
            </Button>
            <Button
              variant={selectedMetricType === 'policy' ? 'default' : 'outline'}
              className={selectedMetricType === 'policy' ? 'bg-primary text-black' : ''}
              onClick={() => onMetricTypeChange('policy')}
              size="sm"
            >
              Policy
            </Button>
          </div>

          {/* Date Range and Actions */}
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                className="flex items-center"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {selectedDateRange.range === '7d' && 'Last 7 days'}
                {selectedDateRange.range === '30d' && 'Last 30 days'}
                {selectedDateRange.range === '90d' && 'Last 90 days'}
                {selectedDateRange.range === 'custom' && 'Custom Range'}
              </Button>
              
              {isDatePickerOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                  <div className="py-1">
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleDateRangeClick('7d')}
                    >
                      Last 7 days
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleDateRangeClick('30d')}
                    >
                      Last 30 days
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => handleDateRangeClick('90d')}
                    >
                      Last 90 days
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex items-center"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}