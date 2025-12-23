import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { RecurringTransactionService } from '@/lib/recurring-transactions';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/recurring-transactions')({
  server: {
    handlers: {
      // GET /api/recurring-transactions - Get user recurring transactions
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
          const type = url.searchParams.get('type') as 'income' | 'expense' | 'debt' | 'receivable' | null;
          const frequency = url.searchParams.get('frequency') as 'daily' | 'weekly' | 'monthly' | 'yearly' | null;
          const category = url.searchParams.get('category');
          const isActive = url.searchParams.get('isActive');
          const dueSoon = url.searchParams.get('dueSoon') === 'true';
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const filters = {
            userId: payload.userId,
            ...(type && { type }),
            ...(frequency && { frequency }),
            ...(category && { category }),
            ...(isActive !== null && { isActive: isActive === 'true' }),
            ...(dueSoon && { dueSoon }),
          };

          const recurringTransactions = await RecurringTransactionService.getFiltered(
            filters, 
            { field: 'nextDueDate', direction: 'asc' }, 
            limit, 
            offset
          );
          const total = await RecurringTransactionService.getCount(filters);
          const summary = await RecurringTransactionService.getSummary(payload.userId);
          const upcoming = await RecurringTransactionService.getUpcoming(payload.userId, 30);

          return json({ 
            recurringTransactions, 
            total, 
            limit, 
            offset, 
            summary, 
            upcoming 
          });
        } catch (error) {
          console.error('Get recurring transactions error:', error);
          return json({ error: 'Failed to fetch recurring transactions' }, { status: 500 });
        }
      },

      // POST /api/recurring-transactions - Create new recurring transaction
      POST: async ({ request }: { request: Request }) => {
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

          const body = await request.json();
          const recurringData = {
            ...body,
            userId: payload.userId,
          };

          const recurringTransaction = await RecurringTransactionService.create(recurringData);
          return json({ recurringTransaction }, { status: 201 });
        } catch (error) {
          console.error('Create recurring transaction error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to create recurring transaction' },
            { status: 400 }
          );
        }
      },
    },
  },
});
