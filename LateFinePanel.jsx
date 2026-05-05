import { useState } from 'react';
import LateFinePanel from './LateFinePanel';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, X, Check, FileText, Download, Trash2, Loader2 } from 'lucide-react';
import { ALL_SERVICES } from '@/utils/constants';

function generatePDF(inv) {
  const taxableAmt = inv.amount;
  const vatAmt = (taxableAmt * (inv.tax_rate || 13)) / 100;
  const total = taxableAmt + vatAmt;
  const fmt = n => 'NPR ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  // Convert to Nepali BS date (approximate)
  const bsDate = today; // kept simple; integrate BS converter if needed
  const html = `<html><head><meta charset='UTF-8'/><style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Noto Sans', Arial, sans-serif; color: #1a202c; background: #fff; }
    .page { max-width: 794px; margin: auto; padding: 40px 48px; }
    .firm-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px double #1e3a5f; padding-bottom: 16px; margin-bottom: 20px; }
    .firm-name { font-size: 20px; font-weight: 800; color: #1e3a5f; letter-spacing: 0.02em; }
    .firm-sub { font-size: 11px; color: #4a5568; margin-top: 4px; line-height: 1.6; }
    .reg-info { font-size: 10px; color: #718096; margin-top: 6px; }
    .inv-badge { text-align: right; }
    .inv-title { font-size: 11px; color: #718096; text-transform: uppercase; letter-spacing: 0.12em; }
    .inv-num { font-size: 22px; font-weight: 700; color: #1e3a5f; margin: 2px 0; }
    .status-badge { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;
      background: ${inv.status === 'paid' ? '#c6f6d5' : '#fefcbf'}; color: ${inv.status === 'paid' ? '#22543d' : '#744210'}; border: 1px solid ${inv.status === 'paid' ? '#9ae6b4' : '#f6e05e'}; }
    .meta-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
    .meta-box { border: 1px solid #e2e8f0; padding: 12px 14px; }
    .meta-label { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #a0aec0; margin-bottom: 4px; }
    .meta-value { font-size: 12px; color: #1a202c; line-height: 1.5; }
    .section-title { font-size: 9px; text-transform: uppercase; letter-spacing: 0.12em; color: #a0aec0; margin-bottom: 8px; border-bottom: 1px solid #e2e8f0; padding-bottom: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 12px; }
    thead th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #edf2f7; vertical-align: top; }
    tbody tr:last-child td { border-bottom: 2px solid #e2e8f0; }
    .text-right { text-align: right; }
    .subtotal-row td { padding: 6px 12px; font-size: 11px; color: #4a5568; }
    .vat-row td { padding: 6px 12px; font-size: 11px; color: #4a5568; background: #f7fafc; }
    .total-row td { padding: 10px 12px; font-weight: 700; font-size: 14px; color: #1e3a5f; background: #ebf8ff; border-top: 2px solid #1e3a5f; }
    .amount-words { background: #f7fafc; border: 1px solid #e2e8f0; padding: 8px 14px; margin-top: 10px; font-size: 11px; color: #4a5568; }
    .payment-info { margin-top: 20px; border: 1px solid #e2e8f0; padding: 14px; }
    .footer { margin-top: 24px; padding-top: 12px; border-top: 2px solid #1e3a5f; font-size: 9.5px; color: #a0aec0; }
    .footer-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .stamp-area { border: 2px dashed #cbd5e0; width: 120px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #cbd5e0; text-align: center; margin-top: 16px; }
    @media print { body { margin: 0; } .page { padding: 20px 28px; } }
  </style></head><body><div class='page'>
    <div class='firm-header'>
      <div>
        <div class='firm-name'>M. BISTA &amp; ASSOCIATES</div>
        <div class='firm-sub'>Chartered Accountants<br/>Kathmandu, Nepal · info@mbista.com.np · +977-1-XXXXXXX</div>
        <div class='reg-info'>PAN No.: XXXXXXXXX &nbsp;|&nbsp; VAT Reg. No.: XXXXXXXXX &nbsp;|&nbsp; ICAN Reg. No.: XXXXX</div>
      </div>
      <div class='inv-badge'>
        <div class='inv-title'>Tax Invoice</div>
        <div class='inv-num'>${inv.invoice_number}</div>
        <div class='status-badge'>${inv.status.toUpperCase()}</div>
      </div>
    </div>

    <div class='meta-grid'>
      <div class='meta-box'>
        <div class='meta-label'>Bill To</div>
        <div class='meta-value'><strong>${inv.client_name || '—'}</strong><br/>${inv.client_company ? inv.client_company + '<br/>' : ''}${inv.client_email || ''}</div>
      </div>
      <div class='meta-box'>
        <div class='meta-label'>Invoice Details</div>
        <div class='meta-value'>
          <strong>Date (AD):</strong> ${today}<br/>
          <strong>Due Date:</strong> ${inv.due_date || '—'}<br/>
          <strong>Service:</strong> ${inv.service}
        </div>
      </div>
    </div>

    <div class='section-title'>Particulars</div>
    <table>
      <thead><tr><th>S.N.</th><th>Description of Service</th><th class='text-right'>Amount (NPR)</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>${inv.service}${inv.description ? '<br/><span style="font-size:10px;color:#718096">' + inv.description + '</span>' : ''}</td><td class='text-right'>${fmt(taxableAmt)}</td></tr>
      </tbody>
    </table>
    <table>
      <tbody>
        <tr class='subtotal-row'><td colspan='2'>Sub Total</td><td class='text-right'>${fmt(taxableAmt)}</td></tr>
        <tr class='vat-row'><td colspan='2'>VAT @ ${inv.tax_rate || 13}% (Value Added Tax as per Nepal VAT Act 2052)</td><td class='text-right'>${fmt(vatAmt)}</td></tr>
        <tr class='total-row'><td colspan='2'>Grand Total</td><td class='text-right'>${fmt(total)}</td></tr>
      </tbody>
    </table>
    <div class='amount-words'><strong>Amount in Words:</strong> Nepalese Rupees (amount in words) Only</div>

    ${inv.notes ? `<div style='margin-top:12px;font-size:11px;color:#718096;'><strong>Remarks:</strong> ${inv.notes}</div>` : ''}
    ${inv.paid_date ? `<div style='margin-top:12px;color:#22543d;font-size:12px;font-weight:700;'>&#10003; Payment Received on ${inv.paid_date}</div>` : ''}

    <div class='payment-info'>
      <div class='section-title'>Payment Methods</div>
      <div style='font-size:11px;color:#4a5568;line-height:1.8;'>
        <strong>Bank Transfer:</strong> Nabil Bank Ltd · A/C: 0123456789012345 · M. Bista &amp; Associates Pvt. Ltd.<br/>
        <strong>eSewa / Khalti:</strong> 9841XXXXXX &nbsp;|&nbsp; <strong>ConnectIPS:</strong> connectips.com
      </div>
    </div>

    <div class='footer'>
      <div class='footer-grid'>
        <div>
          <p>This is a computer generated Tax Invoice.</p>
          <p>Subject to Kathmandu jurisdiction.</p>
        </div>
        <div style='text-align:right'>
          <div class='stamp-area' style='margin-left:auto;'>Authorised<br/>Signature &amp;<br/>Stamp</div>
        </div>
      </div>
    </div>
  </div></body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

// ALL_SERVICES imported from @/utils/constants

const STATUS_COLORS = {
  unpaid:    'text-amber-400 border-amber-400/30 bg-amber-400/5',
  paid:      'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  overdue:   'text-red-400 border-red-400/30 bg-red-400/5',
  cancelled: 'text-basalt border-basalt/30 bg-basalt/5',
};

function formatNPR(n) { return 'NPR ' + Number(n).toLocaleString('en-IN'); }

export default function InvoiceManagementTab({ invoices, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: '', client_name: '', client_email: '', client_company: '',
    service: '', description: '', amount: '', tax_rate: 13, due_date: '', notes: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.service || !form.amount) return;
    setSaving(true);
    const inv_num = 'INV-' + Date.now().toString().slice(-6);
    await base44.entities.Invoice.create({ ...form, invoice_number: inv_num, amount: Number(form.amount), status: 'unpaid' });
    setSaving(false);
    setForm({ client_id: '', client_name: '', client_email: '', client_company: '', service: '', description: '', amount: '', tax_rate: 13, due_date: '', notes: '' });
    setShowForm(false);
    onRefresh();
  };

  const handleStatusChange = async (inv, newStatus) => {
    const update = { status: newStatus };
    if (newStatus === 'paid') update.paid_date = new Date().toISOString().split('T')[0];
    await base44.entities.Invoice.update(inv.id, update);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this invoice?')) {
      setDeleting(id);
      await base44.entities.Invoice.delete(id);
      setDeleting(null);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-chalk font-light">Invoice Management</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 min-h-[44px]">
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 mb-8 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">New Invoice</p>
              <button onClick={() => setShowForm(false)} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: 'client_id', label: 'Client ID *', placeholder: 'MB-XXXXXX' },
                { key: 'client_name', label: 'Client Name', placeholder: 'Full name' },
                { key: 'client_email', label: 'Client Email', placeholder: 'email@example.com' },
                { key: 'client_company', label: 'Company', placeholder: 'Company name' },
              ].map(f => (
                <div key={f.key}>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">{f.label}</label>
                  <input type="text" value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
                </div>
              ))}
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Service *</label>
                <select value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                  <option value="" className="bg-background">Select service</option>
                  {ALL_SERVICES.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Amount (NPR) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                  placeholder="e.g. 85000"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Tax Rate (%)</label>
                <input type="number" value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: Number(e.target.value) }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Due Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Brief description..."
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                  <Check className="w-4 h-4" /> {saving ? 'Creating...' : 'Create Invoice'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk transition-all min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {invoices.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <FileText className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No Invoices Yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {invoices.map((inv, i) => {
            const total = inv.amount * (1 + (inv.tax_rate || 13) / 100);
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="border border-border p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                      <span className="font-body text-xs text-chalk/30">{inv.invoice_number}</span>
                      {inv.late_fine_applied && (
                        <span className="font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border text-red-400 border-red-400/30 bg-red-400/5">Fine Applied</span>
                      )}
                      {inv.waiver_status === 'pending' && inv.waiver_requested && (
                        <span className="font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border text-amber-400 border-amber-400/30 bg-amber-400/5 animate-pulse">Waiver Pending</span>
                      )}
                    </div>
                    <p className="font-body text-sm text-chalk">{inv.service}</p>
                    <p className="font-body text-xs text-chalk/40 mt-0.5">{inv.client_name} · {inv.client_id}</p>
                    <p className="font-display text-xl text-chalk font-light mt-1">{formatNPR(Math.round(total))}</p>
                    {inv.late_fine_applied && inv.late_fine_amount > 0 && (
                      <p className="font-body text-xs text-red-400 mt-0.5">+ Fine: {formatNPR(inv.late_fine_amount)} → Total: {formatNPR(Math.round(total) + inv.late_fine_amount)}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <button onClick={() => generatePDF(inv)}
                      className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      <Download className="w-3.5 h-3.5" /> PDF
                    </button>
                    {inv.status === 'unpaid' && (
                      <>
                        <button onClick={() => handleStatusChange(inv, 'paid')}
                          className="font-body text-xs px-3 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all min-h-[36px]">
                          Mark Paid
                        </button>
                        <button onClick={() => handleStatusChange(inv, 'overdue')}
                          className="font-body text-xs px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all min-h-[36px]">
                          Mark Overdue
                        </button>
                      </>
                    )}
                    {inv.status === 'overdue' && (
                      <button onClick={() => handleStatusChange(inv, 'paid')}
                        className="font-body text-xs px-3 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all min-h-[36px]">
                        Mark Paid
                      </button>
                    )}
                    {inv.status !== 'cancelled' && inv.status !== 'paid' && (
                      <button onClick={() => handleStatusChange(inv, 'cancelled')}
                        className="font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/30 hover:text-chalk transition-all min-h-[36px]">
                        Cancel
                      </button>
                    )}
                    <button onClick={() => handleDelete(inv.id)} disabled={deleting === inv.id}
                      className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 disabled:opacity-50 transition-all min-h-[36px]">
                      {deleting === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
                <LateFinePanel inv={inv} onRefresh={onRefresh} />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}