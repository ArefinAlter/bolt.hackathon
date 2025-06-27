'use client';

import { useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  File, 
  Trash2, 
  Loader2,
  Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { EvidenceFile } from '@/types/return';

interface EvidenceUploaderProps {
  onClose: () => void;
  onUpload: (files: File[]) => void;
  isUploading: boolean;
  evidenceFiles: EvidenceFile[];
  setEvidenceFiles: React.Dispatch<React.SetStateAction<EvidenceFile[]>>;
}

export function EvidenceUploader({ 
  onClose, 
  onUpload, 
  isUploading,
  evidenceFiles,
  setEvidenceFiles
}: EvidenceUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    const newFiles = Array.from(files);
    addFiles(newFiles);
  };

  const handleDrag = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      addFiles(newFiles);
    }
  };

  const addFiles = (files: File[]) => {
    // Validate file size
    const validFiles = files.filter(file => file.size <= 10 * 1024 * 1024); // 10MB limit
    
    if (validFiles.length !== files.length) {
      // Show error for files that are too large
      const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
      oversizedFiles.forEach(file => {
        setEvidenceFiles(prev => [
          ...prev,
          {
            id: crypto.randomUUID(),
            file,
            preview_url: URL.createObjectURL(file),
            upload_progress: 0,
            status: 'error',
            error: 'File size exceeds 10MB limit'
          }
        ]);
      });
    }
    
    // Create evidence files for valid files
    const newEvidenceFiles: EvidenceFile[] = validFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      preview_url: URL.createObjectURL(file),
      upload_progress: 0,
      status: 'pending'
    }));
    
    setEvidenceFiles(prev => [...prev, ...newEvidenceFiles]);
  };

  const handleRemoveFile = (id: string) => {
    setEvidenceFiles(prev => {
      const fileToRemove = prev.find(file => file.id === id);
      if (fileToRemove && fileToRemove.preview_url) {
        URL.revokeObjectURL(fileToRemove.preview_url);
      }
      
      const updatedFiles = prev.filter(file => file.id !== id);
      return updatedFiles;
    });
  };

  const handleUpload = () => {
    const files = evidenceFiles.filter(file => file.status === 'pending').map(file => file.file);
    if (files.length === 0) return;
    
    onUpload(files);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Upload Evidence</DialogTitle>
          <DialogDescription>
            Upload photos or documents to support your return request
          </DialogDescription>
        </DialogHeader>
        
        <div 
          className={`mt-4 border-2 border-dashed rounded-lg p-6 text-center ${
            dragActive ? 'border-primary bg-primary/5' : 'border-gray-300 dark:border-gray-600'
          }`}
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            multiple
            accept="image/*,.pdf,.doc,.docx"
          />
          
          <Upload className="h-10 w-10 text-black dark:text-gray-500 mx-auto mb-3" />
          <p className="text-black dark:text-gray-300 font-medium mb-1">
            Drag and drop files here, or{' '}
            <button 
              type="button" 
              className="text-primary hover:underline"
              onClick={() => fileInputRef.current?.click()}
            >
              browse
            </button>
          </p>
          <p className="text-black dark:text-gray-400 text-sm">
            Supported formats: JPG, PNG, PDF, DOC (max 10MB per file)
          </p>
        </div>
        
        {/* File preview */}
        {evidenceFiles.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-black dark:text-gray-300 mb-2">Selected Files</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {evidenceFiles.map(file => (
                <div 
                  key={file.id} 
                  className="relative border dark:border-gray-700 rounded-md overflow-hidden"
                >
                  {file.file.type.startsWith('image/') ? (
                    <div className="aspect-square relative">
                      <img 
                        src={file.preview_url} 
                        alt={file.file.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <File className="h-10 w-10 text-black dark:text-gray-500" />
                    </div>
                  )}
                  
                  <div className="p-2 bg-white dark:bg-gray-800">
                    <p className="text-xs text-black dark:text-gray-300 truncate">{file.file.name}</p>
                    <p className="text-xs text-black dark:text-gray-400">
                      {(file.file.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
                  
                  {file.status === 'uploading' && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
                      <div 
                        className="h-full bg-primary" 
                        style={{ width: `${file.upload_progress}%` }}
                      ></div>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <div className="absolute top-0 right-0 left-0 bg-red-500 text-white text-xs px-2 py-1 flex items-center justify-between">
                      <span>Error</span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="h-3 w-3" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{file.error}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  )}
                  
                  {file.status === 'success' && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs px-2 py-1">
                      Uploaded
                    </div>
                  )}
                  
                  {file.status !== 'uploading' && (
                    <button 
                      className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1 text-white hover:bg-opacity-70"
                      onClick={() => handleRemoveFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="mt-6 flex justify-end space-x-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isUploading}
            className="dark:border-gray-600 dark:text-white"
          >
            Cancel
          </Button>
          <Button 
            className="bg-primary hover:bg-primary/90 text-black"
            onClick={handleUpload}
            disabled={isUploading || evidenceFiles.filter(f => f.status === 'pending').length === 0}
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Upload {evidenceFiles.filter(f => f.status === 'pending').length} Files
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}