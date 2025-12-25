import { db } from './connection';
import { users, categories, transactions, investmentBalances } from './schema';
import { eq } from 'drizzle-orm';

// Database utility functions for common operations

/**
 * Test database connection
 */
export async function testConnection(): Promise<boolean> {
  try {
    await db.select().from(users).limit(1);
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] || null;
}

/**
 * Get user by ID
 */
export async function getUserById(id: number) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] || null;
}

/**
 * Create default categories for a new user
 */
export async function createDefaultCategories(userId: string) {
  const defaultCategories = [
    // Income categories
    { userId, name: 'Salary', type: 'income' as const, color: '#10B981' },
    { userId, name: 'Freelance', type: 'income' as const, color: '#3B82F6' },
    { userId, name: 'Investment', type: 'income' as const, color: '#8B5CF6' },
    { userId, name: 'Other Income', type: 'income' as const, color: '#6B7280' },
    
    // Expense categories
    { userId, name: 'Food & Dining', type: 'expense' as const, color: '#EF4444' },
    { userId, name: 'Transportation', type: 'expense' as const, color: '#F59E0B' },
    { userId, name: 'Shopping', type: 'expense' as const, color: '#EC4899' },
    { userId, name: 'Entertainment', type: 'expense' as const, color: '#8B5CF6' },
    { userId, name: 'Bills & Utilities', type: 'expense' as const, color: '#6B7280' },
    { userId, name: 'Healthcare', type: 'expense' as const, color: '#10B981' },
    { userId, name: 'Other Expenses', type: 'expense' as const, color: '#6B7280' },
  ];

  return await db.insert(categories).values(defaultCategories).returning();
}

/**
 * Health check function to verify all tables exist and are accessible
 */
export async function healthCheck() {
  try {
    // Test each table
    await db.select().from(users).limit(1);
    await db.select().from(categories).limit(1);
    await db.select().from(transactions).limit(1);
    await db.select().from(investmentBalances).limit(1);
    
    return {
      status: 'healthy',
      message: 'All database tables are accessible',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      message: `Database health check failed: ${error}`,
      timestamp: new Date().toISOString(),
    };
  }
}