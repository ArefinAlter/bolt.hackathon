export interface PolicyRule {
  return_window_days: number;
  auto_approve_threshold: number;
  required_evidence: string[];
  acceptable_reasons: string[];
  high_risk_categories: string[];
  fraud_flags: string[];
  allow_voice_calls?: boolean;
  allow_video_calls?: boolean;
  record_calls?: boolean;
  max_call_duration?: number;
  auto_escalation_threshold?: number;
}

export interface Policy {
  id: number;
  business_id: string;
  version: string;
  is_active: boolean;
  effective_date: string;
  created_at: string;
  rules: PolicyRule;
  policy_impact_score?: number;
  usage_statistics?: Record<string, any>;
  compliance_metrics?: Record<string, any>;
}

export interface PolicyChangeHistory {
  id: string;
  policy_id: number;
  business_id: string;
  change_type: 'created' | 'modified' | 'activated' | 'deactivated' | 'deleted';
  previous_rules?: PolicyRule;
  new_rules?: PolicyRule;
  impact_analysis?: Record<string, any>;
  change_summary?: string;
  changed_by: string;
  created_at: string;
}

export interface PolicyComplianceMetrics {
  total_requests: number;
  compliant_requests: number;
  compliance_rate: number;
  violations: {
    type: string;
    count: number;
  }[];
  top_violation_reasons: string[];
}

export interface PolicyTestResult {
  decision: 'auto_approve' | 'auto_deny' | 'human_review';
  confidence: number;
  reasoning: string;
  policy_violations: string[];
  risk_factors: string[];
}

export interface PolicyABTest {
  id: string;
  name: string;
  policy_a_id: number;
  policy_b_id: number;
  start_date: string;
  end_date?: string;
  status: 'running' | 'completed' | 'scheduled';
  metrics: {
    policy_a: {
      approval_rate: number;
      auto_approval_rate: number;
      customer_satisfaction: number;
    };
    policy_b: {
      approval_rate: number;
      auto_approval_rate: number;
      customer_satisfaction: number;
    };
    winner?: 'a' | 'b' | 'tie';
  };
}