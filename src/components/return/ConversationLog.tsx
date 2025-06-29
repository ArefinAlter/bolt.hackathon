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
          className={`flex ${message.sender === 'customer' ? 'justify-end' : message.sender === 'system' ? 'justify-center' : 'justify-start'}`}
        >
          {message.sender === 'system' ? (
            <div className="bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-4 py-2 max-w-[80%] text-sm">
              {message.message}
            </div>
          ) : (
            <div 
              className={`max-w-[80%] rounded-lg p-3 ${
                message.sender === 'customer' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-gray-100' 
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100'
              }`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="text-xs font-medium text-gray-900 dark:text-gray-100">
                  {message.sender === 'customer' 
                    ? 'You' 
                    : message.sender === 'agent'
                      ? 'AI Agent'
                      : 'System'}
                </span>
                <span className="text-xs text-gray-900 dark:text-gray-100 ml-2">
                  {format(new Date(message.timestamp), 'MMM d, h:mm a')}
                </span>
              </div>
              <p className="text-sm whitespace-pre-line">{message.message}</p>
            </div>
          )}
        </div>
      ))}
      
      {messages.length === 0 && (
        <div className="text-center py-4">
          <p className="text-gray-900 dark:text-gray-100">No messages in this conversation</p>
        </div>
      )}
    </div>
  );
}