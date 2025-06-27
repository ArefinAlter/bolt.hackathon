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
  ChevronDown,
  Moon,
  Sun,
  Keyboard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import { KeyboardShortcutsHelp } from '@/components/common/KeyboardShortcutsHelp';
import { useTheme } from 'next-themes';
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
  const { theme, setTheme } = useTheme();

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
    <header className="bg-white dark:bg-gray-900 border-b dark:border-gray-800">
      <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        {/* Left: Page title */}
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {getPageTitle()}
        </h1>

        {/* Middle: Search */}
        <div className="hidden md:block max-w-md w-full mx-4">
          <GlobalSearch />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-4">
          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
                {theme === 'dark' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('system')}>
                <Settings className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Keyboard shortcuts */}
          <KeyboardShortcutsHelp />

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <Bell className="h-5 w-5" />
          </Button>

          {/* Help */}
          <Button variant="ghost" size="icon" className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            <HelpCircle className="h-5 w-5" />
          </Button>

          {/* Profile dropdown */}
          <DropdownMenu open={isProfileMenuOpen} onOpenChange={setIsProfileMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="flex items-center space-x-2 text-gray-700 dark:text-gray-300"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${userName}`} alt={userName} />
                  <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="hidden sm:block text-sm font-medium">
                  {userName}
                </span>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <div className="p-3 border-b">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{userName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {userRole === 'business' ? 'Business Account' : 'Customer Account'}
                </p>
              </div>
              <DropdownMenuItem onClick={onRoleSwitch}>
                <User className="h-4 w-4 mr-3" />
                Switch to {userRole === 'business' ? 'Customer' : 'Business'} View
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem>
                  <Settings className="h-4 w-4 mr-3" />
                  Settings
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onSignOut}>
                <LogOut className="h-4 w-4 mr-3" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}