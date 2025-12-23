import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  DollarSign,
  Plus,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

interface BudgetPerformance {
  budgetId: number;
  budgetName: string;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
  isOverBudget: boolean;
  daysRemaining: number;
  dailyBudgetRemaining: number;
  category?: string;
  period: string;
  shouldAlert: boolean;
}

interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
  overBudgetCount: number;
  alertCount: number;
  averageUsagePercentage: number;
}

interface BudgetOverviewProps {
  onCreateBudget?: () => void;
}

export function BudgetOverview({ onCreateBudget }: BudgetOverviewProps) {
  const { token } = useAuth();
  const [budgets, setBudgets] = useState<BudgetPerformance[]>([]);
  const [summary, setSummary] = useState<BudgetSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/budgets?isActive=true&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch budgets');
      }

      const data = await response.json();
      
      // Get performance for each budget
      const budgetPerformances: BudgetPerformance[] = [];
      for (const budget of data.budgets) {
        const perfResponse = await fetch(`/api/budgets/${budget.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (perfResponse.ok) {
          const perfData = await perfResponse.json();
          if (perfData.performance) {
            budgetPerformances.push(perfData.performance);
          }
        }
      }

      setBudgets(budgetPerformances);

      // Calculate summary
      const totalBudgets = budgetPerformances.length;
      const totalBudgetAmount = budgetPerformances.reduce((sum, b) => sum + b.budgetAmount, 0);
      const totalSpentAmount = budgetPerformances.reduce((sum, b) => sum + b.spentAmount, 0);
      const totalRemainingAmount = budgetPerformances.reduce((sum, b) => sum + b.remainingAmount, 0);
      const overBudgetCount = budgetPerformances.filter(b => b.isOverBudget).length;
      const alertCount = budgetPerformances.filter(b => b.shouldAlert).length;
      const averageUsagePercentage = totalBudgets > 0 
        ? budgetPerformances.reduce((sum, b) => sum + b.percentageUsed, 0) / totalBudgets 
        : 0;

      setSummary({
        totalBudgets,
        activeBudgets: totalBudgets,
        totalBudgetAmount,
        totalSpentAmount,
        totalRemainingAmount,
        overBudgetCount,
        alertCount,
        averageUsagePercentage,
      });

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getBudgetStatusColor = (budget: BudgetPerformance): string => {
    if (budget.isOverBudget) return 'text-red-600';
    if (budget.shouldAlert) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getBudgetStatusIcon = (budget: BudgetPerformance) => {
    if (budget.isOverBudget) return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (budget.shouldAlert) return <Clock className="h-4 w-4 text-yellow-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Overview</CardTitle>
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
          <CardTitle>Budget Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchBudgets} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      {/* Summary Cards */}
      {summary && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="ml-2 overflow-hidden">
                  <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
                  <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(summary.totalBudgetAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Total Spent</p>
                  <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(summary.totalSpentAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Remaining</p>
                  <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(summary.totalRemainingAmount)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <div className="ml-2">
                  <p className="text-sm font-medium text-muted-foreground">Alerts</p>
                  <p className="text-xl sm:text-2xl font-bold">{summary.alertCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Budget List */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Active Budgets</CardTitle>
              <CardDescription>
                {budgets.length} active budget{budgets.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button onClick={onCreateBudget} size="sm" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No active budgets found</p>
              <Button onClick={onCreateBudget} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Budget
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {budgets.map((budget) => (
                <div key={budget.budgetId} className="border rounded-lg p-4">
                  <div className="flex flex-wrap items-start justify-between mb-2 gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {getBudgetStatusIcon(budget)}
                      <h4 className="font-medium break-words">{budget.budgetName}</h4>
                      {budget.category && (
                        <Badge variant="secondary">{budget.category}</Badge>
                      )}
                    </div>
                    <div className="text-left sm:text-right w-auto">
                      <p className="text-sm text-muted-foreground whitespace-nowrap">
                        {formatCurrency(budget.spentAmount)} / {formatCurrency(budget.budgetAmount)}
                      </p>
                      <p className={`text-sm font-medium ${getBudgetStatusColor(budget)}`}>
                        {budget.percentageUsed.toFixed(1)}% used
                      </p>
                    </div>
                  </div>
                  
                  <Progress 
                    value={Math.min(budget.percentageUsed, 100)} 
                    className="mb-2"
                  />
                  
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {budget.remainingAmount >= 0 
                        ? `${formatCurrency(budget.remainingAmount)} remaining`
                        : `${formatCurrency(Math.abs(budget.remainingAmount))} over budget`
                      }
                    </span>
                    <span>{budget.daysRemaining} days left</span>
                  </div>
                  
                  {budget.daysRemaining > 0 && budget.dailyBudgetRemaining > 0 && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      Daily budget: {formatCurrency(budget.dailyBudgetRemaining)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}