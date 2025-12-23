import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import type { NewTransaction } from '@/db/schema';

// Reuse the default categories for now
const defaultCategories = [
  { id: 1, name: 'Food & Dining', type: 'expense' as const, color: '#EF4444' },
  { id: 2, name: 'Transportation', type: 'expense' as const, color: '#F97316' },
  { id: 3, name: 'Housing & Utilities', type: 'expense' as const, color: '#EAB308' },
  { id: 4, name: 'Entertainment', type: 'expense' as const, color: '#3B82F6' },
  { id: 5, name: 'Shopping', type: 'expense' as const, color: '#8B5CF6' },
  { id: 6, name: 'Health', type: 'expense' as const, color: '#EC4899' },
  { id: 7, name: 'Other', type: 'expense' as const, color: '#6B7280' },
];

interface QuickExpenseDialogProps {
  onSuccess?: () => void;
}

export function QuickExpenseDialog({ onSuccess }: QuickExpenseDialogProps) {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: NewTransaction) => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      setOpen(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-all duration-200 whitespace-nowrap">
          <Plus className="h-4 w-4 mr-2" />
          Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Quick Add Expense</DialogTitle>
          <DialogDescription>
            Record a new daily expense quickly.
          </DialogDescription>
        </DialogHeader>
        
        <TransactionForm
          categories={defaultCategories}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isLoading={loading}
          error={error || undefined}
          defaultType="expense"
          isTypeLocked={false}
          embedded={true}
          titleOverride=" "
        />
      </DialogContent>
    </Dialog>
  );
}
