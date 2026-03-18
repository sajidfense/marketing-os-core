import { Navigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const { loading, needsOnboarding } = useOrg();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (needsOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
