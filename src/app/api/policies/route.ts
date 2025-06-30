import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const getSupabaseClient = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required')
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
}

// Mock data for demo mode - matches the policies table schema exactly
const mockPolicies = [
  {
    id: 1,
    created_at: "2024-01-01T00:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    version: "v1.0",
    is_active: true,
    effective_date: "2024-01-01T00:00:00Z",
    rules: [
      {
        id: 1,
        condition: "return_reason = 'defective'",
        action: "auto_approve",
        priority: 1,
        risk_threshold: 0.3
      },
      {
        id: 2,
        condition: "order_value > 1000",
        action: "manual_review",
        priority: 2,
        risk_threshold: 0.5
      },
      {
        id: 3,
        condition: "customer_history_score < 0.7",
        action: "manual_review",
        priority: 3,
        risk_threshold: 0.6
      }
    ],
    policy_impact_score: 0.85,
    usage_statistics: {
      total_requests_processed: 1250,
      auto_approved: 890,
      manual_reviews: 360,
      average_processing_time: 45000,
      customer_satisfaction: 4.2
    },
    compliance_metrics: {
      regulatory_compliance: 0.95,
      fraud_prevention_rate: 0.92,
      policy_violations_detected: 45,
      escalation_rate: 0.15
    }
  },
  {
    id: 2,
    created_at: "2024-06-01T00:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    version: "v1.1",
    is_active: false,
    effective_date: "2024-06-01T00:00:00Z",
    rules: [
      {
        id: 4,
        condition: "return_reason = 'defective' AND order_value < 500",
        action: "auto_approve",
        priority: 1,
        risk_threshold: 0.2
      },
      {
        id: 5,
        condition: "order_value > 500",
        action: "manual_review",
        priority: 2,
        risk_threshold: 0.4
      },
      {
        id: 6,
        condition: "customer_history_score < 0.8",
        action: "manual_review",
        priority: 3,
        risk_threshold: 0.5
      },
      {
        id: 7,
        condition: "days_since_purchase > 30",
        action: "auto_deny",
        priority: 4,
        risk_threshold: 0.8
      }
    ],
    policy_impact_score: 0.78,
    usage_statistics: {
      total_requests_processed: 850,
      auto_approved: 520,
      manual_reviews: 280,
      auto_denied: 50,
      average_processing_time: 38000,
      customer_satisfaction: 4.0
    },
    compliance_metrics: {
      regulatory_compliance: 0.98,
      fraud_prevention_rate: 0.94,
      policy_violations_detected: 32,
      escalation_rate: 0.12
    }
  },
  {
    id: 3,
    created_at: "2024-12-01T00:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    version: "v2.0",
    is_active: false,
    effective_date: "2024-12-01T00:00:00Z",
    rules: [
      {
        id: 8,
        condition: "ai_risk_score < 0.3",
        action: "auto_approve",
        priority: 1,
        risk_threshold: 0.3
      },
      {
        id: 9,
        condition: "ai_risk_score >= 0.3 AND ai_risk_score < 0.7",
        action: "manual_review",
        priority: 2,
        risk_threshold: 0.7
      },
      {
        id: 10,
        condition: "ai_risk_score >= 0.7",
        action: "auto_deny",
        priority: 3,
        risk_threshold: 1.0
      },
      {
        id: 11,
        condition: "fraud_flags.suspicious_pattern = true",
        action: "auto_deny",
        priority: 4,
        risk_threshold: 0.9
      }
    ],
    policy_impact_score: 0.92,
    usage_statistics: {
      total_requests_processed: 0,
      auto_approved: 0,
      manual_reviews: 0,
      auto_denied: 0,
      average_processing_time: 0,
      customer_satisfaction: 0
    },
    compliance_metrics: {
      regulatory_compliance: 0.99,
      fraud_prevention_rate: 0.96,
      policy_violations_detected: 0,
      escalation_rate: 0.08
    }
  }
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const demoMode = searchParams.get('demo_mode') === 'true'
    const businessId = searchParams.get('business_id')

    if (demoMode) {
      // Return mock data for demo mode
      return NextResponse.json({
        success: true,
        data: mockPolicies,
        demo_mode: true
      })
    }

    // Live mode - call Supabase Edge Function
    const supabase = getSupabaseClient()
    
    if (!businessId) {
      return NextResponse.json(
        { error: 'Business ID is required' },
        { status: 400 }
      )
    }

    // Call the policy-mcp-server Supabase function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/policy-mcp-server`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        action: 'list_policies'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch policies')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      data: result.data || [],
      demo_mode: false
    })

  } catch (error) {
    console.error('Error in policies API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const demoMode = searchParams.get('demo_mode') === 'true'
    const body = await request.json()

    if (demoMode) {
      // In demo mode, just return success
      return NextResponse.json({
        success: true,
        data: { ...body, id: Date.now() },
        demo_mode: true
      })
    }

    // Live mode - call Supabase Edge Function
    const supabase = getSupabaseClient()
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/policy-mcp-server`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create_policy',
        ...body
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create policy')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      data: result.data,
      demo_mode: false
    })

  } catch (error) {
    console.error('Error in policies API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 