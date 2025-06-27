'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Package, 
  User, 
  FileText, 
  Save, 
  X,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createReturnRequest } from '@/lib/return';

// Form validation schema
const createReturnSchema = z.object({
  order_id: z.string().min(1, { message: 'Order ID is required' }),
  customer_email: z.string().email({ message: 'Valid email is required' }),
  reason_for_return: z.string().optional(),
});

type CreateReturnFormValues = z.infer<typeof createReturnSchema>;

interface CreateReturnFormProps {
  businessId: string;
  onSuccess?: () => void;
}

export function CreateReturnForm({ businessId, onSuccess }: CreateReturnFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<CreateReturnFormValues>({
    resolver: zodResolver(createReturnSchema),
    defaultValues: {
      order_id: '',
      customer_email: '',
      reason_for_return: '',
    },
  });

  const onSubmit = async (values: CreateReturnFormValues) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createReturnRequest(
        businessId,
        values.order_id,
        values.customer_email,
        values.reason_for_return
      );
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/requests');
      }
    } catch (error: any) {
      console.error('Error creating return request:', error);
      setError(error.message || 'Failed to create return request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard/requests');
  };

  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="mr-2 h-5 w-5" />
          Create Manual Return
        </CardTitle>
        <CardDescription>
          Create a return request on behalf of a customer
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="order_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order ID</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input className="pl-10" placeholder="e.g., ORDER-12345" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the order ID for this return
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="customer_email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Email</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                      <Input className="pl-10" placeholder="customer@example.com" {...field} />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Enter the customer's email address
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="reason_for_return"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Return (Optional)</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 text-gray-500 h-4 w-4" />
                      <Textarea 
                        className="pl-10" 
                        placeholder="Enter the reason for this return request..."
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Provide details about why the customer is returning the item
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90 text-black"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Return
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}