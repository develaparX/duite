import { db } from '@/db';
import { recurringTransactions, transactions, type RecurringTransaction, type NewRecurringTransaction, type NewTransaction } from '@/db/schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';

/**
 * Recurring transaction validation functions
 */
export function validateRecurringTransactionAmount(amount: number | string): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
}

export function validateRecurringTransactionType(type: string): type is 'income' | 'expense' | 'debt' | 'receivable' {
  return ['income', 'expense', 'debt', 'receivable'].includes(type);
}

export function validateRecurringTransactionFrequency(frequency: string): frequency is 'daily' | 'weekly' | 'monthly' | 'yearly' {
  return ['daily', 'weekly', 'monthly', 'yearly'].includes(frequency);
}

export function validateRecurringTransactionData(data: Partial<NewRecurringTransaction>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.amount || !validateRecurringTransactionAmount(data.amount)) {
    errors.push('Amount must be a positive number');
  }

  if (!data.type || !validateRecurringTransactionType(data.type)) {
    errors.push('Type must be one of: income, expense, debt, receivable');
  }

  if (!data.frequency || !validateRecurringTransactionFrequency(data.frequency)) {
    errors.push('Frequency must be one of: daily, weekly, monthly, yearly');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!data.startDate) {
    errors.push('Start date is required');
  }

  if (!data.nextDueDate) {
    errors.push('Next due date is required');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  if (data.intervalValue !== undefined && data.intervalValue < 1) {
    errors.push('Interval must be at least 1');
  }

  if (data.endDate && data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
    errors.push('End date must be after start date');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Recurring transaction filtering and sorting types
 */
export interface RecurringTransactionFilters {
  userId: string;
  type?: 'income' | 'expense' | 'debt' | 'receivable';
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  category?: string;
  isActive?: boolean;
  dueSoon?: boolean; // Due in next 7 days
}

export interface RecurringTransactionSortOptions {
  field: 'nextDueDate' | 'amount' | 'description' | 'createdAt';
  direction: 'asc' | 'desc';
}

/**
 * Recurring transaction processing types
 */
export interface RecurringTransactionDue {
  recurringTransaction: RecurringTransaction;
  daysUntilDue: number;
  isOverdue: boolean;
  nextOccurrence: Date;
}

/**
 * Date calculation utilities
 */
export class DateCalculator {
  static addFrequency(date: Date, frequency: string, interval: number = 1): Date {
    const newDate = new Date(date);
    
    switch (frequency) {
      case 'daily':
        newDate.setDate(newDate.getDate() + interval);
        break;
      case 'weekly':
        newDate.setDate(newDate.getDate() + (interval * 7));
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + interval);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + interval);
        break;
      default:
        throw new Error(`Invalid frequency: ${frequency}`);
    }
    
    return newDate;
  }

  static calculateNextDueDate(lastDueDate: Date, frequency: string, interval: number = 1): Date {
    return this.addFrequency(lastDueDate, frequency, interval);
  }

  static getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = date2.getTime() - date1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}

/**
 * Recurring Transaction Service
 */
export class RecurringTransactionService {
  /**
   * Create a new recurring transaction
   */
  static async create(data: NewRecurringTransaction): Promise<RecurringTransaction> {
    const validation = validateRecurringTransactionData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [recurringTransaction] = await db
      .insert(recurringTransactions)
      .values({
        ...data,
        isActive: data.isActive ?? true,
        intervalValue: data.intervalValue ?? 1,
      })
      .returning();

    return recurringTransaction;
  }

  /**
   * Get recurring transaction by ID
   */
  static async getById(id: number, userId: string): Promise<RecurringTransaction | null> {
    const [recurringTransaction] = await db
      .select()
      .from(recurringTransactions)
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
      .limit(1);

    return recurringTransaction || null;
  }

