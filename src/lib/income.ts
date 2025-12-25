import { TransactionService, type TransactionFilters } from './transactions';
import type { Transaction } from '@/db/schema';

/**
 * Income-specific utility functions and services
 */

export interface IncomeSource {
  name: string;
  totalAmount: number;
  transactionCount: number;
  averageAmount: number;
}

export interface MonthlyIncomeReport {
  year: number;
  month: number;
  totalIncome: number;
  transactionCount: number;
  sources: IncomeSource[];
  transactions: Transaction[];
}

export interface IncomeFilters extends Omit<TransactionFilters, 'type'> {
  source?: string; // Filter by income source (category)
}

export class IncomeService {
  /**
   * Get monthly income report with source breakdown
   */
  static async getMonthlyIncomeReport(
    userId: string,
    year: number,
    month: number,
    sourceFilter?: string
  ): Promise<MonthlyIncomeReport> {
    // Calculate date range for the month
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    // Get all income transactions for the month
    const filters: TransactionFilters = {
      userId,
      type: 'income',
      startDate,
      endDate,
    };

    // Add source filter if specified
    if (sourceFilter && sourceFilter !== 'all') {
      filters.category = sourceFilter;
    }

    const transactions = await TransactionService.getFiltered(
      filters,
      { field: 'transactionDate', direction: 'desc' },
      1000 // Get all transactions for the month
    );

    // Calculate totals and group by source
    const sourceMap = new Map<string, IncomeSource>();
    let totalIncome = 0;

    transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount);
      totalIncome += amount;

      const sourceName = transaction.category || 'Uncategorized';
      
      if (sourceMap.has(sourceName)) {
        const source = sourceMap.get(sourceName)!;
        source.totalAmount += amount;
        source.transactionCount += 1;
        source.averageAmount = source.totalAmount / source.transactionCount;
      } else {
        sourceMap.set(sourceName, {
          name: sourceName,
          totalAmount: amount,
          transactionCount: 1,
          averageAmount: amount,
        });
      }
    });

    // Convert map to array and sort by total amount
    const sources = Array.from(sourceMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    return {
      year,
      month,
      totalIncome,
      transactionCount: transactions.length,
      sources,
      transactions,
    };
  }

  /**
   * Get income by source for a date range
   */
  static async getIncomeBySource(
    userId: string,
    startDate?: string,
    endDate?: string
  ): Promise<IncomeSource[]> {
    const filters: TransactionFilters = {
      userId,
      type: 'income',
      ...(startDate && { startDate }),
      ...(endDate && { endDate }),
    };

    const transactions = await TransactionService.getFiltered(
      filters,
      { field: 'transactionDate', direction: 'desc' },
      1000
    );

    // Group by source
    const sourceMap = new Map<string, IncomeSource>();

    transactions.forEach((transaction) => {
      const amount = parseFloat(transaction.amount);
      const sourceName = transaction.category || 'Uncategorized';
      
      if (sourceMap.has(sourceName)) {
        const source = sourceMap.get(sourceName)!;
        source.totalAmount += amount;
        source.transactionCount += 1;
        source.averageAmount = source.totalAmount / source.transactionCount;
      } else {
        sourceMap.set(sourceName, {
          name: sourceName,
          totalAmount: amount,
          transactionCount: 1,
          averageAmount: amount,
        });
      }
    });

    return Array.from(sourceMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );
  }

  /**
   * Get available income sources for a user
   */
  static async getAvailableIncomeSources(userId: string): Promise<string[]> {
    const filters: TransactionFilters = {
      userId,
      type: 'income',
    };

    const transactions = await TransactionService.getFiltered(
      filters,
      { field: 'transactionDate', direction: 'desc' },
      1000
    );

    // Extract unique sources
    const sources = new Set<string>();
    transactions.forEach((transaction) => {
      if (transaction.category) {
        sources.add(transaction.category);
      }
    });

    return Array.from(sources).sort();
  }

  /**
   * Get income trends over multiple months
   */
  static async getIncometrends(
    userId: string,
    monthsBack: number = 12
  ): Promise<{ month: string; year: number; totalIncome: number }[]> {
    const trends = [];
    const currentDate = new Date();

    for (let i = 0; i < monthsBack; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      const report = await this.getMonthlyIncomeReport(userId, year, month);
      
      trends.push({
        month: date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        year,
        totalIncome: report.totalIncome,
      });
    }

    return trends.reverse(); // Return in chronological order
  }

  /**
   * Validate income data
   */
  static validateIncomeData(data: {
    amount: number | string;
    description: string;
    source?: string;
    date: string;
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Amount validation
    const amount = typeof data.amount === 'string' ? parseFloat(data.amount) : data.amount;
    if (isNaN(amount) || amount <= 0) {
      errors.push('Income amount must be a positive number');
    }

    // Description validation
    if (!data.description || data.description.trim().length === 0) {
      errors.push('Income description is required');
    }

    // Date validation
    if (!data.date) {
      errors.push('Income date is required');
    } else {
      const date = new Date(data.date);
      if (isNaN(date.getTime())) {
        errors.push('Invalid income date format');
      }
    }

    // Source validation (optional but should be meaningful if provided)
    if (data.source && data.source.trim().length === 0) {
      errors.push('Income source cannot be empty if provided');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Format income amount for display
   */
  static formatIncomeAmount(amount: number | string): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(numAmount);
  }

  /**
   * Calculate income growth rate between two periods
   */
  static calculateIncomeGrowth(currentAmount: number, previousAmount: number): {
    growthRate: number;
    growthAmount: number;
    isPositive: boolean;
  } {
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
      growthRate: Math.round(growthRate * 100) / 100, // Round to 2 decimal places
      growthAmount,
      isPositive: growthAmount >= 0,
    };
  }
}