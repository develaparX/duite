import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { InvestmentService } from '@/lib/investments';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/investments/history')({
  server: {
    handlers: {
      // GET /api/investments/history - Get investment balance history
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

          // Parse query parameters
          const url = new URL(request.url);
          const accountName = url.searchParams.get('accountName');
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');
          const limit = parseInt(url.searchParams.get('limit') || '50');

          let history;
          
          if (accountName) {
            // Get history for specific account
            history = await InvestmentService.getAccountHistory(payload.userId, accountName, limit);
          } else {
            // Get history for all accounts within date range
            history = await InvestmentService.getBalanceHistory(
              payload.userId,
              startDate || undefined,
              endDate || undefined
            );
          }

          return json({ history });
        } catch (error) {
          console.error('Get investment history error:', error);
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
