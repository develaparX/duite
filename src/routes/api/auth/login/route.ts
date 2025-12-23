import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users } from '@/db/schema';
import { verifyPassword, generateToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/auth/login')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        try {
          const body = await request.json();
          const { email, password } = body;

          // Validate required fields
          if (!email || !password) {
            return json(
              {
                error: {
                  code: 'MISSING_CREDENTIALS',
                  message: 'Email and password are required',
                  details: {
                    timestamp: new Date().toISOString(),
                  },
                },
              },
              {
                status: 400,
              }
            );
          }

          // Find user by email
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (!user) {
            return json(
              {
                error: {
                  code: 'INVALID_CREDENTIALS',
                  message: 'Invalid email or password',
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

          // Verify password
          const isValidPassword = await verifyPassword(password, user.passwordHash);
          if (!isValidPassword) {
            return json(
              {
                error: {
                  code: 'INVALID_CREDENTIALS',
                  message: 'Invalid email or password',
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

          // Generate JWT token
          const token = generateToken({
            userId: user.id,
            email: user.email,
          });

          // Return user data (without password hash) and token
          const { passwordHash, ...userWithoutPassword } = user;

          return json(
            {
              user: userWithoutPassword,
              token,
            },
            {
              status: 200,
            }
          );
        } catch (error) {
          console.error('Login error:', error);
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