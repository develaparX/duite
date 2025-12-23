import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Target, 
  Calendar, 
  DollarSign,
  Plus,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface GoalProgress {
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

interface GoalSummary {
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

interface FinancialGoalsWidgetProps {
  onCreateGoal?: () => void;
  onViewAll?: () => void;
}

export function FinancialGoalsWidget({ onCreateGoal, onViewAll }: FinancialGoalsWidgetProps) {
  const { token } = useAuth();
  const [goals, setGoals] = useState<GoalProgress[]>([]);
  const [summary, setSummary] = useState<GoalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!token) {
        throw new Error('No authentication token available');
      }

      const response = await fetch('/api/financial-goals?isCompleted=false&limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch financial goals');
      }

      const data = await response.json();
      
      // Get progress for each goal
      const goalProgresses: GoalProgress[] = [];
      for (const goal of data.goals) {
        const progressResponse = await fetch(`/api/financial-goals/${goal.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (progressResponse.ok) {
          const progressData = await progressResponse.json();
          if (progressData.progress) {
            goalProgresses.push(progressData.progress);
          }
        }
      }

      setGoals(goalProgresses);
      setSummary(data.summary);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount);
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };



  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Financial Goals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-muted-foreground">{error}</p>
            <Button variant="outline" onClick={fetchGoals} className="mt-2">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Financial Goals
            </CardTitle>
            <CardDescription>
              {summary ? `${summary.activeGoals} active goals, ${summary.completedGoals} completed` : 'Track your financial objectives'}
            </CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={onCreateGoal} size="sm" variant="outline" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
            {goals.length > 0 && (
              <Button onClick={onViewAll} size="sm" className="w-full sm:w-auto">
                View All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Progress</p>
              <p className="text-xl sm:text-2xl font-bold">{summary.averageProgress.toFixed(1)}%</p>
            </div>
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <p className="text-sm text-muted-foreground">Total Saved</p>
              <p className="text-xl sm:text-2xl font-bold break-words">{formatCurrency(summary.totalCurrentAmount)}</p>
            </div>
          </div>
        )}

        {goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">No active financial goals</p>
            <Button onClick={onCreateGoal} variant="outline" className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Goal
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => (
              <div key={goal.goalId} className="border rounded-lg p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-2 gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="font-medium break-words">{goal.goalName}</h4>
                    <Badge className={getPriorityColor(goal.priority)}>
                      {goal.priority}
                    </Badge>
                    {goal.autoContribute && (
                      <Badge variant="outline">Auto</Badge>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    {goal.onTrack ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-yellow-600" />
                    )}
                    <span className="text-sm font-medium">
                      {goal.progressPercentage.toFixed(1)}%
                    </span>
                  </div>
                </div>

                <Progress 
                  value={goal.progressPercentage} 
                  className="mb-3"
                />

                <div className="flex flex-col sm:flex-row justify-between text-sm text-muted-foreground mb-2 gap-1">
                  <span>{formatCurrency(goal.currentAmount)} saved</span>
                  <span>{formatCurrency(goal.targetAmount)} target</span>
                </div>

                <div className="flex flex-col sm:flex-row justify-between text-sm gap-1">
                  <div className="flex items-center">
                    <DollarSign className="h-3 w-3 mr-1" />
                    <span>{formatCurrency(goal.remainingAmount)} remaining</span>
                  </div>
                  {goal.targetDate && goal.daysRemaining && (
                    <div className="flex items-center">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>{goal.daysRemaining} days left</span>
                    </div>
                  )}
                </div>

                {goal.requiredMonthlySavings && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    Required monthly: {formatCurrency(goal.requiredMonthlySavings)}
                    {goal.currentMonthlySavings && (
                      <span className={goal.onTrack ? 'text-green-600' : 'text-yellow-600'}>
                        {' '}(Current: {formatCurrency(goal.currentMonthlySavings)})
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}