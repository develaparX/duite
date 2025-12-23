import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

interface IncomeTrendsProps {
  userId: number;
  authToken: string;
}

interface TrendData {
  month: string;
  year: number;
  totalIncome: number;
}

interface IncomeGrowth {
  growthRate: number;
  growthAmount: number;
  isPositive: boolean;
}

export function IncomeTrends({ authToken }: IncomeTrendsProps) {
  const [trends, setTrends] = useState<TrendData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [monthsBack, setMonthsBack] = useState(12);

  useEffect(() => {
    loadIncomeTrends();
  }, [monthsBack]);

  const loadIncomeTrends = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Calculate trends using the existing transaction API
      const trendsData: TrendData[] = [];
      const currentDate = new Date();

      for (let i = 0; i < monthsBack; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // Calculate date range for the month
        const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];

        // Get income transactions for this month
        const params = new URLSearchParams({
          type: 'income',
          startDate,
          endDate,
          limit: '1000',
        });

        const response = await fetch(`/api/transactions?${params}`, {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to load income trends');
        }

        const data = await response.json();
        const transactions = data.transactions || [];

        // Calculate total income for this month
        const totalIncome = transactions.reduce((sum: number, transaction: any) => {
          return sum + parseFloat(transaction.amount);
        }, 0);

        trendsData.push({
          month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
          year,
          totalIncome,
        });
      }

      setTrends(trendsData.reverse()); // Return in chronological order
    } catch (error) {
      console.error('Error loading income trends:', error);
      setError('Failed to load income trends');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateGrowth = (currentAmount: number, previousAmount: number): IncomeGrowth => {
    if (previousAmount === 0) {
      return {
        growthRate: currentAmount > 0 ? 100 : 0,
        growthAmount: currentAmount,
        isPositive: currentAmount >= 0,
      };
    }

    const growthAmount = currentAmount - previousAmount;
    const growthRate = (growthAmount / previousAmount) * 100;

    return {
      growthRate: Math.round(growthRate * 100) / 100,
      growthAmount,
      isPositive: growthAmount >= 0,
    };
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const formatPercentage = (rate: number) => {
    return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`;
  };

  const getAverageIncome = () => {
    if (trends.length === 0) return 0;
    const total = trends.reduce((sum, trend) => sum + trend.totalIncome, 0);
    return total / trends.length;
  };

  const getHighestIncome = () => {
    if (trends.length === 0) return { amount: 0, month: '' };
    const highest = trends.reduce((max, trend) => 
      trend.totalIncome > max.totalIncome ? trend : max
    );
    return { amount: highest.totalIncome, month: highest.month };
  };

  const getLowestIncome = () => {
    if (trends.length === 0) return { amount: 0, month: '' };
    const lowest = trends.reduce((min, trend) => 
      trend.totalIncome < min.totalIncome ? trend : min
    );
    return { amount: lowest.totalIncome, month: lowest.month };
  };

  const getCurrentVsPreviousGrowth = () => {
    if (trends.length < 2) return null;
    const current = trends[trends.length - 1];
    const previous = trends[trends.length - 2];
    return calculateGrowth(current.totalIncome, previous.totalIncome);
  };

  const monthsBackOptions = [
    { value: 6, label: '6 months' },
    { value: 12, label: '12 months' },
    { value: 18, label: '18 months' },
    { value: 24, label: '24 months' },
  ];

  const averageIncome = getAverageIncome();
  const highestIncome = getHighestIncome();
  const lowestIncome = getLowestIncome();
  const currentGrowth = getCurrentVsPreviousGrowth();

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Income Trends</h3>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Label htmlFor="months-back">Period:</Label>
            <Select
              value={monthsBack.toString()}
              onValueChange={(value) => setMonthsBack(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthsBackOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={loadIncomeTrends} disabled={isLoading}>
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md">
          {error}
        </div>
      )}

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Average Income</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(averageIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Highest Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(highestIncome.amount)}
            </div>
            <div className="text-sm text-gray-500">{highestIncome.month}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lowest Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(lowestIncome.amount)}
            </div>
            <div className="text-sm text-gray-500">{lowestIncome.month}</div>
          </CardContent>
        </Card>

        {currentGrowth && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Month-over-Month</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${currentGrowth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(currentGrowth.growthRate)}
              </div>
              <div className="text-sm text-gray-500">
                {formatCurrency(Math.abs(currentGrowth.growthAmount))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Trends Chart (Simple Bar Chart) */}
      <Card>
        <CardHeader>
          <CardTitle>Income Over Time</CardTitle>
          <CardDescription>
            Monthly income trends for the last {monthsBack} months
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">Loading trends...</div>
            </div>
          ) : trends.length === 0 ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-gray-500">No income data available</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Simple bar chart representation */}
              <div className="space-y-2">
                {trends.map((trend, index) => {
                  const maxAmount = Math.max(...trends.map(t => t.totalIncome));
                  const barWidth = maxAmount > 0 ? (trend.totalIncome / maxAmount) * 100 : 0;
                  const previousTrend = index > 0 ? trends[index - 1] : null;
                  const growth = previousTrend ? calculateGrowth(trend.totalIncome, previousTrend.totalIncome) : null;

                  return (
                    <div key={`${trend.year}-${trend.month}`} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{trend.month}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{formatCurrency(trend.totalIncome)}</span>
                          {growth && (
                            <span className={`text-xs ${growth.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                              ({formatPercentage(growth.growthRate)})
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Trends Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Breakdown</CardTitle>
          <CardDescription>
            Month-by-month income details with growth calculations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trends.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No income data available for the selected period
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Month</th>
                    <th className="text-right py-2">Income</th>
                    <th className="text-right py-2">Growth</th>
                    <th className="text-right py-2">vs Average</th>
                  </tr>
                </thead>
                <tbody>
                  {trends.map((trend, index) => {
                    const previousTrend = index > 0 ? trends[index - 1] : null;
                    const growth = previousTrend ? calculateGrowth(trend.totalIncome, previousTrend.totalIncome) : null;
                    const vsAverage = calculateGrowth(trend.totalIncome, averageIncome);

                    return (
                      <tr key={`${trend.year}-${trend.month}`} className="border-b">
                        <td className="py-2 font-medium">{trend.month}</td>
                        <td className="text-right py-2 font-semibold">
                          {formatCurrency(trend.totalIncome)}
                        </td>
                        <td className="text-right py-2">
                          {growth ? (
                            <span className={growth.isPositive ? 'text-green-600' : 'text-red-600'}>
                              {formatPercentage(growth.growthRate)}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="text-right py-2">
                          <span className={vsAverage.isPositive ? 'text-green-600' : 'text-red-600'}>
                            {formatPercentage(vsAverage.growthRate)}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}