import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { InvestmentService } from '@/lib/investments';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/investments/summary')({
  server: {
    handlers: {
      // GET /api/investments/summary - Get investment summary and performance
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

          // Get investment summary
          const summary = await InvestmentService.getInvestmentSummary(payload.userId);
          
          // Get performance data for all accounts
          const performance = await InvestmentService.getAllAccountPerformance(payload.userId);

          // Get available account names and types
          const accountNames = await InvestmentService.getAccountNames(payload.userId);
          const accountTypes = await InvestmentService.getAccountTypes(payload.userId);

          return json({
            summary,
            performance,
            accountNames,
            accountTypes,
          });
        } catch (error) {
          console.error('Get investment summary error:', error);
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
