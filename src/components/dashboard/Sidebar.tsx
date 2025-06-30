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
import { useHotkeys } from 'react-hotkeys-hook';

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

  // Register keyboard shortcuts for navigation
  useHotkeys('g d', () => {
    window.location.href = '/dashboard';
  });

  const toggleGroup = (title: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const isActive = (href: string) => {
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
      href: '/settings',
      icon: Settings,
      role: 'both',
      shortcut: 'g s'
    }
  ];

  const filteredNavItems = navItems.filter(
    item => item.role === userRole || item.role === 'both'
  );

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-20 bg-white border-b px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center">
          <Image
            src="/main_logo.svg"
            alt="Dokani"
            width={100}
            height={28}
            className="h-8 w-auto"
            style={{ width: 'auto' }}
          />
        </Link>
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
          <div className="p-4 border-b">
            <Link href="/" className="flex items-center">
              <Image
                src="/main_logo.svg"
                alt="Dokani"
                width={180}
                height={48}
                className="h-16 w-auto"
                style={{ width: 'auto' }}
              />
            </Link>
          </div>

          {/* Mobile search */}
          <div className="p-4 lg:hidden">
            <GlobalSearch />
          </div>

          {/* Role indicator */}
          <div className="px-4 py-3 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  {userRole === 'business' ? (
                    <Users className="h-4 w-4 text-primary" />
                  ) : (
                    <Users className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {userRole === 'business' ? 'Business View' : 'Customer View'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {userRole === 'business' ? 'Managing returns' : 'Making returns'}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRoleSwitch}
                className="text-xs"
              >
                Switch
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4">
            <ul className="space-y-1 px-2">
              {filteredNavItems.map((item) => (
                <li key={item.title}>
                  {item.children ? (
                    <div>
                      <button
                        onClick={() => toggleGroup(item.title)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md font-medium ${
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center">
                          <item.icon className="h-5 w-5 mr-3" />
                          {item.title}
                        </div>
                        {expandedGroups[item.title] ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                      {expandedGroups[item.title] && (
                        <ul className="mt-1 pl-10 space-y-1">
                          {item.children.map((child) => (
                            <li key={child.title}>
                              <Link
                                href={child.href}
                                className={`flex items-center px-3 py-2 text-sm rounded-md ${
                                  isActive(child.href)
                                    ? 'bg-primary/10 text-primary font-medium'
                                    : 'text-gray-700 hover:bg-gray-100'
                                }`}
                              >
                                <child.icon className="h-4 w-4 mr-3" />
                                {child.title}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 text-sm rounded-md ${
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center">
                        <item.icon className="h-5 w-5 mr-3" />
                        {item.title}
                      </div>
                      {item.shortcut && (
                        <kbd className="hidden lg:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                          {item.shortcut}
                        </kbd>
                      )}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          {/* Sidebar footer */}
          <div className="p-4 border-t">
            <Button
              variant="ghost"
              className="w-full justify-start text-gray-700 hover:bg-gray-100"
              onClick={onSignOut}
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}