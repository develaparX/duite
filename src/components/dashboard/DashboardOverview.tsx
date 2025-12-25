import { useState, useEffect } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FinancialSummaryCard } from './FinancialSummaryCard';
import { BudgetOverview } from './BudgetOverview';
import { FinancialGoalsWidget } from './FinancialGoalsWidget';
import { BillRemindersWidget } from './BillRemindersWidget';
import { useAuth } from '@/contexts/AuthContext';
import {
  Activity,
  DollarSign,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Target,
  Bell,
  PiggyBank,
  Wallet
} from 'lucide-react';
import { OverviewChart } from './OverviewChart';
import { DailySpendingChart } from './DailySpendingChart';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QuickExpenseDialog } from './QuickExpenseDialog';
import { Skeleton } from '@/components/ui/skeleton';

interface FinancialPosition {
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  dailyAverageIncome: number;
  dailyAverageExpenses: number;
  totalActiveDebts: number;
  totalActiveReceivables: number;
  totalSettledDebts: number;
  totalSettledReceivables: number;
  overdueDebts: number;
  overdueReceivables: number;
  totalInvestmentBalance: number;
  investmentGainLoss: number;
  investmentGainLossPercentage: number;
  investmentAccountCount: number;
  totalBudgetAmount: number;
  totalBudgetSpent: number;
  budgetUtilizationPercentage: number;
  overBudgetCount: number;
  budgetAlertCount: number;
  totalGoalTargetAmount: number;
  totalGoalCurrentAmount: number;
  goalCompletionPercentage: number;
  completedGoalsCount: number;
  activeGoalsCount: number;
  monthlyRecurringIncome: number;
  monthlyRecurringExpenses: number;
  upcomingBillsAmount: number;
  overdueBillsAmount: number;
  netWorth: number;
  liquidNetWorth: number;
  debtToIncomeRatio: number;
  savingsRate: number;
  expenseToIncomeRatio: number;
  emergencyFundMonths: number;
  budgetVariance: number;
  projectedCashFlow: number;
  cashFlowTrend: 'positive' | 'negative' | 'stable';
  lastUpdated: Date;
  calculatedAt: Date;
}

interface MonthlyComparison {
  currentMonth: {
    income: number;
    expenses: number;
    netIncome: number;
    budgetUtilization: number;
    goalProgress: number;
    month: string;
  };
  previousMonth: {
    income: number;
    expenses: number;
    netIncome: number;
    budgetUtilization: number;
    goalProgress: number;
    month: string;
  };
  changes: {
    incomeChange: number;
    incomeChangePercentage: number;
    expenseChange: number;
    expenseChangePercentage: number;
    netIncomeChange: number;
    netIncomeChangePercentage: number;
    budgetUtilizationChange: number;
    goalProgressChange: number;
  };
}

interface RealTimeMetrics {
  currentCashFlow: number;
  burnRate: number;
  runwayDays: number;
  breakEvenDays: number;
  emergencyFundMonths: number;
  debtPayoffMonths: number;
  nextBillDue: {
    name: string;
    amount: number;
    daysUntilDue: number;
  } | null;
  goalMilestones: Array<{
    goalName: string;
    progressPercentage: number;
    daysToTarget: number;
  }>;
}

interface HealthScore {
  overallScore: number;
  components: {
    savingsRate: { score: number; weight: number; value: number };
    debtToIncome: { score: number; weight: number; value: number };
    emergencyFund: { score: number; weight: number; value: number };
    budgetCompliance: { score: number; weight: number; value: number };
    goalProgress: { score: number; weight: number; value: number };
    investmentDiversification: { score: number; weight: number; value: number };
    cashFlowStability: { score: number; weight: number; value: number };
  };
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

interface DashboardData {
  financialPosition: FinancialPosition;
  monthlyComparison: MonthlyComparison;
  financialTrends: {
    monthlyData: Array<{
      month: string;
      income: number;
      expenses: number;
      netIncome: number;
      investmentBalance: number;
      netWorth: number;
      budgetUtilization: number;
      goalProgress: number;
      cashFlow: number;
    }>;
    trends: {
      incomeGrowthRate: number;
      expenseGrowthRate: number;
      netWorthGrowthRate: number;
      investmentGrowthRate: number;
      budgetComplianceRate: number;
      goalCompletionRate: number;
    };
  };
  realTimeMetrics: RealTimeMetrics;
  healthScore: HealthScore;
  recentTransactions: Array<{
    id: number;
    type: string;
    amount: string;
    description: string;
    transactionDate: string;
    category?: string;
  }>;
  dailySpending: {
    thisMonth: Array<{
      date: string;
      amount: number;
      category?: string;
    }>;
    lastMonth: Array<{
      date: string;
      amount: number;
      category?: string;
    }>;
    comparison: {
      averageThisMonth: number;
      averageLastMonth: number;
      percentageChange: number;
      trend: 'increasing' | 'decreasing' | 'stable';
    };
  };
  overdue: {
    debts: Array<{
      id: number;
      amount: string;
      description: string;
      relatedParty: string;
      dueDate: string;
    }>;
    receivables: Array<{
      id: number;
      amount: string;
      description: string;
      relatedParty: string;
      dueDate: string;
    }>;
  };
  investments: {
    accounts: Array<{
      accountName: string;
      accountType: string;
      currentBalance: number;
      lastUpdated: Date;
    }>;
    lastUpdated: Date | null;
  };
}

interface DashboardOverviewProps {
  startDate?: string;
  endDate?: string;
}

export function DashboardOverview({ startDate, endDate }: DashboardOverviewProps) {
  const { token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDashboardData();
  }, [startDate, endDate]);

