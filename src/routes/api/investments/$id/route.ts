import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { InvestmentService } from '@/lib/investments';
import { verifyToken } from '@/lib/auth';
import type { NewInvestmentBalance } from '@/db/schema';

export const Route = createFileRoute('/api/investments/$id')({
  server: {
    handlers: {
      // GET /api/investments/:id - Get investment balance by ID
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

          const id = parseInt(params.id);
          if (isNaN(id)) {
            return json(
              {
                error: {
                  code: 'INVALID_ID',
                  message: 'Invalid investment balance ID',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          const balance = await InvestmentService.getById(id, payload.userId);
          if (!balance) {
            return json(
              {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Investment balance not found',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 404 }
            );
          }

          return json({ balance });
        } catch (error) {
          console.error('Get investment balance error:', error);
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

      // PUT /api/investments/:id - Update investment balance
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

          const id = parseInt(params.id);
          if (isNaN(id)) {
            return json(
              {
                error: {
                  code: 'INVALID_ID',
                  message: 'Invalid investment balance ID',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          // Parse request body
          const body = await request.json();
          const updateData: Partial<NewInvestmentBalance> = body;

          // Update investment balance
          const balance = await InvestmentService.update(id, payload.userId, updateData);
          if (!balance) {
            return json(
              {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Investment balance not found',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 404 }
            );
          }

          return json({ balance });
        } catch (error) {
          console.error('Update investment balance error:', error);
          
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

      // DELETE /api/investments/:id - Delete investment balance
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

          const id = parseInt(params.id);
          if (isNaN(id)) {
            return json(
              {
                error: {
                  code: 'INVALID_ID',
                  message: 'Invalid investment balance ID',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 400 }
            );
          }

          const deleted = await InvestmentService.delete(id, payload.userId);
          if (!deleted) {
            return json(
              {
                error: {
                  code: 'NOT_FOUND',
                  message: 'Investment balance not found',
                  details: { timestamp: new Date().toISOString() },
                },
              },
              { status: 404 }
            );
          }

          return json({ success: true });
        } catch (error) {
          console.error('Delete investment balance error:', error);
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