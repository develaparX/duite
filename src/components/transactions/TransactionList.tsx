
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from './DateRangePicker';
import type { Transaction } from '@/db/schema';

interface TransactionListProps {
  transactions: Transaction[];
  isLoading?: boolean;
  onEdit?: (transaction: Transaction) => void;
  onDelete?: (transactionId: number) => void;
  onMarkAsSettled?: (transactionId: number) => void;
  // Filtering props
  typeFilter?: 'income' | 'expense' | 'debt' | 'receivable' | 'all';
  onTypeFilterChange?: (type: 'income' | 'expense' | 'debt' | 'receivable' | 'all') => void;
  statusFilter?: 'active' | 'settled' | 'cancelled' | 'all';
  onStatusFilterChange?: (status: 'active' | 'settled' | 'cancelled' | 'all') => void;
  startDate?: string;
  endDate?: string;
  onStartDateChange?: (date: string) => void;
  onEndDateChange?: (date: string) => void;
  onClearDateFilter?: () => void;
  // Pagination props
  hasMore?: boolean;
  onLoadMore?: () => void;
  totalCount?: number;
}

export function TransactionList({
  transactions,
  isLoading = false,
  onEdit,
  onDelete,
  onMarkAsSettled,
  typeFilter = 'all',
  onTypeFilterChange,
  statusFilter = 'all',
  onStatusFilterChange,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClearDateFilter,
  hasMore = false,
  onLoadMore,
  totalCount,
}: TransactionListProps) {
  const formatAmount = (amount: string) => {
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

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'income':
        return 'text-green-600 bg-green-50';
      case 'expense':
        return 'text-red-600 bg-red-50';
      case 'debt':
        return 'text-orange-600 bg-orange-50';
      case 'receivable':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'settled':
        return 'text-gray-600 bg-gray-50';
      case 'cancelled':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const canMarkAsSettled = (transaction: Transaction) => {
    return (
      (transaction.type === 'debt' || transaction.type === 'receivable') &&
      (transaction.status || 'active') === 'active'
    );
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Type Filter */}
            {onTypeFilterChange && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Transaction Type</label>
                <Select value={typeFilter} onValueChange={onTypeFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="income">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                    <SelectItem value="debt">Debt</SelectItem>
                    <SelectItem value="receivable">Receivable</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter */}
            {onStatusFilterChange && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <Select value={statusFilter} onValueChange={onStatusFilterChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="settled">Settled</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Date Range Filter */}
          {onStartDateChange && onEndDateChange && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <DateRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={onStartDateChange}
                onEndDateChange={onEndDateChange}
                onClear={onClearDateFilter}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transactions</span>
            {totalCount !== undefined && (
              <span className="text-sm font-normal text-muted-foreground">
                {totalCount} total
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading && transactions.length === 0 ? (
            <div className="space-y-4">
               {[1, 2, 3, 4, 5].map((i) => (
                 <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                   <div className="space-y-2 w-full">
                     <Skeleton className="h-4 w-[200px]" />
                     <Skeleton className="h-4 w-[150px]" />
                   </div>
                   <Skeleton className="h-8 w-[100px]" />
                 </div>
               ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No transactions found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getTransactionTypeColor(
                          transaction.type
                        )}`}
                      >
                        {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          transaction.status || 'active'
                        )}`}
                      >
                        {(transaction.status || 'active').charAt(0).toUpperCase() + (transaction.status || 'active').slice(1)}
                      </span>
                    </div>
                    <h3 className="font-medium">{transaction.description}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{formatDate(transaction.transactionDate)}</span>
                      {transaction.category && <span>• {transaction.category}</span>}
                      {transaction.relatedParty && <span>• {transaction.relatedParty}</span>}
                      {transaction.dueDate && (
                        <span>• Due: {formatDate(transaction.dueDate)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-semibold">
                      {formatAmount(transaction.amount)}
                    </span>
                    <div className="flex gap-2">
                      {canMarkAsSettled(transaction) && onMarkAsSettled && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onMarkAsSettled(transaction.id)}
                        >
                          Mark Settled
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(transaction)}
                        >
                          Edit
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => onDelete(transaction.id)}
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMore && onLoadMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={onLoadMore}
                disabled={isLoading}
              >
                {isLoading ? 'Loading...' : 'Load More'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}