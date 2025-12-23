import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { DebtReceivableService } from '@/lib/transactions';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/debts')({
  server: {
    handlers: {
      // GET /api/debts - Get all debts for user
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

          let debts;
          if (status === 'outstanding') {
            debts = await DebtReceivableService.getOutstandingDebts(payload.userId);
          } else {
            debts = await DebtReceivableService.getAllDebts(payload.userId);
          }

          return json({ debts });
        } catch (error) {
          console.error('Get debts error:', error);
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

      // POST /api/debts - Create new debt
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
          const { amount, description, creditor, dueDate, transactionDate } = body;

          // Validate required fields
          if (!amount || !description || !creditor || !dueDate) {
            return json(
              {
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Amount, description, creditor, and due date are required',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          // Create debt
          const debt = await DebtReceivableService.createDebt({
            userId: payload.userId,
            amount,
            description,
            creditor,
            dueDate,
            transactionDate,
          });

          return json({ debt }, { status: 201 });
        } catch (error) {
          console.error('Create debt error:', error);
          
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