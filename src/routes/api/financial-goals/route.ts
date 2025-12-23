import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { FinancialGoalService } from '@/lib/financial-goals';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/financial-goals')({
  server: {
    handlers: {
      // GET /api/financial-goals - Get user financial goals
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
          const category = url.searchParams.get('category');
          const priority = url.searchParams.get('priority') as 'low' | 'medium' | 'high' | null;
          const isCompleted = url.searchParams.get('isCompleted');
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const filters = {
            userId: payload.userId,
            ...(category && { category }),
            ...(priority && { priority }),
            ...(isCompleted !== null && { isCompleted: isCompleted === 'true' }),
          };

          const goals = await FinancialGoalService.getFiltered(filters, { field: 'createdAt', direction: 'desc' }, limit, offset);
          const total = await FinancialGoalService.getCount(filters);
          const summary = await FinancialGoalService.getGoalsSummary(payload.userId);
          const recommendations = await FinancialGoalService.getGoalRecommendations(payload.userId);

          return json({ goals, total, limit, offset, summary, recommendations });
        } catch (error) {
          console.error('Get financial goals error:', error);
          return json({ error: 'Failed to fetch financial goals' }, { status: 500 });
        }
      },

      // POST /api/financial-goals - Create new financial goal
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
          const goalData = {
            ...body,
            userId: payload.userId,
          };

          const goal = await FinancialGoalService.create(goalData);
          return json({ goal }, { status: 201 });
        } catch (error) {
          console.error('Create financial goal error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to create financial goal' },
            { status: 400 }
          );
        }
      },
    },
  },
});
