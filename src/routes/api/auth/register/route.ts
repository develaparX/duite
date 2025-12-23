import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { db } from '@/db';
import { users } from '@/db/schema';
import { hashPassword, generateToken } from '@/lib/auth';
import { eq } from 'drizzle-orm';

export const Route = createFileRoute('/api/auth/register')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        console.log('Register API called');
        try {
          const body = await request.json();
          console.log('Request body:', { email: body.email, fullName: body.fullName });
          const { email, password, fullName } = body;

          // Validate required fields
          if (!email || !password || !fullName) {
            return json(
              {
                error: {
                  code: 'MISSING_FIELDS',
                  message: 'Email, password, and full name are required',
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

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(email)) {
            return json(
              {
                error: {
                  code: 'INVALID_EMAIL',
                  message: 'Please provide a valid email address',
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

          // Validate password length
          if (password.length < 6) {
            return json(
              {
                error: {
                  code: 'WEAK_PASSWORD',
                  message: 'Password must be at least 6 characters long',
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

          // Check if user already exists
          const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);

          if (existingUser.length > 0) {
            return json(
              {
                error: {
                  code: 'EMAIL_EXISTS',
                  message: 'An account with this email already exists',
                  details: {
                    timestamp: new Date().toISOString(),
                  },
                },
              },
              {
                status: 409,
              }
            );
          }

          // Hash password and create user
          const passwordHash = await hashPassword(password);
          const [newUser] = await db
            .insert(users)
            .values({
              email,
              passwordHash,
              fullName,
            })
            .returning({
              id: users.id,
              email: users.email,
              fullName: users.fullName,
              createdAt: users.createdAt,
            });

          // Generate JWT token
          const token = generateToken({
            userId: newUser.id,
            email: newUser.email,
          });

          return json(
            {
              user: newUser,
              token,
            },
            {
              status: 201,
            }
          );
        } catch (error) {
          console.error('Registration error:', error);
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