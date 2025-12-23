import { TransactionService } from './transactions';
import { DebtReceivableService } from './transactions';
import { InvestmentService } from './investments';
import { BudgetService } from './budgets';
import { FinancialGoalService } from './financial-goals';
import { BillReminderService } from './bill-reminders';
import { RecurringTransactionService } from './recurring-transactions';

/**
 * Comprehensive financial summary types
 */
export interface FinancialPosition {
  // Income and Expenses
  totalIncome: number;
  totalExpenses: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  dailyAverageIncome: number;
  dailyAverageExpenses: number;
  
  // Debts and Receivables
  totalActiveDebts: number;
  totalActiveReceivables: number;
  totalSettledDebts: number;
  totalSettledReceivables: number;
  overdueDebts: number;
  overdueReceivables: number;
  
  // Investments
  totalInvestmentBalance: number;
  investmentGainLoss: number;
  investmentGainLossPercentage: number;
  investmentAccountCount: number;
  
  // Budgets
  totalBudgetAmount: number;
  totalBudgetSpent: number;
  budgetUtilizationPercentage: number;
  overBudgetCount: number;
  budgetAlertCount: number;
  
  // Financial Goals
  totalGoalTargetAmount: number;
  totalGoalCurrentAmount: number;
  goalCompletionPercentage: number;
  completedGoalsCount: number;
  activeGoalsCount: number;
  
  // Bills and Recurring
  monthlyRecurringIncome: number;
  monthlyRecurringExpenses: number;
  upcomingBillsAmount: number;
  overdueBillsAmount: number;
  
  // Net Worth Calculation
  netWorth: number;
  liquidNetWorth: number; // Excluding investments
  
  // Financial Health Metrics
  debtToIncomeRatio: number;
  savingsRate: number;
  expenseToIncomeRatio: number;
  emergencyFundMonths: number;
  budgetVariance: number;
  
  // Cash Flow
  projectedCashFlow: number;
  cashFlowTrend: 'positive' | 'negative' | 'stable';
  
  // Timestamps
  lastUpdated: Date;
  calculatedAt: Date;
}

