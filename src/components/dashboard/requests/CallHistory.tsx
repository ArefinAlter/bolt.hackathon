'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Phone, 
  Clock, 
  MessageSquare, 
  User, 
  Search,
  Filter,
  Calendar,
  Play,
  Download
} from 'lucide-react';

interface CallRecord {
  id: string;
  chat_session_id: string;
  call_type: 'voice' | 'video' | 'test';
  provider: 'elevenlabs' | 'tavus' | 'test';
  external_session_id: string;
  status: 'initiated' | 'connecting' | 'active' | 'ended' | 'failed';
  duration_seconds: number;
  provider_data: any;
  created_at: string;
  ended_at: string;
  elevenlabs_agent_id?: string;
  elevenlabs_conversation_id?: string;
  tavus_replica_id?: string;
  tavus_conversation_id?: string;
  session_url: string;
  webhook_data: {
    satisfaction_score: number;
    call_successful: string;
    duration_seconds: number;
    messages_count: number;
  };
  is_active: boolean;
  persona_config_id: string;
  call_quality_score: number;
  customer_feedback: {
    satisfaction: number;
    comments: string;
  };
  streaming_enabled: boolean;
  websocket_url: string;
  stream_processor_urls: string[];
  streaming_config: any;
  real_time_events: any[];
  connection_count: number;
  last_stream_activity: string;
  stream_quality_metrics: any;
  ai_conversation_state_id: string;
  updated_at: string;
}

interface CallHistoryProps {
  businessId: string;
  isDemoMode?: boolean;
}

export function CallHistory({ businessId, isDemoMode = false }: CallHistoryProps) {
  console.log('CallHistory rendered', { businessId, isDemoMode });
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'in_progress'>('all');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  useEffect(() => {
    // Only load data if businessId is available
    if (businessId) {
      loadCallHistory();
    }
  }, [businessId]); // Only depend on businessId

  const loadCallHistory = async () => {
    try {
      setIsLoading(true);
      console.log('Loading call history for businessId:', businessId, 'isDemoMode:', isDemoMode);
      
      if (isDemoMode) {
        // Use the new API endpoint for demo mode
        const url = `/api/call-history?demo_mode=true&business_id=${businessId}`;
        console.log('Making API call to:', url);
        const response = await fetch(url);
        console.log('Call history response status:', response.status);
        console.log('Call history response headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('API response not ok:', errorText);
          throw new Error(`Failed to fetch call history: ${response.status} ${errorText}`);
        }
        
        const data = await response.json();
        console.log('Call history data received:', data);
        console.log('Call history data.data:', data.data);
        console.log('Call history data.data length:', data.data?.length);
        
        if (Array.isArray(data.data)) {
          setCalls(data.data);
          console.log('Successfully set calls:', data.data.length, 'calls');
        } else {
          console.error('Data.data is not an array:', data.data);
          setCalls([]);
        }
      } else {
        // TODO: Implement real API call
        const response = await fetch(`/api/call-history?business_id=${businessId}`);
        if (response.ok) {
          const data = await response.json();
          setCalls(data.data || []);
        }
      }
    } catch (error) {
      console.error('Error loading call history:', error);
      setCalls([]); // Set empty array on error
    } finally {
      setIsLoading(false);
      console.log('Finished loading call history, isLoading set to false');
    }
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.external_session_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (call.webhook_data?.satisfaction_score?.toString() || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || call.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'ended': { label: 'Completed', color: 'bg-green-100 text-green-800' },
      'failed': { label: 'Failed', color: 'bg-red-100 text-red-800' },
      'active': { label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
      'connecting': { label: 'Connecting', color: 'bg-yellow-100 text-yellow-800' },
      'initiated': { label: 'Initiated', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { label: status, color: 'bg-gray-100 text-gray-800' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getSatisfactionColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 4) return 'text-green-600';
    if (score >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Call History</h2>
          <p className="text-gray-600">Review past voice conversations and transcripts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="border rounded-md px-3 py-2 text-sm"
              >
                <option value="all">All Status</option>
                <option value="ended">Completed</option>
                <option value="failed">Failed</option>
                <option value="active">In Progress</option>
                <option value="connecting">Connecting</option>
                <option value="initiated">Initiated</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading call history...</p>
          </div>
        ) : filteredCalls.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <Phone className="h-12 w-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">No calls found</p>
            </CardContent>
          </Card>
        ) : (
          filteredCalls.map((call) => (
            <Card key={call.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <span className="font-medium">Conversation {call.external_session_id}</span>
                      {getStatusBadge(call.status)}
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDuration(call.duration_seconds)}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {call.webhook_data?.messages_count || 0} messages
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(call.created_at)}
                        </span>
                      </div>
                      
                      {call.customer_feedback?.satisfaction && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm font-medium ${getSatisfactionColor(call.customer_feedback.satisfaction)}`}>
                            {call.customer_feedback.satisfaction}/5
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {call.customer_feedback?.comments && (
                      <p className="text-sm text-gray-600 mb-3">
                        {call.customer_feedback.comments}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCall(call)}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Call Detail Modal */}
      {selectedCall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Call Details</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCall(null)}
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Conversation ID</label>
                  <p className="text-sm">{selectedCall.external_session_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <div className="mt-1">{getStatusBadge(selectedCall.status)}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duration</label>
                  <p className="text-sm">{formatDuration(selectedCall.duration_seconds)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Messages</label>
                  <p className="text-sm">{selectedCall.webhook_data?.messages_count || 0}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm">{formatDate(selectedCall.created_at)}</p>
                </div>
                {selectedCall.customer_feedback?.satisfaction && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Satisfaction</label>
                    <p className={`text-sm font-medium ${getSatisfactionColor(selectedCall.customer_feedback.satisfaction)}`}>
                      {selectedCall.customer_feedback.satisfaction}/5
                    </p>
                  </div>
                )}
              </div>
              
              {selectedCall.customer_feedback?.comments && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Comments</label>
                  <p className="text-sm mt-1">{selectedCall.customer_feedback.comments}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Download Transcript
                </Button>
                <Button variant="outline" size="sm">
                  <Play className="h-4 w-4 mr-2" />
                  Play Recording
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 