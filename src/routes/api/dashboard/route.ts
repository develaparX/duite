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

          // Get comprehensive financial position first (needed for health score and optimization)
          const financialPosition = await FinancialSummaryService.calculateFinancialPosition(
            payload.userId,
            startDate || undefined,
            endDate || undefined
          );

          // Execute independent fetchers in parallel for performance
          const [
            monthlyComparison,
            financialTrends,
            realTimeMetrics,
            recentTransactions,
            overdue,
            investmentSummary,
            dailySpending
          ] = await Promise.all([
            FinancialSummaryService.getMonthlyComparison(payload.userId),
            FinancialSummaryService.getFinancialTrends(payload.userId, 6),
            FinancialSummaryService.getRealTimeMetrics(payload.userId, financialPosition),
            TransactionService.getFiltered(
              { userId: payload.userId },
              { field: 'createdAt', direction: 'desc' },
              10
            ),
            DebtReceivableService.getOverdue(payload.userId),
            InvestmentService.getInvestmentSummary(payload.userId),
            FinancialSummaryService.getDailySpending(payload.userId)
          ]);

          // Calculate financial health score
          const healthScore = FinancialSummaryService.calculateFinancialHealthScore(financialPosition);

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