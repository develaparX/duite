import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { TransactionService } from '@/lib/transactions';
import { verifyToken } from '@/lib/auth';
import type { NewTransaction } from '@/db/schema';

export const Route = createFileRoute('/api/transactions/$id')({
  server: {
    handlers: {
      // GET /api/transactions/:id - Get transaction by ID
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const transactionId = parseInt(params.id);
          if (isNaN(transactionId)) {
            return json(
              {
                error: {
                  code: 'INVALID_ID',
                  message: 'Transaction ID must be a valid number',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          const transaction = await TransactionService.getById(transactionId, payload.userId);
          if (!transaction) {
            return json(
              {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Transaction not found',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 404 }
            );
          }

          return json({ transaction });
        } catch (error) {
          console.error('Get transaction error:', error);
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

      // PUT /api/transactions/:id - Update transaction
      PUT: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const transactionId = parseInt(params.id);
          if (isNaN(transactionId)) {
            return json(
              {
                error: {
                  code: 'INVALID_ID',
                  message: 'Transaction ID must be a valid number',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          // Parse request body
          const body = await request.json();
          const updateData: Partial<NewTransaction> = body;

          // Update transaction
          const transaction = await TransactionService.update(transactionId, payload.userId, updateData);
          if (!transaction) {
            return json(
              {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Transaction not found',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 404 }
            );
          }

          return json({ transaction });
        } catch (error) {
          console.error('Update transaction error:', error);
          
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

      // DELETE /api/transactions/:id - Delete transaction
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const transactionId = parseInt(params.id);
          if (isNaN(transactionId)) {
            return json(
              {
                error: {
                  code: 'INVALID_ID',
                  message: 'Transaction ID must be a valid number',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          const deleted = await TransactionService.delete(transactionId, payload.userId);
          if (!deleted) {
            return json(
              {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Transaction not found',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 404 }
            );
          }

          return json({ message: 'Transaction deleted successfully' });
        } catch (error) {
          console.error('Delete transaction error:', error);
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
