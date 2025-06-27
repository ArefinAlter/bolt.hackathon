'use client';

import { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Package,
  Calendar,
  DollarSign,
  Tag,
  User,
  MessageSquare,
  Image,
  FileText,
  BarChart,
  Shield,
  Save,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnRequest, ReturnRequestUpdateData } from '@/types/return';
import { updateReturnRequest } from '@/lib/return';
import { format } from 'date-fns';
import { StatusTimeline } from './StatusTimeline';
import { EvidenceGallery } from './EvidenceGallery';
import { ConversationLog } from './ConversationLog';

interface RequestDetailProps {
  request: ReturnRequest;
  onClose: () => void;
  onRequestUpdated: (updatedRequest: ReturnRequest) => void;
}

export function RequestDetail({ 
  request, 
  onClose,
  onRequestUpdated
}: RequestDetailProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState(request.admin_notes || '');
  const [decisionReason, setDecisionReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleUpdateStatus = async (status: 'approved' | 'denied' | 'completed') => {
    setIsUpdating(true);
    setError(null);
    
    try {
      const updateData: ReturnRequestUpdateData = {
        status,
        admin_notes: adminNotes,
        decision_reason: decisionReason
      };
      
      const updatedRequest = await updateReturnRequest(request.public_id, updateData);
      onRequestUpdated(updatedRequest);
    } catch (error) {
      console.error('Error updating request:', error);
      setError('Failed to update request status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Return Request Details</h2>
          <p className="text-gray-500">
            {request.order_id} • {format(new Date(request.created_at), 'MMM d, yyyy')}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline" 
            onClick={onClose}
          >
            <X className="mr-2 h-4 w-4" />
            Close
          </Button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Request details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status timeline */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Request Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <StatusTimeline request={request} />
            </CardContent>
          </Card>
          
          {/* Order details */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Package className="mr-2 h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-medium">{request.order_id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Customer</p>
                  <p className="font-medium">{request.customer_email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Purchase Date</p>
                  <p className="font-medium">
                    {request.order_details?.purchase_date 
                      ? format(new Date(request.order_details.purchase_date), 'MMM d, yyyy')
                      : 'Unknown'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Days Since Purchase</p>
                  <p className="font-medium">{request.days_since_purchase || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Product</p>
                  <p className="font-medium">{request.order_details?.product_name || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Category</p>
                  <p className="font-medium">{request.order_details?.product_category || request.product_category || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Order Value</p>
                  <p className="font-medium">
                    ${request.order_value?.toFixed(2) || 
                       request.order_details?.purchase_price?.toFixed(2) || 
                       '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Return Reason</p>
                  <p className="font-medium">{request.reason_for_return || 'Not specified'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Conversation log */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="mr-2 h-5 w-5" />
                Conversation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.conversation_log && request.conversation_log.length > 0 ? (
                <ConversationLog messages={request.conversation_log} />
              ) : (
                <div className="text-center py-6">
                  <MessageSquare className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No conversation history available</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Evidence gallery */}
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="mr-2 h-5 w-5" />
                Evidence Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              {request.evidence_urls && request.evidence_urls.length > 0 ? (
                <EvidenceGallery evidenceUrls={request.evidence_urls} />
              ) : (
                <div className="text-center py-6">
                  <Image className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No evidence files uploaded</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Right column - Decision panel */}
        <div className="space-y-6">
          {/* Status card */}
          <Card className={`border-0 shadow-md ${
            request.status === 'approved' 
              ? 'bg-green-50 border-green-200' 
              : request.status === 'denied'
                ? 'bg-red-50 border-red-200'
                : request.status === 'pending_review' || request.status === 'pending_triage'
                  ? 'bg-orange-50 border-orange-200'
                  : 'bg-purple-50 border-purple-200'
          }`}>
            <CardHeader>
              <CardTitle className="flex items-center">
                {request.status === 'approved' ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5 text-green-600" />
                    Approved
                  </>
                ) : request.status === 'denied' ? (
                  <>
                    <XCircle className="mr-2 h-5 w-5 text-red-600" />
                    Denied
                  </>
                ) : request.status === 'completed' ? (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5 text-purple-600" />
                    Completed
                  </>
                ) : (
                  <>
                    <Clock className="mr-2 h-5 w-5 text-orange-600" />
                    {request.status === 'pending_triage' ? 'Pending Triage' : 'Pending Review'}
                  </>
                )}
              </CardTitle>
              <CardDescription>
                {request.status === 'approved' 
                  ? `Approved on ${request.approved_at ? format(new Date(request.approved_at), 'MMM d, yyyy') : 'Unknown date'}`
                  : request.status === 'denied'
                    ? `Denied on ${request.denied_at ? format(new Date(request.denied_at), 'MMM d, yyyy') : 'Unknown date'}`
                    : request.status === 'completed'
                      ? 'Return process completed'
                      : 'Awaiting decision'}
              </CardDescription>
            </CardHeader>
          </Card>
          
          {/* AI recommendation */}
          {request.ai_recommendation && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  AI Recommendation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center mb-3">
                  <span className="font-medium mr-2">Decision:</span>
                  {request.ai_recommendation === 'auto_approve' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Approve
                    </span>
                  ) : request.ai_recommendation === 'auto_deny' ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <XCircle className="w-3 h-3 mr-1" />
                      Deny
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Human Review
                    </span>
                  )}
                </div>
                
                {request.ai_confidence_score !== undefined && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Confidence: {(request.ai_confidence_score * 100).toFixed(0)}%</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          request.ai_recommendation === 'auto_approve' 
                            ? 'bg-green-500' 
                            : request.ai_recommendation === 'auto_deny'
                              ? 'bg-red-500'
                              : 'bg-orange-500'
                        }`}
                        style={{ width: `${request.ai_confidence_score * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {request.ai_reasoning && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Reasoning:</p>
                    <p className="text-sm text-gray-700">{request.ai_reasoning}</p>
                  </div>
                )}
                
                {request.policy_violations && request.policy_violations.length > 0 && (
                  <div className="mb-3">
                    <p className="text-sm font-medium mb-1">Policy Violations:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {request.policy_violations.map((violation, index) => (
                        <li key={index}>{violation}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {request.risk_factors && request.risk_factors.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Risk Factors:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {request.risk_factors.map((factor, index) => (
                        <li key={index}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Risk assessment */}
          {request.risk_score !== undefined && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-3">
                  <p className="text-sm font-medium mb-1">Risk Score: {(request.risk_score * 100).toFixed(0)}%</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        request.risk_score < 0.3 
                          ? 'bg-green-500' 
                          : request.risk_score < 0.7
                            ? 'bg-orange-500'
                            : 'bg-red-500'
                      }`}
                      style={{ width: `${request.risk_score * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {request.risk_score < 0.3 
                      ? 'Low risk' 
                      : request.risk_score < 0.7
                        ? 'Medium risk'
                        : 'High risk'}
                  </p>
                </div>
                
                {request.fraud_flags && Object.keys(request.fraud_flags).length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-1">Fraud Flags:</p>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {Object.entries(request.fraud_flags)
                        .filter(([_, value]) => value)
                        .map(([flag], index) => (
                          <li key={index}>{flag.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</li>
                        ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Decision panel */}
          {(request.status === 'pending_review' || request.status === 'pending_triage') && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Make Decision</CardTitle>
                <CardDescription>
                  Review the request and make a decision
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Admin Notes
                    </label>
                    <Textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes about this return request..."
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Decision Reason (shared with customer)
                    </label>
                    <Textarea
                      value={decisionReason}
                      onChange={(e) => setDecisionReason(e.target.value)}
                      placeholder="Explain the reason for your decision..."
                      rows={3}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button 
                  variant="outline" 
                  className="border-red-200 text-red-700 hover:bg-red-50"
                  onClick={() => handleUpdateStatus('denied')}
                  disabled={isUpdating}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Updating...' : 'Deny Return'}
                </Button>
                <Button 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Updating...' : 'Approve Return'}
                </Button>
              </CardFooter>
            </Card>
          )}
          
          {/* Admin notes */}
          {request.admin_notes && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <FileText className="mr-2 h-5 w-5" />
                  Admin Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-700 whitespace-pre-line">{request.admin_notes}</p>
              </CardContent>
            </Card>
          )}
          
          {/* Complete button for approved returns */}
          {request.status === 'approved' && (
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle>Complete Return</CardTitle>
                <CardDescription>
                  Mark this return as completed once processed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => handleUpdateStatus('completed')}
                  disabled={isUpdating}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  {isUpdating ? 'Updating...' : 'Mark as Completed'}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}