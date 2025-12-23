import { db } from '@/db';
import { cashFlowProjections, transactions, type CashFlowProjection, type NewCashFlowProjection } from '@/db/schema';
import { eq, and, gte, lte, asc, sql } from 'drizzle-orm';
import { RecurringTransactionService } from './recurring-transactions';

/**
 * Cash flow projection validation functions
 */
export function validateProjectionData(data: Partial<NewCashFlowProjection>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.projectionDate) {
    errors.push('Projection date is required');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  if (data.projectedIncome !== undefined && Number(data.projectedIncome) < 0) {
    errors.push('Projected income cannot be negative');
  }

  if (data.projectedExpenses !== undefined && Number(data.projectedExpenses) < 0) {
    errors.push('Projected expenses cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Cash flow analysis types
 */
export interface CashFlowAnalysis {
  projectionDate: Date;
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
  actualIncome?: number;
  actualExpenses?: number;
  actualBalance?: number;
  variance?: {
    incomeVariance: number;
    expenseVariance: number;
    balanceVariance: number;
    incomeVariancePercentage: number;
    expenseVariancePercentage: number;
    balanceVariancePercentage: number;
  };
  accuracy?: number; // Overall accuracy percentage
}

export interface CashFlowSummary {
  totalProjectedIncome: number;
  totalProjectedExpenses: number;
  totalProjectedBalance: number;
  totalActualIncome: number;
  totalActualExpenses: number;
  totalActualBalance: number;
  averageAccuracy: number;
  projectionCount: number;
  positiveFlowDays: number;
  negativeFlowDays: number;
}

export interface CashFlowForecast {
  date: Date;
  projectedIncome: number;
  projectedExpenses: number;
  projectedBalance: number;
  cumulativeBalance: number;
  confidence: number; // 0-100 based on historical accuracy
  sources: {
    recurringIncome: number;
    recurringExpenses: number;
    historicalAverage: number;
  };
}

/**
 * Cash Flow Projection Service
 */
export class CashFlowProjectionService {
  /**
   * Create or update cash flow projection
   */
  static async createOrUpdate(data: NewCashFlowProjection): Promise<CashFlowProjection> {
    const validation = validateProjectionData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if projection already exists for this date
    const existing = await db
      .select()
      .from(cashFlowProjections)
      .where(
        and(
          eq(cashFlowProjections.userId, data.userId),
          eq(cashFlowProjections.projectionDate, data.projectionDate)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      // Update existing projection
      const [updated] = await db
        .update(cashFlowProjections)
        .set({
          ...data,
          updatedAt: new Date(),
        })
        .where(eq(cashFlowProjections.id, existing[0].id))
        .returning();

      return updated;
    } else {
      // Create new projection
      const [created] = await db
        .insert(cashFlowProjections)
        .values({
          ...data,
          projectedBalance: (Number(data.projectedIncome || 0) - Number(data.projectedExpenses || 0)).toString(),
        })
        .returning();

      return created;
    }
  }

  /**
   * Get projection by date
   */
  static async getByDate(userId: number, projectionDate: string): Promise<CashFlowProjection | null> {
    const [projection] = await db
      .select()
      .from(cashFlowProjections)
      .where(
        and(
          eq(cashFlowProjections.userId, userId),
          eq(cashFlowProjections.projectionDate, projectionDate)
        )
      )
      .limit(1);

    return projection || null;
  }

  /**
   * Get projections for date range
   */
  static async getProjections(
    userId: number,
    startDate: string,
    endDate: string,
    limit: number = 100
  ): Promise<CashFlowProjection[]> {
    return await db
      .select()
      .from(cashFlowProjections)
      .where(
        and(
          eq(cashFlowProjections.userId, userId),
          gte(cashFlowProjections.projectionDate, startDate),
          lte(cashFlowProjections.projectionDate, endDate)
        )
      )
      .orderBy(asc(cashFlowProjections.projectionDate))
      .limit(limit);
  }

  /**
   * Update actual values for a projection
   */
  static async updateActuals(
    userId: number,
    projectionDate: string,
    actualIncome: number,
    actualExpenses: number
  ): Promise<CashFlowProjection> {
    const actualBalance = actualIncome - actualExpenses;

    const existing = await this.getByDate(userId, projectionDate);
    if (!existing) {
      throw new Error('Projection not found for this date');
    }

    const [updated] = await db
      .update(cashFlowProjections)
      .set({
        actualIncome: actualIncome.toString(),
        actualExpenses: actualExpenses.toString(),
        actualBalance: actualBalance.toString(),
        updatedAt: new Date(),
      })
      .where(eq(cashFlowProjections.id, existing.id))
      .returning();

    return updated;
  }

  /**
   * Generate projections based on recurring transactions and historical data
   */
  static async generateProjections(
    userId: number,
    startDate: string,
    endDate: string,
    includeHistorical: boolean = true
  ): Promise<CashFlowProjection[]> {
    const projections: CashFlowProjection[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Get recurring transactions
    const recurringTransactions = await RecurringTransactionService.getFiltered({
      userId,
      isActive: true,
    });

    // Get historical averages if requested
    let historicalDailyIncome = 0;
    let historicalDailyExpenses = 0;

    if (includeHistorical) {
      const historicalData = await this.getHistoricalAverages(userId, 90); // Last 90 days
      historicalDailyIncome = historicalData.dailyIncome;
      historicalDailyExpenses = historicalData.dailyExpenses;
    }

    // Generate projections for each day
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Calculate projected income and expenses for this date
      let projectedIncome = historicalDailyIncome;
      let projectedExpenses = historicalDailyExpenses;

      // Add recurring transactions that fall on this date
      for (const recurring of recurringTransactions) {
        // Check if this recurring transaction occurs on this date
        if (this.isRecurringDueOnDate(recurring, currentDate)) {
          const amount = Number(recurring.amount);
          if (recurring.type === 'income') {
            projectedIncome += amount;
          } else if (recurring.type === 'expense') {
            projectedExpenses += amount;
          }
        }
      }

      const projectedBalance = projectedIncome - projectedExpenses;

      // Create or update projection
      const projectionData: NewCashFlowProjection = {
        userId,
        projectionDate: dateStr,
        projectedIncome: projectedIncome.toString(),
        projectedExpenses: projectedExpenses.toString(),
        projectedBalance: projectedBalance.toString(),
      };

      const projection = await this.createOrUpdate(projectionData);
      projections.push(projection);

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return projections;
  }

  /**
   * Check if recurring transaction is due on specific date
   */
  private static isRecurringDueOnDate(recurring: any, targetDate: Date): boolean {
    const startDate = new Date(recurring.startDate);
    
    if (targetDate < startDate) {
      return false;
    }

    if (recurring.endDate && targetDate > new Date(recurring.endDate)) {
      return false;
    }

    // Calculate if target date matches the recurring pattern
    const daysDiff = Math.floor((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const interval = recurring.intervalValue || 1;

    switch (recurring.frequency) {
      case 'daily':
        return daysDiff % interval === 0;
      case 'weekly':
        return daysDiff % (7 * interval) === 0;
      case 'monthly':
        // More complex calculation for monthly
        const monthsDiff = (targetDate.getFullYear() - startDate.getFullYear()) * 12 + 
                          (targetDate.getMonth() - startDate.getMonth());
        return monthsDiff % interval === 0 && targetDate.getDate() === startDate.getDate();
      case 'yearly':
        const yearsDiff = targetDate.getFullYear() - startDate.getFullYear();
        return yearsDiff % interval === 0 && 
               targetDate.getMonth() === startDate.getMonth() && 
               targetDate.getDate() === startDate.getDate();
      default:
        return false;
    }
  }

  /**
   * Get historical averages for projections
   */
  static async getHistoricalAverages(userId: number, days: number = 90): Promise<{
    dailyIncome: number;
    dailyExpenses: number;
    totalDays: number;
  }> {
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    const incomeResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          eq(transactions.status, 'active'),
          gte(transactions.transactionDate, startDate.toISOString().split('T')[0]),
          lte(transactions.transactionDate, endDate.toISOString().split('T')[0])
        )
      );

    const expenseResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          eq(transactions.status, 'active'),
          gte(transactions.transactionDate, startDate.toISOString().split('T')[0]),
          lte(transactions.transactionDate, endDate.toISOString().split('T')[0])
        )
      );

    const totalIncome = Number(incomeResult[0]?.total || 0);
    const totalExpenses = Number(expenseResult[0]?.total || 0);

    return {
      dailyIncome: totalIncome / days,
      dailyExpenses: totalExpenses / days,
      totalDays: days,
    };
  }

  /**
   * Get cash flow analysis with variance
   */
  static async getCashFlowAnalysis(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<CashFlowAnalysis[]> {
    const projections = await this.getProjections(userId, startDate, endDate);
    const analyses: CashFlowAnalysis[] = [];

    for (const projection of projections) {
      const analysis: CashFlowAnalysis = {
        projectionDate: new Date(projection.projectionDate),
        projectedIncome: Number(projection.projectedIncome),
        projectedExpenses: Number(projection.projectedExpenses),
        projectedBalance: Number(projection.projectedBalance),
        actualIncome: projection.actualIncome ? Number(projection.actualIncome) : undefined,
        actualExpenses: projection.actualExpenses ? Number(projection.actualExpenses) : undefined,
        actualBalance: projection.actualBalance ? Number(projection.actualBalance) : undefined,
      };

      // Calculate variance if actuals are available
      if (analysis.actualIncome !== undefined && analysis.actualExpenses !== undefined) {
        const incomeVariance = analysis.actualIncome - analysis.projectedIncome;
        const expenseVariance = analysis.actualExpenses - analysis.projectedExpenses;
        const balanceVariance = analysis.actualBalance! - analysis.projectedBalance;

        const incomeVariancePercentage = analysis.projectedIncome > 0 
          ? (incomeVariance / analysis.projectedIncome) * 100 
          : 0;
        const expenseVariancePercentage = analysis.projectedExpenses > 0 
          ? (expenseVariance / analysis.projectedExpenses) * 100 
          : 0;
        const balanceVariancePercentage = analysis.projectedBalance !== 0 
          ? (balanceVariance / Math.abs(analysis.projectedBalance)) * 100 
          : 0;

        analysis.variance = {
          incomeVariance,
          expenseVariance,
          balanceVariance,
          incomeVariancePercentage,
          expenseVariancePercentage,
          balanceVariancePercentage,
        };

        // Calculate overall accuracy (inverse of average absolute variance percentage)
        const avgAbsVariance = (
          Math.abs(incomeVariancePercentage) + 
          Math.abs(expenseVariancePercentage)
        ) / 2;
        analysis.accuracy = Math.max(0, 100 - avgAbsVariance);
      }

      analyses.push(analysis);
    }

    return analyses;
  }

  /**
   * Get cash flow summary
   */
  static async getCashFlowSummary(
    userId: number,
    startDate: string,
    endDate: string
  ): Promise<CashFlowSummary> {
    const analyses = await this.getCashFlowAnalysis(userId, startDate, endDate);

    let totalProjectedIncome = 0;
    let totalProjectedExpenses = 0;
    let totalProjectedBalance = 0;
    let totalActualIncome = 0;
    let totalActualExpenses = 0;
    let totalActualBalance = 0;
    let totalAccuracy = 0;
    let accuracyCount = 0;
    let positiveFlowDays = 0;
    let negativeFlowDays = 0;

    for (const analysis of analyses) {
      totalProjectedIncome += analysis.projectedIncome;
      totalProjectedExpenses += analysis.projectedExpenses;
      totalProjectedBalance += analysis.projectedBalance;

      if (analysis.actualIncome !== undefined) {
        totalActualIncome += analysis.actualIncome;
      }
      if (analysis.actualExpenses !== undefined) {
        totalActualExpenses += analysis.actualExpenses;
      }
      if (analysis.actualBalance !== undefined) {
        totalActualBalance += analysis.actualBalance;
      }

      if (analysis.accuracy !== undefined) {
        totalAccuracy += analysis.accuracy;
        accuracyCount++;
      }

      if (analysis.projectedBalance > 0) {
        positiveFlowDays++;
      } else if (analysis.projectedBalance < 0) {
        negativeFlowDays++;
      }
    }

    const averageAccuracy = accuracyCount > 0 ? totalAccuracy / accuracyCount : 0;

    return {
      totalProjectedIncome,
      totalProjectedExpenses,
      totalProjectedBalance,
      totalActualIncome,
      totalActualExpenses,
      totalActualBalance,
      averageAccuracy,
      projectionCount: analyses.length,
      positiveFlowDays,
      negativeFlowDays,
    };
  }

  /**
   * Generate future forecast with confidence levels
   */
  static async generateForecast(
    userId: number,
    startDate: string,
    days: number = 30
  ): Promise<CashFlowForecast[]> {
    const forecasts: CashFlowForecast[] = [];
    
    // Get historical accuracy to determine confidence
    const historicalEndDate = new Date(startDate);
    historicalEndDate.setDate(historicalEndDate.getDate() - 1);
    const historicalStartDate = new Date(historicalEndDate);
    historicalStartDate.setDate(historicalStartDate.getDate() - 90);

    const historicalSummary = await this.getCashFlowSummary(
      userId,
      historicalStartDate.toISOString().split('T')[0],
      historicalEndDate.toISOString().split('T')[0]
    );

    const baseConfidence = Math.min(95, Math.max(50, historicalSummary.averageAccuracy));

    // Generate projections for forecast period
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + days);

    const projections = await this.generateProjections(
      userId,
      startDate,
      endDate.toISOString().split('T')[0],
      true
    );

    let cumulativeBalance = 0;

    for (const projection of projections) {
      cumulativeBalance += Number(projection.projectedBalance);

      // Confidence decreases over time
      const dayIndex = forecasts.length;
      const timeDecay = Math.max(0.5, 1 - (dayIndex / days) * 0.3);
      const confidence = baseConfidence * timeDecay;

      const forecast: CashFlowForecast = {
        date: new Date(projection.projectionDate),
        projectedIncome: Number(projection.projectedIncome),
        projectedExpenses: Number(projection.projectedExpenses),
        projectedBalance: Number(projection.projectedBalance),
        cumulativeBalance,
        confidence,
        sources: {
          recurringIncome: 0, // Will be calculated separately
          recurringExpenses: 0, // Will be calculated separately
          historicalAverage: Number(projection.projectedIncome) - Number(projection.projectedExpenses),
        },
      };

      forecasts.push(forecast);
    }

    return forecasts;
  }

  /**
   * Update actuals from transactions automatically
   */
  static async updateActualsFromTransactions(userId: number, date: string): Promise<CashFlowProjection | null> {
    // Get actual transactions for the date
    const incomeResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'income'),
          eq(transactions.status, 'active'),
          eq(transactions.transactionDate, date)
        )
      );

    const expenseResult = await db
      .select({
        total: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          eq(transactions.status, 'active'),
          eq(transactions.transactionDate, date)
        )
      );

    const actualIncome = Number(incomeResult[0]?.total || 0);
    const actualExpenses = Number(expenseResult[0]?.total || 0);

    try {
      return await this.updateActuals(userId, date, actualIncome, actualExpenses);
    } catch (error) {
      // If projection doesn't exist, create it with actuals
      const projectionData: NewCashFlowProjection = {
        userId,
        projectionDate: date,
        projectedIncome: actualIncome.toString(),
        projectedExpenses: actualExpenses.toString(),
        projectedBalance: (actualIncome - actualExpenses).toString(),
        actualIncome: actualIncome.toString(),
        actualExpenses: actualExpenses.toString(),
        actualBalance: (actualIncome - actualExpenses).toString(),
      };

      return await this.createOrUpdate(projectionData);
    }
  }
}