import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/dashboard/DashboardLayout';
import { DashboardWrapper } from '@/components/dashboard/DashboardWrapper';

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <DashboardWrapper>
        {children}
      </DashboardWrapper>
    </AuthGuard>
  );
}