import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { RecurringTransactionService } from '@/lib/recurring-transactions';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/recurring-transactions/$id')({
  server: {
    handlers: {
      // GET /api/recurring-transactions/:id - Get recurring transaction by ID
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const recurringId = parseInt(params.id);
          if (isNaN(recurringId)) {
            return json({ error: 'Invalid recurring transaction ID' }, { status: 400 });
          }

          const recurringTransaction = await RecurringTransactionService.getById(recurringId, payload.userId);
          if (!recurringTransaction) {
            return json({ error: 'Recurring transaction not found' }, { status: 404 });
          }

          return json({ recurringTransaction });
        } catch (error) {
          console.error('Get recurring transaction error:', error);
          return json({ error: 'Failed to fetch recurring transaction' }, { status: 500 });
        }
      },

      // PUT /api/recurring-transactions/:id - Update recurring transaction
      PUT: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const recurringId = parseInt(params.id);
          if (isNaN(recurringId)) {
            return json({ error: 'Invalid recurring transaction ID' }, { status: 400 });
          }

          const body = await request.json();
          const recurringTransaction = await RecurringTransactionService.update(recurringId, payload.userId, body);

          return json({ recurringTransaction });
        } catch (error) {
          console.error('Update recurring transaction error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to update recurring transaction' },
            { status: 400 }
          );
        }
      },

      // DELETE /api/recurring-transactions/:id - Delete recurring transaction
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const recurringId = parseInt(params.id);
          if (isNaN(recurringId)) {
            return json({ error: 'Invalid recurring transaction ID' }, { status: 400 });
          }

          await RecurringTransactionService.delete(recurringId, payload.userId);
          return json({ success: true });
        } catch (error) {
          console.error('Delete recurring transaction error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to delete recurring transaction' },
            { status: 400 }
          );
        }
      },
    },
  },
});
