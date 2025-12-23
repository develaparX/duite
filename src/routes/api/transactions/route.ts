import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { TransactionService } from '@/lib/transactions';
import { verifyToken } from '@/lib/auth';
import type { NewTransaction } from '@/db/schema';

export const Route = createFileRoute('/api/transactions')({
  server: {
    handlers: {
      // GET /api/transactions - Get filtered transactions
      GET: async ({ request }: { request: Request }) => {
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

          // Parse query parameters
          const url = new URL(request.url);
          const type = url.searchParams.get('type') as 'income' | 'expense' | 'debt' | 'receivable' | null;
          const status = url.searchParams.get('status') as 'active' | 'settled' | 'cancelled' | null;
          const category = url.searchParams.get('category');
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');
          const relatedParty = url.searchParams.get('relatedParty');
          const sortField = url.searchParams.get('sortField') as 'transactionDate' | 'amount' | 'createdAt' || 'transactionDate';
          const sortDirection = url.searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          // Build filters
          const filters = {
            userId: payload.userId,
            ...(type && { type }),
            ...(status && { status }),
            ...(category && { category }),
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
            ...(relatedParty && { relatedParty }),
          };

          // Get transactions
          const transactions = await TransactionService.getFiltered(
            filters,
            { field: sortField, direction: sortDirection },
            limit,
            offset
          );

          // Get total count for pagination
          const totalCount = await TransactionService.getCount(filters);

          return json({
            transactions,
            pagination: {
              total: totalCount,
              limit,
              offset,
              hasMore: offset + limit < totalCount,
            },
          });
        } catch (error) {
          console.error('Get transactions error:', error);
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

      // POST /api/transactions - Create new transaction
      POST: async ({ request }: { request: Request }) => {
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

          // Parse request body
          const body = await request.json();
          const transactionData: NewTransaction = {
            ...body,
            userId: payload.userId,
          };

          // Create transaction
          const transaction = await TransactionService.create(transactionData);

          return json({ transaction }, { status: 201 });
        } catch (error) {
          console.error('Create transaction error:', error);
          
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
    },
  },
});
