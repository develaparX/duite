import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { MainLayout } from '@/components/layout';
import { DashboardOverview } from '@/components/dashboard/DashboardOverview';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  return (
    <ProtectedRoute>
      <MainLayout>
        <DashboardOverview />
      </MainLayout>
    </ProtectedRoute>
  );
}