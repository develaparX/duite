import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { BudgetService } from '@/lib/budgets';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/budgets')({
  server: {
    handlers: {
      // GET /api/budgets - Get user budgets with filtering
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
          const period = url.searchParams.get('period') as 'weekly' | 'monthly' | 'yearly' | null;
          const category = url.searchParams.get('category');
          const isActive = url.searchParams.get('isActive');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const filters = {
            userId: payload.userId,
            ...(period && { period }),
            ...(category && { category }),
            ...(isActive !== null && { isActive: isActive === 'true' }),
          };

          const budgets = await BudgetService.getFiltered(filters, { field: 'createdAt', direction: 'desc' }, limit, offset);
          const total = await BudgetService.getCount(filters);

          return json({ budgets, total, limit, offset });
        } catch (error) {
          console.error('Get budgets error:', error);
          return json({ error: 'Failed to fetch budgets' }, { status: 500 });
        }
      },

      // POST /api/budgets - Create new budget
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
          const budgetData = {
            ...body,
            userId: payload.userId,
          };

          const budget = await BudgetService.create(budgetData);
          return json({ budget }, { status: 201 });
        } catch (error) {
          console.error('Create budget error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to create budget' },
            { status: 400 }
          );
        }
      },
    },
  },
});