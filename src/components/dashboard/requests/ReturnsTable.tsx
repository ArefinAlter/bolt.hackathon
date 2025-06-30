'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Eye,
  Download,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchInput } from '@/components/common/SearchInput';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { ReturnRequest, ReturnRequestFilter } from '@/types/return';
import { fetchReturnRequests, subscribeToReturnRequests } from '@/lib/return';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useHotkeys } from 'react-hotkeys-hook';

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
  const { toast } = useToast();
  const [requests, setRequests] = useState<ReturnRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReturnRequestFilter>(initialFilter || {
    status: 'all',
    sortBy: 'created_at',
    sortDirection: 'desc',
    search: ''
  });
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);

  const loadReturnRequests = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we're in demo mode by checking if businessId is the demo ID
      const isDemoMode = businessId === '550e8400-e29b-41d4-a716-446655440000';
      
      if (isDemoMode) {
        // Use the API endpoint for demo mode
        const response = await fetch(`/api/requests?demo_mode=true&business_id=${businessId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch return requests');
        }
        
        const data = await response.json();
        setRequests(data.data || []);
      } else {
        // Use the existing function for live mode
        const data = await fetchReturnRequests(businessId, filter);
        setRequests(data);
      }
    } catch (error) {
      console.error('Error loading return requests:', error);
      setError('Failed to load return requests');
    } finally {
      setIsLoading(false);
    }
  }, [businessId, filter]);

  const handleRefresh = useCallback(() => {
    loadReturnRequests();
    toast({
      title: "Refreshed",
      description: "Return requests have been refreshed",
      duration: 2000,
    });
  }, [loadReturnRequests, toast]);

  // Register keyboard shortcuts
  useHotkeys('r', handleRefresh);
  useHotkeys('f', () => document.getElementById('search-input')?.focus());
  useHotkeys('n r', () => router.push('/dashboard/requests/new'));

  useEffect(() => {
    // Only load data if businessId is available
    if (businessId) {
      loadReturnRequests();
    }
    
    // Only subscribe to real-time updates if not in demo mode
    const isDemoMode = businessId === '550e8400-e29b-41d4-a716-446655440000';
    
    if (!isDemoMode && businessId) {
      // Subscribe to real-time updates
      const unsubscribe = subscribeToReturnRequests(businessId, (payload) => {
        // Reload data when changes occur
        loadReturnRequests();
        
        // Show toast notification
        toast({
          title: "Return request updated",
          description: `A return request has been ${payload.eventType === 'INSERT' ? 'created' : 'updated'}`,
          duration: 3000,
        });
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [businessId]);

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

  const handleExport = () => {
    // In a real implementation, this would generate a CSV or Excel file
    toast({
      title: "Export started",
      description: "Your export is being prepared and will download shortly",
      duration: 3000,
    });
    
    // Simulate download delay
    setTimeout(() => {
      const element = document.createElement('a');
      element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent('Return ID,Order ID,Customer,Date,Status,Reason,Value\n' + 
        requests.map(r => `${r.id},${r.order_id},${r.customer_email},${new Date(r.created_at).toLocaleDateString()},${r.status},${r.reason_for_return || 'Not specified'},${r.order_value || 0}`).join('\n')));
      element.setAttribute('download', `return-requests-${new Date().toISOString().split('T')[0]}.csv`);
      element.style.display = 'none';
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }, 1000);
  };

  const handleSelectAll = () => {
    if (selectedRequests.length === requests.length) {
      setSelectedRequests([]);
    } else {
      setSelectedRequests(requests.map(r => r.id));
    }
  };

  const handleSelectRequest = (id: number) => {
    if (selectedRequests.includes(id)) {
      setSelectedRequests(selectedRequests.filter(r => r !== id));
    } else {
      setSelectedRequests([...selectedRequests, id]);
    }
  };

  const handleBulkAction = (action: 'approve' | 'deny' | 'delete') => {
    if (selectedRequests.length === 0) return;
    
    // In a real implementation, this would call an API
    toast({
      title: `Bulk ${action} started`,
      description: `${selectedRequests.length} requests will be ${action}d`,
      duration: 3000,
    });
    
    // Reset selection
    setSelectedRequests([]);
  };

  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    let bgColor = '';
    let textColor = '';
    let icon = null;
    let label = '';
    
    switch (status) {
      case 'pending_triage':
        bgColor = 'bg-blue-50 dark:bg-blue-900/30';
        textColor = 'text-blue-700 dark:text-blue-300';
        icon = <Clock className="w-4 h-4 mr-1" />;
        label = 'Pending Triage';
        break;
      case 'pending_review':
        bgColor = 'bg-orange-50 dark:bg-orange-900/30';
        textColor = 'text-orange-700 dark:text-orange-300';
        icon = <Clock className="w-4 h-4 mr-1" />;
        label = 'Pending Review';
        break;
      case 'approved':
        bgColor = 'bg-green-50 dark:bg-green-900/30';
        textColor = 'text-green-700 dark:text-green-300';
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
        label = 'Approved';
        break;
      case 'denied':
        bgColor = 'bg-red-50 dark:bg-red-900/30';
        textColor = 'text-red-700 dark:text-red-300';
        icon = <XCircle className="w-4 h-4 mr-1" />;
        label = 'Denied';
        break;
      case 'completed':
        bgColor = 'bg-purple-50 dark:bg-purple-900/30';
        textColor = 'text-purple-700 dark:text-purple-300';
        icon = <CheckCircle className="w-4 h-4 mr-1" />;
        label = 'Completed';
        break;
      default:
        bgColor = 'bg-gray-50 dark:bg-gray-800';
        textColor = 'text-gray-700 dark:text-gray-300';
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
    <Card className="border-0 shadow-md dark:bg-gray-800 dark:border-gray-700">
      <CardHeader className="pb-2">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle className="text-2xl dark:text-white">Return Requests</CardTitle>
            <CardDescription className="dark:text-gray-400">
              View and manage all customer return requests
            </CardDescription>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="dark:border-gray-600 dark:text-gray-300"
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
          <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400 dark:text-red-300" />
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
            <SearchInput
              placeholder="Search by order ID, customer, or reason..."
              onSearch={handleSearch}
              initialValue={filter.search || ''}
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={!filter.status || filter.status === 'all' ? 'default' : 'outline'}
              className={!filter.status || filter.status === 'all' ? 'bg-primary text-black' : 'dark:border-gray-600 dark:text-gray-300'}
              onClick={() => handleStatusFilter('all')}
              size="sm"
            >
              All
            </Button>
            <Button
              variant={filter.status === 'pending_triage' || filter.status === 'pending_review' ? 'default' : 'outline'}
              className={filter.status === 'pending_triage' || filter.status === 'pending_review' ? 'bg-orange-500 text-white' : 'dark:border-gray-600 dark:text-gray-300'}
              onClick={() => handleStatusFilter(filter.status === 'pending_triage' ? 'pending_review' : 'pending_triage')}
              size="sm"
            >
              <Clock className="mr-2 h-4 w-4" />
              Pending
            </Button>
            <Button
              variant={filter.status === 'approved' ? 'default' : 'outline'}
              className={filter.status === 'approved' ? 'bg-green-500 text-white' : 'dark:border-gray-600 dark:text-gray-300'}
              onClick={() => handleStatusFilter(filter.status === 'approved' ? null : 'approved')}
              size="sm"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Approved
            </Button>
            <Button
              variant={filter.status === 'denied' ? 'default' : 'outline'}
              className={filter.status === 'denied' ? 'bg-red-500 text-white' : 'dark:border-gray-600 dark:text-gray-300'}
              onClick={() => handleStatusFilter(filter.status === 'denied' ? null : 'denied')}
              size="sm"
            >
              <XCircle className="mr-2 h-4 w-4" />
              Denied
            </Button>
          </div>
        </div>

        {/* Bulk actions */}
        {selectedRequests.length > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md p-2 mb-4 flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {selectedRequests.length} {selectedRequests.length === 1 ? 'request' : 'requests'} selected
            </span>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('approve')}
                className="text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-900/30"
              >
                <CheckCircle className="mr-2 h-3 w-3" />
                Approve
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleBulkAction('deny')}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/30"
              >
                <XCircle className="mr-2 h-3 w-3" />
                Deny
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setSelectedRequests([])}
                className="dark:border-gray-600 dark:text-gray-300"
              >
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Export button */}
        <div className="flex justify-end mb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="dark:border-gray-600 dark:text-gray-300">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExport}>
                Export as CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                Export as Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExport}>
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-md border border-gray-200 dark:border-gray-700">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner text="Loading return requests..." />
            </div>
          ) : requests.length > 0 ? (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-800 text-left">
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        checked={selectedRequests.length === requests.length && requests.length > 0}
                        onChange={handleSelectAll}
                      />
                    </div>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('id')}
                    >
                      Return ID
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('order_id')}
                    >
                      Order ID
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('customer_email')}
                    >
                      Customer
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('created_at')}
                    >
                      Date
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('status')}
                    >
                      Status
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('reason_for_return')}
                    >
                      Reason
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('order_value')}
                    >
                      Value
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded dark:border-gray-600 dark:bg-gray-700"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => handleSelectRequest(request.id)}
                      />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">{request.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">{request.order_id}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">{request.customer_email}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {format(new Date(request.created_at), 'MMM d, yyyy')}
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {request.reason_for_return || 'Not specified'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">
                      ${request.order_value?.toFixed(2) || 
                         request.order_details?.purchase_price?.toFixed(2) || 
                         '0.00'}
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900 dark:text-gray-300">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs dark:border-gray-600 dark:text-gray-300"
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
              <Package className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No return requests found</h3>
              <p className="text-gray-500 dark:text-gray-400">
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