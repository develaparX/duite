import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { DebtReceivableService } from '@/lib/transactions';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/receivables/$id/collect')({
  server: {
    handlers: {
      // POST /api/receivables/:id/collect - Mark receivable as collected
      POST: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const receivableId = parseInt(params.id);
          if (isNaN(receivableId)) {
            return json(
              {
                error: {
                  code: 'INVALID_ID',
                  message: 'Receivable ID must be a valid number',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          // Collect the receivable
          const collectedReceivable = await DebtReceivableService.collectReceivable(receivableId, payload.userId);
          if (!collectedReceivable) {
            return json(
              {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Receivable not found',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 404 }
            );
          }

          return json({ 
            receivable: collectedReceivable,
            message: 'Receivable collected successfully'
          });
        } catch (error) {
          console.error('Collect receivable error:', error);
          
          // Handle business logic errors
          if (error instanceof Error) {
            return json(
              {
                error: {
                  code: 'BUSINESS_LOGIC_ERROR',
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