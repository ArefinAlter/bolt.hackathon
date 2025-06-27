'use client';

import { ConversationMessage } from '@/types/return';
import { format } from 'date-fns';

interface ConversationLogProps {
  messages: ConversationMessage[];
}

export function ConversationLog({ messages }: ConversationLogProps) {
  return (
    <div className="space-y-4 max-h-96 overflow-y-auto p-2">
      {messages.map((message, index) => (
        <div 
          key={index} 
          className={`flex ${message.sender === 'customer' ? 'justify-end' : 'justify-start'}`}
        >
          <div 
            className={`max-w-[80%] rounded-lg p-3 ${
              message.sender === 'customer' 
                ? 'bg-blue-50 text-gray-800' 
                : message.sender === 'agent'
                  ? 'bg-gray-100 text-gray-800'
                  : 'bg-gray-50 text-gray-600 italic'
            }`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="text-xs font-medium text-gray-500">
                {message.sender === 'customer' 
                  ? 'Customer' 
                  : message.sender === 'agent'
                    ? 'AI Agent'
                    : 'System'}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                {format(new Date(message.timestamp), 'MMM d, h:mm a')}
              </span>
            </div>
            <p className="text-sm whitespace-pre-line">{message.message}</p>
          </div>
        </div>
      ))}
      
      {messages.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-500">No messages in this conversation</p>
        </div>
      )}
    </div>
  );
}