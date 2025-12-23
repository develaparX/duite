import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { BillReminderService } from '@/lib/bill-reminders';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/bill-reminders/$id/pay' as any)({
  server: {
    handlers: {
      // POST /api/bill-reminders/:id/pay - Mark bill as paid
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

          const billId = parseInt(params.id);
          if (isNaN(billId)) {
            return json({ error: 'Invalid bill ID' }, { status: 400 });
          }

          const body = await request.json();
          const { paidDate } = body;

          const bill = await BillReminderService.markAsPaid(billId, payload.userId, paidDate);
          const status = await BillReminderService.getBillStatus(billId, payload.userId);

          return json({ bill, status });
        } catch (error) {
          console.error('Mark bill as paid error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to mark bill as paid' },
            { status: 400 }
          );
        }
      },

      // DELETE /api/bill-reminders/:id/pay - Mark bill as unpaid
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

          const bill = await BillReminderService.markAsUnpaid(billId, payload.userId);
          const status = await BillReminderService.getBillStatus(billId, payload.userId);

          return json({ bill, status });
        } catch (error) {
          console.error('Mark bill as unpaid error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to mark bill as unpaid' },
            { status: 400 }
          );
        }
      },
    },
  },
});