import { supabase } from './supabase';
import { Policy, PolicyRule, PolicyTestResult, PolicyABTest, PolicyComplianceMetrics } from '@/types/policy';

// Fetch all policies for a business
export async function fetchPolicies(businessId: string): Promise<Policy[]> {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching policies:', error);
    throw error;
  }
}

// Fetch active policy for a business
export async function fetchActivePolicy(businessId: string): Promise<Policy | null> {
  try {
    const { data, error } = await supabase
      .from('policies')
      .select('*')
      .eq('business_id', businessId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data || null;
  } catch (error) {
    console.error('Error fetching active policy:', error);
    throw error;
  }
}

// Create a new policy
export async function createPolicy(
  businessId: string,
  version: string,
  rules: PolicyRule,
  effectiveDate: string
): Promise<Policy> {
  try {
    // Call the Supabase Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        version,
        rules,
        effective_date: effectiveDate
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create policy');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error creating policy:', error);
    throw error;
  }
}

// Update an existing policy
export async function updatePolicy(
  policyId: number,
  businessId: string,
  version: string,
  rules: PolicyRule,
  effectiveDate: string
): Promise<Policy> {
  try {
    // Call the Supabase Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/policies/${policyId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        version,
        rules,
        effective_date: effectiveDate
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update policy');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error updating policy:', error);
    throw error;
  }
}

// Activate a policy
export async function activatePolicy(policyId: number, businessId: string): Promise<Policy> {
  try {
    // Call the Supabase Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/policies/${policyId}/activate`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to activate policy');
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error activating policy:', error);
    throw error;
  }
}

// Fetch policy change history
export async function fetchPolicyHistory(businessId: string): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('policy_change_history')
      .select('*')
      .eq('business_id', businessId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching policy history:', error);
    throw error;
  }
}

// Test a policy against a sample return request
export async function testPolicy(
  businessId: string,
  rules: PolicyRule,
  testCase: {
    orderId: string;
    customerEmail: string;
    reason: string;
    orderValue: number;
    daysSincePurchase: number;
    evidenceUrls: string[];
    customerRiskScore: number;
    returnHistory: number;
    productCategory: string;
  }
): Promise<PolicyTestResult> {
  try {
    // Check if we're in demo mode
    const isDemoMode = businessId === '550e8400-e29b-41d4-a716-446655440000';
    
    if (isDemoMode) {
      // Return mock test result for demo mode
      const mockResult: PolicyTestResult = {
        decision: 'auto_approve',
        reasoning: 'Order value is within acceptable range and customer has low risk score. Return reason is valid and evidence is provided.',
        policy_violations: [],
        risk_factors: ['Customer has previous return history'],
        confidence: 0.85
      };
      
      // Simulate some policy violations based on test case
      if (testCase.daysSincePurchase > rules.return_window_days) {
        mockResult.policy_violations.push('Return window exceeded');
        mockResult.decision = 'auto_deny';
        mockResult.confidence = 0.95;
      }
      
      if (testCase.orderValue > 1000 && testCase.customerRiskScore > 0.7) {
        mockResult.risk_factors.push('High-value order from high-risk customer');
        mockResult.decision = 'human_review';
        mockResult.confidence = 0.75;
      }
      
      if (!rules.acceptable_reasons.includes(testCase.reason)) {
        mockResult.policy_violations.push('Return reason not acceptable');
        mockResult.decision = 'auto_deny';
        mockResult.confidence = 0.90;
      }
      
      return mockResult;
    }
    
    // Call the triage-agent function to test the policy
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('No active session');
    }
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/triage-agent`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestData: testCase,
        policyRules: rules,
        businessId
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to test policy');
    }
    
    const data = await response.json();
    
    // Ensure the response has the correct structure
    const result: PolicyTestResult = {
      decision: data.decision || 'human_review',
      reasoning: data.reasoning || 'No reasoning provided',
      policy_violations: data.policy_violations || [],
      risk_factors: data.risk_factors || [],
      confidence: data.confidence || 0.5
    };
    
    return result;
  } catch (error) {
    console.error('Error testing policy:', error);
    // Return a fallback result instead of throwing
    return {
      decision: 'human_review',
      reasoning: 'Error occurred during policy testing. Manual review required.',
      policy_violations: ['Policy test failed'],
      risk_factors: ['System error'],
      confidence: 0.0
    };
  }
}

// Create an A/B test between two policies
export async function createABTest(
  businessId: string,
  name: string,
  policyAId: number,
  policyBId: number,
  startDate: string,
  endDate: string
): Promise<PolicyABTest> {
  // This would normally call an API endpoint
  // For demo purposes, we'll return a mock response
  const mockABTest: PolicyABTest = {
    id: `abtest-${Date.now()}`,
    name,
    policy_a_id: policyAId,
    policy_b_id: policyBId,
    start_date: startDate,
    end_date: endDate,
    status: 'scheduled',
    metrics: {
      policy_a: {
        approval_rate: 0,
        auto_approval_rate: 0,
        customer_satisfaction: 0
      },
      policy_b: {
        approval_rate: 0,
        auto_approval_rate: 0,
        customer_satisfaction: 0
      }
    }
  };
  
  return mockABTest;
}

// Get policy compliance metrics
export async function getPolicyCompliance(businessId: string, policyId?: number): Promise<PolicyComplianceMetrics> {
  // This would normally call an API endpoint
  // For demo purposes, we'll return mock data
  return {
    total_requests: 125,
    compliant_requests: 112,
    compliance_rate: 89.6,
    violations: [
      { type: 'outside_return_window', count: 8 },
      { type: 'missing_evidence', count: 3 },
      { type: 'invalid_reason', count: 2 }
    ],
    top_violation_reasons: [
      'Return window exceeded',
      'Missing required evidence',
      'Reason not acceptable'
    ]
  };
}