/**
 * StaffInvoiceView — Read-only invoice view for staff.
 * Staff can view invoices, download PDF, add follow-up notes,
 * and mark payment status if permitted.
 */
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { FileText, Eye, Clock, CheckCircle2, AlertCircle, XCircle, MessageSquare, Check, Loader2, AlertOctagon } from 'lucide-react';
import VATInvoicePreview from '@/components/admin/VATInvoicePreview';

const STATUS_CONFIG = {
  unpaid:            { label: 'Unpaid',            color: 'text-amber-400 border-amber-400/30 bg-amber-400/5',   icon: Clock },
  paid:              { label: 'Paid',              color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5', icon: CheckCircle2 },
  overdue:           { label: 'Overdue',           color: 'text-red-400 border-red-400/30 bg-red-400/5',        icon: AlertCircle },
  cancelled:         { label: 'Cancelled',         color: 'text-basalt border-basalt/30 bg-basalt/5',            icon: XCircle },
  payment_requested: { label: 'Pmt. Requested',    color: 'text-blue-400 border-blue-400/30 bg-blue-400/5',     icon: Clock },
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr) - new Date()) / (1000 * 60 * 60 * 24));
}

function formatNPR(n) { return 'NPR ' + Number(n).toLocaleString('en-IN'); }

