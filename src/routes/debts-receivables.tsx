import { createFileRoute, redirect } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { MainLayout, PageHeader, InlineError } from '@/components/layout';
import { AddTransactionDialog } from '@/components/transactions';
import {
  DebtList,
  ReceivableList,
  DebtReceivableSummary,
} from '@/components/debts';
import type { Transaction } from '@/db/schema';

// Keeping interfaces locally if they are not exported from anywhere else
interface DebtReceivableSummaryData {
  totalOutstandingDebts: number;
  totalOutstandingReceivables: number;
  totalSettledDebts: number;
  totalSettledReceivables: number;
  debtCount: number;
  receivableCount: number;
}

interface OverdueData {
  overdueDebts: Transaction[];
  overdueReceivables: Transaction[];
}



export const Route = createFileRoute('/debts-receivables')({
  beforeLoad: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        throw redirect({
          to: '/login',
          search: {
            redirect: '/debts-receivables',
          },
        });
      }
    }
  },
  component: DebtsReceivablesPage,
});

function DebtsReceivablesPage() {
  const { user, token } = useAuth();
  const [debts, setDebts] = useState<Transaction[]>([]);
  const [receivables, setReceivables] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<DebtReceivableSummaryData | null>(null);
  const [overdue, setOverdue] = useState<OverdueData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (user && token) {
      fetchAllData();
    }
  }, [user, token]);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError('');
    try {
      await Promise.all([
        fetchDebts(),
        fetchReceivables(),
        fetchSummary(),
      ]);
    } catch (err) {
      setError('Failed to load data. Please try again.');
      console.error('Fetch data error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDebts = async () => {
    if (!token) return;
    const response = await fetch('/api/transactions?type=debt', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch debts');
    const data = await response.json();
    setDebts(data.transactions || []);
  };

  const fetchReceivables = async () => {
    if (!token) return;
    const response = await fetch('/api/transactions?type=receivable', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch receivables');
    const data = await response.json();
    setReceivables(data.transactions || []);
  };

  const fetchSummary = async () => {
    if (!token) return;
    const response = await fetch('/api/debts-receivables/summary', {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!response.ok) throw new Error('Failed to fetch summary');
    const data = await response.json();
    setSummary(data.summary);
    setOverdue(data.overdue);
  };

  const handleSettleDebt = async (debtId: number) => {
     if (!token) return;
    try {
       const response = await fetch(`/api/transactions/${debtId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'settled' })
      });
      if (!response.ok) throw new Error('Failed to settle');
      await fetchAllData();
    } catch (err) {
      setError('Failed to settle debt');
    }
  };

  const handleCollectReceivable = async (receivableId: number) => {
     if (!token) return;
    try {
       const response = await fetch(`/api/transactions/${receivableId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: 'settled' })
      });
      if (!response.ok) throw new Error('Failed to collect');
      await fetchAllData();
    } catch (err) {
      setError('Failed to collect receivable');
    }
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="text-center py-12">Please log in.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader 
        title="Debts & Receivables" 
        description="Track money you owe and money owed to you"
      />

      {error && <InlineError description={error} onDismiss={() => setError('')} />}

      {summary && <DebtReceivableSummary summary={summary} overdue={overdue || undefined} />}

      <Tabs defaultValue="debts" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="debts">Debts</TabsTrigger>
              <TabsTrigger value="receivables">Receivables</TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              <AddTransactionDialog 
                 type="debt" 
                 trigger={
                   <Button disabled={isLoading}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Debt
                   </Button>
                 } 
                 onSuccess={fetchAllData} 
              />
              <AddTransactionDialog 
                 type="receivable" 
                 trigger={
                   <Button disabled={isLoading}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Receivable
                   </Button>
                 }
                 onSuccess={fetchAllData} 
              />
            </div>
          </div>

          <TabsContent value="debts" className="space-y-6">
            <DebtList
              debts={debts}
              onSettle={handleSettleDebt}
              isLoading={isLoading}
              title="All Debts"
              emptyMessage="No debts found."
            />
          </TabsContent>

          <TabsContent value="receivables" className="space-y-6">
            <ReceivableList
              receivables={receivables}
              onCollect={handleCollectReceivable}
              isLoading={isLoading}
              title="All Receivables"
              emptyMessage="No receivables found."
            />
          </TabsContent>
      </Tabs>
    </MainLayout>
  );
}