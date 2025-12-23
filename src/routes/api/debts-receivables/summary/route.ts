import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { DebtReceivableService } from '@/lib/transactions';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/debts-receivables/summary')({
  server: {
    handlers: {
      // GET /api/debts-receivables/summary - Get debt and receivable summary
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

          // Get summary data
          const summary = await DebtReceivableService.getSummary(payload.userId);
          const overdue = await DebtReceivableService.getOverdue(payload.userId);

          return json({
            summary,
            overdue,
          });
        } catch (error) {
          console.error('Get debt/receivable summary error:', error);
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