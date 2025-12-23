import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Bell, 
  AlertTriangle, 
  Calendar, 
  Plus,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface BillReminderStatus {
  billReminder: {
    id: number;
    name: string;
    amount: string;
    payee: string;
    nextDueDate: string;
    frequency: string;
    category?: string;
    isPaid: boolean;
  };
  daysUntilDue: number;
  isOverdue: boolean;
  shouldRemind: boolean;
  nextOccurrence: Date;
  estimatedMonthlyAmount: number;
}

interface BillSummary {
  totalBills: number;
  activeBills: number;
  paidBills: number;
  overdueBills: number;
  dueSoonBills: number;
  totalMonthlyAmount: number;
  totalYearlyAmount: number;
  averageBillAmount: number;
}

interface BillRemindersWidgetProps {
  onCreateBill?: () => void;
  onViewAll?: () => void;
}

export function BillRemindersWidget({ onCreateBill, onViewAll }: BillRemindersWidgetProps) {
  const { token } = useAuth();
  const [dueSoonBills, setDueSoonBills] = useState<BillReminderStatus[]>([]);
  const [overdueBills, setOverdueBills] = useState<BillReminderStatus[]>([]);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/bill-reminders?isActive=true', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch bill reminders');
      }

      const data = await response.json();
      setDueSoonBills(data.dueSoon || []);
      setOverdueBills(data.overdue || []);
      setSummary(data.summary);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (billId: number) => {
    try {
      const response = await fetch(`/api/bill-reminders/${billId}/pay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paidDate: new Date().toISOString().split('T')[0],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark bill as paid');
      }

      // Refresh the bills list
      fetchBills();
    } catch (err) {
      console.error('Mark as paid error:', err);
    }
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(numAmount);
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getDaysText = (days: number): string => {
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    if (days < 0) return `${Math.abs(days)} days overdue`;
    return `${days} days`;
  };

  const getBillStatusColor = (bill: BillReminderStatus): string => {
    if (bill.isOverdue) return 'text-red-600';
    if (bill.daysUntilDue <= 1) return 'text-orange-600';
    if (bill.daysUntilDue <= 3) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBillStatusIcon = (bill: BillReminderStatus) => {
    if (bill.isOverdue) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (bill.daysUntilDue <= 1) return <Clock className="h-4 w-4 text-orange-600" />;
    return <Bell className="h-4 w-4 text-yellow-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bill Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bill Reminders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchBills} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const allBills = [...overdueBills, ...dueSoonBills].slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2" />
              Bill Reminders
            </CardTitle>
            <CardDescription>
              {summary ? `${summary.dueSoonBills + summary.overdueBills} bills need attention` : 'Upcoming and overdue bills'}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={onCreateBill} size="sm" variant="outline" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Bill
            </Button>
            {allBills.length > 0 && (
              <Button onClick={onViewAll} size="sm" className="w-full sm:w-auto">
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Monthly Bills</p>
              <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(summary.totalMonthlyAmount)}</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Active Bills</p>
              <p className="text-xl sm:text-2xl font-bold">{summary.activeBills}</p>
            </div>
          </div>
        )}

        {allBills.length === 0 ? (
          <div className="text-center py-8">
            <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">All bills are up to date!</p>
            <Button onClick={onCreateBill} variant="outline" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Bill Reminder
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {allBills.map((billStatus) => (
              <div key={billStatus.billReminder.id} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {getBillStatusIcon(billStatus)}
                    <h4 className="font-medium break-words">{billStatus.billReminder.name}</h4>
                    {billStatus.billReminder.category && (
                      <Badge variant="secondary">{billStatus.billReminder.category}</Badge>
                    )}
                    {billStatus.isOverdue && (
                      <Badge variant="destructive">Overdue</Badge>
                    )}
                  </div>
                  <div className="text-left sm:text-right w-full sm:w-auto">
                    <p className="font-medium">{formatCurrency(billStatus.billReminder.amount)}</p>
                    <p className={`text-sm ${getBillStatusColor(billStatus)}`}>
                      {getDaysText(billStatus.daysUntilDue)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm text-muted-foreground gap-2">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span>To: {billStatus.billReminder.payee}</span>
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>Due: {formatDate(billStatus.billReminder.nextDueDate)}</span>
                    </div>
                  </div>
                  
                  {!billStatus.billReminder.isPaid && (
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => markAsPaid(billStatus.billReminder.id)}
                    >
                      Mark Paid
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}