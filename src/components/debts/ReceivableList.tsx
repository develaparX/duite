import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction } from '@/db/schema';

interface ReceivableListProps {
  receivables: Transaction[];
  onCollect: (receivableId: number) => Promise<void>;
  onEdit?: (receivable: Transaction) => void;
  isLoading?: boolean;
  title?: string;
  emptyMessage?: string;
}

export function ReceivableList({
  receivables,
  onCollect,
  onEdit,
  isLoading = false,
  title = 'Receivables',
  emptyMessage = 'No receivables found',
}: ReceivableListProps) {
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

  const isOverdue = (expectedDate: string | null) => {
    if (!expectedDate) return false;
    return new Date(expectedDate) < new Date();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-blue-600 bg-blue-50 border-blue-200';
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
          <CardDescription>Loading receivables...</CardDescription>
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

  if (receivables.length === 0) {
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
          {receivables.length} receivable{receivables.length !== 1 ? 's' : ''} found
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {receivables.map((receivable) => (
            <div
              key={receivable.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{receivable.description}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(
                      receivable.status || 'active'
                    )}`}
                  >
                    {receivable.status || 'active'}
                  </span>
                  {receivable.status === 'active' && receivable.dueDate && isOverdue(receivable.dueDate) && (
                    <span className="px-2 py-1 text-xs font-medium rounded-full border text-red-600 bg-red-50 border-red-200">
                      Overdue
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <span>
                    <strong>Amount:</strong> {formatCurrency(receivable.amount)}
                  </span>
                  <span>
                    <strong>Debtor:</strong> {receivable.relatedParty}
                  </span>
                  {receivable.dueDate && (
                    <span>
                      <strong>Expected:</strong> {formatDate(receivable.dueDate)}
                    </span>
                  )}
                  <span>
                    <strong>Created:</strong> {formatDate(receivable.transactionDate)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(receivable)}
                    disabled={isLoading}
                  >
                    Edit
                  </Button>
                )}
                
                {receivable.status === 'active' && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => onCollect(receivable.id)}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Collecting...' : 'Mark as Collected'}
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