export interface MonthlyComparison {
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

export interface FinancialTrends {
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
}

export interface RealTimeMetrics {
  currentCashFlow: number;
  burnRate: number; // Daily expense rate
  runwayDays: number; // Days until money runs out at current burn rate
  breakEvenDays: number; // Days to break even
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

export interface FinancialHealthScore {
  overallScore: number; // 0-100
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

export interface DailySpending {
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
}

/**
 * Enhanced Financial Summary Service
 */
export class FinancialSummaryService {
  /**
   * Calculate comprehensive financial position for a user
   */
  static async calculateFinancialPosition(
    userId: number,
    startDate?: string,
    endDate?: string
  ): Promise<FinancialPosition> {
    const now = new Date();
    const calculatedAt = now;

    // Default to current month if no dates provided
    const defaultStartDate = startDate || `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-01`;
    const defaultEndDate = endDate || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

    // Get transaction summary
    const transactionSummary = await TransactionService.getSummary(userId, defaultStartDate, defaultEndDate);
    
    // Get debt and receivable summary
    const overdue = await DebtReceivableService.getOverdue(userId);
    
    // Get investment summary
    const investmentSummary = await InvestmentService.getInvestmentSummary(userId);
    
    // Get budget summary
    const budgetSummary = await BudgetService.getBudgetSummary(userId);
    
    // Get financial goals summary
    const goalsSummary = await FinancialGoalService.getGoalsSummary(userId);
    
    // Get bill reminders summary
    const recurringSummary = await RecurringTransactionService.getSummary(userId);

    // Calculate period length in days for daily averages
    const periodStart = new Date(defaultStartDate);
    const periodEnd = new Date(defaultEndDate);
    const periodDays = Math.ceil((periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Calculate daily averages
    const dailyAverageIncome = periodDays > 0 ? transactionSummary.totalIncome / periodDays : 0;
    const dailyAverageExpenses = periodDays > 0 ? transactionSummary.totalExpenses / periodDays : 0;

    // Calculate net worth
    const netWorth = transactionSummary.totalIncome 
      - transactionSummary.totalExpenses 
      + transactionSummary.totalActiveReceivables 
      - transactionSummary.totalActiveDebts
      + investmentSummary.totalCurrentBalance
      + goalsSummary.totalCurrentAmount;

    // Calculate liquid net worth (excluding investments)
    const liquidNetWorth = transactionSummary.totalIncome 
      - transactionSummary.totalExpenses 
      + transactionSummary.totalActiveReceivables 
      - transactionSummary.totalActiveDebts
      + goalsSummary.totalCurrentAmount;

    // Calculate financial health metrics
    const monthlyIncome = recurringSummary.monthlyIncomeTotal + (transactionSummary.totalIncome / (periodDays / 30.44));
    const monthlyExpenses = recurringSummary.monthlyExpenseTotal + (transactionSummary.totalExpenses / (periodDays / 30.44));
    
    const debtToIncomeRatio = monthlyIncome > 0 
      ? (transactionSummary.totalActiveDebts / (monthlyIncome * 12)) * 100 
      : 0;

    const netIncome = monthlyIncome - monthlyExpenses;
    const savingsRate = monthlyIncome > 0 
      ? (netIncome / monthlyIncome) * 100 
      : 0;

    const expenseToIncomeRatio = monthlyIncome > 0 
      ? (monthlyExpenses / monthlyIncome) * 100 
      : 0;

    // Calculate emergency fund months
    const emergencyFundMonths = monthlyExpenses > 0 
      ? goalsSummary.totalCurrentAmount / monthlyExpenses 
      : 0;

    // Calculate budget variance
    const budgetVariance = budgetSummary.totalBudgetAmount > 0 
      ? ((budgetSummary.totalBudgetAmount - budgetSummary.totalSpentAmount) / budgetSummary.totalBudgetAmount) * 100 
      : 0;

    // Calculate projected cash flow (next 30 days)
    const projectedCashFlow = (recurringSummary.monthlyIncomeTotal - recurringSummary.monthlyExpenseTotal);
    
    // Determine cash flow trend
    let cashFlowTrend: 'positive' | 'negative' | 'stable' = 'stable';
    if (projectedCashFlow > monthlyIncome * 0.1) {
      cashFlowTrend = 'positive';
    } else if (projectedCashFlow < -monthlyIncome * 0.05) {
      cashFlowTrend = 'negative';
    }

    // Calculate overdue amounts
    const overdueDebts = overdue.overdueDebts.reduce((sum, debt) => sum + Number(debt.amount), 0);
    const overdueReceivables = overdue.overdueReceivables.reduce((sum, receivable) => sum + Number(receivable.amount), 0);

    // Calculate upcoming and overdue bills amounts
    const upcomingBills = await BillReminderService.getBillsDueSoon(userId);
    const overdueBills = await BillReminderService.getOverdueBills(userId);
    
    const upcomingBillsAmount = upcomingBills.reduce((sum, bill) => sum + Number(bill.billReminder.amount), 0);
    const overdueBillsAmount = overdueBills.reduce((sum, bill) => sum + Number(bill.billReminder.amount), 0);

    return {
      // Income and Expenses
      totalIncome: transactionSummary.totalIncome,
      totalExpenses: transactionSummary.totalExpenses,
      monthlyIncome,
      monthlyExpenses,
      dailyAverageIncome,
      dailyAverageExpenses,
      
      // Debts and Receivables
      totalActiveDebts: transactionSummary.totalActiveDebts,
      totalActiveReceivables: transactionSummary.totalActiveReceivables,
      totalSettledDebts: 0, // Will be calculated from transaction history
      totalSettledReceivables: 0, // Will be calculated from transaction history
      overdueDebts,
      overdueReceivables,
      
      // Investments
      totalInvestmentBalance: investmentSummary.totalCurrentBalance,
      investmentGainLoss: investmentSummary.totalGainLoss,
      investmentGainLossPercentage: investmentSummary.totalGainLossPercentage,
      investmentAccountCount: investmentSummary.accountCount,
      
      // Budgets
      totalBudgetAmount: budgetSummary.totalBudgetAmount,
      totalBudgetSpent: budgetSummary.totalSpentAmount,
      budgetUtilizationPercentage: budgetSummary.averageUsagePercentage,
      overBudgetCount: budgetSummary.overBudgetCount,
      budgetAlertCount: budgetSummary.alertCount,
      
      // Financial Goals
      totalGoalTargetAmount: goalsSummary.totalTargetAmount,
      totalGoalCurrentAmount: goalsSummary.totalCurrentAmount,
      goalCompletionPercentage: goalsSummary.averageProgress,
      completedGoalsCount: goalsSummary.completedGoals,
      activeGoalsCount: goalsSummary.activeGoals,
      
      // Bills and Recurring
      monthlyRecurringIncome: recurringSummary.monthlyIncomeTotal,
      monthlyRecurringExpenses: recurringSummary.monthlyExpenseTotal,
      upcomingBillsAmount,
      overdueBillsAmount,
      
      // Net Worth
      netWorth,
      liquidNetWorth,
      
      // Financial Health Metrics
      debtToIncomeRatio,
      savingsRate,
      expenseToIncomeRatio,
      emergencyFundMonths,
      budgetVariance,
      
      // Cash Flow
      projectedCashFlow,
      cashFlowTrend,
      
      // Timestamps
      lastUpdated: investmentSummary.lastUpdated || now,
      calculatedAt,
    };
  }

  /**
   * Get monthly comparison with enhanced metrics
   */
  static async getMonthlyComparison(userId: number): Promise<MonthlyComparison> {
    const now = new Date();
    
    // Current month
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Previous month
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentPosition = await this.calculateFinancialPosition(
      userId,
      currentMonthStart.toISOString().split('T')[0],
      currentMonthEnd.toISOString().split('T')[0]
    );

    const previousPosition = await this.calculateFinancialPosition(
      userId,
      previousMonthStart.toISOString().split('T')[0],
      previousMonthEnd.toISOString().split('T')[0]
    );

    // Calculate changes
    const incomeChange = currentPosition.monthlyIncome - previousPosition.monthlyIncome;
    const incomeChangePercentage = previousPosition.monthlyIncome > 0 
      ? (incomeChange / previousPosition.monthlyIncome) * 100 
      : 0;

    const expenseChange = currentPosition.monthlyExpenses - previousPosition.monthlyExpenses;
    const expenseChangePercentage = previousPosition.monthlyExpenses > 0 
      ? (expenseChange / previousPosition.monthlyExpenses) * 100 
      : 0;

    const netIncomeChange = incomeChange - expenseChange;
    const previousNetIncome = previousPosition.monthlyIncome - previousPosition.monthlyExpenses;
    const netIncomeChangePercentage = previousNetIncome !== 0 
      ? (netIncomeChange / Math.abs(previousNetIncome)) * 100 
      : 0;

    const budgetUtilizationChange = currentPosition.budgetUtilizationPercentage - previousPosition.budgetUtilizationPercentage;
    const goalProgressChange = currentPosition.goalCompletionPercentage - previousPosition.goalCompletionPercentage;

    return {
      currentMonth: {
        income: currentPosition.monthlyIncome,
        expenses: currentPosition.monthlyExpenses,
        netIncome: currentPosition.monthlyIncome - currentPosition.monthlyExpenses,
        budgetUtilization: currentPosition.budgetUtilizationPercentage,
        goalProgress: currentPosition.goalCompletionPercentage,
        month: currentMonthStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      },
      previousMonth: {
        income: previousPosition.monthlyIncome,
        expenses: previousPosition.monthlyExpenses,
        netIncome: previousPosition.monthlyIncome - previousPosition.monthlyExpenses,
        budgetUtilization: previousPosition.budgetUtilizationPercentage,
        goalProgress: previousPosition.goalCompletionPercentage,
        month: previousMonthStart.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' }),
      },
      changes: {
        incomeChange,
        incomeChangePercentage,
        expenseChange,
        expenseChangePercentage,
        netIncomeChange,
        netIncomeChangePercentage,
        budgetUtilizationChange,
        goalProgressChange,
      },
    };
  }

  /**
   * Get financial trends with enhanced metrics
   */
  static async getFinancialTrends(userId: number, months: number = 6): Promise<FinancialTrends> {
    const monthlyData: FinancialTrends['monthlyData'] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const position = await this.calculateFinancialPosition(
        userId,
        monthStart.toISOString().split('T')[0],
        monthEnd.toISOString().split('T')[0]
      );

      monthlyData.push({
        month: monthStart.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        income: position.monthlyIncome,
        expenses: position.monthlyExpenses,
        netIncome: position.monthlyIncome - position.monthlyExpenses,
        investmentBalance: position.totalInvestmentBalance,
        netWorth: position.netWorth,
        budgetUtilization: position.budgetUtilizationPercentage,
        goalProgress: position.goalCompletionPercentage,
        cashFlow: position.projectedCashFlow,
      });
    }

    // Calculate growth rates
    const calculateGrowthRate = (values: number[]): number => {
      if (values.length < 2) return 0;
      const firstValue = values[0];
      const lastValue = values[values.length - 1];
      if (firstValue === 0) return 0;
      return ((lastValue - firstValue) / Math.abs(firstValue)) * 100;
    };

    const incomeGrowthRate = calculateGrowthRate(monthlyData.map(d => d.income));
    const expenseGrowthRate = calculateGrowthRate(monthlyData.map(d => d.expenses));
    const netWorthGrowthRate = calculateGrowthRate(monthlyData.map(d => d.netWorth));
    const investmentGrowthRate = calculateGrowthRate(monthlyData.map(d => d.investmentBalance));
    
    // Calculate budget compliance rate (average of months where budget utilization < 100%)
    const budgetComplianceRate = monthlyData.length > 0 
      ? (monthlyData.filter(d => d.budgetUtilization <= 100).length / monthlyData.length) * 100 
      : 0;

    // Calculate goal completion rate (average goal progress)
    const goalCompletionRate = monthlyData.length > 0 
      ? monthlyData.reduce((sum, d) => sum + d.goalProgress, 0) / monthlyData.length 
      : 0;

    return {
      monthlyData,
      trends: {
        incomeGrowthRate,
        expenseGrowthRate,
        netWorthGrowthRate,
        investmentGrowthRate,
        budgetComplianceRate,
        goalCompletionRate,
      },
    };
  }

  /**
   * Get real-time financial metrics
   */
  static async getRealTimeMetrics(userId: number): Promise<RealTimeMetrics> {
    const position = await this.calculateFinancialPosition(userId);
    
    // Calculate burn rate (daily expense rate)
    const burnRate = position.dailyAverageExpenses;
    
    // Calculate runway days (how long money will last at current burn rate)
    const runwayDays = burnRate > 0 ? position.liquidNetWorth / burnRate : Infinity;
    
    // Calculate break even days (days to break even)
    const dailyNetIncome = position.dailyAverageIncome - position.dailyAverageExpenses;
    const breakEvenDays = dailyNetIncome > 0 ? Math.abs(position.liquidNetWorth) / dailyNetIncome : Infinity;
    
    // Calculate debt payoff months
    const monthlyDebtPayment = position.monthlyExpenses * 0.1; // Assume 10% of expenses go to debt
    const debtPayoffMonths = monthlyDebtPayment > 0 ? position.totalActiveDebts / monthlyDebtPayment : Infinity;
    
    // Get next bill due
    const upcomingBills = await BillReminderService.getBillsDueSoon(userId);
    const nextBill = upcomingBills.length > 0 ? upcomingBills[0] : null;
    
    // Get goal milestones
    const highPriorityGoals = await FinancialGoalService.getHighPriorityGoals(userId);
    const goalMilestones = highPriorityGoals.slice(0, 3).map(goal => ({
      goalName: goal.goalName,
      progressPercentage: goal.progressPercentage,
      daysToTarget: goal.daysRemaining || 0,
    }));

    return {
      currentCashFlow: position.projectedCashFlow,
      burnRate,
      runwayDays: Math.min(runwayDays, 9999), // Cap at 9999 for display
      breakEvenDays: Math.min(breakEvenDays, 9999),
      emergencyFundMonths: position.emergencyFundMonths,
      debtPayoffMonths: Math.min(debtPayoffMonths, 999),
      nextBillDue: nextBill ? {
        name: nextBill.billReminder.name,
        amount: Number(nextBill.billReminder.amount),
        daysUntilDue: nextBill.daysUntilDue,
      } : null,
      goalMilestones,
    };
  }

  /**
   * Calculate financial health score
   */
  static calculateFinancialHealthScore(position: FinancialPosition): FinancialHealthScore {
    const components = {
      savingsRate: {
        score: Math.min(100, Math.max(0, position.savingsRate * 5)), // 20% savings rate = 100 score
        weight: 0.2,
        value: position.savingsRate,
      },
      debtToIncome: {
        score: Math.max(0, 100 - position.debtToIncomeRatio * 2.5), // 40% DTI = 0 score
        weight: 0.2,
        value: position.debtToIncomeRatio,
      },
      emergencyFund: {
        score: Math.min(100, position.emergencyFundMonths * 16.67), // 6 months = 100 score
        weight: 0.15,
        value: position.emergencyFundMonths,
      },
      budgetCompliance: {
        score: Math.max(0, 100 - Math.abs(position.budgetVariance - 0) * 2), // Perfect budget = 100
        weight: 0.15,
        value: position.budgetVariance,
      },
      goalProgress: {
        score: position.goalCompletionPercentage,
        weight: 0.1,
        value: position.goalCompletionPercentage,
      },
      investmentDiversification: {
        score: Math.min(100, position.investmentAccountCount * 25), // 4+ accounts = 100 score
        weight: 0.1,
        value: position.investmentAccountCount,
      },
      cashFlowStability: {
        score: position.cashFlowTrend === 'positive' ? 100 : position.cashFlowTrend === 'stable' ? 70 : 30,
        weight: 0.1,
        value: position.projectedCashFlow,
      },
    };

    // Calculate weighted overall score
    let overallScore = 0;
    for (const component of Object.values(components)) {
      overallScore += component.score * component.weight;
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (components.savingsRate.score < 50) {
      recommendations.push('Increase your savings rate to at least 10% of income');
    }
    if (components.debtToIncome.score < 70) {
      recommendations.push('Work on reducing your debt-to-income ratio');
    }
    if (components.emergencyFund.score < 50) {
      recommendations.push('Build an emergency fund covering 3-6 months of expenses');
    }
    if (components.budgetCompliance.score < 70) {
      recommendations.push('Improve budget tracking and stick to spending limits');
    }
    if (components.goalProgress.score < 50) {
      recommendations.push('Set up automatic contributions to your financial goals');
    }
    if (components.investmentDiversification.score < 50) {
      recommendations.push('Diversify your investment portfolio across different accounts');
    }

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' = 'low';
    if (overallScore < 40) {
      riskLevel = 'high';
    } else if (overallScore < 70) {
      riskLevel = 'medium';
    }

    return {
      overallScore,
      components,
      recommendations,
      riskLevel,
    };
  }

  /**
   * Get daily spending comparison
   */
  static async getDailySpending(userId: number): Promise<DailySpending> {
    const now = new Date();
    
    // This month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    // Last month
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get daily spending for this month
    const thisMonthTransactions = await TransactionService.getFiltered({
      userId,
      type: 'expense',
      startDate: thisMonthStart.toISOString().split('T')[0],
      endDate: thisMonthEnd.toISOString().split('T')[0],
    });

    // Get daily spending for last month
    const lastMonthTransactions = await TransactionService.getFiltered({
      userId,
      type: 'expense',
      startDate: lastMonthStart.toISOString().split('T')[0],
      endDate: lastMonthEnd.toISOString().split('T')[0],
    });

    // Group by date
    const groupByDate = (transactions: any[]) => {
      const grouped: { [date: string]: { amount: number; category?: string } } = {};
      transactions.forEach(t => {
        const date = t.transactionDate;
        if (!grouped[date]) {
          grouped[date] = { amount: 0 };
        }
        grouped[date].amount += Number(t.amount);
        grouped[date].category = t.category;
      });
      return Object.entries(grouped).map(([date, data]) => ({
        date,
        amount: data.amount,
        category: data.category,
      }));
    };

    const thisMonth = groupByDate(thisMonthTransactions);
    const lastMonth = groupByDate(lastMonthTransactions);

    // Calculate averages
    const averageThisMonth = thisMonth.length > 0 
      ? thisMonth.reduce((sum, day) => sum + day.amount, 0) / thisMonth.length 
      : 0;
    const averageLastMonth = lastMonth.length > 0 
      ? lastMonth.reduce((sum, day) => sum + day.amount, 0) / lastMonth.length 
      : 0;

    const percentageChange = averageLastMonth > 0 
      ? ((averageThisMonth - averageLastMonth) / averageLastMonth) * 100 
      : 0;

    let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (percentageChange > 5) {
      trend = 'increasing';
    } else if (percentageChange < -5) {
      trend = 'decreasing';
    }

    return {
      thisMonth,
      lastMonth,
      comparison: {
        averageThisMonth,
        averageLastMonth,
        percentageChange,
        trend,
      },
    };
  }
}