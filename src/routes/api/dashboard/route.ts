import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { TransactionService } from '@/lib/transactions';
import { DebtReceivableService } from '@/lib/transactions';
import { InvestmentService } from '@/lib/investments';
import { FinancialSummaryService } from '@/lib/financial-summary';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/dashboard')({
  server: {
    handlers: {
      // GET /api/dashboard - Get comprehensive dashboard data
      GET: async ({ request }: { request: Request }) => {
        try {
          // Verify authentication
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json(
              { error: 'Authorization header required' },
              { status: 401 }
            );
          }

          const token = authHeader.substring(7);
          const payload = verifyToken(token);

          if (!payload) {
            return json(
              { error: 'Invalid or expired token' },
              { status: 401 }
            );
          }

          const url = new URL(request.url);
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');

          // Get comprehensive financial position
          const financialPosition = await FinancialSummaryService.calculateFinancialPosition(
            payload.userId,
            startDate || undefined,
            endDate || undefined
          );

          // Get monthly comparison
          const monthlyComparison = await FinancialSummaryService.getMonthlyComparison(payload.userId);

          // Get financial trends
          const financialTrends = await FinancialSummaryService.getFinancialTrends(payload.userId, 6);

          // Get real-time metrics
          const realTimeMetrics = await FinancialSummaryService.getRealTimeMetrics(payload.userId);

          // Get financial health score
          const healthScore = FinancialSummaryService.calculateFinancialHealthScore(financialPosition);

          // Get recent transactions (last 10)
          const recentTransactions = await TransactionService.getFiltered(
            { userId: payload.userId },
            { field: 'createdAt', direction: 'desc' },
            10
          );

          // Get overdue items
          const overdue = await DebtReceivableService.getOverdue(payload.userId);

          // Get investment summary
          const investmentSummary = await InvestmentService.getInvestmentSummary(payload.userId);

          // Get daily spending (This Month vs Last Month)
          const dailySpending = await FinancialSummaryService.getDailySpending(payload.userId);

          return json({
            financialPosition,
            monthlyComparison,
            financialTrends,
            realTimeMetrics,
            healthScore,
            recentTransactions,
            dailySpending,
            overdue: {
              debts: overdue.overdueDebts,
              receivables: overdue.overdueReceivables,
            },
            investments: {
              accounts: investmentSummary.accounts,
              lastUpdated: investmentSummary.lastUpdated,
            },
          });
        } catch (error) {
          console.error('Get dashboard data error:', error);
          return json(
            { error: 'Failed to fetch dashboard data' },
            { status: 500 }
          );
        }
      },
    },
  },
});