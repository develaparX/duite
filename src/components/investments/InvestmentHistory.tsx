import React, { useState, useEffect } from 'react';
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
import type { InvestmentBalance } from '@/db/schema';

interface InvestmentHistoryProps {
  userId: number;
  authToken: string;
  selectedAccount?: string;
  onAccountChange?: (accountName: string) => void;
}

interface HistoryEntry extends InvestmentBalance {
  gainLoss?: number;
  gainLossPercentage?: number;
  isPositive?: boolean;
}

export function InvestmentHistory({ 
  userId, 
  authToken, 
  selectedAccount,
  onAccountChange 
}: InvestmentHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [accountNames, setAccountNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [currentAccount, setCurrentAccount] = useState<string>(selectedAccount || 'all');

  useEffect(() => {
    loadAccountNames();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [currentAccount]);

  const loadAccountNames = async () => {
    try {
      const response = await fetch('/api/investments/accounts', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load account names');
      }

      const data = await response.json();
      setAccountNames(data.accountNames || []);
    } catch (error) {
      console.error('Error loading account names:', error);
      setError('Failed to load account names');
    }
  };

  const loadHistory = async () => {
    setIsLoading(true);
    setError('');

    try {
      const params = new URLSearchParams({
        limit: '50',
      });

      if (currentAccount !== 'all') {
        params.append('accountName', currentAccount);
      }

      const response = await fetch(`/api/investments/history?${params}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load investment history');
      }

      const data = await response.json();
      const historyData = data.history || [];

      // Calculate gain/loss for each entry compared to previous entry
      const enhancedHistory: HistoryEntry[] = historyData.map((entry: InvestmentBalance, index: number) => {
        const currentBalance = parseFloat(entry.balance);
        let gainLoss = 0;
        let gainLossPercentage = 0;
        let isPositive = true;

        // Find previous entry for the same account
        const previousEntry = historyData
          .slice(index + 1)
          .find((prev: InvestmentBalance) => prev.accountName === entry.accountName);

        if (previousEntry) {
          const previousBalance = parseFloat(previousEntry.balance);
          gainLoss = currentBalance - previousBalance;
          gainLossPercentage = previousBalance !== 0 ? (gainLoss / previousBalance) * 100 : 0;
          isPositive = gainLoss >= 0;
        }

        return {
          ...entry,
          gainLoss,
          gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
          isPositive,
        };
      });

      setHistory(enhancedHistory);
    } catch (error) {
      console.error('Error loading investment history:', error);
      setError('Failed to load investment history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccountChange = (accountName: string) => {
    setCurrentAccount(accountName);
    if (onAccountChange) {
      onAccountChange(accountName);
    }
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(numAmount);
  };

  const formatPercentage = (percentage: number): string => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  };

  const formatDate = (date: Date | string | null): string => {
    if (!date) return 'N/A';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAccountTypeName = (type: string): string => {
    return type
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="space-y-6">
      {/* Account Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Balance History</CardTitle>
          <CardDescription>
            View the balance history for your investment accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={currentAccount}
                  onValueChange={handleAccountChange}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {accountNames.map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* History List */}
      <Card>
        <CardHeader>
          <CardTitle>
            Balance History
            {currentAccount !== 'all' && ` - ${currentAccount}`}
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${history.length} balance record${history.length !== 1 ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading investment history...</div>
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {currentAccount === 'all' 
                ? 'No investment balance records found'
                : `No balance records found for ${currentAccount}`
              }
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((entry, index) => (
                <div
                  key={entry.id}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 w-full">
                      <div className="flex flex-wrap items-center gap-3">
                        <h4 className="font-semibold text-lg">{entry.accountName}</h4>
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded-full">
                          {formatAccountTypeName(entry.accountType || 'general')}
                        </span>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Balance: </span>
                          <span className="font-semibold text-lg">
                            {formatCurrency(entry.balance)}
                          </span>
                        </div>
                        
                        {entry.gainLoss !== undefined && entry.gainLoss !== 0 && (
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-sm font-medium ${
                                entry.isPositive ? 'text-green-600' : 'text-red-600'
                              }`}
                            >
                              {entry.isPositive ? '+' : ''}{formatCurrency(entry.gainLoss)}
                            </span>
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${
                                entry.isPositive 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {formatPercentage(entry.gainLossPercentage || 0)}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="text-sm text-gray-600">
                        Recorded: {formatDate(entry.recordedAt)}
                      </div>

                      {entry.notes && (
                        <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                          <strong>Notes:</strong> {entry.notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}