function generatePDF(inv) {
  const taxAmt = (inv.amount * (inv.tax_rate || 13)) / 100;
  const total = inv.amount + taxAmt;
  const fmt = n => 'NPR ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const html = `<html><head><meta charset='UTF-8'/><style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans', Arial, sans-serif; color: #1a202c; background: #fff; }
    .page { max-width: 794px; margin: auto; padding: 40px 48px; }
    .firm-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px double #1e3a5f; padding-bottom: 16px; margin-bottom: 20px; }
    .firm-name { font-size: 20px; font-weight: 800; color: #1e3a5f; }
    .firm-sub { font-size: 11px; color: #4a5568; margin-top: 4px; }
    .inv-badge { text-align: right; }
    .inv-title { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.12em; }
    .inv-num { font-size: 22px; font-weight: 700; color: #1e3a5f; margin: 2px 0; }
    .status-badge { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; background: ${inv.status === 'paid' ? '#c6f6d5' : '#fefcbf'}; color: ${inv.status === 'paid' ? '#22543d' : '#744210'}; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .meta-box { border: 1px solid #e2e8f0; padding: 12px 14px; }
    .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #a0aec0; margin-bottom: 4px; }
    .meta-value { font-size: 12px; color: #1a202c; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 12px; }
    thead th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #edf2f7; }
    .subtotal-row td { padding: 6px 12px; font-size: 11px; color: #4a5568; }
    .vat-row td { padding: 6px 12px; font-size: 11px; color: #4a5568; background: #f7fafc; }
    .total-row td { padding: 10px 12px; font-weight: 700; font-size: 14px; color: #1e3a5f; background: #ebf8ff; border-top: 2px solid #1e3a5f; }
    .text-right { text-align: right; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #1e3a5f; font-size: 9.5px; color: #a0aec0; }
    @media print { body { margin: 0; } }
  </style></head><body><div class='page'>
    <div class='firm-header'>
      <div><div class='firm-name'>M. BISTA &amp; ASSOCIATES</div><div class='firm-sub'>Chartered Accountants · Kathmandu, Nepal</div></div>
      <div class='inv-badge'><div class='inv-title'>Tax Invoice</div><div class='inv-num'>${inv.invoice_number}</div><span class='status-badge'>${inv.status.toUpperCase()}</span></div>
    </div>
    <div class='meta-grid'>
      <div class='meta-box'><div class='meta-label'>Bill To</div><div class='meta-value'><strong>${inv.client_name || '—'}</strong><br/>${inv.client_company || ''}${inv.client_email ? '<br/>' + inv.client_email : ''}</div></div>
      <div class='meta-box'><div class='meta-label'>Invoice Details</div><div class='meta-value'><strong>Date:</strong> ${today}<br/><strong>Due:</strong> ${inv.due_date || '—'}<br/><strong>Service:</strong> ${inv.service}</div></div>
    </div>
    <table><thead><tr><th>Description</th><th class='text-right'>Amount (NPR)</th></tr></thead>
    <tbody><tr><td>${inv.service}${inv.description ? '<br/><span style="font-size:10px;color:#718096">' + inv.description + '</span>' : ''}</td><td class='text-right'>${fmt(inv.amount)}</td></tr></tbody></table>
    <table><tbody>
      <tr class='subtotal-row'><td colspan='2'>Sub Total</td><td class='text-right'>${fmt(inv.amount)}</td></tr>
      <tr class='vat-row'><td colspan='2'>VAT @ ${inv.tax_rate || 13}%</td><td class='text-right'>${fmt(taxAmt)}</td></tr>
      <tr class='total-row'><td colspan='2'>Grand Total</td><td class='text-right'>${fmt(total)}</td></tr>
    </tbody></table>
    ${inv.paid_date ? `<p style='margin-top:12px;color:#22543d;font-weight:700;'>&#10003; Paid on ${inv.paid_date}</p>` : ''}
    <div class='footer'>This is a computer generated Tax Invoice. Subject to Kathmandu jurisdiction.</div>
  </div></body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function StaffInvoiceView({ invoices, onRefresh, staff }) {
  const [noteInv, setNoteInv] = useState(null);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    setSaving(true);
    await base44.entities.Invoice.update(noteInv.id, {
      notes: noteInv.notes ? noteInv.notes + '\n[Follow-up] ' + note : '[Follow-up] ' + note,
    });
    // Audit log
    await base44.entities.AuditLog.create({
      actor_email: staff?.email || '',
      actor_name: staff?.full_name || '',
      actor_type: 'staff',
      action: 'added_payment_followup',
      entity_type: 'Invoice',
      entity_id: noteInv.id,
      details: note,
    });
    // Notify admin
    const admins = await base44.entities.Admin.list('-created_date', 5);
    for (const admin of admins) {
      await base44.entities.Notification.create({
        admin_id: admin.id,
        type: 'staff_alert',
        title: 'Payment Follow-up Added',
        message: `${staff?.full_name || 'Staff'} added a follow-up note on invoice ${noteInv.invoice_number}: "${note}"`,
        reference_id: noteInv.id,
        reference_type: 'Invoice',
        priority: 'medium',
      });
    }
    setSaving(false);
    setNoteInv(null);
    setNote('');
    onRefresh();
  };

  const handleMarkPaid = async (inv) => {
    await base44.entities.Invoice.update(inv.id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] });
    await base44.entities.AuditLog.create({
      actor_email: staff?.email || '',
      actor_name: staff?.full_name || '',
      actor_type: 'staff',
      action: 'marked_invoice_paid',
      entity_type: 'Invoice',
      entity_id: inv.id,
      details: `Invoice ${inv.invoice_number} marked as paid`,
    });
    onRefresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-chalk font-light">Invoices</h2>
        <span className="font-body text-xs text-chalk/30 border border-basalt/20 px-3 py-1.5">View Only</span>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <FileText className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No Invoices</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv, i) => {
            const sc = STATUS_CONFIG[inv.status] || STATUS_CONFIG.unpaid;
            const StatusIcon = sc.icon;
            const total = inv.amount * (1 + (inv.tax_rate || 13) / 100);
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className="border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <span className={`flex items-center gap-1 font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc.color}`}>
                        <StatusIcon className="w-3 h-3" />{sc.label}
                      </span>
                      <span className="font-body text-xs text-chalk/30">{inv.invoice_number}</span>
                      {inv.late_fine_applied && (
                        <span className="font-body text-[10px] uppercase px-2 py-0.5 border text-red-400 border-red-400/30 bg-red-400/5">Fine Applied</span>
                      )}
                      {inv.waiver_status === 'pending' && (
                        <span className="font-body text-[10px] uppercase px-2 py-0.5 border text-amber-400 border-amber-400/30 bg-amber-400/5 animate-pulse">Waiver Pending</span>
                      )}
                    </div>
                    <p className="font-body text-sm text-chalk">{inv.service}</p>
                    <p className="font-body text-xs text-chalk/40 mt-0.5">{inv.client_name} · {inv.client_id}</p>
                    {/* Discount badge */}
                    {inv.discount_status === 'pending' && (
                      <span className="inline-block font-body text-[10px] uppercase tracking-widest px-2 py-0.5 border text-amber-400 border-amber-400/30 bg-amber-400/5 mt-1">Discount Pending</span>
                    )}
                    {inv.discount_status === 'approved' && Number(inv.discount_amount) > 0 && (
                      <span className="inline-block font-body text-[10px] uppercase tracking-widest px-2 py-0.5 border text-emerald-400 border-emerald-400/30 bg-emerald-400/5 mt-1">Discount: -NPR {Number(inv.discount_amount).toLocaleString('en-IN')}</span>
                    )}
                    {inv.discount_status === 'approved' && Number(inv.discount_amount) > 0 ? (
                      <p className="font-display text-xl text-emerald-400 font-light mt-1">{formatNPR(Math.round(total - Number(inv.discount_amount)))} <span className="text-chalk/30 line-through text-sm">{formatNPR(Math.round(total))}</span></p>
                    ) : (
                      <p className="font-display text-xl text-chalk font-light mt-1">{formatNPR(Math.round(total))}</p>
                    )}
                    {inv.due_date && <p className="font-body text-xs text-chalk/30 mt-0.5">Due: {inv.due_date}</p>}
                    {inv.notes && <p className="font-body text-xs text-chalk/40 mt-1 italic">{inv.notes}</p>}
                  </div>
                  <div className="flex gap-2 flex-wrap flex-shrink-0">
                    <button onClick={() => setViewing(inv)}
                      className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>
                    {/* Payment due date indicator for staff */}
                    {inv.status === 'payment_requested' && inv.payment_due_date && (() => {
                      const d = daysUntil(inv.payment_due_date);
                      return (
                        <span className={`font-body text-[10px] px-2 py-1 border ${
                          d < 0 ? 'text-red-400 border-red-400/30 bg-red-400/5' : 'text-blue-400 border-blue-400/30 bg-blue-400/5'
                        }`}>
                          {d < 0 ? `${Math.abs(d)}d overdue` : `${d}d remaining`} · {inv.payment_due_date}
                        </span>
                      );
                    })()}

                    {/* Follow-up: only if payment_requested or overdue, not for paid */}
                    {(inv.status === 'payment_requested' || inv.status === 'overdue' || inv.status === 'unpaid') && inv.status !== 'paid' && (
                      <button onClick={() => { setNoteInv(inv); setNote(''); }}
                        className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-violet-400/30 text-violet-400 hover:bg-violet-400/5 transition-all min-h-[36px]">
                        <MessageSquare className="w-3.5 h-3.5" /> Follow-up Note
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Follow-up Note Modal */}
      {noteInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={() => setNoteInv(null)}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="relative bg-background border border-border w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <h3 className="font-display text-xl text-chalk font-light mb-2">Add Follow-up Note</h3>
            <p className="font-body text-xs text-chalk/40 mb-5">{noteInv.invoice_number} · {noteInv.client_name}</p>
            <form onSubmit={handleAddNote} className="space-y-4">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Note</label>
                <textarea rows={3} value={note} onChange={e => setNote(e.target.value)}
                  placeholder="Enter follow-up note..."
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={saving || !note.trim()}
                  className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Saving...' : 'Add Note'}
                </button>
                <button type="button" onClick={() => setNoteInv(null)}
                  className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <AnimatePresence>
        {viewing && <VATInvoicePreview inv={viewing} onClose={() => setViewing(null)} />}
      </AnimatePresence>
    </div>
  );
}