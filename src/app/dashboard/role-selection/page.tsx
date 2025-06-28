'use client';

import { RoleSelectionPage } from '@/components/dashboard/RoleSelectionPage';
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function RoleSelection() {
  console.log('=== ROLE SELECTION PAGE LOADING ===');
  
  return (
    <AuthGuard requireAuth={true} requireProfile={true}>
      <RoleSelectionPage />
    </AuthGuard>
  );
}