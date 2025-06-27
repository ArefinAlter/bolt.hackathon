'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Phone, 
  Video, 
  User, 
  LogOut, 
  ChevronDown,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase';

interface ChatHeaderProps {
  userName: string;
  onStartVoiceCall: () => void;
  onStartVideoCall: () => void;
  isCallActive: boolean;
}

export function ChatHeader({ 
  userName, 
  onStartVoiceCall, 
  onStartVideoCall, 
  isCallActive 
}: ChatHeaderProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userRole');
    router.push('/');
  };

  const handleRoleSwitch = () => {
    localStorage.setItem('userRole', 'business');
    router.push('/dashboard');
  };

  return (
    <header className="bg-white border-b px-4 py-3">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="ml-3">
            <h1 className="text-lg font-semibold text-gray-900">Customer Support</h1>
            <p className="text-sm text-gray-500">
              {isCallActive ? 'Call in progress...' : 'Chat with our AI assistant'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={onStartVoiceCall}
              disabled={isCallActive}
            >
              <Phone className="h-4 w-4 mr-2" />
              Voice
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onStartVideoCall}
              disabled={isCallActive}
            >
              <Video className="h-4 w-4 mr-2" />
              Video
            </Button>
          </div>
          
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                <span className="hidden md:inline">{userName}</span>
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleRoleSwitch}>
                <User className="h-4 w-4 mr-2" />
                Switch to Business View
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => router.push('/customer/settings')}>
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}