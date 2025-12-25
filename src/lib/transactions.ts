import { db } from '@/db';
import { transactions, categories, type Transaction, type NewTransaction } from '@/db/schema';
import { eq, and, gte, lte, desc, asc } from 'drizzle-orm';

// Transaction validation functions
export function validateTransactionAmount(amount: number | string): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
}

export function validateTransactionType(type: string): type is 'income' | 'expense' | 'debt' | 'receivable' {
  return ['income', 'expense', 'debt', 'receivable'].includes(type);
}

export function validateTransactionStatus(status: string): status is 'active' | 'settled' | 'cancelled' {
  return ['active', 'settled', 'cancelled'].includes(status);
}

export function validateTransactionData(data: Partial<NewTransaction>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.amount || !validateTransactionAmount(data.amount)) {
    errors.push('Amount must be a positive number');
  }

  if (!data.type || !validateTransactionType(data.type)) {
    errors.push('Type must be one of: income, expense, debt, receivable');
  }

  if (!data.description || data.description.trim().length === 0) {
    errors.push('Description is required');
  }

  if (!data.transactionDate) {
    errors.push('Transaction date is required');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  if (data.status && !validateTransactionStatus(data.status)) {
    errors.push('Status must be one of: active, settled, cancelled');
  }

  // Validate debt/receivable specific fields
  if ((data.type === 'debt' || data.type === 'receivable') && !data.relatedParty) {
    errors.push('Related party is required for debts and receivables');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Transaction filtering types
export interface TransactionFilters {
  userId: string; // Changed from number to string for UUID
  type?: 'income' | 'expense' | 'debt' | 'receivable';
  status?: 'active' | 'settled' | 'cancelled';
  category?: string;
  startDate?: string;
  endDate?: string;
  relatedParty?: string;
}

export interface TransactionSortOptions {
  field: 'transactionDate' | 'amount' | 'createdAt';
  direction: 'asc' | 'desc';
}

// CRUD Operations
export class TransactionService {
  /**
   * Create a new transaction
   */
  static async create(data: NewTransaction): Promise<Transaction> {
    const validation = validateTransactionData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [transaction] = await db
      .insert(transactions)
      .values({
        ...data,
        status: data.status || 'active',
      })
      .returning();

    return transaction;
  }

  /**
   * Get transaction by ID
   */
  static async getById(id: number, userId: string): Promise<Transaction | null> {
    const [transaction] = await db
      .select()
      .from(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .limit(1);

    return transaction || null;
  }

  /**
   * Update transaction
   */
  static async update(
    id: number,
    userId: string,
    data: Partial<NewTransaction>
  ): Promise<Transaction | null> {
    // Validate the update data
    const validation = validateTransactionData({ ...data, userId });
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [transaction] = await db
      .update(transactions)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning();

    return transaction || null;
  }

  /**
   * Delete transaction
   */
  static async delete(id: number, userId: string): Promise<boolean> {
    const result = await db
      .delete(transactions)
      .where(and(eq(transactions.id, id), eq(transactions.userId, userId)))
      .returning({ id: transactions.id });

    return result.length > 0;
  }

  /**
   * Get transactions with filtering and sorting
   */
  static async getFiltered(
    filters: TransactionFilters,
    sort: TransactionSortOptions = { field: 'transactionDate', direction: 'desc' },
    limit: number = 50,
    offset: number = 0
  ): Promise<Transaction[]> {
    let query = db.select().from(transactions);

    // Build where conditions
    const conditions = [eq(transactions.userId, filters.userId)];

    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status));
    }

    if (filters.category) {
      conditions.push(eq(transactions.category, filters.category));
    }

    if (filters.startDate) {
      conditions.push(gte(transactions.transactionDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(transactions.transactionDate, filters.endDate));
    }

    if (filters.relatedParty) {
      conditions.push(eq(transactions.relatedParty, filters.relatedParty));
    }

    // Apply where conditions
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const sortField = transactions[sort.field];
    query = query.orderBy(sort.direction === 'desc' ? desc(sortField) : asc(sortField));

    // Apply pagination
    query = query.limit(limit).offset(offset);

    return await query;
  }

  /**
   * Get transactions by date range
   */
  static async getByDateRange(
    userId: string,
    startDate: string,
    endDate: string,
    type?: 'income' | 'expense' | 'debt' | 'receivable'
  ): Promise<Transaction[]> {
    return this.getFiltered({
      userId,
      type,
      startDate,
      endDate,
    });
  }

  /**
   * Get daily expenses for a specific date
   */
  static async getDailyExpenses(userId: string, date: string): Promise<Transaction[]> {
    return this.getFiltered({
      userId,
      type: 'expense',
      startDate: date,
      endDate: date,
    });
  }

  /**
   * Get monthly income for a specific month
   */
  static async getMonthlyIncome(userId: string, year: number, month: number): Promise<Transaction[]> {
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0]; // Last day of month

    return this.getFiltered({
      userId,
      type: 'income',
      startDate,
      endDate,
    });
  }

  /**
   * Get outstanding debts and receivables
   */
  static async getOutstanding(
    userId: string,
    type: 'debt' | 'receivable'
  ): Promise<Transaction[]> {
    return this.getFiltered({
      userId,
      type,
      status: 'active',
    });
  }

  /**
   * Mark debt or receivable as settled
   */
  static async markAsSettled(id: number, userId: string): Promise<Transaction | null> {
    return this.update(id, userId, { status: 'settled' });
  }

  /**
   * Get transaction summary for a user
   */
  static async getSummary(userId: string, startDate?: string, endDate?: string) {
    const filters: TransactionFilters = { userId };
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const allTransactions = await this.getFiltered(filters, { field: 'transactionDate', direction: 'desc' }, 1000);

    const summary = {
      totalIncome: 0,
      totalExpenses: 0,
      totalActiveDebts: 0,
      totalActiveReceivables: 0,
      transactionCount: allTransactions.length,
    };

    for (const transaction of allTransactions) {
      const amount = parseFloat(transaction.amount);

      switch (transaction.type) {
        case 'income':
          summary.totalIncome += amount;
          break;
        case 'expense':
          summary.totalExpenses += amount;
          break;
        case 'debt':
          if (transaction.status === 'active') {
            summary.totalActiveDebts += amount;
          }
          break;
        case 'receivable':
          if (transaction.status === 'active') {
            summary.totalActiveReceivables += amount;
          }
          break;
      }
    }

    return summary;
  }

  /**
   * Get transactions count for pagination
   */
  static async getCount(filters: TransactionFilters): Promise<number> {
    const conditions = [eq(transactions.userId, filters.userId)];

    if (filters.type) {
      conditions.push(eq(transactions.type, filters.type));
    }

    if (filters.status) {
      conditions.push(eq(transactions.status, filters.status));
    }

    if (filters.category) {
      conditions.push(eq(transactions.category, filters.category));
    }

    if (filters.startDate) {
      conditions.push(gte(transactions.transactionDate, filters.startDate));
    }

    if (filters.endDate) {
      conditions.push(lte(transactions.transactionDate, filters.endDate));
    }

    if (filters.relatedParty) {
      conditions.push(eq(transactions.relatedParty, filters.relatedParty));
    }

    const result = await db
      .select({ count: transactions.id })
      .from(transactions)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    return result.length;
  }
}

