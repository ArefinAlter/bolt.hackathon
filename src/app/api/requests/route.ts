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

// Mock data for demo mode - matches the return_requests table schema exactly
const mockRequests = [
  {
    id: 1,
    public_id: "550e8400-e29b-41d4-a716-446655440001",
    created_at: "2024-12-01T10:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    order_id: "ORD-2024-001",
    customer_email: "customer1@example.com",
    reason_for_return: "Defective product - headphones not working",
    status: "pending_review",
    evidence_urls: ["receipt.pdf", "defect_photo.jpg", "video_evidence.mp4"],
    conversation_log: [
      {
        sender: "customer",
        message: "The headphones I received are not working properly",
        timestamp: "2024-12-01T10:05:00Z"
      },
      {
        sender: "agent",
        message: "I understand your concern. Can you describe the issue in detail?",
        timestamp: "2024-12-01T10:07:00Z"
      }
    ],
    ai_recommendation: "auto_approve",
    admin_notes: "Customer provided clear evidence of defect",
    risk_score: 0.3,
    fraud_flags: {
      suspicious_pattern: false,
      multiple_returns: false,
      high_value_item: false
    },
    triage_agent_id: "triage_agent_001",
    customer_service_agent_id: "cs_agent_001",
    processing_time_ms: 45000,
    escalation_reason: null,
    policy_version_used: "v1.0",
    admin_decision_at: null,
    days_since_purchase: 15,
    order_value: 299.99,
    product_category: "Electronics",
    customer_satisfaction_score: 4.2,
    ai_reasoning: "Low risk return, customer has good history, clear evidence provided",
    policy_violations: [],
    risk_factors: ["defective_product"],
    approved_at: null,
    denied_at: null,
    return_history: 1
  },
  {
    id: 2,
    public_id: "550e8400-e29b-41d4-a716-446655440002",
    created_at: "2024-12-01T11:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    order_id: "ORD-2024-002",
    customer_email: "customer2@example.com",
    reason_for_return: "Changed mind - decided to get a different model",
    status: "approved",
    evidence_urls: ["receipt.pdf"],
    conversation_log: [
      {
        sender: "customer",
        message: "I'd like to return this watch and get a different model",
        timestamp: "2024-12-01T11:05:00Z"
      },
      {
        sender: "agent",
        message: "No problem! I can help you with that return.",
        timestamp: "2024-12-01T11:07:00Z"
      }
    ],
    ai_recommendation: "auto_approve",
    admin_notes: "Standard return request - customer changed mind",
    risk_score: 0.1,
    fraud_flags: {
      suspicious_pattern: false,
      multiple_returns: false,
      high_value_item: false
    },
    triage_agent_id: "triage_agent_001",
    customer_service_agent_id: "cs_agent_002",
    processing_time_ms: 30000,
    escalation_reason: null,
    policy_version_used: "v1.0",
    admin_decision_at: "2024-12-01T11:30:00Z",
    days_since_purchase: 8,
    order_value: 199.99,
    product_category: "Wearables",
    customer_satisfaction_score: 4.5,
    ai_reasoning: "Standard return request, customer has good history",
    policy_violations: [],
    risk_factors: [],
    approved_at: "2024-12-01T11:30:00Z",
    denied_at: null,
    return_history: 0
  },
  {
    id: 3,
    public_id: "550e8400-e29b-41d4-a716-446655440003",
    created_at: "2024-12-01T12:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    order_id: "ORD-2024-003",
    customer_email: "customer3@example.com",
    reason_for_return: "Not as described - laptop specifications don't match listing",
    status: "pending_triage",
    evidence_urls: ["receipt.pdf", "product_photo.jpg", "description_screenshot.png", "comparison_chart.pdf"],
    conversation_log: [
      {
        sender: "customer",
        message: "The laptop I received doesn't match the specifications in the listing",
        timestamp: "2024-12-01T12:05:00Z"
      },
      {
        sender: "agent",
        message: "I'll need to review this case. Can you provide more details?",
        timestamp: "2024-12-01T12:10:00Z"
      }
    ],
    ai_recommendation: "manual_review",
    admin_notes: "High value item with specification discrepancy - needs manual review",
    risk_score: 0.7,
    fraud_flags: {
      suspicious_pattern: false,
      multiple_returns: true,
      high_value_item: true
    },
    triage_agent_id: "triage_agent_002",
    customer_service_agent_id: null,
    processing_time_ms: 120000,
    escalation_reason: "High value item with specification discrepancy",
    policy_version_used: "v1.0",
    admin_decision_at: null,
    days_since_purchase: 3,
    order_value: 1299.99,
    product_category: "Computers",
    customer_satisfaction_score: 2.8,
    ai_reasoning: "High value item, needs manual review due to specification discrepancy",
    policy_violations: ["specification_mismatch"],
    risk_factors: ["high_value_item", "specification_discrepancy", "multiple_returns"],
    approved_at: null,
    denied_at: null,
    return_history: 3
  },
  {
    id: 4,
    public_id: "550e8400-e29b-41d4-a716-446655440004",
    created_at: "2024-12-01T13:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    order_id: "ORD-2024-004",
    customer_email: "customer4@example.com",
    reason_for_return: "Wrong size received - ordered large, got medium",
    status: "approved",
    evidence_urls: ["receipt.pdf", "size_comparison.jpg"],
    conversation_log: [
      {
        sender: "customer",
        message: "I ordered a large but received a medium size",
        timestamp: "2024-12-01T13:05:00Z"
      },
      {
        sender: "agent",
        message: "I apologize for the error. I'll process your return immediately.",
        timestamp: "2024-12-01T13:07:00Z"
      }
    ],
    ai_recommendation: "auto_approve",
    admin_notes: "Clear shipping error - wrong size sent",
    risk_score: 0.2,
    fraud_flags: {
      suspicious_pattern: false,
      multiple_returns: false,
      high_value_item: false
    },
    triage_agent_id: "triage_agent_001",
    customer_service_agent_id: "cs_agent_003",
    processing_time_ms: 25000,
    escalation_reason: null,
    policy_version_used: "v1.0",
    admin_decision_at: "2024-12-01T13:15:00Z",
    days_since_purchase: 2,
    order_value: 89.99,
    product_category: "Clothing",
    customer_satisfaction_score: 4.0,
    ai_reasoning: "Clear shipping error, low risk return",
    policy_violations: [],
    risk_factors: ["shipping_error"],
    approved_at: "2024-12-01T13:15:00Z",
    denied_at: null,
    return_history: 0
  },
  {
    id: 5,
    public_id: "550e8400-e29b-41d4-a716-446655440005",
    created_at: "2024-12-01T14:00:00Z",
    business_id: "550e8400-e29b-41d4-a716-446655440000",
    order_id: "ORD-2024-005",
    customer_email: "customer5@example.com",
    reason_for_return: "Damaged during shipping - box was crushed",
    status: "pending_review",
    evidence_urls: ["receipt.pdf", "damaged_box.jpg", "damaged_item.jpg", "shipping_label.jpg"],
    conversation_log: [
      {
        sender: "customer",
        message: "The item arrived with a crushed box and is damaged",
        timestamp: "2024-12-01T14:05:00Z"
      },
      {
        sender: "agent",
        message: "I can see the damage from your photos. Let me escalate this.",
        timestamp: "2024-12-01T14:10:00Z"
      }
    ],
    ai_recommendation: "auto_approve",
    admin_notes: "Shipping damage confirmed with photos",
    risk_score: 0.4,
    fraud_flags: {
      suspicious_pattern: false,
      multiple_returns: false,
      high_value_item: false
    },
    triage_agent_id: "triage_agent_001",
    customer_service_agent_id: "cs_agent_004",
    processing_time_ms: 60000,
    escalation_reason: "Shipping damage claim",
    policy_version_used: "v1.0",
    admin_decision_at: null,
    days_since_purchase: 1,
    order_value: 159.99,
    product_category: "Home & Garden",
    customer_satisfaction_score: 3.5,
    ai_reasoning: "Shipping damage confirmed, should be approved",
    policy_violations: [],
    risk_factors: ["shipping_damage"],
    approved_at: null,
    denied_at: null,
    return_history: 1
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
        data: mockRequests,
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

    // Call the request-mcp-server Supabase function
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/request-mcp-server`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        business_id: businessId,
        action: 'list_requests'
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to fetch requests')
    }

    const result = await response.json()

    return NextResponse.json({
      success: true,
      data: result.data || [],
      demo_mode: false
    })

  } catch (error) {
    console.error('Error in requests API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 