import { db } from '@/db';
import { financialGoals, savingsAccounts, type FinancialGoal, type NewFinancialGoal } from '@/db/schema';
import { eq, and, desc, asc, sql, sum } from 'drizzle-orm';

/**
 * Financial goal validation functions
 */
export function validateGoalAmount(amount: number | string): boolean {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  return !isNaN(numAmount) && numAmount > 0;
}

export function validateGoalPriority(priority: string): priority is 'low' | 'medium' | 'high' {
  return ['low', 'medium', 'high'].includes(priority);
}

export function validateGoalData(data: Partial<NewFinancialGoal>): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Goal name is required');
  }

  if (!data.targetAmount || !validateGoalAmount(data.targetAmount)) {
    errors.push('Target amount must be a positive number');
  }

  if (data.currentAmount !== undefined && data.currentAmount < 0) {
    errors.push('Current amount cannot be negative');
  }

  if (!data.category || data.category.trim().length === 0) {
    errors.push('Goal category is required');
  }

  if (!data.userId) {
    errors.push('User ID is required');
  }

  if (data.priority && !validateGoalPriority(data.priority)) {
    errors.push('Priority must be one of: low, medium, high');
  }

  if (data.monthlyContribution !== undefined && data.monthlyContribution < 0) {
    errors.push('Monthly contribution cannot be negative');
  }

  if (data.targetDate && new Date(data.targetDate) <= new Date()) {
    errors.push('Target date must be in the future');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Financial goal filtering and sorting types
 */
export interface FinancialGoalFilters {
  userId: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  isCompleted?: boolean;
  autoContribute?: boolean;
}

export interface FinancialGoalSortOptions {
  field: 'name' | 'targetAmount' | 'targetDate' | 'priority' | 'createdAt';
  direction: 'asc' | 'desc';
}

/**
 * Financial goal progress and analysis types
 */
export interface GoalProgress {
  goalId: number;
  goalName: string;
  targetAmount: number;
  currentAmount: number;
  remainingAmount: number;
  progressPercentage: number;
  isCompleted: boolean;
  targetDate?: Date;
  daysRemaining?: number;
  monthsRemaining?: number;
  requiredMonthlySavings?: number;
  currentMonthlySavings?: number;
  onTrack: boolean;
  category: string;
  priority: string;
  autoContribute: boolean;
}

export interface GoalSummary {
  totalGoals: number;
  completedGoals: number;
  activeGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  totalRemainingAmount: number;
  averageProgress: number;
  goalsOnTrack: number;
  goalsOffTrack: number;
  totalMonthlyContributions: number;
}

export interface GoalRecommendation {
  goalId: number;
  goalName: string;
  recommendation: string;
  suggestedAction: string;
  priority: 'low' | 'medium' | 'high';
  impact: string;
}

/**
 * Financial Goal Service
 */
export class FinancialGoalService {
  /**
   * Create a new financial goal
   */
  static async create(data: NewFinancialGoal): Promise<FinancialGoal> {
    const validation = validateGoalData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    const [goal] = await db
      .insert(financialGoals)
      .values({
        ...data,
        currentAmount: data.currentAmount ?? 0,
        priority: data.priority ?? 'medium',
        isCompleted: false,
        autoContribute: data.autoContribute ?? false,
      })
      .returning();

    return goal;
  }

  /**
   * Get financial goal by ID
   */
  static async getById(id: number, userId: string): Promise<FinancialGoal | null> {
    const [goal] = await db
      .select()
      .from(financialGoals)
      .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)))
      .limit(1);

    return goal || null;
  }

  /**
   * Update financial goal
   */
  static async update(id: number, userId: string, data: Partial<NewFinancialGoal>): Promise<FinancialGoal> {
    const validation = validateGoalData(data);
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    // Check if goal should be marked as completed
    if (data.currentAmount !== undefined && data.targetAmount !== undefined) {
      if (Number(data.currentAmount) >= Number(data.targetAmount)) {
        data.isCompleted = true;
      }
    }

    const [goal] = await db
      .update(financialGoals)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)))
      .returning();

    if (!goal) {
      throw new Error('Financial goal not found');
    }

    return goal;
  }

  /**
   * Delete financial goal
   */
  static async delete(id: number, userId: string): Promise<void> {
    const result = await db
      .delete(financialGoals)
      .where(and(eq(financialGoals.id, id), eq(financialGoals.userId, userId)));

    if (result.rowCount === 0) {
      throw new Error('Financial goal not found');
    }
  }

  /**
   * Add contribution to goal
   */
  static async addContribution(id: number, userId: string, amount: number): Promise<FinancialGoal> {
    if (amount <= 0) {
      throw new Error('Contribution amount must be positive');
    }

    const goal = await this.getById(id, userId);
    if (!goal) {
      throw new Error('Financial goal not found');
    }

    const newCurrentAmount = Number(goal.currentAmount) + amount;
    const isCompleted = newCurrentAmount >= Number(goal.targetAmount);

    return await this.update(id, userId, {
      currentAmount: newCurrentAmount,
      isCompleted,
    });
  }

  /**
   * Get filtered financial goals with pagination
   */
  static async getFiltered(
    filters: FinancialGoalFilters,
    sortOptions: FinancialGoalSortOptions = { field: 'createdAt', direction: 'desc' },
    limit: number = 50,
    offset: number = 0
  ): Promise<FinancialGoal[]> {
    let query = db.select().from(financialGoals).where(eq(financialGoals.userId, filters.userId));

    // Apply filters
    if (filters.category) {
      query = query.where(eq(financialGoals.category, filters.category));
    }

    if (filters.priority) {
      query = query.where(eq(financialGoals.priority, filters.priority));
    }

    if (filters.isCompleted !== undefined) {
      query = query.where(eq(financialGoals.isCompleted, filters.isCompleted));
    }

    if (filters.autoContribute !== undefined) {
      query = query.where(eq(financialGoals.autoContribute, filters.autoContribute));
    }

    // Apply sorting
    const sortField = financialGoals[sortOptions.field];
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
   * Get count of filtered financial goals
   */
  static async getCount(filters: FinancialGoalFilters): Promise<number> {
    let query = db.select({ count: sql<number>`count(*)` }).from(financialGoals)
      .where(eq(financialGoals.userId, filters.userId));

    // Apply same filters as getFiltered
    if (filters.category) {
      query = query.where(eq(financialGoals.category, filters.category));
    }

    if (filters.priority) {
      query = query.where(eq(financialGoals.priority, filters.priority));
    }

    if (filters.isCompleted !== undefined) {
      query = query.where(eq(financialGoals.isCompleted, filters.isCompleted));
    }

    if (filters.autoContribute !== undefined) {
      query = query.where(eq(financialGoals.autoContribute, filters.autoContribute));
    }

    const [result] = await query;
    return result.count;
  }

  /**
   * Get goal progress analysis
   */
  static async getGoalProgress(goalId: number, userId: string): Promise<GoalProgress | null> {
    const goal = await this.getById(goalId, userId);
    if (!goal) {
      return null;
    }

    const targetAmount = Number(goal.targetAmount);
    const currentAmount = Number(goal.currentAmount);
    const remainingAmount = Math.max(0, targetAmount - currentAmount);
    const progressPercentage = targetAmount > 0 ? (currentAmount / targetAmount) * 100 : 0;

    let daysRemaining: number | undefined;
    let monthsRemaining: number | undefined;
    let requiredMonthlySavings: number | undefined;
    let onTrack = true;

    if (goal.targetDate) {
      const today = new Date();
      const targetDate = new Date(goal.targetDate);
      daysRemaining = Math.max(0, Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
      monthsRemaining = Math.max(0, daysRemaining / 30.44); // Average days per month

      if (monthsRemaining > 0 && remainingAmount > 0) {
        requiredMonthlySavings = remainingAmount / monthsRemaining;
        
        // Check if on track
        if (goal.monthlyContribution) {
          const currentMonthlySavings = Number(goal.monthlyContribution);
          onTrack = currentMonthlySavings >= requiredMonthlySavings;
        } else {
          onTrack = false; // No monthly contribution set
        }
      }
    }

    return {
      goalId: goal.id,
      goalName: goal.name,
      targetAmount,
      currentAmount,
      remainingAmount,
      progressPercentage,
      isCompleted: goal.isCompleted,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
      daysRemaining,
      monthsRemaining,
      requiredMonthlySavings,
      currentMonthlySavings: goal.monthlyContribution ? Number(goal.monthlyContribution) : undefined,
      onTrack,
      category: goal.category,
      priority: goal.priority,
      autoContribute: goal.autoContribute,
    };
  }

  /**
   * Get goals summary for user
   */
  static async getGoalsSummary(userId: string): Promise<GoalSummary> {
    const allGoals = await db
      .select()
      .from(financialGoals)
      .where(eq(financialGoals.userId, userId));

    const completedGoals = allGoals.filter(g => g.isCompleted);
    const activeGoals = allGoals.filter(g => !g.isCompleted);

    const totalTargetAmount = allGoals.reduce((sum, g) => sum + Number(g.targetAmount), 0);
    const totalCurrentAmount = allGoals.reduce((sum, g) => sum + Number(g.currentAmount), 0);
    const totalRemainingAmount = Math.max(0, totalTargetAmount - totalCurrentAmount);
    const averageProgress = allGoals.length > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;

    let goalsOnTrack = 0;
    let goalsOffTrack = 0;
    let totalMonthlyContributions = 0;

    for (const goal of activeGoals) {
      const progress = await this.getGoalProgress(goal.id, userId);
      if (progress) {
        if (progress.onTrack) {
          goalsOnTrack++;
        } else {
          goalsOffTrack++;
        }
      }

      if (goal.monthlyContribution) {
        totalMonthlyContributions += Number(goal.monthlyContribution);
      }
    }

    return {
      totalGoals: allGoals.length,
      completedGoals: completedGoals.length,
      activeGoals: activeGoals.length,
      totalTargetAmount,
      totalCurrentAmount,
      totalRemainingAmount,
      averageProgress,
      goalsOnTrack,
      goalsOffTrack,
      totalMonthlyContributions,
    };
  }

  /**
   * Get goal recommendations
   */
  static async getGoalRecommendations(userId: string): Promise<GoalRecommendation[]> {
    const activeGoals = await this.getFiltered({ userId, isCompleted: false });
    const recommendations: GoalRecommendation[] = [];

    for (const goal of activeGoals) {
      const progress = await this.getGoalProgress(goal.id, userId);
      if (!progress) continue;

      // Recommendation for goals with no monthly contribution
      if (!goal.monthlyContribution && progress.targetDate) {
        recommendations.push({
          goalId: goal.id,
          goalName: goal.name,
          recommendation: 'Set up automatic monthly contributions',
          suggestedAction: `Set monthly contribution to $${progress.requiredMonthlySavings?.toFixed(2) || '0'} to reach your goal on time`,
          priority: 'high',
          impact: 'Helps ensure you reach your goal by the target date',
        });
      }

      // Recommendation for goals off track
      if (!progress.onTrack && progress.requiredMonthlySavings && progress.currentMonthlySavings) {
        const shortfall = progress.requiredMonthlySavings - progress.currentMonthlySavings;
        recommendations.push({
          goalId: goal.id,
          goalName: goal.name,
          recommendation: 'Increase monthly contributions',
          suggestedAction: `Increase monthly contribution by $${shortfall.toFixed(2)} to stay on track`,
          priority: 'medium',
          impact: 'Keeps you on track to reach your goal by the target date',
        });
      }

      // Recommendation for goals without target date
      if (!goal.targetDate) {
        recommendations.push({
          goalId: goal.id,
          goalName: goal.name,
          recommendation: 'Set a target date',
          suggestedAction: 'Add a target date to help track progress and plan contributions',
          priority: 'low',
          impact: 'Improves goal planning and motivation',
        });
      }

      // Recommendation for goals close to completion
      if (progress.progressPercentage >= 90 && !progress.isCompleted) {
        recommendations.push({
          goalId: goal.id,
          goalName: goal.name,
          recommendation: 'Final push to completion',
          suggestedAction: `Only $${progress.remainingAmount.toFixed(2)} left to reach your goal!`,
          priority: 'high',
          impact: 'Complete your goal and celebrate your achievement',
        });
      }
    }

    return recommendations;
  }

  /**
   * Process automatic contributions
   */
  static async processAutoContributions(userId: string): Promise<{ processed: number; errors: string[] }> {
    const autoContributeGoals = await this.getFiltered({ 
      userId, 
      isCompleted: false, 
      autoContribute: true 
    });

    let processed = 0;
    const errors: string[] = [];

    for (const goal of autoContributeGoals) {
      if (!goal.monthlyContribution) {
        continue;
      }

      try {
        await this.addContribution(goal.id, userId, Number(goal.monthlyContribution));
        processed++;
      } catch (error) {
        errors.push(`Failed to process auto-contribution for goal ${goal.id}: ${error}`);
      }
    }

    return { processed, errors };
  }

  /**
   * Get goals by category
   */
  static async getByCategory(userId: string, category: string): Promise<FinancialGoal[]> {
    return await db
      .select()
      .from(financialGoals)
      .where(and(eq(financialGoals.userId, userId), eq(financialGoals.category, category)))
      .orderBy(desc(financialGoals.createdAt));
  }

  /**
   * Get high priority goals
   */
  static async getHighPriorityGoals(userId: string): Promise<GoalProgress[]> {
    const highPriorityGoals = await this.getFiltered({ 
      userId, 
      priority: 'high', 
      isCompleted: false 
    });

    const progressList: GoalProgress[] = [];
    for (const goal of highPriorityGoals) {
      const progress = await this.getGoalProgress(goal.id, userId);
      if (progress) {
        progressList.push(progress);
      }
    }

    return progressList;
  }
}