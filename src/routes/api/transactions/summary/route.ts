import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { TransactionService } from '@/lib/transactions';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/transactions/summary')({
  server: {
    handlers: {
      // GET /api/transactions/summary - Get transaction summary
      GET: async ({ request }: { request: Request }) => {
        try {
          // Verify authentication
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json(
              {
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authorization token required',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 401 }
            );
          }

          const token = authHeader.substring(7);
          const payload = verifyToken(token);
          if (!payload) {
            return json(
              {
                error: {
                  code: 'INVALID_TOKEN',
                  message: 'Invalid or expired token',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 401 }
            );
          }

          // Parse query parameters for date range
          const url = new URL(request.url);
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');

          // Get summary
          const summary = await TransactionService.getSummary(payload.userId, startDate || undefined, endDate || undefined);

          // Calculate net worth (assets - debts)
          const netWorth = summary.totalIncome - summary.totalExpenses + summary.totalActiveReceivables - summary.totalActiveDebts;

          return json({
            ...summary,
            netWorth,
            period: {
              startDate: startDate || 'all-time',
              endDate: endDate || 'all-time',
            },
          });
        } catch (error) {
          console.error('Get transaction summary error:', error);
          return json(
            {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal server error occurred',
                details: { timestamp: new Date().toISOString() },
              },
            },
            { status: 500 }
          );
        }
      },
    },
  },
});
