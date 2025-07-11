'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  Package, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid, GridItem, Flex, Container } from '@/components/ui/grid';
import { Badge } from '@/components/ui/badge';
import { ReturnRequest } from '@/types/return';
import { supabase } from '@/lib/supabase';
import { Switch } from '@/components/ui/switch';
import { DemoToggle } from '@/components/common/DemoToggle';

export default function ReturnPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDemoMode, setIsDemoMode] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadReturns = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/login');
          return;
        }

        if (isDemoMode) {
          // Use demo data
          const demoReturns: ReturnRequest[] = [
            {
              id: 1,
              public_id: 'RET-001',
              customer_email: 'john.doe@example.com',
              business_id: 'demo-business-123',
              order_id: 'ORD-001',
              reason_for_return: 'Item arrived damaged',
              status: 'pending_triage',
              evidence_urls: ['https://example.com/evidence1.jpg'],
              conversation_log: [
                {
                  sender: 'customer',
                  message: 'The item arrived damaged and I need to return it',
                  timestamp: new Date().toISOString()
                },
                {
                  sender: 'agent',
                  message: 'I understand your concern. Let me help you with the return process.',
                  timestamp: new Date().toISOString()
                }
              ],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 2,
              public_id: 'RET-002',
              customer_email: 'jane.smith@example.com',
              business_id: 'demo-business-123',
              order_id: 'ORD-002',
              reason_for_return: 'Wrong size received',
              status: 'approved',
              evidence_urls: [],
              conversation_log: [
                {
                  sender: 'customer',
                  message: 'I ordered size M but received size L',
                  timestamp: new Date().toISOString()
                }
              ],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            {
              id: 3,
              public_id: 'RET-003',
              customer_email: 'mike.wilson@example.com',
              business_id: 'demo-business-123',
              order_id: 'ORD-003',
              reason_for_return: 'Changed my mind',
              status: 'denied',
              evidence_urls: [],
              conversation_log: [
                {
                  sender: 'customer',
                  message: 'I changed my mind about this purchase',
                  timestamp: new Date().toISOString()
                }
              ],
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ];
          setReturns(demoReturns);
        } else {
          // Get user profile to get business_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('business_id')
            .eq('id', session.user.id)
            .single();
          
          if (!profile) {
            console.error('Profile not found');
            setIsLoading(false);
            return;
          }
          
          // Fetch returns from database
          const { data: returnData } = await supabase
            .from('return_requests')
            .select('*')
            .eq('business_id', profile.business_id)
            .order('created_at', { ascending: false });
          
          if (returnData) {
            setReturns(returnData);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading returns:', error);
        setError('Failed to load return requests');
        setIsLoading(false);
      }
    };
    
    loadReturns();
  }, [router, isDemoMode]);

  const filteredReturns = returns.filter(returnRequest => {
    const matchesSearch = returnRequest.customer_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         returnRequest.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (returnRequest.reason_for_return ? returnRequest.reason_for_return.toLowerCase().includes(searchTerm.toLowerCase()) : false);
    
    const matchesStatus = filterStatus === 'all' || returnRequest.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending_triage':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Triage</Badge>;
      case 'pending_review':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="bg-red-100 text-red-800"><XCircle className="h-3 w-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusCount = (status: string) => {
    return returns.filter(r => r.status === status).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="space-y-4">
          {/* Header with Stats and Actions */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Return Requests</h1>
              <p className="text-gray-500">Track and manage your return requests</p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <DemoToggle 
                isDemoMode={isDemoMode} 
                onDemoModeChange={setIsDemoMode}
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/customer/chat')}
                  size="sm"
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chat with Support
                </Button>
                <Button 
                  className="bg-primary hover:bg-primary/90 text-black"
                  onClick={() => router.push('/return/new')}
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Return Request
                </Button>
              </div>
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

          {/* Compact Stats Bar */}
          <div className="bg-white border rounded-lg p-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Total</span>
                </div>
                <p className="text-xl font-bold text-gray-900">{returns.length}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Clock className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-500">Pending</span>
                </div>
                <p className="text-xl font-bold text-yellow-600">{getStatusCount('pending_triage') + getStatusCount('pending_review')}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-500">Approved</span>
                </div>
                <p className="text-xl font-bold text-green-600">{getStatusCount('approved')}</p>
              </div>
              
              <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-gray-500">Denied</span>
                </div>
                <p className="text-xl font-bold text-red-600">{getStatusCount('denied')}</p>
              </div>
            </div>
          </div>

          {/* Compact Filters */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by email, order ID, or reason..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 bg-white"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 min-w-[200px]">
                <Filter className="h-4 w-4 text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary w-full text-gray-900"
                >
                  <option value="all">All Status</option>
                  <option value="pending_triage">Pending Triage</option>
                  <option value="pending_review">Pending Review</option>
                  <option value="approved">Approved</option>
                  <option value="denied">Denied</option>
                </select>
              </div>
            </div>
          </div>

            {/* Returns List */}
            <div className="space-y-4">
              {filteredReturns.length === 0 ? (
                <Card className="border-0 shadow-md">
                  <CardContent className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No return requests found</h3>
                    <p className="text-gray-500 mb-4">
                      {searchTerm || filterStatus !== 'all' 
                        ? 'Try adjusting your search or filters'
                        : 'Get started by creating your first return request'
                      }
                    </p>
                    {!searchTerm && filterStatus === 'all' && (
                      <Button 
                        className="bg-primary hover:bg-primary/90 text-black"
                        onClick={() => router.push('/return/new')}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Return Request
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                filteredReturns.map((returnRequest) => (
                  <Card key={returnRequest.id} className="border-0 shadow-md hover:shadow-lg transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900">
                              {returnRequest.public_id}
                            </h3>
                            {getStatusBadge(returnRequest.status)}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-gray-500">Customer</p>
                              <p className="font-medium">{returnRequest.customer_email}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Order ID</p>
                              <p className="font-medium">{returnRequest.order_id}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">Reason</p>
                              <p className="font-medium truncate">{returnRequest.reason_for_return || 'Not specified'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                            <div className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              {new Date(returnRequest.created_at).toLocaleDateString()}
                            </div>
                            {returnRequest.evidence_urls && returnRequest.evidence_urls.length > 0 && (
                              <div className="flex items-center">
                                <Package className="h-4 w-4 mr-1" />
                                {returnRequest.evidence_urls.length} evidence file(s)
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-4 md:mt-0 md:ml-4">
                          <Button 
                            variant="outline"
                            onClick={() => router.push(`/return/${returnRequest.public_id}`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
          </div>
        </div>
      </main>
    </div>
  );
} 