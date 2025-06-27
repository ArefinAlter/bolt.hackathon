'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequestDetail } from './RequestDetail';
import { ReturnRequest } from '@/types/return';

interface RequestDetailModalProps {
  request: ReturnRequest;
  onClose: () => void;
  onRequestUpdated: (updatedRequest: ReturnRequest) => void;
}

export function RequestDetailModal({ 
  request, 
  onClose,
  onRequestUpdated
}: RequestDetailModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    
    // Prevent body scrolling
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore body scrolling
      document.body.style.overflow = 'auto';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <RequestDetail 
            request={request} 
            onClose={onClose}
            onRequestUpdated={onRequestUpdated}
          />
        </div>
      </div>
    </div>
  );
}