// Debt and Receivable Management Service
export class DebtReceivableService {
  /**
   * Create a new debt record
   */
  static async createDebt(data: {
    userId: string;
    amount: string;
    description: string;
    creditor: string;
    dueDate: string;
    transactionDate?: string;
  }): Promise<Transaction> {
    const debtData: NewTransaction = {
      userId: data.userId,
      type: 'debt',
      amount: data.amount,
      description: data.description,
      relatedParty: data.creditor,
      dueDate: data.dueDate,
      transactionDate: data.transactionDate || new Date().toISOString().split('T')[0],
      status: 'active',
      category: null,
    };

    return TransactionService.create(debtData);
  }

  /**
   * Create a new receivable record
   */
  static async createReceivable(data: {
    userId: string;
    amount: string;
    description: string;
    debtor: string;
    expectedDate: string;
    transactionDate?: string;
  }): Promise<Transaction> {
    const receivableData: NewTransaction = {
      userId: data.userId,
      type: 'receivable',
      amount: data.amount,
      description: data.description,
      relatedParty: data.debtor,
      dueDate: data.expectedDate,
      transactionDate: data.transactionDate || new Date().toISOString().split('T')[0],
      status: 'active',
      category: null,
    };

    return TransactionService.create(receivableData);
  }

  /**
   * Get all outstanding debts for a user
   */
  static async getOutstandingDebts(userId: string): Promise<Transaction[]> {
    return TransactionService.getFiltered({
      userId,
      type: 'debt',
      status: 'active',
    });
  }

