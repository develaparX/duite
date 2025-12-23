import { createFileRoute, redirect } from '@tanstack/react-router';
import { ExpenseManager } from '@/components/expenses';
import { MainLayout, PageHeader } from '@/components/layout';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { AddTransactionDialog } from '@/components/transactions';

export const Route = createFileRoute('/expenses')({
  beforeLoad: () => {
    // Check if user is authenticated (client-side only check)
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw redirect({
          to: '/login',
          search: {
            redirect: '/expenses',
          },
        });
      }
    }
  },
  component: ExpensesPage,
});

function ExpensesPage() {
  const { user, token: authToken } = useAuth();

  if (!user || !authToken) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Please log in to access expense management.</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader 
        title="Expense Tracker" 
        description="Track your daily expenses and spending"
        action={
          <AddTransactionDialog 
            type="expense" 
            trigger={<Button>Add Expense</Button>}
            onSuccess={() => {
              window.location.reload(); 
            }}
          />
        }
      />
      <ExpenseManager userId={user.id} authToken={authToken} />
    </MainLayout>
  );
}
