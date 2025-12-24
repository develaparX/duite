import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InvestmentBalanceForm } from './InvestmentBalanceForm';
import { InvestmentHistory } from './InvestmentHistory';
import { InvestmentPerformance } from './InvestmentPerformance';
import type { InvestmentBalance, NewInvestmentBalance } from '@/db/schema';

interface InvestmentManagerProps {
  userId: number;
  authToken: string;
}

interface InvestmentSummary {
  totalCurrentBalance: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  accountCount: number;
  lastUpdated: Date | null;
  accounts: {
    accountName: string;
    accountType: string;
    currentBalance: number;
    lastUpdated: Date;
  }[];
}

type TabType = 'overview' | 'add' | 'history' | 'performance';

export function InvestmentManager({ userId, authToken }: InvestmentManagerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [summary, setSummary] = useState<InvestmentSummary | null>(null);
  const [existingAccountNames, setExistingAccountNames] = useState<string[]>([]);
  const [existingAccountTypes, setExistingAccountTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [editingBalance, setEditingBalance] = useState<InvestmentBalance | null>(null);

  useEffect(() => {
    loadInvestmentData();
  }, []);

  const loadInvestmentData = async () => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/investments/summary', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load investment data');
      }

      const data = await response.json();
      setSummary(data.summary);
      setExistingAccountNames(data.accountNames || []);
      setExistingAccountTypes(data.accountTypes || []);
    } catch (error) {
      console.error('Error loading investment data:', error);
      setError('Failed to load investment data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBalance = async (data: NewInvestmentBalance) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/investments', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to record balance');
      }

      setActiveTab('overview');
      await loadInvestmentData(); // Reload data
    } catch (error) {
      console.error('Error creating balance:', error);
      setError(error instanceof Error ? error.message : 'Failed to record balance');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBalance = async (data: NewInvestmentBalance) => {
    if (!editingBalance) return;

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`/api/investments/${editingBalance.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update balance');
      }

      setEditingBalance(null);
      setActiveTab('overview');
      await loadInvestmentData(); // Reload data
    } catch (error) {
      console.error('Error updating balance:', error);
      setError(error instanceof Error ? error.message : 'Failed to update balance');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const formatPercentage = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const formatDate = (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatAccountTypeName = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Render based on active tab
  const renderContent = () => {
    if (activeTab === 'add' || editingBalance) {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              {editingBalance ? 'Update Investment Balance' : 'Record Investment Balance'}
            </h2>
            <Button 
              variant="outline" 
              onClick={() => {
                setActiveTab('overview');
                setEditingBalance(null);
              }}
            >
              Back to Overview
            </Button>
          </div>
          <InvestmentBalanceForm
            balance={editingBalance || undefined}
            onSubmit={editingBalance ? handleUpdateBalance : handleCreateBalance}
            onCancel={() => {
              setActiveTab('overview');
              setEditingBalance(null);
            }}
            isLoading={isLoading}
            error={error}
            existingAccountNames={existingAccountNames}
            existingAccountTypes={existingAccountTypes}
          />
        </div>
      );
    }

    if (activeTab === 'history') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Investment History</h2>
            <Button variant="outline" onClick={() => setActiveTab('overview')}>
              Back to Overview
            </Button>
          </div>
          <InvestmentHistory userId={userId} authToken={authToken} />
        </div>
      );
    }

    if (activeTab === 'performance') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Investment Performance</h2>
            <Button variant="outline" onClick={() => setActiveTab('overview')}>
              Back to Overview
            </Button>
          </div>
          <InvestmentPerformance userId={userId} authToken={authToken} />
        </div>
      );
    }

    // Default to overview
    return (
      <>
        {/* Error Display */}
        {error && (
          <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        {/* Portfolio Summary */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Balance */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Portfolio Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(summary.totalCurrentBalance)}
                </div>
                {summary.lastUpdated && (
                  <p className="text-xs text-gray-500 mt-1">
                    Last updated: {formatDate(summary.lastUpdated)}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Total Gain/Loss */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Gain/Loss</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(summary.totalGainLoss)}
                </div>
                <div className={`text-sm ${
                  summary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatPercentage(summary.totalGainLossPercentage)}
                </div>
              </CardContent>
            </Card>

            {/* Account Count */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Investment Accounts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {summary.accountCount}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Active account{summary.accountCount !== 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>

            {/* Quick Action */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={() => setActiveTab('add')} 
                  className="w-full"
                  size="sm"
                >
                  Record New Balance
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Account Details */}
        {summary && summary.accounts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
              <CardDescription>
                Current balances for all your investment accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {summary.accounts.map((account) => (
                  <div
                    key={account.accountName}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors gap-4"
                  >
                    <div className="space-y-1 w-full">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="font-semibold">{account.accountName}</h4>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {formatAccountTypeName(account.accountType)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Last updated: {formatDate(account.lastUpdated)}
                      </p>
                    </div>
                    <div className="text-left sm:text-right w-full sm:w-auto ml-0">
                      <div className="text-lg font-semibold">
                        {formatCurrency(account.currentBalance)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {summary && summary.accountCount === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <div className="space-y-4">
                <div className="text-gray-500">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">No investment accounts yet</h3>
                  <p className="text-gray-500 mt-1">
                    Start tracking your investment portfolio by recording your first balance.
                  </p>
                </div>
                <Button onClick={() => setActiveTab('add')}>
                  Record Your First Balance
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {isLoading && !summary && (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading investment data...</div>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold">Investment Portfolio</h2>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <Button
            variant={activeTab === 'overview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('overview')}
            className="flex-1 sm:flex-initial"
            size="sm"
          >
            Overview
          </Button>
          <Button
            variant={activeTab === 'history' ? 'default' : 'outline'}
            onClick={() => setActiveTab('history')}
            className="flex-1 sm:flex-initial"
            size="sm"
          >
            History
          </Button>
          <Button
            variant={activeTab === 'performance' ? 'default' : 'outline'}
            onClick={() => setActiveTab('performance')}
            className="flex-1 sm:flex-initial"
            size="sm"
          >
            Performance
          </Button>
          <Button 
            onClick={() => setActiveTab('add')}
            className="flex-1 sm:flex-initial"
            size="sm"
          >
            Record Balance
          </Button>
        </div>
      </div>

      {renderContent()}
    </div>
  );
}