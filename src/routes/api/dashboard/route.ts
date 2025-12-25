import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { verifyToken } from '@/lib/auth';
import { FinancialSummaryService } from '@/lib/financial-summary';
import { TransactionService } from '@/lib/transactions';
import { DebtReceivableService } from '@/lib/transactions';
import { InvestmentService } from '@/lib/investments';

export const Route = createFileRoute('/api/dashboard')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json({ error: 'Authorization header required' }, { status: 401 });
          }

          const token = authHeader.substring(7);
          const payload = verifyToken(token);
          if (!payload) {
            return json({ error: 'Invalid or expired token' }, { status: 401 });
          }

          const url = new URL(request.url);
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');

          console.log('Fetching complete dashboard data for user:', payload.userId);

          // Use FinancialSummaryService to get all data in sequential queries
          // This avoids I/O sharing issues in Cloudflare Workers
          
          // 1. Financial Position (main metrics)
          const financialPosition = await FinancialSummaryService.calculateFinancialPosition(
            payload.userId,
            startDate || undefined,
            endDate || undefined
          );

          // 2. Monthly Comparison
          const monthlyComparison = await FinancialSummaryService.getMonthlyComparison(payload.userId);

          // 3. Financial Trends
          const financialTrends = await FinancialSummaryService.getFinancialTrends(payload.userId);

          // 4. Real-time Metrics
          const realTimeMetrics = await FinancialSummaryService.getRealTimeMetrics(payload.userId, financialPosition);

          // 5. Health Score
          const healthScore = FinancialSummaryService.calculateFinancialHealthScore(financialPosition);

          // 6. Recent Transactions
          const recentTransactions = await TransactionService.getFiltered(
            { userId: payload.userId },
            { field: 'createdAt', direction: 'desc' },
            20,
            0
          );

          // 7. Daily Spending
          const dailySpending = await FinancialSummaryService.getDailySpending(payload.userId);

          // 8. Overdue Items
          const overdue = await DebtReceivableService.getOverdue(payload.userId);

          // 9. Investment Summary
          const investments = await InvestmentService.getInvestmentSummary(payload.userId);

          const dashboardData = {
            financialPosition,
            monthlyComparison,
            financialTrends,
            realTimeMetrics,
            healthScore,
            recentTransactions,
            dailySpending,
            overdue,
            investments
          };

          console.log('Complete dashboard data fetched successfully');

          return json(dashboardData);
        } catch (error) {
          console.error('Dashboard error:', error);
          return json(
            { 
              error: 'Failed to fetch dashboard data', 
              details: error instanceof Error ? error.message : String(error) 
            },
            { status: 500 }
          );
        }
      },
    },
  },
});