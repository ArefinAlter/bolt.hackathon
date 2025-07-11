'use client';

import { useState } from 'react';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Package, 
  Paperclip, 
  ImageIcon, 
  File 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage as ChatMessageType } from '@/types/chat';
import { format } from 'date-fns';

interface ChatMessageProps {
  message: ChatMessageType;
  onFeedback: (messageId: string, isPositive: boolean) => void;
  onViewFile: (url: string, fileName: string) => void;
  showFeedback: string | null;
}

export function ChatMessage({ 
  message, 
  onFeedback, 
  onViewFile,
  showFeedback 
}: ChatMessageProps) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';
  const hasReturnDetection = message.metadata?.return_detected;
  
  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : isSystem ? 'justify-center' : 'justify-start'} mb-4`}
    >
      {isSystem ? (
        <div className="bg-gray-100 text-black rounded-lg px-4 py-2 max-w-[80%] text-sm">
          {message.message}
        </div>
      ) : (
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div 
            className={`rounded-lg px-4 py-3 ${
              isUser 
                ? 'bg-primary text-black' 
                : 'bg-white border border-gray-200'
            }`}
          >
            <p className="whitespace-pre-wrap">{message.message}</p>
            
            {/* File attachments */}
            {message.metadata?.file_urls && (
              <div className="mt-2 flex flex-wrap gap-2">
                {Array.isArray(message.metadata.file_urls) && message.metadata.file_urls.map((url, index) => {
                  const isImage = url.match(/\.(jpeg|jpg|gif|png|webp)$/i);
                  const fileName = message.metadata?.file_names?.[index] || 'File';
                  
                  return isImage ? (
                    <div 
                      key={index} 
                      className="relative w-20 h-20 rounded overflow-hidden border cursor-pointer"
                      onClick={() => onViewFile(url, fileName)}
                    >
                      <img 
                        src={url} 
                        alt="Attachment" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <a 
                      key={index}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center bg-white border rounded-md px-3 py-2 text-sm text-black hover:bg-gray-50"
                    >
                      <Paperclip className="h-4 w-4 mr-2" />
                      {fileName}
                    </a>
                  );
                })}
              </div>
            )}
            
            <div className="mt-1 text-xs text-black">
              {format(new Date(message.created_at), 'h:mm a')}
            </div>
          </div>
          
          {/* Return detection indicator */}
          {!isUser && hasReturnDetection && (
            <div className="mt-1 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              <Package className="h-3 w-3 mr-1" />
              Return request detected
            </div>
          )}
        </div>
      )}
    </div>
  );
}