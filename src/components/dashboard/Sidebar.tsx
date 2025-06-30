'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  BarChart3, 
  Settings, 
  Package, 
  Users, 
  FileText, 
  Shield, 
  Headphones, 
  Video, 
  Menu, 
  X,
  ChevronDown,
  ChevronRight,
  LogOut,
  Search,
  LayoutDashboard,
  Brain,
  Phone,
  MessageSquare,
  History
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from '@/components/common/GlobalSearch';
import { UserRole } from '@/types/auth';
import { Logo } from '@/components/common/Logo';

interface SidebarProps {
  userRole: UserRole;
  onRoleSwitch: () => void;
  onSignOut: () => void;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  role: UserRole | 'both';
  shortcut?: string;
  children?: Omit<NavItem, 'children' | 'role'>[];
}

export function Sidebar({ userRole, onRoleSwitch, onSignOut }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});

  // Close mobile menu when path changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      role: 'business',
      shortcut: 'g d'
    },
    {
      title: 'Returns',
      href: '/dashboard/requests',
      icon: Package,
      role: 'business',
      shortcut: 'g r'
    },
    {
      title: 'Analytics',
      href: '/dashboard/analytics',
      icon: BarChart3,
      role: 'business',
      shortcut: 'g a'
    },
    {
      title: 'Risk Assessment',
      href: '/dashboard/risk-assessment',
      icon: Brain,
      role: 'business'
    },
    {
      title: 'Personas',
      href: '/dashboard/personas',
      icon: Users,
      role: 'business',
      children: [
        {
          title: 'Voice Personas',
          href: '/dashboard/personas/voice',
          icon: Headphones
        },
        {
          title: 'Video Personas',
          href: '/dashboard/personas/video',
          icon: Video
        }
      ]
    },
    {
      title: 'Policy',
      href: '/dashboard/policy',
      icon: FileText,
      role: 'business',
      shortcut: 'g p'
    },
    {
      title: 'Call History',
      href: '/dashboard/call-history',
      icon: History,
      role: 'business'
    },
    {
      title: 'Settings',
      href: '/dashboard/settings',
      icon: Settings,
      role: 'both',
      shortcut: 'g s'
    }
  ];

  // Always show navigation items for business role or both
  const filteredNavItems = navItems.filter(
    item => item.role === 'business' || item.role === 'both'
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
        <Logo />
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile sidebar overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-10 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:static lg:h-screen lg:w-64 flex-shrink-0`}
      >
        <div className="flex flex-col h-full">
          {/* Sidebar header */}
          <div className="h-16 px-6 py-4 border-b flex items-center">
            <Logo />
          </div>

          {/* Mobile search */}
          <div className="lg:hidden p-4 border-b">
            <GlobalSearch />
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {filteredNavItems.map((item) => {
              if (item.children) {
                const isExpanded = expandedGroups[item.title] ?? false;
                const hasActiveChild = item.children.some(child => isActive(child.href));
                
                return (
                  <div key={item.title}>
                    <button
                      onClick={() => toggleGroup(item.title)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                        hasActiveChild 
                          ? 'bg-primary text-black font-medium' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-3" />
                        <span>{item.title}</span>
                      </div>
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </button>
                    
                    {isExpanded && (
                      <div className="mt-2 ml-8 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`flex items-center p-2 rounded-md text-sm transition-colors ${
                              isActive(child.href)
                                ? 'bg-primary text-black font-medium'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <child.icon className="h-4 w-4 mr-2" />
                            {child.title}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center p-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary text-black font-medium'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.title}</span>
                  {item.shortcut && (
                    <span className="ml-auto text-xs text-gray-400 font-mono">
                      {item.shortcut}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t space-y-2">
            <Button
              variant="outline"
              onClick={onRoleSwitch}
              className="w-full justify-start"
            >
              <Users className="h-4 w-4 mr-2" />
              Switch to {userRole === 'business' ? 'Customer' : 'Business'} View
            </Button>
            <Button
              variant="ghost"
              onClick={onSignOut}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}