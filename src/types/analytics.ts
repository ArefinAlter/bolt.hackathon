export interface ReturnMetrics {
  total_returns: number;
  approved_returns: number;
  denied_returns: number;
  pending_review: number;
  auto_approval_rate: string;
  approval_rate: string;
  trend: {
    recent_period: number;
    previous_period: number;
    change_percentage: string;
  };
}

export interface AIAccuracyMetrics {
  total_ai_decisions: number;
  correct_decisions: number;
  accuracy_rate: string;
  average_confidence: string;
  high_confidence_decisions: number;
}

export interface SatisfactionMetrics {
  total_interactions: number;
  positive_interactions: number;
  negative_interactions: number;
  satisfaction_score: string;
  response_time_avg: string;
}

export interface PolicyMetrics {
  total_policies: number;
  active_policy: string;
  policy_changes: number;
  current_approval_rate: string;
  policy_effectiveness: string;
}

export interface AnalyticsData {
  returns?: ReturnMetrics;
  ai_accuracy?: AIAccuracyMetrics;
  satisfaction?: SatisfactionMetrics;
  policy?: PolicyMetrics;
}

export interface AnalyticsResponse {
  success: boolean;
  business_id: string;
  analytics: AnalyticsData;
}

export type MetricType = 'all' | 'returns' | 'ai_accuracy' | 'satisfaction' | 'policy';

export type DateRange = '7d' | '30d' | '90d' | 'custom';

export interface DateRangeFilter {
  range: DateRange;
  startDate?: Date;
  endDate?: Date;
}