  /**
   * Update recurring transaction
   */
  static async update(id: number, userId: string, data: Partial<NewRecurringTransaction>): Promise<RecurringTransaction> {
    const validation = validateRecurringTransactionData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [recurringTransaction] = await db
      .update(recurringTransactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)))
      .returning();

    if (!recurringTransaction) {
      throw new Error('Recurring transaction not found');
    }

    return recurringTransaction;
  }

  /**
   * Delete recurring transaction
   */
  static async delete(id: number, userId: string): Promise<void> {
    const result = await db
      .delete(recurringTransactions)
      .where(and(eq(recurringTransactions.id, id), eq(recurringTransactions.userId, userId)));

    if (result.rowCount === 0) {
      throw new Error('Recurring transaction not found');
    }
  }

  /**
   * Get filtered recurring transactions with pagination
   */
  static async getFiltered(
    filters: RecurringTransactionFilters,
    sortOptions: RecurringTransactionSortOptions = { field: 'nextDueDate', direction: 'asc' },
    limit: number = 50,
    offset: number = 0
  ): Promise<RecurringTransaction[]> {
    let query = db.select().from(recurringTransactions)
      .where(eq(recurringTransactions.userId, filters.userId));

    // Apply filters
    if (filters.type) {
      query = query.where(eq(recurringTransactions.type, filters.type));
    }

    if (filters.frequency) {
      query = query.where(eq(recurringTransactions.frequency, filters.frequency));
    }

    if (filters.category) {
      query = query.where(eq(recurringTransactions.category, filters.category));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(recurringTransactions.isActive, filters.isActive));
    }

    if (filters.dueSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query = query.where(lte(recurringTransactions.nextDueDate, sevenDaysFromNow.toISOString().split('T')[0]));
    }

    // Apply sorting
    const sortField = recurringTransactions[sortOptions.field];
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
   * Get count of filtered recurring transactions
   */
  static async getCount(filters: RecurringTransactionFilters): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(recurringTransactions)
      .where(eq(recurringTransactions.userId, filters.userId));

    // Apply same filters as getFiltered
    if (filters.type) {
      query = query.where(eq(recurringTransactions.type, filters.type));
    }

    if (filters.frequency) {
      query = query.where(eq(recurringTransactions.frequency, filters.frequency));
    }

    if (filters.category) {
      query = query.where(eq(recurringTransactions.category, filters.category));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(recurringTransactions.isActive, filters.isActive));
    }

    if (filters.dueSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query = query.where(lte(recurringTransactions.nextDueDate, sevenDaysFromNow.toISOString().split('T')[0]));
    }

    const [result] = await query;
    return result.count;
  }

  /**
   * Get due recurring transactions
   */
  static async getDueTransactions(userId: string, daysAhead: number = 0): Promise<RecurringTransactionDue[]> {
    const today = new Date();
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() + daysAhead);

    const dueTransactions = await db
      .select()
      .from(recurringTransactions)
      .where(
        and(
          eq(recurringTransactions.userId, userId),
          eq(recurringTransactions.isActive, true),
          lte(recurringTransactions.nextDueDate, checkDate.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(recurringTransactions.nextDueDate));

    return dueTransactions.map(rt => {
      const nextDueDate = new Date(rt.nextDueDate);
      const daysUntilDue = DateCalculator.getDaysBetween(today, nextDueDate);
      const isOverdue = daysUntilDue < 0;
      
      return {
        recurringTransaction: rt,
        daysUntilDue,
        isOverdue,
        nextOccurrence: nextDueDate,
      };
    });
  }

  /**
   * Process due recurring transactions (create actual transactions)
   */
  static async processDueTransactions(userId: string): Promise<{ created: number; errors: string[] }> {
    const dueTransactions = await this.getDueTransactions(userId, 0);
    let created = 0;
    const errors: string[] = [];

    for (const { recurringTransaction } of dueTransactions) {
      try {
        // Create the actual transaction
        const transactionData: NewTransaction = {
          userId: recurringTransaction.userId,
          type: recurringTransaction.type,
          amount: recurringTransaction.amount,
          currency: recurringTransaction.currency,
          description: recurringTransaction.description,
          category: recurringTransaction.category,
          categoryId: recurringTransaction.categoryId,
          transactionDate: recurringTransaction.nextDueDate,
          status: 'active',
          relatedParty: recurringTransaction.relatedParty,
          recurringId: recurringTransaction.id,
          tags: recurringTransaction.tags,
          notes: recurringTransaction.notes,
        };

        await db.insert(transactions).values(transactionData);

        // Update next due date
        const currentNextDue = new Date(recurringTransaction.nextDueDate);
        const newNextDue = DateCalculator.calculateNextDueDate(
          currentNextDue,
          recurringTransaction.frequency,
          recurringTransaction.intervalValue || 1
        );

        // Check if we should stop (end date reached)
        let shouldDeactivate = false;
        if (recurringTransaction.endDate) {
          const endDate = new Date(recurringTransaction.endDate);
          if (newNextDue > endDate) {
            shouldDeactivate = true;
          }
        }

        await db
          .update(recurringTransactions)
          .set({
            nextDueDate: newNextDue.toISOString().split('T')[0],
            isActive: !shouldDeactivate,
            updatedAt: new Date(),
          })
          .where(eq(recurringTransactions.id, recurringTransaction.id));

        created++;
      } catch (error) {
        errors.push(`Failed to process recurring transaction ${recurringTransaction.id}: ${error}`);
      }
    }

    return { created, errors };
  }

  /**
   * Get upcoming recurring transactions (next 30 days)
   */
  static async getUpcoming(userId: string, days: number = 30): Promise<RecurringTransactionDue[]> {
    return await this.getDueTransactions(userId, days);
  }

  /**
   * Pause/Resume recurring transaction
   */
  static async toggleActive(id: number, userId: string): Promise<RecurringTransaction> {
    const recurringTransaction = await this.getById(id, userId);
    if (!recurringTransaction) {
      throw new Error('Recurring transaction not found');
    }

    return await this.update(id, userId, {
      isActive: !recurringTransaction.isActive,
    });
  }

  /**
   * Skip next occurrence
   */
  static async skipNext(id: number, userId: string): Promise<RecurringTransaction> {
    const recurringTransaction = await this.getById(id, userId);
    if (!recurringTransaction) {
      throw new Error('Recurring transaction not found');
    }

    const currentNextDue = new Date(recurringTransaction.nextDueDate);
    const newNextDue = DateCalculator.calculateNextDueDate(
      currentNextDue,
      recurringTransaction.frequency,
      recurringTransaction.intervalValue || 1
    );

    return await this.update(id, userId, {
      nextDueDate: newNextDue.toISOString().split('T')[0],
    });
  }

  /**
   * Get recurring transaction summary
   */
  static async getSummary(userId: string): Promise<{
    totalActive: number;
    totalInactive: number;
    monthlyIncomeTotal: number;
    monthlyExpenseTotal: number;
    dueSoon: number;
    overdue: number;
  }> {
    const allRecurring = await db
      .select()
      .from(recurringTransactions)
      .where(eq(recurringTransactions.userId, userId));

    const active = allRecurring.filter(rt => rt.isActive);
    const inactive = allRecurring.filter(rt => !rt.isActive);

    // Calculate monthly totals (convert all frequencies to monthly equivalent)
    let monthlyIncomeTotal = 0;
    let monthlyExpenseTotal = 0;

    for (const rt of active) {
      const amount = Number(rt.amount);
      let monthlyAmount = 0;

      switch (rt.frequency) {
        case 'daily':
          monthlyAmount = amount * 30 / (rt.intervalValue || 1);
          break;
        case 'weekly':
          monthlyAmount = amount * 4.33 / (rt.intervalValue || 1);
          break;
        case 'monthly':
          monthlyAmount = amount / (rt.intervalValue || 1);
          break;
        case 'yearly':
          monthlyAmount = amount / 12 / (rt.intervalValue || 1);
          break;
      }

      if (rt.type === 'income') {
        monthlyIncomeTotal += monthlyAmount;
      } else if (rt.type === 'expense') {
        monthlyExpenseTotal += monthlyAmount;
      }
    }

    // Count due soon and overdue
    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const dueSoon = active.filter(rt => {
      const dueDate = new Date(rt.nextDueDate);
      return dueDate <= sevenDaysFromNow && dueDate >= today;
    }).length;

    const overdue = active.filter(rt => {
      const dueDate = new Date(rt.nextDueDate);
      return dueDate < today;
    }).length;

    return {
      totalActive: active.length,
      totalInactive: inactive.length,
      monthlyIncomeTotal,
      monthlyExpenseTotal,
      dueSoon,
      overdue,
    };
  }
}