  /**
   * Get all outstanding receivables for a user
   */
  static async getOutstandingReceivables(userId: string): Promise<Transaction[]> {
    return TransactionService.getFiltered({
      userId,
      type: 'receivable',
      status: 'active',
    });
  }

  /**
   * Get all debts (active and settled) for a user
   */
  static async getAllDebts(userId: string): Promise<Transaction[]> {
    return TransactionService.getFiltered({
      userId,
      type: 'debt',
    });
  }

  /**
   * Get all receivables (active and settled) for a user
   */
  static async getAllReceivables(userId: string): Promise<Transaction[]> {
    return TransactionService.getFiltered({
      userId,
      type: 'receivable',
    });
  }

  /**
   * Settle a debt (mark as paid)
   */
  static async settleDebt(id: number, userId: string): Promise<Transaction | null> {
    // First verify it's a debt
    const debt = await TransactionService.getById(id, userId);
    if (!debt || debt.type !== 'debt') {
      throw new Error('Transaction is not a debt or does not exist');
    }

    if (debt.status === 'settled') {
      throw new Error('Debt is already settled');
    }

    return TransactionService.update(id, userId, { status: 'settled' });
  }

  /**
   * Collect a receivable (mark as received)
   */
  static async collectReceivable(id: number, userId: string): Promise<Transaction | null> {
    // First verify it's a receivable
    const receivable = await TransactionService.getById(id, userId);
    if (!receivable || receivable.type !== 'receivable') {
      throw new Error('Transaction is not a receivable or does not exist');
    }

    if (receivable.status === 'settled') {
      throw new Error('Receivable is already collected');
    }

    return TransactionService.update(id, userId, { status: 'settled' });
  }

  /**
   * Get debt and receivable summary
   */
  static async getSummary(userId: string): Promise<{
    totalOutstandingDebts: number;
    totalOutstandingReceivables: number;
    totalSettledDebts: number;
    totalSettledReceivables: number;
    debtCount: number;
    receivableCount: number;
  }> {
    const allDebts = await this.getAllDebts(userId);
    const allReceivables = await this.getAllReceivables(userId);

    const summary = {
      totalOutstandingDebts: 0,
      totalOutstandingReceivables: 0,
      totalSettledDebts: 0,
      totalSettledReceivables: 0,
      debtCount: allDebts.length,
      receivableCount: allReceivables.length,
    };

    // Calculate debt totals
    for (const debt of allDebts) {
      const amount = parseFloat(debt.amount);
      if (debt.status === 'active') {
        summary.totalOutstandingDebts += amount;
      } else if (debt.status === 'settled') {
        summary.totalSettledDebts += amount;
      }
    }

    // Calculate receivable totals
    for (const receivable of allReceivables) {
      const amount = parseFloat(receivable.amount);
      if (receivable.status === 'active') {
        summary.totalOutstandingReceivables += amount;
      } else if (receivable.status === 'settled') {
        summary.totalSettledReceivables += amount;
      }
    }

    return summary;
  }

  /**
   * Get overdue debts and receivables
   */
  static async getOverdue(userId: string): Promise<{
    overdueDebts: Transaction[];
    overdueReceivables: Transaction[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const outstandingDebts = await this.getOutstandingDebts(userId);
    const outstandingReceivables = await this.getOutstandingReceivables(userId);

    const overdueDebts = outstandingDebts.filter(debt => 
      debt.dueDate && debt.dueDate < today
    );

    const overdueReceivables = outstandingReceivables.filter(receivable => 
      receivable.dueDate && receivable.dueDate < today
    );

    return {
      overdueDebts,
      overdueReceivables,
    };
  }
}