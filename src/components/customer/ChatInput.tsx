'use client';

import { useState, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Image as ImageIcon, 
  File, 
  Loader2, 
  X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { FileUpload } from '@/types/chat';
import TextareaAutosize from 'react-textarea-autosize';

interface ChatInputProps {
  message: string;
  setMessage: (message: string) => void;
  onSendMessage: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveFile: (id: string) => void;
  fileUploads: FileUpload[];
  isSending: boolean;
}

export function ChatInput({
  message,
  setMessage,
  onSendMessage,
  onFileUpload,
  onRemoveFile,
  fileUploads,
  isSending
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };
  
  return (
    <div className="bg-white border-t p-4">
      {/* File uploads preview */}
      {fileUploads.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {fileUploads.map(file => (
            <div 
              key={file.id} 
              className="relative bg-gray-50 rounded-md border p-2 flex items-center"
            >
              {file.status === 'uploading' ? (
                <div className="w-6 h-6 mr-2 flex items-center justify-center">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                </div>
              ) : file.file.type.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4 mr-2 text-blue-500" />
              ) : (
                <File className="h-4 w-4 mr-2 text-gray-500" />
              )}
              
              <span className="text-sm truncate max-w-[150px]">{file.file.name}</span>
              
              <button 
                className="ml-2 text-gray-400 hover:text-gray-600"
                onClick={() => onRemoveFile(file.id)}
              >
                <X className="h-4 w-4" />
              </button>
              
              {file.status === 'uploading' && (
                <div className="absolute bottom-0 left-0 h-1 bg-primary" style={{ width: `${file.upload_progress}%` }}></div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="max-w-4xl mx-auto flex items-end space-x-2">
        <div className="flex-1 relative">
          <TextareaAutosize
            placeholder="Type your message..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary resize-none max-h-32"
            minRows={1}
            maxRows={5}
            disabled={isSending}
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon" disabled={isSending}>
              <Paperclip className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <ImageIcon className="h-4 w-4 mr-2" />
              <span>Upload Image</span>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={onFileUpload}
                multiple
              />
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <File className="h-4 w-4 mr-2" />
              <span>Upload File</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button 
          className="bg-primary hover:bg-primary/90 text-black"
          onClick={onSendMessage}
          disabled={isSending || (!message.trim() && fileUploads.length === 0)}
        >
          {isSending ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </Button>
      </div>
    </div>
  );
}