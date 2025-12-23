import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { FinancialGoalService } from '@/lib/financial-goals';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/financial-goals/$id/contribute')({
  server: {
    handlers: {
      // POST /api/financial-goals/:id/contribute - Add contribution to goal
      POST: async ({ request, params }: { request: Request; params: { id: string } }) => {
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
          const { amount } = body;

          if (!amount || amount <= 0) {
            return json({ error: 'Valid contribution amount is required' }, { status: 400 });
          }

          const goal = await FinancialGoalService.addContribution(goalId, payload.userId, amount);
          const progress = await FinancialGoalService.getGoalProgress(goalId, payload.userId);

          return json({ goal, progress });
        } catch (error) {
          console.error('Add contribution error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to add contribution' },
            { status: 400 }
          );
        }
      },
    },
  },
});
