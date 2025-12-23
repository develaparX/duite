import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { BudgetService } from '@/lib/budgets';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/budgets/$id')({
  server: {
    handlers: {
      // GET /api/budgets/:id - Get budget by ID
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

          const budgetId = parseInt(params.id);
          if (isNaN(budgetId)) {
            return json({ error: 'Invalid budget ID' }, { status: 400 });
          }

          const budget = await BudgetService.getById(budgetId, payload.userId);
          if (!budget) {
            return json({ error: 'Budget not found' }, { status: 404 });
          }

          // Get budget performance
          const performance = await BudgetService.getBudgetPerformance(budgetId, payload.userId);

          return json({ budget, performance });
        } catch (error) {
          console.error('Get budget error:', error);
          return json({ error: 'Failed to fetch budget' }, { status: 500 });
        }
      },

      // PUT /api/budgets/:id - Update budget
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

          const budgetId = parseInt(params.id);
          if (isNaN(budgetId)) {
            return json({ error: 'Invalid budget ID' }, { status: 400 });
          }

          const body = await request.json();
          const budget = await BudgetService.update(budgetId, payload.userId, body);

          return json({ budget });
        } catch (error) {
          console.error('Update budget error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to update budget' },
            { status: 400 }
          );
        }
      },

      // DELETE /api/budgets/:id - Delete budget
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

          const budgetId = parseInt(params.id);
          if (isNaN(budgetId)) {
            return json({ error: 'Invalid budget ID' }, { status: 400 });
          }

          await BudgetService.delete(budgetId, payload.userId);
          return json({ success: true });
        } catch (error) {
          console.error('Delete budget error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to delete budget' },
            { status: 400 }
          );
        }
      },
    },
  },
});