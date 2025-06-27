'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Video, 
  Upload, 
  Save, 
  X, 
  Loader2,
  AlertTriangle,
  Trash,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createVideoPersona } from '@/lib/persona';
import { PersonaFormData } from '@/types/persona';

// Form validation schema
const videoPersonaSchema = z.object({
  persona_name: z.string().min(2, { message: 'Persona name must be at least 2 characters' }),
  video_samples: z.any().refine(files => files?.length >= 1, { message: 'At least one video sample is required' }),
  video_settings: z.object({
    system_prompt: z.string().optional(),
    context: z.string().optional()
  }).optional(),
  is_default: z.boolean().default(false)
});

interface VideoPersonaCreatorProps {
  businessId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VideoPersonaCreator({ businessId, onSuccess, onCancel }: VideoPersonaCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<PersonaFormData>({
    resolver: zodResolver(videoPersonaSchema),
    defaultValues: {
      persona_name: '',
      video_samples: undefined,
      video_settings: {
        system_prompt: 'You are a professional customer service representative. You help customers with return and refund requests. Be polite, professional, and empathetic.',
        context: 'Customer service for e-commerce returns and refunds'
      },
      is_default: false
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
      form.setValue('video_samples', fileArray);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    form.setValue('video_samples', newFiles.length > 0 ? newFiles : undefined);
  };

  const onSubmit = async (data: PersonaFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createVideoPersona(businessId, data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the video persona');
      console.error('Video persona creation error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="persona_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Persona Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Customer Support Video Avatar" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this video persona
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="video_samples"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Video Samples</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex items-center justify-center w-full">
                        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            <Upload className="w-8 h-8 mb-2 text-gray-500" />
                            <p className="mb-2 text-sm text-gray-500">
                              <span className="font-semibold">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-500">
                              MP4, MOV, or AVI (max 100MB per file)
                            </p>
                          </div>
                          <Input 
                            id="video-samples" 
                            type="file" 
                            className="hidden" 
                            accept="video/mp4,video/quicktime,video/x-msvideo" 
                            multiple
                            onChange={handleFileChange}
                            {...field}
                          />
                        </label>
                      </div>
                      
                      {selectedFiles.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-sm font-medium text-gray-700">Selected Files:</p>
                          {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                              <div className="flex items-center">
                                <Video className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm text-gray-700 truncate max-w-xs">{file.name}</span>
                              </div>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeFile(index)}
                              >
                                <Trash className="h-4 w-4 text-gray-500" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload a 1-2 minute video of yourself speaking naturally to the camera
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Persona Settings</h3>
            
            <FormField
              control={form.control}
              name="video_settings.system_prompt"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>System Prompt</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="You are a professional customer service representative..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Instructions for how the AI should behave and respond
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="video_settings.context"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Business Context</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="e.g., Customer service for e-commerce returns"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Additional context about your business domain
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="is_default"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 mt-6">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Set as Default</FormLabel>
                    <FormDescription>
                      Make this the default video persona for all video interactions
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
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onCancel}
            disabled={isSubmitting}
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
                Create Video Persona
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}