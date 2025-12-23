import { pgTable, serial, varchar, text, timestamp, decimal, date, integer, check, boolean, foreignKey } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Categories table (Enhanced with hierarchical support)
export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  parentId: integer('parent_id'),
  color: varchar('color', { length: 7 }).default('#6B7280'),
  icon: varchar('icon', { length: 50 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  parentReference: foreignKey({
    columns: [table.parentId],
    foreignColumns: [table.id],
    name: "categories_parent_id_fkey"
  }).onDelete("cascade"),
  typeCheck: check('type_check', sql`${table.type} IN ('income', 'expense')`),
}));

// Transactions table (Enhanced with multi-currency and recurring support)
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  categoryId: integer('category_id').references(() => categories.id),
  transactionDate: date('transaction_date').notNull(),
  status: varchar('status', { length: 20 }).default('active'),
  relatedParty: varchar('related_party', { length: 255 }),
  dueDate: date('due_date'),
  recurringId: integer('recurring_id').references(() => recurringTransactions.id),
  tags: text('tags'), // JSON array of tags
  notes: text('notes'),
  attachments: text('attachments'), // JSON array of file paths
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  typeCheck: check('type_check', sql`${table.type} IN ('income', 'expense', 'debt', 'receivable', 'transfer')`),
  statusCheck: check('status_check', sql`${table.status} IN ('active', 'settled', 'cancelled', 'pending')`),
  amountCheck: check('amount_check', sql`${table.amount} > 0`),
}));

// Recurring transactions table
export const recurringTransactions = pgTable('recurring_transactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  description: text('description').notNull(),
  category: varchar('category', { length: 100 }),
  categoryId: integer('category_id').references(() => categories.id),
  frequency: varchar('frequency', { length: 20 }).notNull(), // daily, weekly, monthly, yearly
  intervalValue: integer('interval_value').default(1), // every X frequency
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  nextDueDate: date('next_due_date').notNull(),
  isActive: boolean('is_active').default(true),
  relatedParty: varchar('related_party', { length: 255 }),
  tags: text('tags'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  typeCheck: check('type_check', sql`${table.type} IN ('income', 'expense', 'debt', 'receivable')`),
  frequencyCheck: check('frequency_check', sql`${table.frequency} IN ('daily', 'weekly', 'monthly', 'yearly')`),
  amountCheck: check('amount_check', sql`${table.amount} > 0`),
}));

// Budgets table
export const budgets = pgTable('budgets', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }),
  categoryId: integer('category_id').references(() => categories.id),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  period: varchar('period', { length: 20 }).notNull(), // monthly, yearly, weekly
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  alertThreshold: decimal('alert_threshold', { precision: 5, scale: 2 }).default('80.00'), // percentage
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  periodCheck: check('period_check', sql`${table.period} IN ('weekly', 'monthly', 'yearly')`),
  amountCheck: check('amount_check', sql`${table.amount} > 0`),
  thresholdCheck: check('threshold_check', sql`${table.alertThreshold} >= 0 AND ${table.alertThreshold} <= 100`),
}));

// Financial goals table
export const financialGoals = pgTable('financial_goals', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  targetAmount: decimal('target_amount', { precision: 15, scale: 2 }).notNull(),
  currentAmount: decimal('current_amount', { precision: 15, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  targetDate: date('target_date'),
  category: varchar('category', { length: 50 }).notNull(), // emergency_fund, vacation, house, car, etc.
  priority: varchar('priority', { length: 20 }).default('medium'),
  isCompleted: boolean('is_completed').default(false),
  autoContribute: boolean('auto_contribute').default(false),
  monthlyContribution: decimal('monthly_contribution', { precision: 12, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  priorityCheck: check('priority_check', sql`${table.priority} IN ('low', 'medium', 'high')`),
  targetAmountCheck: check('target_amount_check', sql`${table.targetAmount} > 0`),
  currentAmountCheck: check('current_amount_check', sql`${table.currentAmount} >= 0`),
}));

// Savings accounts table
export const savingsAccounts = pgTable('savings_accounts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  accountType: varchar('account_type', { length: 50 }).notNull(), // savings, checking, emergency, goal-based
  balance: decimal('balance', { precision: 15, scale: 2 }).default('0.00'),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  interestRate: decimal('interest_rate', { precision: 5, scale: 4 }).default('0.0000'),
  goalId: integer('goal_id').references(() => financialGoals.id),
  isActive: boolean('is_active').default(true),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  balanceCheck: check('balance_check', sql`${table.balance} >= 0`),
  interestRateCheck: check('interest_rate_check', sql`${table.interestRate} >= 0`),
}));

