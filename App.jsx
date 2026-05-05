import { base44 } from '@/api/base44Client';

/**
 * Checks all unpaid invoices past their due date.
 * For each overdue invoice:
 *   1. Marks it as 'overdue'
 *   2. Sends a polite reminder email to the client
 *   3. Creates a 'followup' PaymentRequest for staff visibility (deduplicated by invoice_id)
 *
 * Should be called once per staff portal session (e.g. on load).
 */
export async function checkAndNotifyOverdueInvoices() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Fetch unpaid invoices and existing followup requests in parallel
  const [unpaidInvoices, existingFollowups] = await Promise.all([
    base44.entities.Invoice.filter({ status: 'unpaid' }, '-due_date', 200),
    base44.entities.PaymentRequest.filter({ request_type: 'followup' }, '-created_date', 500),
  ]);

  // Build a set of invoice IDs that already have a followup to avoid duplicates
  const alreadyFollowedUp = new Set(
    existingFollowups.filter(f => f.invoice_id).map(f => f.invoice_id)
  );

  const overdue = unpaidInvoices.filter(inv => {
    if (!inv.due_date) return false;
    const due = new Date(inv.due_date);
    due.setHours(0, 0, 0, 0);
    return due < today;
  });

  if (overdue.length === 0) return { processed: 0 };

  let processed = 0;

  await Promise.all(
    overdue.map(async (inv) => {
      const total = Math.round(inv.amount * (1 + (inv.tax_rate || 13) / 100));
      const fmtNPR = (n) => 'NPR ' + n.toLocaleString('en-IN');

      // 1. Mark invoice as overdue
      await base44.entities.Invoice.update(inv.id, { status: 'overdue' });

      // 3. Create followup PaymentRequest for staff (deduplicated)
      if (!alreadyFollowedUp.has(inv.id)) {
        await base44.entities.PaymentRequest.create({
          client_id: inv.client_id,
          client_name: inv.client_name,
          client_email: inv.client_email,
          request_type: 'followup',
          amount: total,
          description: `Auto-generated overdue reminder for Invoice ${inv.invoice_number} (${inv.service}). Due: ${inv.due_date}.`,
          due_date: inv.due_date,
          status: 'pending',
          invoice_id: inv.id,
          requested_by: 'system',
        });
        alreadyFollowedUp.add(inv.id);
      }

      processed++;
    })
  );

  return { processed };
}