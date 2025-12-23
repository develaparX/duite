import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/auth/me')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => {
        try {
          // Get token from Authorization header
          const authHeader = request.headers.get('Authorization');
          if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return json(
              {
                error: {
                  code: 'MISSING_TOKEN',
                  message: 'Authorization token is required',
                  details: {
                    timestamp: new Date().toISOString(),
                  },
                },
              },
              {
                status: 401,
              }
            );
          }

          const token = authHeader.substring(7); // Remove 'Bearer ' prefix
          const payload = verifyToken(token);

          if (!payload) {
            return json(
              {
                error: {
                  code: 'INVALID_TOKEN',
                  message: 'Invalid or expired token',
                  details: {
                    timestamp: new Date().toISOString(),
                  },
                },
              },
              {
                status: 401,
              }
            );
          }

          // Get current user data
          const [user] = await db
            .select({
              id: users.id,
              email: users.email,
              fullName: users.fullName,
              createdAt: users.createdAt,
              updatedAt: users.updatedAt,
            })
            .from(users)
            .where(eq(users.id, payload.userId))
            .limit(1);

          if (!user) {
            return json(
              {
                error: {
                  code: 'USER_NOT_FOUND',
                  message: 'User not found',
                  details: {
                    timestamp: new Date().toISOString(),
                  },
                },
              },
              {
                status: 404,
              }
            );
          }

          return json(
            {
              user,
            },
            {
              status: 200,
            }
          );
        } catch (error) {
          console.error('Get user error:', error);
          return json(
            {
              error: {
                code: 'INTERNAL_ERROR',
                message: 'An internal server error occurred',
                details: {
                  timestamp: new Date().toISOString(),
                },
              },
            },
            {
              status: 500,
            }
          );
        }
      },
    },
  },
});