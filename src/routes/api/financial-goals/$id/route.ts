import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { FinancialGoalService } from '@/lib/financial-goals';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/financial-goals/$id')({
  server: {
    handlers: {
      // GET /api/financial-goals/:id - Get financial goal by ID
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

          const goalId = parseInt(params.id);
          if (isNaN(goalId)) {
            return json({ error: 'Invalid goal ID' }, { status: 400 });
          }

          const goal = await FinancialGoalService.getById(goalId, payload.userId);
          if (!goal) {
            return json({ error: 'Financial goal not found' }, { status: 404 });
          }

          // Get goal progress
          const progress = await FinancialGoalService.getGoalProgress(goalId, payload.userId);

          return json({ goal, progress });
        } catch (error) {
          console.error('Get financial goal error:', error);
          return json({ error: 'Failed to fetch financial goal' }, { status: 500 });
        }
      },

      // PUT /api/financial-goals/:id - Update financial goal
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

          const goalId = parseInt(params.id);
          if (isNaN(goalId)) {
            return json({ error: 'Invalid goal ID' }, { status: 400 });
          }

          const body = await request.json();
          const goal = await FinancialGoalService.update(goalId, payload.userId, body);

          return json({ goal });
        } catch (error) {
          console.error('Update financial goal error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to update financial goal' },
            { status: 400 }
          );
        }
      },

      // DELETE /api/financial-goals/:id - Delete financial goal
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

          const goalId = parseInt(params.id);
          if (isNaN(goalId)) {
            return json({ error: 'Invalid goal ID' }, { status: 400 });
          }

          await FinancialGoalService.delete(goalId, payload.userId);
          return json({ success: true });
        } catch (error) {
          console.error('Delete financial goal error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to delete financial goal' },
            { status: 400 }
          );
        }
      },
    },
  },
});
