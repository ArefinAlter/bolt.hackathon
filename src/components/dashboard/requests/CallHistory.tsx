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
  conversation_id: string;
  agent_id: string;
  status: 'completed' | 'failed' | 'in_progress';
  duration_seconds: number;
  messages_count: number;
  satisfaction_score?: number;
  created_at: string;
  transcript_summary?: string;
  call_successful?: string;
}

interface CallHistoryProps {
  businessId: string;
  isDemoMode?: boolean;
}

export function CallHistory({ businessId, isDemoMode = false }: CallHistoryProps) {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'failed' | 'in_progress'>('all');
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);

  useEffect(() => {
    loadCallHistory();
  }, [businessId]);

  const loadCallHistory = async () => {
    try {
      setIsLoading(true);
      
      if (isDemoMode) {
        // Demo data
        const demoCalls: CallRecord[] = [
          {
            id: '1',
            conversation_id: 'conv_001',
            agent_id: 'agent_001',
            status: 'completed',
            duration_seconds: 245,
            messages_count: 12,
            satisfaction_score: 4.2,
            created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
            transcript_summary: 'Customer requested return for damaged item. Agent processed return successfully.',
            call_successful: 'success'
          },
          {
            id: '2',
            conversation_id: 'conv_002',
            agent_id: 'agent_001',
            status: 'completed',
            duration_seconds: 180,
            messages_count: 8,
            satisfaction_score: 3.8,
            created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            transcript_summary: 'Customer inquired about shipping status. Agent provided tracking information.',
            call_successful: 'success'
          },
          {
            id: '3',
            conversation_id: 'conv_003',
            agent_id: 'agent_002',
            status: 'failed',
            duration_seconds: 45,
            messages_count: 3,
            satisfaction_score: 1.5,
            created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            transcript_summary: 'Call disconnected due to poor connection.',
            call_successful: 'failed'
          }
        ];
        setCalls(demoCalls);
      } else {
        // TODO: Implement real API call
        const response = await fetch(`/api/call-history?business_id=${businessId}`);
        if (response.ok) {
          const data = await response.json();
          setCalls(data.calls || []);
        }
      }
    } catch (error) {
      console.error('Error loading call history:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCalls = calls.filter(call => {
    const matchesSearch = call.conversation_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         call.transcript_summary?.toLowerCase().includes(searchTerm.toLowerCase());
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
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      case 'in_progress':
        return <Badge variant="secondary">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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
                <option value="completed">Completed</option>
                <option value="failed">Failed</option>
                <option value="in_progress">In Progress</option>
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
                      <span className="font-medium">Conversation {call.conversation_id}</span>
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
                          {call.messages_count} messages
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">
                          {formatDate(call.created_at)}
                        </span>
                      </div>
                      
                      {call.satisfaction_score && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className={`text-sm font-medium ${getSatisfactionColor(call.satisfaction_score)}`}>
                            {call.satisfaction_score}/5
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {call.transcript_summary && (
                      <p className="text-sm text-gray-600 mb-3">
                        {call.transcript_summary}
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
                  <p className="text-sm">{selectedCall.conversation_id}</p>
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
                  <p className="text-sm">{selectedCall.messages_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Date</label>
                  <p className="text-sm">{formatDate(selectedCall.created_at)}</p>
                </div>
                {selectedCall.satisfaction_score && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Satisfaction</label>
                    <p className={`text-sm font-medium ${getSatisfactionColor(selectedCall.satisfaction_score)}`}>
                      {selectedCall.satisfaction_score}/5
                    </p>
                  </div>
                )}
              </div>
              
              {selectedCall.transcript_summary && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Summary</label>
                  <p className="text-sm mt-1">{selectedCall.transcript_summary}</p>
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