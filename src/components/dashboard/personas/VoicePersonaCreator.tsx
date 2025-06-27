'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Mic, 
  Upload, 
  Save, 
  X, 
  Loader2,
  AlertTriangle,
  Trash
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { createVoicePersona } from '@/lib/persona';
import { PersonaFormData } from '@/types/persona';

// Form validation schema
const voicePersonaSchema = z.object({
  persona_name: z.string().min(2, { message: 'Persona name must be at least 2 characters' }),
  voice_samples: z.any().refine(files => files?.length >= 1, { message: 'At least one voice sample is required' }),
  voice_settings: z.object({
    stability: z.number().min(0).max(1),
    similarity_boost: z.number().min(0).max(1),
    style: z.number().min(0).max(1),
    accent: z.string().optional(),
    age: z.string().optional(),
    gender: z.string().optional()
  }),
  is_default: z.boolean().default(false)
});

interface VoicePersonaCreatorProps {
  businessId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function VoicePersonaCreator({ businessId, onSuccess, onCancel }: VoicePersonaCreatorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const form = useForm<PersonaFormData>({
    resolver: zodResolver(voicePersonaSchema),
    defaultValues: {
      persona_name: '',
      voice_samples: undefined,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0
      },
      is_default: false
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedFiles(fileArray);
      form.setValue('voice_samples', fileArray);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...selectedFiles];
    newFiles.splice(index, 1);
    setSelectedFiles(newFiles);
    form.setValue('voice_samples', newFiles.length > 0 ? newFiles : undefined);
  };

  const onSubmit = async (data: PersonaFormData) => {
    setIsSubmitting(true);
    setError(null);
    
    try {
      await createVoicePersona(businessId, data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the voice persona');
      console.error('Voice persona creation error:', err);
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
                    <Input placeholder="e.g., Customer Support Voice" {...field} />
                  </FormControl>
                  <FormDescription>
                    A descriptive name for this voice persona
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="voice_samples"
              render={({ field: { onChange, value, ...field } }) => (
                <FormItem>
                  <FormLabel>Voice Samples</FormLabel>
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
                              MP3, WAV, or M4A (max 10MB per file)
                            </p>
                          </div>
                          <Input 
                            id="voice-samples" 
                            type="file" 
                            className="hidden" 
                            accept="audio/mpeg,audio/wav,audio/mp4" 
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
                                <Mic className="h-4 w-4 text-gray-500 mr-2" />
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
                    Upload 1-3 voice samples for best results (30-60 seconds each)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Voice Settings</h3>
            
            <FormField
              control={form.control}
              name="voice_settings.stability"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stability ({(field.value * 100).toFixed(0)}%)</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher values make the voice more consistent but less expressive
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="voice_settings.similarity_boost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Similarity Boost ({(field.value * 100).toFixed(0)}%)</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher values make the voice sound more like the original samples
                  </FormDescription>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="voice_settings.style"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Style Emphasis ({(field.value * 100).toFixed(0)}%)</FormLabel>
                  <FormControl>
                    <Slider
                      min={0}
                      max={1}
                      step={0.01}
                      value={[field.value]}
                      onValueChange={(value) => field.onChange(value[0])}
                    />
                  </FormControl>
                  <FormDescription>
                    Higher values enhance the style from the voice samples
                  </FormDescription>
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
                      Make this the default voice persona for all voice interactions
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
                Create Voice Persona
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}