import { AuthGuard } from '@/components/auth/AuthGuard';

export default function ReturnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard requiredRole="customer">
      {children}
    </AuthGuard>
  );
}