  const handleRefresh = () => {
    fetchDashboardData();
    setRefreshKey((prev) => prev + 1);
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No authentication token available');
      }

      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await fetch(`/api/dashboard?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const dashboardData = await response.json();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number | string): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(numAmount);
  };

  const getCashFlowTrendIcon = () => {
    if (!data) return <Activity className="h-4 w-4 text-muted-foreground" />;
    switch (data.financialPosition.cashFlowTrend) {
      case 'positive': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'negative': return <TrendingDown className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getCashFlowTrendColor = () => {
    if (!data) return 'text-muted-foreground';
    switch (data.financialPosition.cashFlowTrend) {
      case 'positive': return 'text-green-600';
      case 'negative': return 'text-red-600';
      default: return 'text-yellow-600';
    }
  };

  return (
    <div className="flex-1 space-y-8 pt-6 pb-12 container mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h2>
          <p className="text-muted-foreground mt-1">
            Overview of your financial health and activity.
          </p>
        </div>
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          {loading ? (
             <Skeleton className="h-9 w-32 rounded-full" />
          ) : (
            <Badge variant="outline" className="py-1.5 px-3 flex items-center space-x-2 w-full sm:w-auto justify-center bg-background shadow-sm">
              {getCashFlowTrendIcon()}
              <span className={`font-medium ${getCashFlowTrendColor()}`}>
                {data?.financialPosition.cashFlowTrend === 'positive' ? 'Positive Cash Flow' : 
                 data?.financialPosition.cashFlowTrend === 'negative' ? 'Negative Cash Flow' : 'Stable Cash Flow'}
              </span>
            </Badge>
          )}
          <QuickExpenseDialog onSuccess={handleRefresh} />
        </div>
      </div>
      
      {/* KPI Cards Section - 2x2 on Laptop, 4x1 on Ultra Wide */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <FinancialSummaryCard
          title="Net Worth"
          value={data?.financialPosition.netWorth ?? 0}
          icon={<Wallet className="h-5 w-5 text-primary" />}
          description="Total assets minus liabilities"
          className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary"
          loading={loading}
        />
        <FinancialSummaryCard
          title="Monthly Income"
          value={data?.financialPosition.monthlyIncome ?? 0}
          change={data ? {
            amount: data.monthlyComparison.changes.incomeChange,
            percentage: data.monthlyComparison.changes.incomeChangePercentage,
            isPositive: data.monthlyComparison.changes.incomeChange >= 0,
          } : undefined}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-green-600"
          loading={loading}
        />
        <FinancialSummaryCard
          title="Monthly Expenses"
          value={data?.financialPosition.monthlyExpenses ?? 0}
          change={data ? {
            amount: data.monthlyComparison.changes.expenseChange,
            percentage: data.monthlyComparison.changes.expenseChangePercentage,
            isPositive: data.monthlyComparison.changes.expenseChange <= 0,
          } : undefined}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-red-600"
          loading={loading}
        />
        <FinancialSummaryCard
          title="Savings Rate"
          value={data?.financialPosition.savingsRate ?? 0}
          icon={<PiggyBank className="h-5 w-5 text-blue-600" />}
          description="Percent of income saved"
          isPercentage={true}
          className="shadow-sm hover:shadow-md transition-all border-l-4 border-l-blue-600"
          loading={loading}
        />
      </div>

      {/* Main Charts Row - Equal Split for readability */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="shadow-sm hover:shadow-md transition-all h-full">
          <CardHeader>
            <CardTitle>Financial Overview</CardTitle>
            <CardDescription>Income vs Expenses over time</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-[250px] sm:h-[300px] w-full rounded-lg" />
            ) : (
              <OverviewChart transactions={data?.recentTransactions || []} />
            )}
          </CardContent>
        </Card>
        
        <Card className="shadow-sm hover:shadow-md transition-all h-full">
          <CardHeader>
            <CardTitle>Daily Spending Comparison</CardTitle>
            <CardDescription>This month vs last month</CardDescription>
          </CardHeader>
          <CardContent>
             {loading ? (
               <Skeleton className="h-[250px] sm:h-[300px] w-full rounded-lg" />
             ) : (
               <DailySpendingChart data={data?.dailySpending || { thisMonth: [], lastMonth: [], comparison: { averageThisMonth: 0, averageLastMonth: 0, percentageChange: 0, trend: 'stable' } }} />
             )}
          </CardContent>
        </Card>
      </div>

      {/* Health & Quick Stats Row - 4 columns on large screens */}
      <h3 className="text-xl font-semibold tracking-tight mt-8 mb-4">Financial Health</h3>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="bg-gradient-to-br from-background to-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="h-4 w-4 mr-2" />
              Financial Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                 <Skeleton className="h-8 w-16" />
                 <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between">
                    <div className="text-3xl font-bold">{data?.healthScore.overallScore.toFixed(0)}</div>
                    <Badge variant={data?.healthScore.riskLevel === 'low' ? 'default' : data?.healthScore.riskLevel === 'medium' ? 'secondary' : 'destructive'} className="mb-1">
                      {data?.healthScore.riskLevel} risk
                    </Badge>
                </div>
                <Progress value={data?.healthScore.overallScore} className="h-2 mt-4" />
              </>
            )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Goals Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
             ) : (
               <>
                 <div className="text-3xl font-bold">{data?.financialPosition.goalCompletionPercentage.toFixed(1)}%</div>
                 <p className="text-xs text-muted-foreground mt-1">{data?.financialPosition.activeGoalsCount} active goals</p>
               </>
             )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              Budget Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
             ) : (
                <>
                  <div className="text-3xl font-bold">{data?.financialPosition.budgetUtilizationPercentage.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground mt-1">{data?.financialPosition.overBudgetCount} over budget</p>
                </>
             )}
          </CardContent>
        </Card>

        <Card>
           <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Emergency Fund
            </CardTitle>
          </CardHeader>
          <CardContent>
             {loading ? (
                <div className="space-y-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-4 w-32" />
                </div>
             ) : (
                <>
                  <div className="text-3xl font-bold">{data?.financialPosition.emergencyFundMonths.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">months of expenses</p>
                </>
             )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Widgets Grid - Masonry-like spacing */}
      <h3 className="text-xl font-semibold tracking-tight mt-8 mb-4">Detailed Breakdown</h3>
      <div className="grid gap-6 grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 items-start">
        <div className="space-y-6">
           {/* Budget Column */}
           <BudgetOverview 
             key={`budget-${refreshKey}`} 
             onCreateBudget={() => console.log('Create budget')} 
           />
        </div>

        <div className="space-y-6">
           {/* Goals Column */}
           <FinancialGoalsWidget 
             key={`goals-${refreshKey}`}
             onCreateGoal={() => console.log('Create goal')}
             onViewAll={() => console.log('View all goals')}
           />
        </div>

        <div className="space-y-6 xl:col-span-2 2xl:col-span-1">
           {/* Bills & Recent Activity Column */}
           {/* On XL (2 cols), this spans full width. On 2XL (3 cols), it's a column. */}
           <BillRemindersWidget 
             key={`bills-${refreshKey}`}
             onCreateBill={() => console.log('Create bill')}
             onViewAll={() => console.log('View all bills')}
           />
           
           <Card className="mt-6 shadow-sm">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>
                Latest transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                       <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-20" />
                       </div>
                       <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {data?.recentTransactions.slice(0, 5).map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                      <div className="space-y-1">
                        <p className="text-sm font-medium leading-none">{transaction.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {transaction.category || transaction.type} • {new Date(transaction.transactionDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`font-medium text-sm ${
                        transaction.type === 'income' || transaction.type === 'receivable' ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {transaction.type === 'income' || transaction.type === 'receivable' ? '+' : '-'}
                        {formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Alerts */}
      {error && (
         <Alert variant="destructive" className="mt-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
             {error}
             <Button variant="outline" size="sm" onClick={fetchDashboardData} className="ml-2">Retry</Button>
          </AlertDescription>
        </Alert>
      )}

      {!loading && data && ((data.overdue?.debts?.length || 0) > 0 || (data.overdue?.receivables?.length || 0) > 0 || (data.financialPosition?.budgetAlertCount || 0) > 0) && (
        <Alert variant="destructive" className="mt-6 border-red-200 bg-red-50 dark:bg-red-950/20">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Action Required</AlertTitle>
          <AlertDescription>
            <div className="flex flex-col gap-1 mt-2">
              {(data.overdue?.debts?.length || 0) > 0 && <span>• {data.overdue.debts.length} overdue debts.</span>}
              {(data.overdue?.receivables?.length || 0) > 0 && <span>• {data.overdue.receivables.length} overdue receivables.</span>}
              {(data.financialPosition?.budgetAlertCount || 0) > 0 && <span>• {data.financialPosition.budgetAlertCount} budget alerts.</span>}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}