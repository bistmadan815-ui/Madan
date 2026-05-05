import { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { X, Loader2, Check, CreditCard, Banknote, MoreHorizontal } from 'lucide-react';
import { BANK_ACCOUNTS } from './VATInvoicePreview';

const METHODS = [
  { id: 'cash',    label: 'Cash',         icon: Banknote,      color: 'text-emerald-400 border-emerald-400/30' },
  { id: 'bank',    label: 'Bank Account', icon: CreditCard,    color: 'text-blue-400 border-blue-400/30' },
  { id: 'other',   label: 'Other',        icon: MoreHorizontal, color: 'text-chalk/50 border-basalt/30' },
];

export default function PaymentRequestModal({ inv, admin, onClose, onSuccess }) {
  const [method, setMethod] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [otherInstructions, setOtherInstructions] = useState('');
  const [creditPeriodDays, setCreditPeriodDays] = useState(inv.credit_period_days || '');
  const [creditError, setCreditError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!method) return;
    const days = parseInt(creditPeriodDays);
    if (!days || days <= 0) {
      setCreditError('Credit period (days) is required and must be greater than 0.');
      return;
    }
    setCreditError('');
    setSaving(true);

    const todayStr = new Date().toISOString().split('T')[0];
    const dueD = new Date();
    dueD.setDate(dueD.getDate() + days);
    const paymentDueDateStr = dueD.toISOString().split('T')[0];

    const bankDetails = method === 'bank' && selectedBank
      ? BANK_ACCOUNTS.find(b => b.account_number === selectedBank)
      : null;

    await base44.entities.PaymentRequest.create({
      client_id: inv.client_id,
      client_name: inv.client_name,
      client_email: inv.client_email,
      invoice_id: inv.id,
      request_type: 'payment_request',
      amount: Number(inv.amount) * (1 + (inv.tax_rate || 13) / 100),
      description: `Payment request for invoice ${inv.invoice_number}`,
      payment_method: method,
      bank_details: bankDetails ? JSON.stringify(bankDetails) : otherInstructions || '',
      status: 'pending',
      requested_by: admin?.email || '',
    });

    // Update invoice with payment_requested status + credit period fields
    await base44.entities.Invoice.update(inv.id, {
      status: 'payment_requested',
      credit_period_days: days,
      payment_request_date: todayStr,
      payment_due_date: paymentDueDateStr,
      notes: (inv.notes ? inv.notes + '\n' : '') + `Payment requested via ${method} on ${new Date().toLocaleDateString('en-GB')} (due ${paymentDueDateStr})`,
    });

    // Audit log
    await base44.entities.AuditLog.create({
      actor_email: admin?.email || '',
      actor_name: admin?.full_name || '',
      actor_type: 'admin',
      action: 'payment_requested',
      entity_type: 'Invoice',
      entity_id: inv.id,
      details: `Payment request created for invoice ${inv.invoice_number} via ${method}`,
    });

    setSaving(false);
    setDone(true);
    setTimeout(() => { onSuccess(); onClose(); }, 1500);
  };

  const fmt = n => 'NPR ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 });
  const total = Number(inv.amount) * (1 + (inv.tax_rate || 13) / 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="relative bg-background border border-border w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="font-display text-xl text-chalk font-light">Payment Request Sent</p>
            <p className="font-body text-xs text-chalk/40 mt-2">Client has been notified.</p>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="font-body text-xs tracking-widest uppercase text-saffron mb-1">Payment Request</p>
                <p className="font-display text-xl text-chalk font-light">{inv.invoice_number}</p>
                <p className="font-body text-xs text-chalk/40 mt-0.5">{inv.client_name} · {fmt(total)}</p>
              </div>
              <button onClick={onClose} className="text-chalk/30 hover:text-chalk"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Credit Period */}
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Credit Period (Days) <span className="text-saffron">*</span></label>
                <input type="number" min="1" value={creditPeriodDays}
                  onChange={e => { setCreditPeriodDays(e.target.value); setCreditError(''); }}
                  placeholder="e.g. 30"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
                {creditPeriodDays && parseInt(creditPeriodDays) > 0 && (
                  <p className="font-body text-[10px] text-chalk/35 mt-1">
                    Payment due by: <strong className="text-saffron">{(() => { const d = new Date(); d.setDate(d.getDate() + parseInt(creditPeriodDays)); return d.toLocaleDateString('en-GB'); })()}</strong>
                  </p>
                )}
                {creditError && <p className="font-body text-xs text-red-400 mt-1">{creditError}</p>}
              </div>

              <div>
                <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-3">Select Payment Method</p>
                <div className="space-y-2">
                  {METHODS.map(m => {
                    const Icon = m.icon;
                    return (
                      <button key={m.id} type="button" onClick={() => setMethod(m.id)}
                        className={`w-full flex items-center gap-3 p-4 border transition-all ${method === m.id ? m.color + ' ring-1 ring-current' : 'border-basalt/30 text-chalk/50 hover:text-chalk'}`}>
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="font-body text-sm">{m.label}</span>
                        {m.id === 'cash' && <span className="font-body text-xs text-chalk/30 ml-auto">Pending cash collection</span>}
                        {method === m.id && <Check className="w-4 h-4 ml-auto text-current" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank Account dropdown */}
              {method === 'bank' && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Select Bank Account</p>
                  <select value={selectedBank} onChange={e => setSelectedBank(e.target.value)}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none mb-3">
                    <option value="" className="bg-background">— Select account —</option>
                    {BANK_ACCOUNTS.map(b => (
                      <option key={b.account_number} value={b.account_number} className="bg-background">{b.bank}</option>
                    ))}
                  </select>
                  {selectedBank && (() => {
                    const b = BANK_ACCOUNTS.find(x => x.account_number === selectedBank);
                    return b ? (
                      <div className="border border-blue-400/20 bg-blue-400/5 p-4 space-y-1.5">
                        {[['Bank', b.bank], ['Account Name', b.account_name], ['Account No', b.account_number], ['Branch', b.branch]].map(([k, v]) => (
                          <div key={k} className="flex gap-2">
                            <span className="font-body text-[10px] uppercase tracking-widest text-chalk/30 w-24 flex-shrink-0">{k}</span>
                            <span className="font-body text-xs text-chalk">{v}</span>
                          </div>
                        ))}
                      </div>
                    ) : null;
                  })()}
                </motion.div>
              )}

              {/* Other instructions */}
              {method === 'other' && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Payment Instructions</label>
                  <textarea rows={3} value={otherInstructions} onChange={e => setOtherInstructions(e.target.value)}
                    placeholder="Specify payment instructions..."
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
                </motion.div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || !method || (method === 'bank' && !selectedBank)}
                  className="flex-1 flex items-center justify-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-40 min-h-[44px]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Sending...' : 'Send Payment Request'}
                </button>
                <button type="button" onClick={onClose}
                  className="font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </>
        )}
      </motion.div>
    </div>
  );
}