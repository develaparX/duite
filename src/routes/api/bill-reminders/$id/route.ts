import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { BillReminderService } from '@/lib/bill-reminders';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/bill-reminders/$id')({
  server: {
    handlers: {
      // GET /api/bill-reminders/:id - Get bill reminder by ID
      GET: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const billId = parseInt(params.id);
          if (isNaN(billId)) {
            return json({ error: 'Invalid bill ID' }, { status: 400 });
          }

          const bill = await BillReminderService.getById(billId, payload.userId);
          if (!bill) {
            return json({ error: 'Bill reminder not found' }, { status: 404 });
          }

          // Get bill status
          const status = await BillReminderService.getBillStatus(billId, payload.userId);

          return json({ bill, status });
        } catch (error) {
          console.error('Get bill reminder error:', error);
          return json({ error: 'Failed to fetch bill reminder' }, { status: 500 });
        }
      },

      // PUT /api/bill-reminders/:id - Update bill reminder
      PUT: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const billId = parseInt(params.id);
          if (isNaN(billId)) {
            return json({ error: 'Invalid bill ID' }, { status: 400 });
          }

          const body = await request.json();
          const bill = await BillReminderService.update(billId, payload.userId, body);

          return json({ bill });
        } catch (error) {
          console.error('Update bill reminder error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to update bill reminder' },
            { status: 400 }
          );
        }
      },

      // DELETE /api/bill-reminders/:id - Delete bill reminder
      DELETE: async ({ request, params }: { request: Request; params: { id: string } }) => {
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

          const billId = parseInt(params.id);
          if (isNaN(billId)) {
            return json({ error: 'Invalid bill ID' }, { status: 400 });
          }

          await BillReminderService.delete(billId, payload.userId);
          return json({ success: true });
        } catch (error) {
          console.error('Delete bill reminder error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to delete bill reminder' },
            { status: 400 }
          );
        }
      },
    },
  },
});
