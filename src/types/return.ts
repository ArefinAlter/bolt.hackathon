export interface ReturnRequest {
  id: string;
  public_id: string;
  business_id: string;
  order_id: string;
  customer_email: string;
  reason_for_return?: string;
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed';
  evidence_urls?: string[];
  conversation_log?: ConversationMessage[];
  ai_recommendation?: string;
  ai_confidence_score?: number;
  admin_notes?: string;
  risk_score?: number;
  fraud_flags?: Record<string, boolean>;
  policy_violations?: string[];
  risk_factors?: string[];
  created_at: string;
  approved_at?: string;
  denied_at?: string;
  admin_decision_at?: string;
  days_since_purchase?: number;
  order_value?: number;
  product_category?: string;
  order_details?: OrderDetails;
}

export interface OrderDetails {
  order_id: string;
  purchase_date: string;
  customer_email: string;
  product_name: string;
  product_category: string;
  purchase_price?: number;
}

export interface ConversationMessage {
  sender: 'customer' | 'agent' | 'system';
  message: string;
  timestamp: string;
}

export interface ReturnRequestsResponse {
  success: boolean;
  data: ReturnRequest[];
}

export interface ReturnRequestResponse {
  success: boolean;
  data: ReturnRequest;
}

export interface ReturnRequestUpdateData {
  status: 'pending_triage' | 'pending_review' | 'approved' | 'denied' | 'completed';
  admin_notes?: string;
  decision_reason?: string;
}

export interface ReturnRequestFilter {
  status?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}