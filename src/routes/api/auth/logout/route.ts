import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => {
        // Since we're using JWT tokens, logout is handled client-side
        // by removing the token from storage. This endpoint exists for
        // consistency and future server-side session management if needed.
        
        return json(
          {
            message: 'Logged out successfully',
          },
          {
            status: 200,
          }
        );
      },
    },
  },
});