// Investment balances table (Enhanced)
export const investmentBalances = pgTable('investment_balances', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  accountName: varchar('account_name', { length: 255 }).notNull(),
  balance: decimal('balance', { precision: 15, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  accountType: varchar('account_type', { length: 100 }).default('general'),
  broker: varchar('broker', { length: 255 }),
  assetClass: varchar('asset_class', { length: 100 }), // stocks, bonds, crypto, real_estate, etc.
  recordedAt: timestamp('recorded_at').defaultNow(),
  notes: text('notes'),
});

// Bill reminders table
export const billReminders = pgTable('bill_reminders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 3 }).default('IDR'),
  dueDate: date('due_date').notNull(),
  frequency: varchar('frequency', { length: 20 }).notNull(),
  category: varchar('category', { length: 100 }),
  payee: varchar('payee', { length: 255 }).notNull(),
  reminderDays: integer('reminder_days').default(3), // days before due date
  isActive: boolean('is_active').default(true),
  isPaid: boolean('is_paid').default(false),
  lastPaidDate: date('last_paid_date'),
  nextDueDate: date('next_due_date').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  frequencyCheck: check('frequency_check', sql`${table.frequency} IN ('monthly', 'quarterly', 'yearly', 'weekly')`),
  amountCheck: check('amount_check', sql`${table.amount} > 0`),
  reminderDaysCheck: check('reminder_days_check', sql`${table.reminderDays} >= 0`),
}));

// Notifications table
export const notifications = pgTable('notifications', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // budget_alert, bill_reminder, goal_milestone, etc.
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false),
  priority: varchar('priority', { length: 20 }).default('medium'),
  relatedId: integer('related_id'), // ID of related entity (budget, bill, goal, etc.)
  relatedType: varchar('related_type', { length: 50 }), // budget, bill, goal, etc.
  scheduledFor: timestamp('scheduled_for'),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  priorityCheck: check('priority_check', sql`${table.priority} IN ('low', 'medium', 'high')`),
}));

// Cash flow projections table
export const cashFlowProjections = pgTable('cash_flow_projections', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  projectionDate: date('projection_date').notNull(),
  projectedIncome: decimal('projected_income', { precision: 15, scale: 2 }).default('0.00'),
  projectedExpenses: decimal('projected_expenses', { precision: 15, scale: 2 }).default('0.00'),
  projectedBalance: decimal('projected_balance', { precision: 15, scale: 2 }).default('0.00'),
  actualIncome: decimal('actual_income', { precision: 15, scale: 2 }),
  actualExpenses: decimal('actual_expenses', { precision: 15, scale: 2 }),
  actualBalance: decimal('actual_balance', { precision: 15, scale: 2 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Type exports for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type NewRecurringTransaction = typeof recurringTransactions.$inferInsert;

export type Budget = typeof budgets.$inferSelect;
export type NewBudget = typeof budgets.$inferInsert;

export type FinancialGoal = typeof financialGoals.$inferSelect;
export type NewFinancialGoal = typeof financialGoals.$inferInsert;

export type SavingsAccount = typeof savingsAccounts.$inferSelect;
export type NewSavingsAccount = typeof savingsAccounts.$inferInsert;

export type InvestmentBalance = typeof investmentBalances.$inferSelect;
export type NewInvestmentBalance = typeof investmentBalances.$inferInsert;

export type BillReminder = typeof billReminders.$inferSelect;
export type NewBillReminder = typeof billReminders.$inferInsert;

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export type CashFlowProjection = typeof cashFlowProjections.$inferSelect;
export type NewCashFlowProjection = typeof cashFlowProjections.$inferInsert;
