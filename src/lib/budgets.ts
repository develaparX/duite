import { db } from '@/db';
import { budgets, transactions, type Budget, type NewBudget } from '@/db/schema';
import { eq, and, gte, lte, desc, asc, sum, sql } from 'drizzle-orm';

/**
 * Budget validation functions
 */
export function validateBudgetAmount(amount: number | string): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
}

export function validateBudgetPeriod(period: string): period is 'weekly' | 'monthly' | 'yearly' {
  return ['weekly', 'monthly', 'yearly'].includes(period);
}

export function validateBudgetData(data: Partial<NewBudget>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Budget name is required');
  }

  if (!data.amount || !validateBudgetAmount(data.amount)) {
    errors.push('Budget amount must be a positive number');
  }

  if (!data.period || !validateBudgetPeriod(data.period)) {
    errors.push('Period must be one of: weekly, monthly, yearly');
  }

  if (!data.startDate) {
    errors.push('Start date is required');
  }

  if (!data.endDate) {
    errors.push('End date is required');
  }

  if (data.startDate && data.endDate && new Date(data.startDate) >= new Date(data.endDate)) {
    errors.push('End date must be after start date');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  if (data.alertThreshold !== undefined && (data.alertThreshold < 0 || data.alertThreshold > 100)) {
    errors.push('Alert threshold must be between 0 and 100');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Budget filtering and sorting types
 */
export interface BudgetFilters {
  userId: string;
  period?: 'weekly' | 'monthly' | 'yearly';
  category?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export interface BudgetSortOptions {
  field: 'name' | 'amount' | 'startDate' | 'createdAt';
  direction: 'asc' | 'desc';
}

/**
 * Budget performance and tracking types
 */
export interface BudgetPerformance {
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
  startDate: Date;
  endDate: Date;
  alertThreshold: number;
  shouldAlert: boolean;
}

export interface BudgetSummary {
  totalBudgets: number;
  activeBudgets: number;
  totalBudgetAmount: number;
  totalSpentAmount: number;
  totalRemainingAmount: number;
  overBudgetCount: number;
  alertCount: number;
  averageUsagePercentage: number;
}

/**
 * Budget Service
 */
export class BudgetService {
  /**
   * Create a new budget
   */
  static async create(data: NewBudget): Promise<Budget> {
    const validation = validateBudgetData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [budget] = await db
      .insert(budgets)
      .values({
        ...data,
        isActive: data.isActive ?? true,
        alertThreshold: data.alertThreshold ?? 80.00,
      })
      .returning();

    return budget;
  }

  /**
   * Get budget by ID
   */
  static async getById(id: number, userId: string): Promise<Budget | null> {
    const [budget] = await db
      .select()
      .from(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .limit(1);

    return budget || null;
  }

  /**
   * Update budget
   */
  static async update(id: number, userId: string, data: Partial<NewBudget>): Promise<Budget> {
    const validation = validateBudgetData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [budget] = await db
      .update(budgets)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)))
      .returning();

    if (!budget) {
      throw new Error('Budget not found');
    }

    return budget;
  }

  /**
   * Delete budget
   */
  static async delete(id: number, userId: string): Promise<void> {
    const result = await db
      .delete(budgets)
      .where(and(eq(budgets.id, id), eq(budgets.userId, userId)));

    if (result.rowCount === 0) {
      throw new Error('Budget not found');
    }
  }

  /**
   * Get filtered budgets with pagination
   */
  static async getFiltered(
    filters: BudgetFilters,
    sortOptions: BudgetSortOptions = { field: 'createdAt', direction: 'desc' },
    limit: number = 50,
    offset: number = 0
  ): Promise<Budget[]> {
    let query = db.select().from(budgets).where(eq(budgets.userId, filters.userId));

    // Apply filters
    if (filters.period) {
      query = query.where(eq(budgets.period, filters.period));
    }

    if (filters.category) {
      query = query.where(eq(budgets.category, filters.category));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(budgets.isActive, filters.isActive));
    }

    if (filters.startDate) {
      query = query.where(gte(budgets.startDate, filters.startDate));
    }

    if (filters.endDate) {
      query = query.where(lte(budgets.endDate, filters.endDate));
    }

    // Apply sorting
    const sortField = budgets[sortOptions.field];
    if (sortOptions.direction === 'asc') {
      query = query.orderBy(asc(sortField));
    } else {
      query = query.orderBy(desc(sortField));
    }

    // Apply pagination
    query = query.limit(limit).offset(offset);

    return await query;
  }

  /**
   * Get count of filtered budgets
   */
  static async getCount(filters: BudgetFilters): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(budgets)
      .where(eq(budgets.userId, filters.userId));

    // Apply same filters as getFiltered
    if (filters.period) {
      query = query.where(eq(budgets.period, filters.period));
    }

    if (filters.category) {
      query = query.where(eq(budgets.category, filters.category));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(budgets.isActive, filters.isActive));
    }

    if (filters.startDate) {
      query = query.where(gte(budgets.startDate, filters.startDate));
    }

    if (filters.endDate) {
      query = query.where(lte(budgets.endDate, filters.endDate));
    }

    const [result] = await query;
    return result.count;
  }

  /**
   * Get budget performance with spending analysis
   */
  static async getBudgetPerformance(budgetId: number, userId: string): Promise<BudgetPerformance | null> {
    const budget = await this.getById(budgetId, userId);
    if (!budget) {
      return null;
    }

    // Calculate spent amount from transactions
    const spentResult = await db
      .select({
        totalSpent: sql<number>`COALESCE(SUM(${transactions.amount}), 0)`,
      })
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.type, 'expense'),
          eq(transactions.status, 'active'),
          gte(transactions.transactionDate, budget.startDate),
          lte(transactions.transactionDate, budget.endDate),
          budget.category ? eq(transactions.category, budget.category) : sql`1=1`
        )
      );

    const spentAmount = Number(spentResult[0]?.totalSpent || 0);
    const budgetAmount = Number(budget.amount);
    const remainingAmount = budgetAmount - spentAmount;
    const percentageUsed = budgetAmount > 0 ? (spentAmount / budgetAmount) * 100 : 0;
    const isOverBudget = spentAmount > budgetAmount;

    // Calculate days remaining
    const today = new Date();
    const endDate = new Date(budget.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Calculate daily budget remaining
    const dailyBudgetRemaining = daysRemaining > 0 ? remainingAmount / daysRemaining : 0;

    // Check if should alert
    const shouldAlert = percentageUsed >= Number(budget.alertThreshold);

    return {
      budgetId: budget.id,
      budgetName: budget.name,
      budgetAmount,
      spentAmount,
      remainingAmount,
      percentageUsed,
      isOverBudget,
      daysRemaining,
      dailyBudgetRemaining,
      category: budget.category || undefined,
      period: budget.period,
      startDate: new Date(budget.startDate),
      endDate: new Date(budget.endDate),
      alertThreshold: Number(budget.alertThreshold),
      shouldAlert,
    };
  }

  /**
   * Get budget summary for user
   */
  static async getBudgetSummary(userId: string, period?: string): Promise<BudgetSummary> {
    let budgetQuery = db.select().from(budgets).where(eq(budgets.userId, userId));
    
    if (period) {
      budgetQuery = budgetQuery.where(eq(budgets.period, period));
    }

    const userBudgets = await budgetQuery;
    const activeBudgets = userBudgets.filter(b => b.isActive);

    let totalBudgetAmount = 0;
    let totalSpentAmount = 0;
    let overBudgetCount = 0;
    let alertCount = 0;
    let totalUsagePercentage = 0;

    for (const budget of activeBudgets) {
      const performance = await this.getBudgetPerformance(budget.id, userId);
      if (performance) {
        totalBudgetAmount += performance.budgetAmount;
        totalSpentAmount += performance.spentAmount;
        
        if (performance.isOverBudget) {
          overBudgetCount++;
        }
        
        if (performance.shouldAlert) {
          alertCount++;
        }
        
        totalUsagePercentage += performance.percentageUsed;
      }
    }

    const averageUsagePercentage = activeBudgets.length > 0 ? totalUsagePercentage / activeBudgets.length : 0;
    const totalRemainingAmount = totalBudgetAmount - totalSpentAmount;

    return {
      totalBudgets: userBudgets.length,
      activeBudgets: activeBudgets.length,
      totalBudgetAmount,
      totalSpentAmount,
      totalRemainingAmount,
      overBudgetCount,
      alertCount,
      averageUsagePercentage,
    };
  }

  /**
   * Get current month budgets for user
   */
  static async getCurrentMonthBudgets(userId: string): Promise<BudgetPerformance[]> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const currentBudgets = await db
      .select()
      .from(budgets)
      .where(
        and(
          eq(budgets.userId, userId),
          eq(budgets.isActive, true),
          lte(budgets.startDate, endOfMonth.toISOString().split('T')[0]),
          gte(budgets.endDate, startOfMonth.toISOString().split('T')[0])
        )
      );

    const performances: BudgetPerformance[] = [];
    for (const budget of currentBudgets) {
      const performance = await this.getBudgetPerformance(budget.id, userId);
      if (performance) {
        performances.push(performance);
      }
    }

    return performances;
  }

  /**
   * Check for budget alerts
   */
  static async checkBudgetAlerts(userId: string): Promise<BudgetPerformance[]> {
    const currentBudgets = await this.getCurrentMonthBudgets(userId);
    return currentBudgets.filter(budget => budget.shouldAlert);
  }
}