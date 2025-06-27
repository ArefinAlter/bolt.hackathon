'use client';

import { useState } from 'react';
import { 
  Package, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowUpDown
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Mock data for return requests
const mockRequests = [
  {
    id: 'RET-001',
    orderId: 'ORDER-12345',
    customer: 'john.doe@example.com',
    date: '2023-12-15',
    status: 'pending_review',
    reason: 'Defective product',
    value: 99.99
  },
  {
    id: 'RET-002',
    orderId: 'ORDER-67890',
    customer: 'jane.smith@example.com',
    date: '2023-12-14',
    status: 'approved',
    reason: 'Wrong item received',
    value: 149.99
  },
  {
    id: 'RET-003',
    orderId: 'ORDER-24680',
    customer: 'bob.johnson@example.com',
    date: '2023-12-10',
    status: 'denied',
    reason: 'Outside return window',
    value: 79.99
  },
  {
    id: 'RET-004',
    orderId: 'ORDER-13579',
    customer: 'alice.williams@example.com',
    date: '2023-12-13',
    status: 'pending_triage',
    reason: 'Changed mind',
    value: 199.99
  },
  {
    id: 'RET-005',
    orderId: 'ORDER-97531',
    customer: 'charlie.brown@example.com',
    date: '2023-12-12',
    status: 'approved',
    reason: 'Item damaged in shipping',
    value: 129.99
  }
];

export default function RequestsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort the requests
  const filteredRequests = mockRequests
    .filter(request => {
      // Apply search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          request.orderId.toLowerCase().includes(searchLower) ||
          request.customer.toLowerCase().includes(searchLower) ||
          request.reason.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .filter(request => {
      // Apply status filter
      if (statusFilter) {
        return request.status === statusFilter;
      }
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      if (!sortField) return 0;
      
      let comparison = 0;
      
      switch (sortField) {
        case 'date':
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
          break;
        case 'value':
          comparison = a.value - b.value;
          break;
        default:
          comparison = String(a[sortField as keyof typeof a]).localeCompare(
            String(b[sortField as keyof typeof b])
          );
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });

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
    <div className="space-y-6">
      <Card className="border-0 shadow-md">
        <CardHeader className="pb-2">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="text-2xl">Return Requests</CardTitle>
              <CardDescription>
                View and manage all customer return requests
              </CardDescription>
            </div>
            <div className="mt-4 md:mt-0">
              <Button className="bg-primary hover:bg-primary/90 text-black">
                <Package className="mr-2 h-4 w-4" />
                Create Manual Return
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search by order ID, customer, or reason..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === null ? 'default' : 'outline'}
                className={statusFilter === null ? 'bg-primary text-black' : ''}
                onClick={() => setStatusFilter(null)}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'pending_triage' || statusFilter === 'pending_review' ? 'default' : 'outline'}
                className={statusFilter === 'pending_triage' || statusFilter === 'pending_review' ? 'bg-orange-500 text-white' : ''}
                onClick={() => setStatusFilter(statusFilter === 'pending_triage' ? 'pending_review' : 'pending_triage')}
              >
                <Clock className="mr-2 h-4 w-4" />
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                className={statusFilter === 'approved' ? 'bg-green-500 text-white' : ''}
                onClick={() => setStatusFilter(statusFilter === 'approved' ? null : 'approved')}
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Approved
              </Button>
              <Button
                variant={statusFilter === 'denied' ? 'default' : 'outline'}
                className={statusFilter === 'denied' ? 'bg-red-500 text-white' : ''}
                onClick={() => setStatusFilter(statusFilter === 'denied' ? null : 'denied')}
              >
                <XCircle className="mr-2 h-4 w-4" />
                Denied
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
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
                      onClick={() => handleSort('orderId')}
                    >
                      Order ID
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('customer')}
                    >
                      Customer
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('date')}
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
                      onClick={() => handleSort('reason')}
                    >
                      Reason
                      <ArrowUpDown className="ml-1 h-4 w-4" />
                    </button>
                  </th>
                  <th className="px-4 py-3 text-sm font-medium text-gray-500">
                    <button 
                      className="flex items-center"
                      onClick={() => handleSort('value')}
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
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm text-gray-900">{request.id}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{request.orderId}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{request.customer}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">{request.date}</td>
                    <td className="px-4 py-4 text-sm">
                      <StatusBadge status={request.status} />
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-900">{request.reason}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">${request.value.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="text-xs"
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
                
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                      No return requests found matching your filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}