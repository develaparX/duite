import { db } from '@/db';
import { billReminders, notifications, type BillReminder, type NewBillReminder, type NewNotification } from '@/db/schema';
import { eq, and, gte, lte, desc, asc, sql } from 'drizzle-orm';

/**
 * Bill reminder validation functions
 */
export function validateBillAmount(amount: number | string): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
}

export function validateBillFrequency(frequency: string): frequency is 'weekly' | 'monthly' | 'quarterly' | 'yearly' {
  return ['weekly', 'monthly', 'quarterly', 'yearly'].includes(frequency);
}

export function validateBillReminderData(data: Partial<NewBillReminder>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Bill name is required');
  }

  if (!data.amount || !validateBillAmount(data.amount)) {
    errors.push('Bill amount must be a positive number');
  }

  if (!data.frequency || !validateBillFrequency(data.frequency)) {
    errors.push('Frequency must be one of: weekly, monthly, quarterly, yearly');
  }

  if (!data.payee || data.payee.trim().length === 0) {
    errors.push('Payee is required');
  }

  if (!data.dueDate) {
    errors.push('Due date is required');
  }

  if (!data.nextDueDate) {
    errors.push('Next due date is required');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  if (data.reminderDays !== undefined && data.reminderDays < 0) {
    errors.push('Reminder days cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Bill reminder filtering and sorting types
 */
export interface BillReminderFilters {
  userId: string;
  frequency?: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  category?: string;
  payee?: string;
  isActive?: boolean;
  isPaid?: boolean;
  dueSoon?: boolean; // Due in next 7 days
  overdue?: boolean;
}

export interface BillReminderSortOptions {
  field: 'nextDueDate' | 'amount' | 'name' | 'createdAt';
  direction: 'asc' | 'desc';
}

/**
 * Bill reminder status and analysis types
 */
export interface BillReminderStatus {
  billReminder: BillReminder;
  daysUntilDue: number;
  isOverdue: boolean;
  shouldRemind: boolean;
  nextOccurrence: Date;
  estimatedMonthlyAmount: number;
}

export interface BillReminderSummary {
  totalBills: number;
  activeBills: number;
  paidBills: number;
  overdueBills: number;
  dueSoonBills: number;
  totalMonthlyAmount: number;
  totalYearlyAmount: number;
  averageBillAmount: number;
}

/**
 * Date calculation utilities for bills
 */
export class BillDateCalculator {
  static addFrequency(date: Date, frequency: string): Date {
    const newDate = new Date(date);
    
    switch (frequency) {
      case 'weekly':
        newDate.setDate(newDate.getDate() + 7);
        break;
      case 'monthly':
        newDate.setMonth(newDate.getMonth() + 1);
        break;
      case 'quarterly':
        newDate.setMonth(newDate.getMonth() + 3);
        break;
      case 'yearly':
        newDate.setFullYear(newDate.getFullYear() + 1);
        break;
      default:
        throw new Error(`Invalid frequency: ${frequency}`);
    }
    
    return newDate;
  }

  static calculateNextDueDate(lastDueDate: Date, frequency: string): Date {
    return this.addFrequency(lastDueDate, frequency);
  }

  static getDaysBetween(date1: Date, date2: Date): number {
    const diffTime = date2.getTime() - date1.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  static getMonthlyEquivalent(amount: number, frequency: string): number {
    switch (frequency) {
      case 'weekly':
        return amount * 4.33; // Average weeks per month
      case 'monthly':
        return amount;
      case 'quarterly':
        return amount / 3;
      case 'yearly':
        return amount / 12;
      default:
        return 0;
    }
  }
}

/**
 * Bill Reminder Service
 */
export class BillReminderService {
  /**
   * Create a new bill reminder
   */
  static async create(data: NewBillReminder): Promise<BillReminder> {
    const validation = validateBillReminderData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [billReminder] = await db
      .insert(billReminders)
      .values({
        ...data,
        isActive: data.isActive ?? true,
        isPaid: data.isPaid ?? false,
        reminderDays: data.reminderDays ?? 3,
      })
      .returning();

    return billReminder;
  }

  /**
   * Get bill reminder by ID
   */
  static async getById(id: number, userId: string): Promise<BillReminder | null> {
    const [billReminder] = await db
      .select()
      .from(billReminders)
      .where(and(eq(billReminders.id, id), eq(billReminders.userId, userId)))
      .limit(1);

    return billReminder || null;
  }

  /**
   * Update bill reminder
   */
  static async update(id: number, userId: string, data: Partial<NewBillReminder>): Promise<BillReminder> {
    const validation = validateBillReminderData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [billReminder] = await db
      .update(billReminders)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(billReminders.id, id), eq(billReminders.userId, userId)))
      .returning();

    if (!billReminder) {
      throw new Error('Bill reminder not found');
    }

    return billReminder;
  }

  /**
   * Delete bill reminder
   */
  static async delete(id: number, userId: string): Promise<void> {
    const result = await db
      .delete(billReminders)
      .where(and(eq(billReminders.id, id), eq(billReminders.userId, userId)));

    if (result.rowCount === 0) {
      throw new Error('Bill reminder not found');
    }
  }

  /**
   * Mark bill as paid
   */
  static async markAsPaid(id: number, userId: string, paidDate?: string): Promise<BillReminder> {
    const billReminder = await this.getById(id, userId);
    if (!billReminder) {
      throw new Error('Bill reminder not found');
    }

    const today = paidDate || new Date().toISOString().split('T')[0];
    const nextDueDate = BillDateCalculator.calculateNextDueDate(
      new Date(billReminder.nextDueDate),
      billReminder.frequency
    );

    return await this.update(id, userId, {
      isPaid: true,
      lastPaidDate: today,
      nextDueDate: nextDueDate.toISOString().split('T')[0],
    });
  }

  /**
   * Mark bill as unpaid (undo payment)
   */
  static async markAsUnpaid(id: number, userId: string): Promise<BillReminder> {
    return await this.update(id, userId, {
      isPaid: false,
      lastPaidDate: null,
    });
  }

  /**
   * Get filtered bill reminders with pagination
   */
  static async getFiltered(
    filters: BillReminderFilters,
    sortOptions: BillReminderSortOptions = { field: 'nextDueDate', direction: 'asc' },
    limit: number = 50,
    offset: number = 0
  ): Promise<BillReminder[]> {
    let query = db.select().from(billReminders).where(eq(billReminders.userId, filters.userId));

    // Apply filters
    if (filters.frequency) {
      query = query.where(eq(billReminders.frequency, filters.frequency));
    }

    if (filters.category) {
      query = query.where(eq(billReminders.category, filters.category));
    }

    if (filters.payee) {
      query = query.where(eq(billReminders.payee, filters.payee));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(billReminders.isActive, filters.isActive));
    }

    if (filters.isPaid !== undefined) {
      query = query.where(eq(billReminders.isPaid, filters.isPaid));
    }

    if (filters.dueSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query = query.where(lte(billReminders.nextDueDate, sevenDaysFromNow.toISOString().split('T')[0]));
    }

    if (filters.overdue) {
      const today = new Date().toISOString().split('T')[0];
      query = query.where(and(
        lte(billReminders.nextDueDate, today),
        eq(billReminders.isPaid, false)
      ));
    }

    // Apply sorting
    const sortField = billReminders[sortOptions.field];
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
   * Get count of filtered bill reminders
   */
  static async getCount(filters: BillReminderFilters): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(billReminders)
      .where(eq(billReminders.userId, filters.userId));

    // Apply same filters as getFiltered
    if (filters.frequency) {
      query = query.where(eq(billReminders.frequency, filters.frequency));
    }

    if (filters.category) {
      query = query.where(eq(billReminders.category, filters.category));
    }

    if (filters.payee) {
      query = query.where(eq(billReminders.payee, filters.payee));
    }

    if (filters.isActive !== undefined) {
      query = query.where(eq(billReminders.isActive, filters.isActive));
    }

    if (filters.isPaid !== undefined) {
      query = query.where(eq(billReminders.isPaid, filters.isPaid));
    }

    if (filters.dueSoon) {
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      query = query.where(lte(billReminders.nextDueDate, sevenDaysFromNow.toISOString().split('T')[0]));
    }

    if (filters.overdue) {
      const today = new Date().toISOString().split('T')[0];
      query = query.where(and(
        lte(billReminders.nextDueDate, today),
        eq(billReminders.isPaid, false)
      ));
    }

    const [result] = await query;
    return result.count;
  }

  /**
   * Get bill reminder status with analysis
   */
  static async getBillStatus(billId: number, userId: string): Promise<BillReminderStatus | null> {
    const billReminder = await this.getById(billId, userId);
    if (!billReminder) {
      return null;
    }

    const today = new Date();
    const nextDueDate = new Date(billReminder.nextDueDate);
    const daysUntilDue = BillDateCalculator.getDaysBetween(today, nextDueDate);
    const isOverdue = daysUntilDue < 0 && !billReminder.isPaid;
    const shouldRemind = daysUntilDue <= billReminder.reminderDays && daysUntilDue >= 0 && !billReminder.isPaid;
    const estimatedMonthlyAmount = BillDateCalculator.getMonthlyEquivalent(
      Number(billReminder.amount),
      billReminder.frequency
    );

    return {
      billReminder,
      daysUntilDue,
      isOverdue,
      shouldRemind,
      nextOccurrence: nextDueDate,
      estimatedMonthlyAmount,
    };
  }

  /**
   * Get bills due soon (within reminder period)
   */
  static async getBillsDueSoon(userId: string): Promise<BillReminderStatus[]> {
    const dueSoonBills = await this.getFiltered({ 
      userId, 
      isActive: true, 
      isPaid: false, 
      dueSoon: true 
    });

    const statusList: BillReminderStatus[] = [];
    for (const bill of dueSoonBills) {
      const status = await this.getBillStatus(bill.id, userId);
      if (status && status.shouldRemind) {
        statusList.push(status);
      }
    }

    return statusList;
  }

  /**
   * Get overdue bills
   */
  static async getOverdueBills(userId: string): Promise<BillReminderStatus[]> {
    const overdueBills = await this.getFiltered({ 
      userId, 
      isActive: true, 
      overdue: true 
    });

    const statusList: BillReminderStatus[] = [];
    for (const bill of overdueBills) {
      const status = await this.getBillStatus(bill.id, userId);
      if (status && status.isOverdue) {
        statusList.push(status);
      }
    }

    return statusList;
  }

  /**
   * Get bill reminders summary
   */
  static async getBillSummary(userId: string): Promise<BillReminderSummary> {
    const allBills = await db
      .select()
      .from(billReminders)
      .where(eq(billReminders.userId, userId));

    const activeBills = allBills.filter(b => b.isActive);
    const paidBills = allBills.filter(b => b.isPaid);

    let totalMonthlyAmount = 0;
    let overdueBills = 0;
    let dueSoonBills = 0;

    const today = new Date();
    const sevenDaysFromNow = new Date(today);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    for (const bill of activeBills) {
      // Calculate monthly equivalent
      const monthlyAmount = BillDateCalculator.getMonthlyEquivalent(
        Number(bill.amount),
        bill.frequency
      );
      totalMonthlyAmount += monthlyAmount;

      // Check if overdue
      const dueDate = new Date(bill.nextDueDate);
      if (dueDate < today && !bill.isPaid) {
        overdueBills++;
      }

      // Check if due soon
      if (dueDate <= sevenDaysFromNow && dueDate >= today && !bill.isPaid) {
        dueSoonBills++;
      }
    }

    const totalYearlyAmount = totalMonthlyAmount * 12;
    const averageBillAmount = activeBills.length > 0 ? totalMonthlyAmount / activeBills.length : 0;

    return {
      totalBills: allBills.length,
      activeBills: activeBills.length,
      paidBills: paidBills.length,
      overdueBills,
      dueSoonBills,
      totalMonthlyAmount,
      totalYearlyAmount,
      averageBillAmount,
    };
  }

  /**
   * Create notifications for due bills
   */
  static async createBillNotifications(userId: string): Promise<{ created: number; errors: string[] }> {
    const dueSoonBills = await this.getBillsDueSoon(userId);
    const overdueBills = await this.getOverdueBills(userId);
    
    let created = 0;
    const errors: string[] = [];

    // Create notifications for bills due soon
    for (const { billReminder, daysUntilDue } of dueSoonBills) {
      try {
        const notificationData: NewNotification = {
          userId,
          type: 'bill_reminder',
          title: `Bill Due ${daysUntilDue === 0 ? 'Today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`}`,
          message: `${billReminder.name} payment of $${billReminder.amount} is due ${daysUntilDue === 0 ? 'today' : `in ${daysUntilDue} day${daysUntilDue > 1 ? 's' : ''}`} to ${billReminder.payee}`,
          priority: daysUntilDue <= 1 ? 'high' : 'medium',
          relatedId: billReminder.id,
          relatedType: 'bill_reminder',
          isRead: false,
        };

        await db.insert(notifications).values(notificationData);
        created++;
      } catch (error) {
        errors.push(`Failed to create notification for bill ${billReminder.id}: ${error}`);
      }
    }

    // Create notifications for overdue bills
    for (const { billReminder, daysUntilDue } of overdueBills) {
      try {
        const daysPastDue = Math.abs(daysUntilDue);
        const notificationData: NewNotification = {
          userId,
          type: 'bill_overdue',
          title: `Overdue Bill - ${billReminder.name}`,
          message: `${billReminder.name} payment of $${billReminder.amount} is ${daysPastDue} day${daysPastDue > 1 ? 's' : ''} overdue. Please pay ${billReminder.payee} as soon as possible.`,
          priority: 'high',
          relatedId: billReminder.id,
          relatedType: 'bill_reminder',
          isRead: false,
        };

        await db.insert(notifications).values(notificationData);
        created++;
      } catch (error) {
        errors.push(`Failed to create overdue notification for bill ${billReminder.id}: ${error}`);
      }
    }

    return { created, errors };
  }

  /**
   * Get upcoming bills (next 30 days)
   */
  static async getUpcomingBills(userId: string, days: number = 30): Promise<BillReminderStatus[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const upcomingBills = await db
      .select()
      .from(billReminders)
      .where(
        and(
          eq(billReminders.userId, userId),
          eq(billReminders.isActive, true),
          lte(billReminders.nextDueDate, futureDate.toISOString().split('T')[0])
        )
      )
      .orderBy(asc(billReminders.nextDueDate));

    const statusList: BillReminderStatus[] = [];
    for (const bill of upcomingBills) {
      const status = await this.getBillStatus(bill.id, userId);
      if (status) {
        statusList.push(status);
      }
    }

    return statusList;
  }

  /**
   * Toggle bill active status
   */
  static async toggleActive(id: number, userId: string): Promise<BillReminder> {
    const billReminder = await this.getById(id, userId);
    if (!billReminder) {
      throw new Error('Bill reminder not found');
    }

    return await this.update(id, userId, {
      isActive: !billReminder.isActive,
    });
  }
}