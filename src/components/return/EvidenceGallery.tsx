'use client';

import { useState } from 'react';
import Image from 'next/image';
import { 
  Image as ImageIcon, 
  X, 
  ChevronLeft, 
  ChevronRight,
  Download,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface EvidenceGalleryProps {
  evidenceUrls: string[];
}

export function EvidenceGallery({ evidenceUrls }: EvidenceGalleryProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);

  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowLightbox(true);
  };

  const handleClose = () => {
    setShowLightbox(false);
  };

  const handlePrevious = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNext = () => {
    if (selectedImageIndex !== null && selectedImageIndex < evidenceUrls.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  const isImageUrl = (url: string) => {
    return url.match(/\.(jpeg|jpg|gif|png|webp)$/i) !== null;
  };

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {evidenceUrls.map((url, index) => (
          <div 
            key={index} 
            className="relative aspect-square rounded-md overflow-hidden border cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => handleImageClick(index)}
          >
            {isImageUrl(url) ? (
              <div className="relative w-full h-full">
                <Image
                  src={url}
                  alt={`Evidence ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                <div className="text-center p-2">
                  <ImageIcon className="h-8 w-8 text-black mx-auto mb-1" />
                  <p className="text-xs text-black truncate">File {index + 1}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Lightbox dialog */}
      <Dialog open={showLightbox} onOpenChange={setShowLightbox}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Evidence {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} of {evidenceUrls.length}</DialogTitle>
          </DialogHeader>
          
          {selectedImageIndex !== null && (
            <div className="relative aspect-video bg-black rounded-md overflow-hidden">
              {isImageUrl(evidenceUrls[selectedImageIndex]) ? (
                <div className="relative w-full h-full">
                  <Image
                    src={evidenceUrls[selectedImageIndex]}
                    alt={`Evidence ${selectedImageIndex + 1}`}
                    fill
                    className="object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <div className="text-center">
                    <ImageIcon className="h-16 w-16 text-black mx-auto mb-2" />
                    <p className="text-black">Non-image file</p>
                    <div className="mt-4 flex justify-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(evidenceUrls[selectedImageIndex], '_blank')}
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Open File
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = evidenceUrls[selectedImageIndex];
                          link.download = `evidence-${selectedImageIndex + 1}`;
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={selectedImageIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <div className="text-center">
              <p className="text-sm font-medium">
                Evidence {selectedImageIndex !== null ? selectedImageIndex + 1 : 0} of {evidenceUrls.length}
              </p>
            </div>
            
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={selectedImageIndex === evidenceUrls.length - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}