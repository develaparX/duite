import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from '@/components/ui/dialog';
import { InvestmentBalanceForm } from './InvestmentBalanceForm';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { NewInvestmentBalance } from '@/db/schema';

interface AddInvestmentDialogProps {
  userId: number;
  authToken: string;
  trigger?: React.ReactNode;
  onSuccess?: () => void;
  // We might need to pass existing accounts to help autocomplete
  existingAccountNames?: string[];
  existingAccountTypes?: string[];
}

export function AddInvestmentDialog({ 
  userId,
  authToken,
  trigger,
  onSuccess,
  existingAccountNames = [],
  existingAccountTypes = []
}: AddInvestmentDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: NewInvestmentBalance) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          ...data,
          userId,
        })
      });

      if (!response.ok) {
        throw new Error('Failed to record balance');
      }

      toast.success('Investment balance recorded successfully');
      setOpen(false);
      onSuccess?.();
    } catch (error) {
      console.error(error);
      toast.error('Failed to record balance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Balance
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        {/* We don't use DialogHeader here because InvestmentBalanceForm has its own CardHeader 
            which might look double. But Shadcn Dialog usually expects a header.
            Let's keep the DialogHeader and maybe the Form should adapt? 
            Actually InvestmentBalanceForm has a Card wrapper. We should probably strip that if used in Dialog.
            For now, let's just nest it, it might look slightly boxy but functional.
        */}
        <InvestmentBalanceForm
          onSubmit={handleSubmit}
          onCancel={() => setOpen(false)}
          isLoading={loading}
          existingAccountNames={existingAccountNames}
          existingAccountTypes={existingAccountTypes}
        />
      </DialogContent>
    </Dialog>
  );
}
