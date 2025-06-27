'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Bell, 
  User, 
  Settings, 
  HelpCircle, 
  LogOut,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserRole } from '@/types/auth';

interface HeaderProps {
  userRole: UserRole;
  userName: string;
  onRoleSwitch: () => void;
  onSignOut: () => void;
}

export function Header({ userRole, userName, onRoleSwitch, onSignOut }: HeaderProps) {
  const pathname = usePathname();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  // Get page title based on current path
  const getPageTitle = () => {
    if (pathname === '/dashboard') return 'Dashboard';
    if (pathname === '/dashboard/requests') return 'Return Requests';
    if (pathname === '/dashboard/policy') return 'Policy Management';
    if (pathname === '/dashboard/risk-assessment') return 'Risk Assessment';
    if (pathname.startsWith('/dashboard/personas')) return 'Support Personas';
    if (pathname === '/dashboard/settings') return 'Settings';
    if (pathname === '/return') return 'Return Portal';
    
    return 'Dokani Platform';
  };

  return (
    <header className="bg-white border-b">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Page title */}
        <h1 className="text-xl font-semibold text-gray-900">
          {getPageTitle()}
        </h1>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Profile dropdown */}
          <div className="relative">
            <Button
              variant="ghost"
              className="flex items-center space-x-2 text-gray-700"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-4 w-4 text-primary" />
              </div>
              <span className="hidden sm:block text-sm font-medium">
                {userName}
              </span>
              <ChevronDown className="h-4 w-4" />
            </Button>

            {isProfileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border z-10">
                <div className="p-3 border-b">
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">
                    {userRole === 'business' ? 'Business Account' : 'Customer Account'}
                  </p>
                </div>
                <div className="py-1">
                  <button
                    onClick={onRoleSwitch}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <User className="h-4 w-4 mr-3" />
                    Switch to {userRole === 'business' ? 'Customer' : 'Business'} View
                  </button>
                  <Link
                    href="/dashboard/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                    onClick={() => setIsProfileMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <button
                    onClick={onSignOut}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}