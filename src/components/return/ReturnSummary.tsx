'use client';

import { 
  Package, 
  Calendar, 
  Tag, 
  DollarSign, 
  FileText, 
  ShoppingBag 
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ReturnRequest } from '@/types/return';
import { format } from 'date-fns';

interface ReturnSummaryProps {
  request: ReturnRequest;
}

export function ReturnSummary({ request }: ReturnSummaryProps) {
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Return Summary
        </CardTitle>
        <CardDescription>
          Details about your return request
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Order ID</p>
              <p className="font-medium flex items-center">
                <ShoppingBag className="h-4 w-4 mr-1 text-black" />
                {request.order_id}
              </p>
            </div>
            <div>
              <p className="text-sm text-black">Date Requested</p>
              <p className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-black" />
                {format(new Date(request.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Product</p>
              <p className="font-medium flex items-center">
                <Tag className="h-4 w-4 mr-1 text-black" />
                {request.order_details?.product_name || 'Unknown'}
              </p>
            </div>
            <div>
              <p className="text-sm text-black">Category</p>
              <p className="font-medium flex items-center">
                <FileText className="h-4 w-4 mr-1 text-black" />
                {request.order_details?.product_category || request.product_category || 'Unknown'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-black">Order Value</p>
              <p className="font-medium flex items-center">
                <DollarSign className="h-4 w-4 mr-1 text-black" />
                ${request.order_value?.toFixed(2) || 
                   request.order_details?.purchase_price?.toFixed(2) || 
                   '0.00'}
              </p>
            </div>
            <div>
              <p className="text-sm text-black">Purchase Date</p>
              <p className="font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-1 text-black" />
                {request.order_details?.purchase_date 
                  ? format(new Date(request.order_details.purchase_date), 'MMM d, yyyy')
                  : 'Unknown'}
              </p>
            </div>
          </div>
          
          <div>
            <p className="text-sm text-black">Return Reason</p>
            <p className="font-medium mt-1">
              {request.reason_for_return || 'Not specified'}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}