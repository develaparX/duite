import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface DebtReceivableSummaryProps {
  summary: {
    totalOutstandingDebts: number;
    totalOutstandingReceivables: number;
    totalSettledDebts: number;
    totalSettledReceivables: number;
    debtCount: number;
    receivableCount: number;
  };
  overdue?: {
    overdueDebts: any[];
    overdueReceivables: any[];
  };
}

export function DebtReceivableSummary({ summary, overdue }: DebtReceivableSummaryProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const netPosition = summary.totalOutstandingReceivables - summary.totalOutstandingDebts;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Outstanding Debts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Debts</CardTitle>
          <div className="h-4 w-4 text-red-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summary.totalOutstandingDebts)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.debtCount} total debt{summary.debtCount !== 1 ? 's' : ''}
            {overdue && overdue.overdueDebts.length > 0 && (
              <span className="text-red-600 font-medium">
                {' '}• {overdue.overdueDebts.length} overdue
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Outstanding Receivables */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
          <div className="h-4 w-4 text-green-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(summary.totalOutstandingReceivables)}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.receivableCount} total receivable{summary.receivableCount !== 1 ? 's' : ''}
            {overdue && overdue.overdueReceivables.length > 0 && (
              <span className="text-red-600 font-medium">
                {' '}• {overdue.overdueReceivables.length} overdue
              </span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Net Position */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Net Position</CardTitle>
          <div className={`h-4 w-4 ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <polyline points="22,12 18,12 15,21 9,3 6,12 2,12" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${netPosition >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(Math.abs(netPosition))}
          </div>
          <p className="text-xs text-muted-foreground">
            {netPosition >= 0 ? 'Net receivable' : 'Net debt'}
          </p>
        </CardContent>
      </Card>

      {/* Total Settled */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Settled</CardTitle>
          <div className="h-4 w-4 text-blue-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4"
            >
              <polyline points="20,6 9,17 4,12" />
            </svg>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summary.totalSettledDebts + summary.totalSettledReceivables)}
          </div>
          <p className="text-xs text-muted-foreground">
            {formatCurrency(summary.totalSettledDebts)} debts paid •{' '}
            {formatCurrency(summary.totalSettledReceivables)} collected
          </p>
        </CardContent>
      </Card>
    </div>
  );
}