import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { InvestmentService } from '@/lib/investments';
import { verifyToken } from '@/lib/auth';
import type { NewInvestmentBalance } from '@/db/schema';

export const Route = createFileRoute('/api/investments')({
  server: {
    handlers: {
      // GET /api/investments - Get filtered investment balances
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
          const accountName = url.searchParams.get('accountName');
          const accountType = url.searchParams.get('accountType');
          const startDate = url.searchParams.get('startDate');
          const endDate = url.searchParams.get('endDate');
          const sortField = url.searchParams.get('sortField') as 'recordedAt' | 'balance' | 'accountName' || 'recordedAt';
          const sortDirection = url.searchParams.get('sortDirection') as 'asc' | 'desc' || 'desc';
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          // Build filters
          const filters = {
            userId: payload.userId,
            ...(accountName && { accountName }),
            ...(accountType && { accountType }),
            ...(startDate && { startDate }),
            ...(endDate && { endDate }),
          };

          // Get investment balances
          const balances = await InvestmentService.getFiltered(
            filters,
            { field: sortField, direction: sortDirection },
            limit,
            offset
          );

          // Get total count for pagination
          const totalCount = await InvestmentService.getCount(filters);

          return json({
            balances,
            pagination: {
              total: totalCount,
              limit,
              offset,
              hasMore: offset + limit < totalCount,
            },
          });
        } catch (error) {
          console.error('Get investment balances error:', error);
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

      // POST /api/investments - Create new investment balance record
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
          const balanceData: NewInvestmentBalance = {
            ...body,
            userId: payload.userId,
          };

          // Create investment balance record
          const balance = await InvestmentService.recordBalance(balanceData);

          return json({ balance }, { status: 201 });
        } catch (error) {
          console.error('Create investment balance error:', error);
          
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