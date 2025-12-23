import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface InvestmentPerformanceProps {
  userId: number;
  authToken: string;
}

interface PerformanceData {
  accountName: string;
  currentBalance: number;
  previousBalance: number;
  gainLoss: number;
  gainLossPercentage: number;
  isPositive: boolean;
  recordedAt: Date;
}

interface PerformanceSummary {
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

export function InvestmentPerformance({ authToken }: InvestmentPerformanceProps) {
  const [performance, setPerformance] = useState<PerformanceData[]>([]);
  const [, setSummary] = useState<PerformanceSummary | null>(null);
  const [accountNames, setAccountNames] = useState<string[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadPerformanceData();
  }, [selectedAccount]);

  const loadPerformanceData = async () => {
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
        throw new Error('Failed to load performance data');
      }

      const data = await response.json();
      setSummary(data.summary);
      setPerformance(data.performance || []);
      setAccountNames(data.accountNames || []);
    } catch (error) {
      console.error('Error loading performance data:', error);
      setError('Failed to load performance data');
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

  const getFilteredPerformance = (): PerformanceData[] => {
    if (selectedAccount === 'all') {
      return performance;
    }
    return performance.filter(p => p.accountName === selectedAccount);
  };

  const calculateFilteredSummary = () => {
    const filtered = getFilteredPerformance();
    if (filtered.length === 0) return null;

    const totalCurrent = filtered.reduce((sum, p) => sum + p.currentBalance, 0);
    const totalGainLoss = filtered.reduce((sum, p) => sum + p.gainLoss, 0);
    const totalPrevious = totalCurrent - totalGainLoss;
    const totalGainLossPercentage = totalPrevious !== 0 ? (totalGainLoss / totalPrevious) * 100 : 0;

    return {
      totalCurrentBalance: totalCurrent,
      totalGainLoss,
      totalGainLossPercentage,
      accountCount: filtered.length,
    };
  };

  const filteredSummary = calculateFilteredSummary();

  return (
    <div className="space-y-6">
      {/* Filter Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Performance Analysis</CardTitle>
          <CardDescription>
            View performance metrics and gains/losses for your investment accounts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Account</Label>
                <Select
                  value={selectedAccount}
                  onValueChange={setSelectedAccount}
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

      {/* Performance Summary */}
      {filteredSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Value */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {selectedAccount === 'all' ? 'Total Portfolio Value' : 'Account Value'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(filteredSummary.totalCurrentBalance)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {filteredSummary.accountCount} account{filteredSummary.accountCount !== 1 ? 's' : ''}
              </p>
            </CardContent>
          </Card>

          {/* Total Gain/Loss */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Gain/Loss</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                filteredSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {filteredSummary.totalGainLoss >= 0 ? '+' : ''}{formatCurrency(filteredSummary.totalGainLoss)}
              </div>
              <div className={`text-sm ${
                filteredSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatPercentage(filteredSummary.totalGainLossPercentage)}
              </div>
            </CardContent>
          </Card>

          {/* Performance Status */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Performance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${
                filteredSummary.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {filteredSummary.totalGainLoss >= 0 ? 'Gaining' : 'Losing'}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Since last update
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Performance Details */}
      <Card>
        <CardHeader>
          <CardTitle>
            Performance Details
            {selectedAccount !== 'all' && ` - ${selectedAccount}`}
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `Detailed performance metrics for your investment${selectedAccount === 'all' ? 's' : ''}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-gray-500">Loading performance data...</div>
            </div>
          ) : getFilteredPerformance().length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {selectedAccount === 'all' 
                ? 'No performance data available. Record at least two balance entries for each account to see performance metrics.'
                : `No performance data available for ${selectedAccount}. Record at least two balance entries to see performance metrics.`
              }
            </div>
          ) : (
            <div className="space-y-4">
              {getFilteredPerformance().map((perf) => (
                <div
                  key={perf.accountName}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-lg">{perf.accountName}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Current Balance */}
                        <div>
                          <span className="text-sm text-gray-600">Current Balance</span>
                          <div className="font-semibold text-lg">
                            {formatCurrency(perf.currentBalance)}
                          </div>
                        </div>

                        {/* Previous Balance */}
                        <div>
                          <span className="text-sm text-gray-600">Previous Balance</span>
                          <div className="font-semibold text-lg">
                            {formatCurrency(perf.previousBalance)}
                          </div>
                        </div>

                        {/* Gain/Loss */}
                        <div>
                          <span className="text-sm text-gray-600">Gain/Loss</span>
                          <div className={`font-semibold text-lg ${
                            perf.isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {perf.isPositive ? '+' : ''}{formatCurrency(perf.gainLoss)}
                          </div>
                          <div className={`text-sm ${
                            perf.isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatPercentage(perf.gainLossPercentage)}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm text-gray-600">
                        Last updated: {formatDate(perf.recordedAt)}
                      </div>
                    </div>

                    {/* Performance Indicator */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                      perf.isPositive 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {perf.isPositive ? '↗ Gaining' : '↘ Losing'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Record balances regularly to track performance trends over time</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Performance is calculated by comparing your most recent balance to the previous entry</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Consider market conditions and time periods when evaluating performance</span>
            </div>
            <div className="flex items-start space-x-2">
              <span className="text-blue-500 mt-1">•</span>
              <span>Use the notes field when recording balances to track significant events or changes</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}