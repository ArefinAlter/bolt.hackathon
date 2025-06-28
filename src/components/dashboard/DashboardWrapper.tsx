'use client';

import { usePathname } from 'next/navigation';
import { DashboardLayout } from './DashboardLayout';

interface DashboardWrapperProps {
  children: React.ReactNode;
}

export function DashboardWrapper({ children }: DashboardWrapperProps) {
  const pathname = usePathname();
  const isRoleSelection = pathname === '/dashboard/role-selection';

  if (isRoleSelection) {
    // For role-selection, don't wrap with DashboardLayout
    return <>{children}</>;
  }

  // For other dashboard pages, wrap with DashboardLayout
  return <DashboardLayout>{children}</DashboardLayout>;
} 