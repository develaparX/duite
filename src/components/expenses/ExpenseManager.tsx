import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction, NewTransaction } from '@/db/schema';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface ExpenseManagerProps {
  userId: number;
  authToken: string;
}

interface MonthlyExpenseData {
  month: number;
  year: number;
  transactions: Transaction[];
  totalAmount: number;
  categorizedTotals: { [category: string]: number };
}

export function ExpenseManager({ authToken }: ExpenseManagerProps) {
  const [expenseTransactions, setExpenseTransactions] = useState<Transaction[]>([]);
  const [displayedLimit, setDisplayedLimit] = useState(20);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [activeTab, setActiveTab] = useState<'monthly' | 'trends'>('monthly');
  
  // Monthly filtering state
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyData, setMonthlyData] = useState<MonthlyExpenseData | null>(null);
  
  // Source filtering state
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [availableSources, setAvailableSources] = useState<string[]>([]);

  // Generate year options (current year and 5 years back)
  const yearOptions = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  
  // Month options
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  useEffect(() => {
    loadExpenseCategories();
  }, []);

  useEffect(() => {
    loadMonthlyExpenses();
  }, [selectedYear, selectedMonth, selectedSource]);

  useEffect(() => {
    loadAvailableSources();
  }, []);

  const loadAvailableSources = async () => {
    try {
      const params = new URLSearchParams({
        type: 'expense',
        limit: '1000',
      });

      const response = await fetch(`/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load expense sources');
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      const sources = Array.from(new Set(
        transactions
          .map((t: Transaction) => t.category)
          .filter((category: string | null) => category !== null && category !== undefined)
      )) as string[];

      setAvailableSources(sources.sort());
    } catch (error) {
      console.error('Error loading expense sources:', error);
    }
  };

  const loadExpenseCategories = async () => {
    try {
      const defaultCategories: Category[] = [
        { id: 1, name: 'Food & Dining', type: 'expense', color: '#EF4444' },
        { id: 2, name: 'Transportation', type: 'expense', color: '#F97316' },
        { id: 3, name: 'Housing & Utilities', type: 'expense', color: '#EAB308' },
        { id: 4, name: 'Entertainment', type: 'expense', color: '#3B82F6' },
        { id: 5, name: 'Shopping', type: 'expense', color: '#8B5CF6' },
        { id: 6, name: 'Health', type: 'expense', color: '#EC4899' },
        { id: 7, name: 'Other', type: 'expense', color: '#6B7280' },
      ];
      setCategories(defaultCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMonthlyExpenses = async () => {
    setIsLoading(true);
    setError('');

    try {
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      const params = new URLSearchParams({
        type: 'expense',
        startDate,
        endDate,
        limit: '1000',
      });

      if (selectedSource !== 'all') {
        params.append('category', selectedSource);
      }

      const response = await fetch(`/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load expense data');
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      const categorizedTotals: { [category: string]: number } = {};
      let totalAmount = 0;

      transactions.forEach((transaction: Transaction) => {
        const amount = parseFloat(transaction.amount);
        totalAmount += amount;
        
        const category = transaction.category || 'Uncategorized';
        categorizedTotals[category] = (categorizedTotals[category] || 0) + amount;
      });

      setMonthlyData({
        month: selectedMonth,
        year: selectedYear,
        transactions,
        totalAmount,
        categorizedTotals,
      });

      setExpenseTransactions(transactions);
      setDisplayedLimit(20);
      await loadAvailableSources();
    } catch (error) {
      console.error('Error loading monthly expenses:', error);
      setError('Failed to load expense data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExpense = async (data: NewTransaction) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          type: 'expense',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create expense');
      }

      setShowAddForm(false);
      await loadMonthlyExpenses();
      await loadAvailableSources();
    } catch (error) {
      console.error('Error creating expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to create expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditExpense = async (data: NewTransaction) => {
    if (!editingTransaction) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/transactions/${editingTransaction.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update expense');
      }

      setEditingTransaction(null);
      await loadMonthlyExpenses();
      await loadAvailableSources();
    } catch (error) {
      console.error('Error updating expense:', error);
      setError(error instanceof Error ? error.message : 'Failed to update expense');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExpense = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this expense?')) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete expense');
      }

      await loadMonthlyExpenses();
    } catch (error) {
      console.error('Error deleting expense:', error);
      setError('Failed to delete expense');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  if (showAddForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Add Expense</h2>
          <Button variant="outline" onClick={() => setShowAddForm(false)}>
            Back to Expense Management
          </Button>
        </div>
        <TransactionForm
          categories={categories}
          onSubmit={handleCreateExpense}
          onCancel={() => setShowAddForm(false)}
          isLoading={isLoading}
          error={error}
          defaultType="expense"
        />
      </div>
    );
  }

  if (editingTransaction) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Edit Expense</h2>
          <Button variant="outline" onClick={() => setEditingTransaction(null)}>
            Back to Expense Management
          </Button>
        </div>
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSubmit={handleEditExpense}
          onCancel={() => setEditingTransaction(null)}
          isLoading={isLoading}
          error={error}
          defaultType="expense"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Expense Management</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant={activeTab === 'monthly' ? 'default' : 'outline'}
            onClick={() => setActiveTab('monthly')}
            className="flex-1 sm:flex-initial"
          >
            Monthly View
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex-1 sm:flex-initial"
          >
            Add Expense
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Expense Filter</CardTitle>
          <CardDescription>
            Select a month and year to view expenses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Year</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(value) => setSelectedMonth(parseInt(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Expense Category</Label>
              <Select
                value={selectedSource}
                onValueChange={setSelectedSource}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {availableSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              `${monthOptions.find(m => m.value === (monthlyData?.month || selectedMonth))?.label} ${monthlyData?.year || selectedYear} Summary`
            )}
          </CardTitle>
          <CardDescription>
            {isLoading ? <Skeleton className="h-4 w-64" /> : 'Expense breakdown by category'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                 <Skeleton className="h-24 w-full rounded-lg" />
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   <Skeleton className="h-12 w-full" />
                   <Skeleton className="h-12 w-full" />
                 </div>
              </div>
            ) : monthlyData && (
              <>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium text-red-800">Total Expenses</span>
                    <span className="text-2xl font-bold text-red-900">
                      {formatCurrency(monthlyData.totalAmount)}
                    </span>
                  </div>
                </div>

                {Object.keys(monthlyData.categorizedTotals).length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Expenses by Category</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {Object.entries(monthlyData.categorizedTotals).map(([category, amount]) => (
                        <div key={category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium">{category}</span>
                          <span className="font-semibold">{formatCurrency(amount)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      <TransactionList
        transactions={expenseTransactions.slice(0, displayedLimit)}
        isLoading={isLoading}
        onEdit={setEditingTransaction}
        onDelete={handleDeleteExpense}
        totalCount={expenseTransactions.length}
        hasMore={displayedLimit < expenseTransactions.length}
        onLoadMore={() => setDisplayedLimit(prev => prev + 20)}
      />
    </div>
  );
}
