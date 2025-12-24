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
import { IncomeTrends } from './IncomeTrends';
import { Skeleton } from '@/components/ui/skeleton';
import type { Transaction, NewTransaction } from '@/db/schema';

interface Category {
  id: number;
  name: string;
  type: 'income' | 'expense';
  color: string;
}

interface IncomeManagerProps {
  userId: number;
  authToken: string;
}

interface MonthlyIncomeData {
  month: number;
  year: number;
  transactions: Transaction[];
  totalAmount: number;
  categorizedTotals: { [category: string]: number };
}

export function IncomeManager({ userId, authToken }: IncomeManagerProps) {
  const [incomeTransactions, setIncomeTransactions] = useState<Transaction[]>([]);
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
  const [monthlyData, setMonthlyData] = useState<MonthlyIncomeData | null>(null);
  
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

  // Load income categories
  useEffect(() => {
    loadIncomeCategories();
  }, []);

  // Load monthly income data when month/year changes
  useEffect(() => {
    loadMonthlyIncome();
  }, [selectedYear, selectedMonth, selectedSource]);

  // Load available sources when component mounts
  useEffect(() => {
    loadAvailableSources();
  }, []);

  const loadAvailableSources = async () => {
    try {
      // Get all income transactions to extract unique sources
      const params = new URLSearchParams({
        type: 'income',
        limit: '1000',
      });

      const response = await fetch(`/api/transactions?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load income sources');
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      // Extract unique sources from transactions
      const sources = Array.from(new Set(
        transactions
          .map((t: Transaction) => t.category)
          .filter((category: string | null) => category !== null && category !== undefined)
      )) as string[];

      setAvailableSources(sources.sort());
    } catch (error) {
      console.error('Error loading income sources:', error);
      // Don't set error state for this, as it's not critical
    }
  };

  const loadIncomeCategories = async () => {
    try {
      // For now, use default income categories
      // In a real app, this would come from an API
      const defaultCategories: Category[] = [
        { id: 1, name: 'Salary', type: 'income', color: '#10B981' },
        { id: 2, name: 'Freelance', type: 'income', color: '#3B82F6' },
        { id: 3, name: 'Investment Returns', type: 'income', color: '#8B5CF6' },
        { id: 4, name: 'Business Income', type: 'income', color: '#F59E0B' },
        { id: 5, name: 'Rental Income', type: 'income', color: '#EF4444' },
        { id: 6, name: 'Other Income', type: 'income', color: '#6B7280' },
      ];
      setCategories(defaultCategories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadMonthlyIncome = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Calculate date range for the selected month
      const startDate = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}-01`;
      const endDate = new Date(selectedYear, selectedMonth, 0).toISOString().split('T')[0];

      // Build query parameters for transactions API
      const params = new URLSearchParams({
        type: 'income',
        startDate,
        endDate,
        limit: '1000', // Get all income for the month
      });

      // Add source filter if selected
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
        throw new Error('Failed to load income data');
      }

      const data = await response.json();
      const transactions = data.transactions || [];

      // Calculate totals by category using IncomeService
      const categorizedTotals: { [category: string]: number } = {};
      let totalAmount = 0;

      transactions.forEach((transaction: Transaction) => {
        const amount = parseFloat(transaction.amount);
        totalAmount += amount;
        
        const category = transaction.category || 'Uncategorized';
        categorizedTotals[category] = (categorizedTotals[category] || 0) + amount;
      });

      // Update state with monthly data
      setMonthlyData({
        month: selectedMonth,
        year: selectedYear,
        transactions,
        totalAmount,
        categorizedTotals,
      });

      setIncomeTransactions(transactions);
      setDisplayedLimit(20);

      // Load available sources separately
      await loadAvailableSources();
    } catch (error) {
      console.error('Error loading monthly income:', error);
      setError('Failed to load income data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateIncome = async (data: NewTransaction) => {
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
          type: 'income',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to create income');
      }

      setShowAddForm(false);
      await loadMonthlyIncome(); // Reload data
      await loadAvailableSources(); // Reload sources in case a new one was added
    } catch (error) {
      console.error('Error creating income:', error);
      setError(error instanceof Error ? error.message : 'Failed to create income');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditIncome = async (data: NewTransaction) => {
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
        throw new Error(errorData.error?.message || 'Failed to update income');
      }

      setEditingTransaction(null);
      await loadMonthlyIncome(); // Reload data
      await loadAvailableSources(); // Reload sources in case category was changed
    } catch (error) {
      console.error('Error updating income:', error);
      setError(error instanceof Error ? error.message : 'Failed to update income');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteIncome = async (transactionId: number) => {
    if (!confirm('Are you sure you want to delete this income transaction?')) {
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
        throw new Error('Failed to delete income');
      }

      await loadMonthlyIncome(); // Reload data
    } catch (error) {
      console.error('Error deleting income:', error);
      setError('Failed to delete income');
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Add Income</h2>
          <Button variant="outline" onClick={() => setShowAddForm(false)} className="w-full sm:w-auto">
            Back to Income Management
          </Button>
        </div>
        <TransactionForm
          categories={categories}
          onSubmit={handleCreateIncome}
          onCancel={() => setShowAddForm(false)}
          isLoading={isLoading}
          error={error}
        />
      </div>
    );
  }

  if (editingTransaction) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold">Edit Income</h2>
          <Button variant="outline" onClick={() => setEditingTransaction(null)} className="w-full sm:w-auto">
            Back to Income Management
          </Button>
        </div>
        <TransactionForm
          transaction={editingTransaction}
          categories={categories}
          onSubmit={handleEditIncome}
          onCancel={() => setEditingTransaction(null)}
          isLoading={isLoading}
          error={error}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Income Management</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant={activeTab === 'monthly' ? 'default' : 'outline'}
            onClick={() => setActiveTab('monthly')}
            className="flex-1 sm:flex-initial"
            size="sm"
          >
            Monthly View
          </Button>
          <Button
            variant={activeTab === 'trends' ? 'default' : 'outline'}
            onClick={() => setActiveTab('trends')}
            className="flex-1 sm:flex-initial"
            size="sm"
          >
            Trends
          </Button>
          <Button 
            onClick={() => setShowAddForm(true)}
            className="flex-1 sm:flex-initial"
            size="sm"
          >
            Add Income
          </Button>
        </div>
      </div>

      {/* Render based on active tab */}
      {activeTab === 'trends' ? (
        <IncomeTrends userId={userId} authToken={authToken} />
      ) : (
        <>
          {/* Monthly Filter Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Monthly Income Filter</CardTitle>
              <CardDescription>
                Select a month and year to view income transactions and totals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Year Selector */}
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

                {/* Month Selector */}
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

                {/* Source Filter */}
                <div className="space-y-2">
                  <Label>Income Source</Label>
                  <Select
                    value={selectedSource}
                    onValueChange={setSelectedSource}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
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
                {isLoading ? <Skeleton className="h-4 w-64" /> : 'Income breakdown by source category'}
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
                    {/* Total Income */}
                    <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-lg font-medium text-green-800">Total Income</span>
                        <span className="text-2xl font-bold text-green-900">
                          {formatCurrency(monthlyData.totalAmount)}
                        </span>
                      </div>
                    </div>

                    {/* Income by Category */}
                    {Object.keys(monthlyData.categorizedTotals).length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-medium">Income by Source</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {Object.entries(monthlyData.categorizedTotals).map(([category, amount]) => (
                            <div key={category} className="flex flex-wrap items-center justify-between p-3 bg-gray-50 rounded-lg gap-2">
                              <span className="font-medium mr-1">{category}</span>
                              <span className="font-semibold">{formatCurrency(amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Transaction Count */}
                    <div className="text-sm text-gray-600">
                      {monthlyData.transactions.length} income transaction{monthlyData.transactions.length !== 1 ? 's' : ''}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
              {error}
            </div>
          )}

          {/* Income Transactions List */}
          <TransactionList
            transactions={incomeTransactions.slice(0, displayedLimit)}
            isLoading={isLoading}
            onEdit={setEditingTransaction}
            onDelete={handleDeleteIncome}
            totalCount={incomeTransactions.length}
            hasMore={displayedLimit < incomeTransactions.length}
            onLoadMore={() => setDisplayedLimit(prev => prev + 20)}
          />
        </>
      )}
    </div>
  );
}