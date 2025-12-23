import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { DebtReceivableService } from '@/lib/transactions';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/receivables')({
  server: {
    handlers: {
      // GET /api/receivables - Get all receivables for user
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
          const status = url.searchParams.get('status');

          let receivables;
          if (status === 'outstanding') {
            receivables = await DebtReceivableService.getOutstandingReceivables(payload.userId);
          } else {
            receivables = await DebtReceivableService.getAllReceivables(payload.userId);
          }

          return json({ receivables });
        } catch (error) {
          console.error('Get receivables error:', error);
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

      // POST /api/receivables - Create new receivable
      POST: async ({ request }: { request: Request }) => {
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

          // Parse request body
          const body = await request.json();
          const { amount, description, debtor, expectedDate, transactionDate } = body;

          // Validate required fields
          if (!amount || !description || !debtor || !expectedDate) {
            return json(
              {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Amount, description, debtor, and expected date are required',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          // Create receivable
          const receivable = await DebtReceivableService.createReceivable({
            userId: payload.userId,
            amount,
            description,
            debtor,
            expectedDate,
            transactionDate,
          });

          return json({ receivable }, { status: 201 });
        } catch (error) {
          console.error('Create receivable error:', error);
          
          // Handle validation errors
          if (error instanceof Error && error.message.startsWith('Validation failed:')) {
            return json(
              {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: error.message,
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

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