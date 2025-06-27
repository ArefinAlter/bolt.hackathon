'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Bell, AlertTriangle } from 'lucide-react';
import { ReturnRequest } from '@/types/return';

interface NotificationSystemProps {
  request: ReturnRequest;
}

export function NotificationSystem({ request }: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<{
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    id: string;
  }[]>([]);
  const [previousStatus, setPreviousStatus] = useState(request.status);

  // Check for status changes
  useEffect(() => {
    if (previousStatus !== request.status) {
      // Status has changed, show notification
      const notification = {
        id: crypto.randomUUID(),
        message: getStatusChangeMessage(request.status),
        type: getStatusChangeType(request.status)
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 5000);
      
      // Update previous status
      setPreviousStatus(request.status);
      
      // Show browser notification if supported
      if ('Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification('Return Request Update', {
            body: notification.message,
            icon: '/favicon.ico'
          });
        } else if (Notification.permission !== 'denied') {
          Notification.requestPermission();
        }
      }
    }
  }, [request.status, previousStatus]);

  const getStatusChangeMessage = (status: string): string => {
    switch (status) {
      case 'approved':
        return 'Your return request has been approved!';
      case 'denied':
        return 'Your return request has been denied.';
      case 'completed':
        return 'Your return process has been completed.';
      case 'pending_review':
        return 'Your return request is now pending review.';
      default:
        return 'Your return request status has been updated.';
    }
  };

  const getStatusChangeType = (status: string): 'success' | 'error' | 'info' | 'warning' => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'denied':
        return 'error';
      case 'completed':
        return 'success';
      case 'pending_review':
        return 'warning';
      default:
        return 'info';
    }
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {notifications.map(notification => (
        <div 
          key={notification.id}
          className={`p-4 rounded-lg shadow-lg max-w-md flex items-start space-x-3 animate-slide-up ${
            notification.type === 'success' ? 'bg-green-50 border border-green-200' :
            notification.type === 'error' ? 'bg-red-50 border border-red-200' :
            notification.type === 'warning' ? 'bg-orange-50 border border-orange-200' :
            'bg-blue-50 border border-blue-200'
          }`}
        >
          <div className={`flex-shrink-0 ${
            notification.type === 'success' ? 'text-green-500' :
            notification.type === 'error' ? 'text-red-500' :
            notification.type === 'warning' ? 'text-orange-500' :
            'text-blue-500'
          }`}>
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
             notification.type === 'error' ? <XCircle className="h-5 w-5" /> :
             notification.type === 'warning' ? <AlertTriangle className="h-5 w-5" /> :
             <Bell className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-black">{notification.message}</p>
          </div>
          <button 
            className="flex-shrink-0 text-black hover:text-gray-500"
            onClick={() => dismissNotification(notification.id)}
          >
            <XCircle className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}