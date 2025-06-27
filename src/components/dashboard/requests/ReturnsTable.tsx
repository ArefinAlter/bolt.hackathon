'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowUpDown,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnRequest, ReturnRequestFilter } from '@/types/return';
import { fetchReturnRequests, subscribeToReturnRequests } from '@/lib/return';
import { format } from 'date-fns';

interface ReturnsTableProps {
  businessId: string;
  onViewRequest: (request: ReturnRequest) => void;
  initialFilter?: ReturnRequestFilter;
}

export function ReturnsTable({ 
  businessId, 
  onViewRequest,
  initialFilter
}: ReturnsTableProps) {
  const router = useRouter();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReturnRequestFilter>(initialFilter || {
    status: 'all',
    sortBy: 'created_at',
    sortDirection: 'desc',
    search: ''
  });

  useEffect(() => {
    loadReturnRequests();
    
    // Subscribe to real-time updates
    const unsubscribe = subscribeToReturnRequests(businessId, (payload) => {
      // Reload data when changes occur
      loadReturnRequests();
    });
    
    return () => {
      unsubscribe();
    };
  }, [businessId, filter]);

  const loadReturnRequests = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await fetchReturnRequests(businessId, filter);
      setRequests(data);
    } catch (error) {
      console.error('Error loading return requests:', error);
      setError('Failed to load return requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setFilter(prev => ({
      ...prev,
      sortBy: field,
      sortDirection: prev.sortBy === field && prev.sortDirection === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatusFilter = (status: string | null) => {
    setFilter(prev => ({
      ...prev,
      status: status === 'all' ? undefined : status || undefined
    }));
  };

  const handleSearch = (term: string) => {
    setFilter(prev => ({
      ...prev,
      search: term
    }));
  };

  const handleRefresh = () => {
    loadReturnRequests();
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = '';
    let textColor = '';
    let icon = null;
    let label = '';
    
    switch (status) {
      case 'pending_triage':
        bgColor = 'bg-blue-50';
        textColor = 'text-blue-700';
        icon = <Clock className="w-4 h-4 mr-1" />;
        label = 'Pending Triage';
        break;
      case 'pending_review':
        bgColor = 'bg-orange-50';
        textColor = 'text-orange-700';
        icon = <Clock className="w-4 h-4 mr-1" />;
        label = 'Pending Review';
        break;
      case 'approved':
        bgColor = 'bg-green-50';
        textColor = 'text-green-700';
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
        label = 'Approved';
        break;
      case 'denied':
        bgColor = 'bg-red-50';
        textColor = 'text-red-700';
        icon = <XCircle className="w-4 h-4 mr-1" />;
        label = 'Denied';
        break;
      case 'completed':
        bgColor = 'bg-purple-50';
        textColor = 'text-purple-700';
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
        label = 'Completed';
        break;
      default:
        bgColor = 'bg-gray-50';
        textColor = 'text-gray-700';
        label = status;
    }
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        {label}
      </span>
    );
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl">Return Requests</CardTitle>
            <CardDescription>
              View and manage all customer return requests
            </CardDescription>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button 
              className="bg-primary hover:bg-primary/90 text-black"
              size="sm"
              onClick={() => router.push('/dashboard/requests/new')}
            >
              <Package className="mr-2 h-4 w-4" />
              Create Manual Return
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
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
        
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <Input
              placeholder="Search by order ID, customer, or reason..."
              className="pl-10"
              value={filter.search || ''}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={!filter.status || filter.status === 'all' ? 'default' : 'outline'}
              className={!filter.status || filter.status === 'all' ? 'bg-primary text-black' : ''}
              onClick={() => handleStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter.status === 'pending_triage' || filter.status === 'pending_review' ? 'default' : 'outline'}
              className={filter.status === 'pending_triage' || filter.status === 'pending_review' ? 'bg-orange-500 text-white' : ''}
              onClick={() => handleStatusFilter(filter.status === 'pending_triage' ? 'pending_review' : 'pending_triage')}
              size="sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pending
            </Button>
            <Button
              variant={filter.status === 'approved' ? 'default' : 'outline'}
              className={filter.status === 'approved' ? 'bg-green-500 text-white' : ''}
              onClick={() => handleStatusFilter(filter.status === 'approved' ? null : 'approved')}
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved
            </Button>
            <Button
              variant={filter.status === 'denied' ? 'default' : 'outline'}
              className={filter.status === 'denied' ? 'bg-red-500 text-white' : ''}
              onClick={() => handleStatusFilter(filter.status === 'denied' ? null : 'denied')}
              size="sm"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Denied
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : requests.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 rounded-tl-lg">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('id')}
                    >
                      Return ID
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('order_id')}
                    >
                      Order ID
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('customer_email')}
                    >
                      Customer
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('created_at')}
                    >
                      Date
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('reason_for_return')}
                    >
                      Reason
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('order_value')}
                    >
                      Value
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{request.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{request.order_id}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{request.customer_email}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      {request.reason_for_return || 'Not specified'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      ${request.order_value?.toFixed(2) || 
                         request.order_details?.purchase_price?.toFixed(2) || 
                         '0.00'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                        onClick={() => onViewRequest(request)}
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">No return requests found</h3>
              <p className="text-gray-500">
                {filter.search || filter.status
                  ? 'Try adjusting your filters to see more results'
                  : 'Return requests will appear here when customers make them'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}