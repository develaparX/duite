import { createFileRoute } from '@tanstack/react-router';
import { json } from '@tanstack/react-start';
import { BillReminderService } from '@/lib/bill-reminders';
import { verifyToken } from '@/lib/auth';

export const Route = createFileRoute('/api/bill-reminders')({
  server: {
    handlers: {
      // GET /api/bill-reminders - Get user bill reminders
      GET: async ({ request }: { request: Request }) => {
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

          const url = new URL(request.url);
          const frequency = url.searchParams.get('frequency') as 'weekly' | 'monthly' | 'quarterly' | 'yearly' | null;
          const category = url.searchParams.get('category');
          const payee = url.searchParams.get('payee');
          const isActive = url.searchParams.get('isActive');
          const isPaid = url.searchParams.get('isPaid');
          const dueSoon = url.searchParams.get('dueSoon') === 'true';
          const overdue = url.searchParams.get('overdue') === 'true';
          const limit = parseInt(url.searchParams.get('limit') || '50');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const filters = {
            userId: payload.userId,
            ...(frequency && { frequency }),
            ...(category && { category }),
            ...(payee && { payee }),
            ...(isActive !== null && { isActive: isActive === 'true' }),
            ...(isPaid !== null && { isPaid: isPaid === 'true' }),
            ...(dueSoon && { dueSoon }),
            ...(overdue && { overdue }),
          };

          const bills = await BillReminderService.getFiltered(filters, { field: 'nextDueDate', direction: 'asc' }, limit, offset);
          const total = await BillReminderService.getCount(filters);
          const summary = await BillReminderService.getBillSummary(payload.userId);
          const dueSoonBills = await BillReminderService.getBillsDueSoon(payload.userId);
          const overdueBills = await BillReminderService.getOverdueBills(payload.userId);

          return json({ 
            bills, 
            total, 
            limit, 
            offset, 
            summary, 
            dueSoon: dueSoonBills, 
            overdue: overdueBills 
          });
        } catch (error) {
          console.error('Get bill reminders error:', error);
          return json({ error: 'Failed to fetch bill reminders' }, { status: 500 });
        }
      },

      // POST /api/bill-reminders - Create new bill reminder
      POST: async ({ request }: { request: Request }) => {
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

          const body = await request.json();
          const billData = {
            ...body,
            userId: payload.userId,
          };

          const bill = await BillReminderService.create(billData);
          return json({ bill }, { status: 201 });
        } catch (error) {
          console.error('Create bill reminder error:', error);
          return json(
            { error: error instanceof Error ? error.message : 'Failed to create bill reminder' },
            { status: 400 }
          );
        }
      },
    },
  },
});
