'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Save, 
  X, 
  Plus, 
  Minus, 
  HelpCircle,
  Calendar,
  DollarSign,
  Clock,
  FileCheck,
  Tag,
  ShieldAlert,
  Mic,
  Video,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Policy, PolicyRule } from '@/types/policy';

// Form validation schema
const policySchema = z.object({
  version: z.string().min(1, { message: 'Version is required' }),
  effective_date: z.string().min(1, { message: 'Effective date is required' }),
  rules: z.object({
    return_window_days: z.number().min(1, { message: 'Return window must be at least 1 day' }),
    auto_approve_threshold: z.number().min(0, { message: 'Threshold must be a positive number' }),
    required_evidence: z.array(z.string()),
    acceptable_reasons: z.array(z.string()),
    high_risk_categories: z.array(z.string()),
    fraud_flags: z.array(z.string()),
    allow_voice_calls: z.boolean().optional(),
    allow_video_calls: z.boolean().optional(),
    record_calls: z.boolean().optional(),
    max_call_duration: z.number().optional(),
    auto_escalation_threshold: z.number().optional()
  })
});

type PolicyFormValues = z.infer<typeof policySchema>;

interface PolicyEditorProps {
  policy?: Policy;
  businessId: string;
  onSave: (policy: PolicyFormValues) => Promise<void>;
  onCancel: () => void;
  isNew?: boolean;
}

