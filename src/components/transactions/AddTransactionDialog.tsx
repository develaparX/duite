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
import { TransactionForm } from './TransactionForm';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { NewTransaction } from '@/db/schema';

interface AddTransactionDialogProps {
  type?: 'income' | 'expense' | 'debt' | 'receivable';
  trigger?: React.ReactNode;
  onSuccess?: () => void;
}

export function AddTransactionDialog({ 
  type = 'expense', 
  trigger,
  onSuccess 
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: NewTransaction) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to create transaction');
      }

      toast.success('Transaction created successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Mock categories for now - ideally fetch from API
  const categories = [
    { id: 1, name: 'Salary', type: 'income', color: '#16a34a' },
    { id: 2, name: 'Freelance', type: 'income', color: '#22c55e' },
    { id: 3, name: 'Investments', type: 'income', color: '#4ade80' },
    { id: 4, name: 'Food', type: 'expense', color: '#ef4444' },
    { id: 5, name: 'Transport', type: 'expense', color: '#f97316' },
    { id: 6, name: 'Utilities', type: 'expense', color: '#eab308' },
    { id: 7, name: 'Entertainment', type: 'expense', color: '#3b82f6' },
  ] as any[];

  const isTypeProvided = !!type;
  const title = isTypeProvided 
    ? `Add ${type.charAt(0).toUpperCase() + type.slice(1)}` 
    : 'Add Transaction';

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {title}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
             Record a new {type}.
          </DialogDescription>
        </DialogHeader>
        <TransactionForm
          categories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isLoading={loading}
          defaultType={type}
          isTypeLocked={isTypeProvided}
          titleOverride={title}
        />
      </DialogContent>
    </Dialog>
  );
}
