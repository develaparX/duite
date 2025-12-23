import { db } from '@/db';
import { investmentBalances, type InvestmentBalance, type NewInvestmentBalance } from '@/db/schema';
import { eq, and, desc, asc, gte, lte } from 'drizzle-orm';

/**
 * Investment balance validation functions
 */
export function validateInvestmentBalance(balance: number | string): boolean {
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  return !isNaN(numBalance);
}

export function validateInvestmentData(data: Partial<NewInvestmentBalance>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.accountName || data.accountName.trim().length === 0) {
    errors.push('Account name is required');
  }

  if (data.balance === undefined || data.balance === null || !validateInvestmentBalance(data.balance)) {
    errors.push('Balance must be a valid number');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  if (data.accountType && data.accountType.trim().length === 0) {
    errors.push('Account type cannot be empty if provided');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Investment balance filtering and sorting types
 */
export interface InvestmentFilters {
  userId: number;
  accountName?: string;
  accountType?: string;
  startDate?: string;
  endDate?: string;
}

export interface InvestmentSortOptions {
  field: 'recordedAt' | 'balance' | 'accountName';
  direction: 'asc' | 'desc';
}

/**
 * Investment performance calculation types
 */
export interface InvestmentPerformance {
  accountName: string;
  currentBalance: number;
  previousBalance: number;
  gainLoss: number;
  gainLossPercentage: number;
  isPositive: boolean;
  recordedAt: Date;
}

export interface InvestmentSummary {
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

/**
 * Investment Balance Service
 */
export class InvestmentService {
  /**
   * Create a new investment balance record
   */
  static async recordBalance(data: NewInvestmentBalance): Promise<InvestmentBalance> {
    const validation = validateInvestmentData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [balance] = await db
      .insert(investmentBalances)
      .values({
        ...data,
        accountType: data.accountType || 'general',
        recordedAt: data.recordedAt || new Date(),
      })
      .returning();

    return balance;
  }

  /**
   * Get investment balance by ID
   */
  static async getById(id: number, userId: number): Promise<InvestmentBalance | null> {
    const [balance] = await db
      .select()
      .from(investmentBalances)
      .where(and(eq(investmentBalances.id, id), eq(investmentBalances.userId, userId)))
      .limit(1);

    return balance || null;
  }

  /**
   * Update investment balance record
   */
  static async update(
    id: number,
    userId: number,
    data: Partial<NewInvestmentBalance>
  ): Promise<InvestmentBalance | null> {
    const validation = validateInvestmentData({ ...data, userId });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [balance] = await db
      .update(investmentBalances)
      .set(data)
      .where(and(eq(investmentBalances.id, id), eq(investmentBalances.userId, userId)))
      .returning();

    return balance || null;
  }

  /**
   * Delete investment balance record
   */
  static async delete(id: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(investmentBalances)
      .where(and(eq(investmentBalances.id, id), eq(investmentBalances.userId, userId)))
      .returning({ id: investmentBalances.id });

    return result.length > 0;
  }

  /**
   * Get investment balances with filtering and sorting
   */
  static async getFiltered(
    filters: InvestmentFilters,
    sort: InvestmentSortOptions = { field: 'recordedAt', direction: 'desc' },
    limit: number = 50,
    offset: number = 0
  ): Promise<InvestmentBalance[]> {
    let query = db.select().from(investmentBalances);

    // Build where conditions
    const conditions = [eq(investmentBalances.userId, filters.userId)];

    if (filters.accountName) {
      conditions.push(eq(investmentBalances.accountName, filters.accountName));
    }

    if (filters.accountType) {
      conditions.push(eq(investmentBalances.accountType, filters.accountType));
    }

    if (filters.startDate) {
      conditions.push(gte(investmentBalances.recordedAt, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(investmentBalances.recordedAt, new Date(filters.endDate)));
    }

    // Apply where conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = investmentBalances[sort.field];
    query = query.orderBy(sort.direction === 'desc' ? desc(sortField) : asc(sortField));

    // Apply pagination
    query = query.limit(limit).offset(offset);

    return await query;
  }

  /**
   * Get balance history for a specific account
   */
  static async getAccountHistory(
    userId: number,
    accountName: string,
    limit: number = 50
  ): Promise<InvestmentBalance[]> {
    return this.getFiltered(
      { userId, accountName },
      { field: 'recordedAt', direction: 'desc' },
      limit
    );
  }

  /**
   * Get all unique account names for a user
   */
  static async getAccountNames(userId: number): Promise<string[]> {
    const balances = await db
      .selectDistinct({ accountName: investmentBalances.accountName })
      .from(investmentBalances)
      .where(eq(investmentBalances.userId, userId))
      .orderBy(asc(investmentBalances.accountName));

    return balances.map(b => b.accountName);
  }

  /**
   * Get all unique account types for a user
   */
  static async getAccountTypes(userId: number): Promise<string[]> {
    const balances = await db
      .selectDistinct({ accountType: investmentBalances.accountType })
      .from(investmentBalances)
      .where(eq(investmentBalances.userId, userId))
      .orderBy(asc(investmentBalances.accountType));

    return balances.map(b => b.accountType || 'general');
  }

  /**
   * Get current balance for each account (most recent record)
   */
  static async getCurrentBalances(userId: number): Promise<InvestmentBalance[]> {
    const accountNames = await this.getAccountNames(userId);
    const currentBalances: InvestmentBalance[] = [];

    for (const accountName of accountNames) {
      const [latestBalance] = await this.getFiltered(
        { userId, accountName },
        { field: 'recordedAt', direction: 'desc' },
        1
      );

      if (latestBalance) {
        currentBalances.push(latestBalance);
      }
    }

    return currentBalances;
  }

  /**
   * Calculate investment performance for an account
   */
  static async calculateAccountPerformance(
    userId: number,
    accountName: string
  ): Promise<InvestmentPerformance | null> {
    const history = await this.getAccountHistory(userId, accountName, 2);
    
    if (history.length === 0) {
      return null;
    }

    const current = history[0];
    const previous = history.length > 1 ? history[1] : null;

    const currentBalance = parseFloat(current.balance);
    const previousBalance = previous ? parseFloat(previous.balance) : 0;
    const gainLoss = currentBalance - previousBalance;
    const gainLossPercentage = previousBalance !== 0 ? (gainLoss / previousBalance) * 100 : 0;

    return {
      accountName,
      currentBalance,
      previousBalance,
      gainLoss,
      gainLossPercentage: Math.round(gainLossPercentage * 100) / 100,
      isPositive: gainLoss >= 0,
      recordedAt: current.recordedAt || new Date(),
    };
  }

  /**
   * Get investment summary for a user
   */
  static async getInvestmentSummary(userId: number): Promise<InvestmentSummary> {
    const currentBalances = await this.getCurrentBalances(userId);
    
    let totalCurrentBalance = 0;
    let totalPreviousBalance = 0;
    let lastUpdated: Date | null = null;

    const accounts = [];

    for (const balance of currentBalances) {
      const currentAmount = parseFloat(balance.balance);
      totalCurrentBalance += currentAmount;

      // Get previous balance for performance calculation
      const history = await this.getAccountHistory(userId, balance.accountName, 2);
      const previousAmount = history.length > 1 ? parseFloat(history[1].balance) : 0;
      totalPreviousBalance += previousAmount;

      accounts.push({
        accountName: balance.accountName,
        accountType: balance.accountType || 'general',
        currentBalance: currentAmount,
        lastUpdated: balance.recordedAt || new Date(),
      });

      // Track the most recent update
      if (!lastUpdated || (balance.recordedAt && balance.recordedAt > lastUpdated)) {
        lastUpdated = balance.recordedAt;
      }
    }

    const totalGainLoss = totalCurrentBalance - totalPreviousBalance;
    const totalGainLossPercentage = totalPreviousBalance !== 0 
      ? (totalGainLoss / totalPreviousBalance) * 100 
      : 0;

    return {
      totalCurrentBalance,
      totalGainLoss,
      totalGainLossPercentage: Math.round(totalGainLossPercentage * 100) / 100,
      accountCount: currentBalances.length,
      lastUpdated,
      accounts: accounts.sort((a, b) => b.currentBalance - a.currentBalance),
    };
  }

  /**
   * Get investment performance for all accounts
   */
  static async getAllAccountPerformance(userId: number): Promise<InvestmentPerformance[]> {
    const accountNames = await this.getAccountNames(userId);
    const performances: InvestmentPerformance[] = [];

    for (const accountName of accountNames) {
      const performance = await this.calculateAccountPerformance(userId, accountName);
      if (performance) {
        performances.push(performance);
      }
    }

    return performances.sort((a, b) => b.currentBalance - a.currentBalance);
  }

  /**
   * Get balance history for date range
   */
  static async getBalanceHistory(
    userId: number,
    startDate?: string,
    endDate?: string,
    accountName?: string
  ): Promise<InvestmentBalance[]> {
    const filters: InvestmentFilters = { userId };
    
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;
    if (accountName) filters.accountName = accountName;

    return this.getFiltered(
      filters,
      { field: 'recordedAt', direction: 'asc' },
      1000
    );
  }

  /**
   * Format investment balance for display
   */
  static formatBalance(balance: number | string): string {
    const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(numBalance);
  }

  /**
   * Format percentage for display
   */
  static formatPercentage(percentage: number): string {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(2)}%`;
  }

  /**
   * Get investment count for pagination
   */
  static async getCount(filters: InvestmentFilters): Promise<number> {
    const conditions = [eq(investmentBalances.userId, filters.userId)];

    if (filters.accountName) {
      conditions.push(eq(investmentBalances.accountName, filters.accountName));
    }

    if (filters.accountType) {
      conditions.push(eq(investmentBalances.accountType, filters.accountType));
    }

    if (filters.startDate) {
      conditions.push(gte(investmentBalances.recordedAt, new Date(filters.startDate)));
    }

    if (filters.endDate) {
      conditions.push(lte(investmentBalances.recordedAt, new Date(filters.endDate)));
    }

    const result = await db
      .select({ count: investmentBalances.id })
      .from(investmentBalances)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.length;
  }
}