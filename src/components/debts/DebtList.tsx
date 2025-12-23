import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction } from '@/db/schema';

interface DebtListProps {
  debts: Transaction[];
  onSettle: (debtId: number) => Promise<void>;
  onEdit?: (debt: Transaction) => void;
  isLoading?: boolean;
  title?: string;
  emptyMessage?: string;
}

export function DebtList({
  debts,
  onSettle,
  onEdit,
  isLoading = false,
  title = 'Debts',
  emptyMessage = 'No debts found',
}: DebtListProps) {
  const formatCurrency = (amount: string) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(parseFloat(amount));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dueDate: string | null) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'settled':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'cancelled':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>Loading debts...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
             {[1, 2, 3].map((i) => (
               <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                 <div className="space-y-2 w-full">
                   <Skeleton className="h-4 w-[250px]" />
                   <Skeleton className="h-4 w-[200px]" />
                 </div>
               </div>
             ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (debts.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          {debts.length} debt{debts.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {debts.map((debt) => (
            <div
              key={debt.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{debt.description}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      debt.status || 'active'
                    )}`}
                  >
                    {debt.status || 'active'}
                  </span>
                  {debt.status === 'active' && debt.dueDate && isOverdue(debt.dueDate) && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full border text-red-600 bg-red-50 border-red-200">
                      Overdue
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>
                    <strong>Amount:</strong> {formatCurrency(debt.amount)}
                  </span>
                  <span>
                    <strong>Creditor:</strong> {debt.relatedParty}
                  </span>
                  {debt.dueDate && (
                    <span>
                      <strong>Due:</strong> {formatDate(debt.dueDate)}
                    </span>
                  )}
                  <span>
                    <strong>Created:</strong> {formatDate(debt.transactionDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(debt)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                )}
                
                {debt.status === 'active' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onSettle(debt.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Settling...' : 'Mark as Paid'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}