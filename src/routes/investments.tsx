import { createFileRoute, redirect } from '@tanstack/react-router';
import { InvestmentManager } from '@/components/investments';
import { AddInvestmentDialog } from '@/components/investments';
import { MainLayout, PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';

export const Route = createFileRoute('/investments')({
  beforeLoad: () => {
    // Check if user is authenticated
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw redirect({
          to: '/login',
          search: {
            redirect: '/investments',
          },
        });
      }
    }
  },
  component: InvestmentsPage,
});

function InvestmentsPage() {
  const { user, token } = useAuth();

  if (!user || !token) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold">Authentication Required</h2>
          <p className="text-muted-foreground mt-2">Please log in to access your investment portfolio.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader 
        title="Investment Portfolio" 
        description="Track and monitor your investment balances and performance"
        action={
           <AddInvestmentDialog 
            userId={user.id}
            authToken={token}
            onSuccess={() => window.location.reload()}
          />
        }
      />
      <InvestmentManager userId={user.id} authToken={token} />
    </MainLayout>
  );
}
