'use client';

import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

interface FilePreviewProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
}

export function FilePreview({ isOpen, onClose, fileUrl, fileName }: FilePreviewProps) {
  const isImage = fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i);
  
  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>File Preview</DialogTitle>
          <DialogDescription>
            {fileName}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 flex justify-center">
          {isImage ? (
            <img 
              src={fileUrl} 
              alt={fileName} 
              className="max-h-[60vh] max-w-full object-contain rounded-md"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-md">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg font-medium text-gray-900">{fileName}</p>
              <p className="text-sm text-gray-500 mt-2">
                This file type cannot be previewed
              </p>
            </div>
          )}
        </div>
        
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button onClick={handleDownload}>
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}