export function PolicyEditor({ policy, businessId, onSave, onCancel, isNew = false }: PolicyEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with default values or existing policy
  const form = useForm<PolicyFormValues>({
    resolver: zodResolver(policySchema),
    defaultValues: policy ? {
      version: policy.version,
      effective_date: policy.effective_date.split('T')[0], // Format date for input
      rules: {
        ...policy.rules,
        required_evidence: policy.rules.required_evidence || [],
        acceptable_reasons: policy.rules.acceptable_reasons || [],
        high_risk_categories: policy.rules.high_risk_categories || [],
        fraud_flags: policy.rules.fraud_flags || [],
        allow_voice_calls: policy.rules.allow_voice_calls || true,
        allow_video_calls: policy.rules.allow_video_calls || true,
        record_calls: policy.rules.record_calls || false,
        max_call_duration: policy.rules.max_call_duration || 1800,
        auto_escalation_threshold: policy.rules.auto_escalation_threshold || 500
      }
    } : {
      version: isNew ? 'v1.0' : '',
      effective_date: new Date().toISOString().split('T')[0],
      rules: {
        return_window_days: 30,
        auto_approve_threshold: 100,
        required_evidence: ['photo'],
        acceptable_reasons: ['defective', 'wrong_item', 'damaged', 'not_as_described'],
        high_risk_categories: ['electronics', 'jewelry'],
        fraud_flags: ['multiple_returns', 'high_value', 'suspicious_pattern'],
        allow_voice_calls: true,
        allow_video_calls: true,
        record_calls: false,
        max_call_duration: 1800,
        auto_escalation_threshold: 500
      }
    }
  });

  const handleSubmit = async (values: PolicyFormValues) => {
    setIsSubmitting(true);
    try {
      await onSave(values);
    } catch (error) {
      console.error('Error saving policy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Array management helpers
  const addArrayItem = (field: string, value: string) => {
    const currentValues = form.getValues(`rules.${field}` as any) as string[];
    if (value && !currentValues.includes(value)) {
      form.setValue(`rules.${field}` as any, [...currentValues, value]);
    }
  };

  const removeArrayItem = (field: string, index: number) => {
    const currentValues = form.getValues(`rules.${field}` as any) as string[];
    form.setValue(
      `rules.${field}` as any,
      currentValues.filter((_, i) => i !== index)
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {isNew ? 'Create New Policy' : `Editing Policy ${policy?.version}`}
          </h2>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              onClick={onCancel}
              type="button"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary hover:bg-primary/90 text-black"
              disabled={isSubmitting}
            >
              <Save className="mr-2 h-4 w-4" />
              {isSubmitting ? 'Saving...' : 'Save Policy'}
            </Button>
          </div>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="mr-2 h-5 w-5" />
                Policy Details
              </CardTitle>
              <CardDescription>
                Basic information about this policy version
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Version</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., v1.0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Use semantic versioning (e.g., v1.0, v1.1)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="effective_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effective Date</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input type="date" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      When this policy will take effect
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2 h-5 w-5" />
                Return Window & Thresholds
              </CardTitle>
              <CardDescription>
                Core rules for return eligibility
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="rules.return_window_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Return Window (days)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        {...field} 
                        onChange={e => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormDescription>
                      Number of days after purchase that returns are accepted
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rules.auto_approve_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto-Approve Threshold ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input 
                          type="number" 
                          min={0} 
                          className="pl-10"
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Returns below this value can be auto-approved
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="rules.auto_escalation_threshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto-Escalation Threshold ($)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                        <Input 
                          type="number" 
                          min={0} 
                          className="pl-10"
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Returns above this value require human review
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileCheck className="mr-2 h-5 w-5" />
                Required Evidence & Acceptable Reasons
              </CardTitle>
              <CardDescription>
                What evidence is needed and which reasons are valid
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <FormLabel>Required Evidence</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                  {form.watch('rules.required_evidence').map((evidence, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      <span>{evidence}</span>
                      <button 
                        type="button" 
                        onClick={() => removeArrayItem('required_evidence', index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Add evidence type..."
                    id="new-evidence"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('new-evidence') as HTMLInputElement;
                      addArrayItem('required_evidence', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Examples: photo, video, receipt, etc.
                </p>
              </div>
              
              <div>
                <FormLabel>Acceptable Reasons</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                  {form.watch('rules.acceptable_reasons').map((reason, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      <span>{reason}</span>
                      <button 
                        type="button" 
                        onClick={() => removeArrayItem('acceptable_reasons', index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Add reason..."
                    id="new-reason"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('new-reason') as HTMLInputElement;
                      addArrayItem('acceptable_reasons', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Examples: defective, wrong_item, damaged, etc.
                </p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ShieldAlert className="mr-2 h-5 w-5" />
                Risk Management
              </CardTitle>
              <CardDescription>
                Categories and flags for risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <FormLabel>High-Risk Categories</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                  {form.watch('rules.high_risk_categories').map((category, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      <span>{category}</span>
                      <button 
                        type="button" 
                        onClick={() => removeArrayItem('high_risk_categories', index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Add category..."
                    id="new-category"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('new-category') as HTMLInputElement;
                      addArrayItem('high_risk_categories', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Examples: electronics, jewelry, luxury, etc.
                </p>
              </div>
              
              <div>
                <FormLabel>Fraud Flags</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                  {form.watch('rules.fraud_flags').map((flag, index) => (
                    <div 
                      key={index} 
                      className="bg-gray-100 px-3 py-1 rounded-full flex items-center text-sm"
                    >
                      <span>{flag}</span>
                      <button 
                        type="button" 
                        onClick={() => removeArrayItem('fraud_flags', index)}
                        className="ml-2 text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <Input 
                    placeholder="Add flag..."
                    id="new-flag"
                  />
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      const input = document.getElementById('new-flag') as HTMLInputElement;
                      addArrayItem('fraud_flags', input.value);
                      input.value = '';
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Examples: multiple_returns, high_value, suspicious_pattern, etc.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mic className="mr-2 h-5 w-5" />
              Voice & Video Call Settings
            </CardTitle>
            <CardDescription>
              Configure settings for AI voice and video calls
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="rules.allow_voice_calls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Voice Calls</FormLabel>
                        <FormDescription>
                          Enable AI voice call support for returns
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-6 w-6 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rules.allow_video_calls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Allow Video Calls</FormLabel>
                        <FormDescription>
                          Enable AI video call support for returns
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-6 w-6 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="rules.record_calls"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Record Calls</FormLabel>
                        <FormDescription>
                          Save recordings of customer calls
                        </FormDescription>
                      </div>
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="h-6 w-6 text-primary focus:ring-primary border-gray-300 rounded"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="rules.max_call_duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Call Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={60} 
                          {...field} 
                          onChange={e => field.onChange(parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <FormDescription>
                        Maximum length of AI calls (recommended: 1800 seconds / 30 minutes)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}