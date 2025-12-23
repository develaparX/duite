import { createFileRoute, redirect } from '@tanstack/react-router';
import { IncomeManager } from '@/components/income/IncomeManager';
import { MainLayout, PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { AddTransactionDialog } from '@/components/transactions';

export const Route = createFileRoute('/income')({
  beforeLoad: () => {
    // Check if user is authenticated (client-side only check)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw redirect({
          to: '/login',
          search: {
            redirect: '/income',
          },
        });
      }
    }
  },
  component: IncomePage,
});

function IncomePage() {
  const { user, token: authToken } = useAuth();

  if (!user || !authToken) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access income management.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader 
        title="Income Management" 
        description="Track and manage your income sources"
        action={
          <AddTransactionDialog 
            type="income" 
            onSuccess={() => {
              window.location.reload(); 
            }}
          />
        }
      />
      <IncomeManager userId={user.id} authToken={authToken} />
    </MainLayout>
  );
}