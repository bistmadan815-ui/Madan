import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Loader2, Check, X, Eye, Send, Mail, Search, Download, TrendingUp, Clock, CheckCircle2, AlertCircle, Tag, XCircle } from 'lucide-react';
import { ALL_SERVICES } from '@/utils/constants';
import VATInvoicePreview from './VATInvoicePreview';
import PaymentRequestModal from './PaymentRequestModal';

const STATUS_COLORS = {
  unpaid:             'text-amber-400 border-amber-400/30 bg-amber-400/5',
  paid:               'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  overdue:            'text-red-400 border-red-400/30 bg-red-400/5',
  cancelled:          'text-basalt border-basalt/30 bg-basalt/5',
  payment_requested:  'text-blue-400 border-blue-400/30 bg-blue-400/5',
};

const STATUS_LABELS = {
  unpaid: 'Unpaid', paid: 'Paid', overdue: 'Overdue',
  cancelled: 'Cancelled', payment_requested: 'Payment Requested',
};

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr) - new Date();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function generateInvoicePDF(inv) {
  const taxableAmt = inv.amount;
  const vatAmt = (taxableAmt * (inv.tax_rate || 13)) / 100;
  const total = taxableAmt + vatAmt;
  const fmt = n => 'NPR ' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const html = `<html><head><meta charset='UTF-8'/><style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, sans-serif; color: #1a202c; }
    .page { max-width: 794px; margin: auto; padding: 40px 48px; }
    .firm-header { border-bottom: 3px double #1e3a5f; padding-bottom: 16px; margin-bottom: 20px; }
    .firm-name { font-size: 20px; font-weight: 800; color: #1e3a5f; }
    .inv-title { font-size: 24px; font-weight: 700; color: #1e3a5f; margin-top: 20px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 12px; }
    thead th { background: #1e3a5f; color: #fff; padding: 8px 12px; text-align: left; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #edf2f7; }
    .total-row { font-weight: 700; font-size: 14px; color: #1e3a5f; background: #ebf8ff; }
  </style></head><body><div class='page'>
    <div class='firm-header'>
      <div class='firm-name'>M. BISTA &amp; ASSOCIATES</div>
      <p>Chartered Accountants, Kathmandu, Nepal</p>
    </div>
    <div class='inv-title'>Invoice #${inv.invoice_number}</div>
    <p><strong>Date:</strong> ${today}</p>
    <p><strong>Bill To:</strong> ${inv.client_name} (${inv.client_company})</p>
    <table>
      <thead><tr><th>Service</th><th style='text-align:right'>Amount</th></tr></thead>
      <tbody>
        <tr><td>${inv.service}</td><td style='text-align:right'>${fmt(taxableAmt)}</td></tr>
        <tr><td>VAT @ ${inv.tax_rate || 13}%</td><td style='text-align:right'>${fmt(vatAmt)}</td></tr>
        <tr class='total-row'><td>TOTAL</td><td style='text-align:right'>${fmt(total)}</td></tr>
      </tbody>
    </table>
  </div></body></html>`;
  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

const emptyForm = { client_id: '', client_name: '', client_email: '', client_company: '', client_address: '', client_pan: '', service: '', description: '', amount: '', tax_rate: 13, due_date: new Date().toISOString().split('T')[0], status: 'unpaid' };

export default function InvoicesTab({ admin }) {
  const [invoices, setInvoices] = useState([]);
  const [clients, setClients] = useState([]);
  const [discountRequests, setDiscountRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [clientSelected, setClientSelected] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [viewing, setViewing] = useState(null);
  const [requesting, setRequesting] = useState(null);
  const [emailingInv, setEmailingInv] = useState(null);
  const [emailSending, setEmailSending] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showDiscounts, setShowDiscounts] = useState(false);
  const [discountSaving, setDiscountSaving] = useState('');

  useEffect(() => {
    loadInvoices();
    loadClients();
    loadDiscountRequests();
  }, []);

  const loadInvoices = async () => {
    setLoading(true);
    const data = await base44.entities.Invoice.list('-created_date', 100);
    setInvoices(data);
    setLoading(false);
  };

  const loadClients = async () => {
    const data = await base44.entities.ClientProfile.list('-created_date', 100);
    setClients(data);
  };

  const loadDiscountRequests = async () => {
    const data = await base44.entities.DiscountRequest.list('-created_date', 100);
    setDiscountRequests(data);
  };

  const handleDiscountAction = async (dr, action) => {
    // action: 'approved' | 'rejected'
    setDiscountSaving(dr.id);
    const approvedAmt = action === 'approved' ? dr.requested_amount : 0;
    await base44.entities.DiscountRequest.update(dr.id, {
      status: action,
      approved_amount: approvedAmt,
      reviewed_by: admin?.full_name || 'Admin',
    });
    if (action === 'approved') {
      // Apply discount to invoice
      await base44.entities.Invoice.update(dr.invoice_id, {
        discount_amount: approvedAmt,
        discount_status: 'approved',
        discount_request_id: dr.id,
      });
      // Notify client
      if (dr.client_id) {
        await base44.entities.ClientNotification.create({
          client_id: dr.client_id, is_read: false,
          title: `Discount Approved — NPR ${approvedAmt.toLocaleString('en-IN')}`,
          message: `Your discount request of NPR ${approvedAmt.toLocaleString('en-IN')} on invoice ${dr.invoice_number} has been approved.`,
          type: 'general', reference_id: dr.invoice_id, reference_type: 'Invoice',
        });
      }
    } else {
      await base44.entities.Invoice.update(dr.invoice_id, { discount_status: 'rejected' });
      if (dr.client_id) {
        await base44.entities.ClientNotification.create({
          client_id: dr.client_id, is_read: false,
          title: `Discount Request Rejected`,
          message: `Your discount request on invoice ${dr.invoice_number} was not approved.`,
          type: 'general', reference_id: dr.invoice_id, reference_type: 'Invoice',
        });
      }
    }
    await base44.entities.AuditLog.create({
      actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin',
      action: `discount_${action}`, entity_type: 'DiscountRequest', entity_id: dr.id,
      details: `Discount ${action} for invoice ${dr.invoice_number} — NPR ${approvedAmt}`,
    });
    setDiscountSaving('');
    loadDiscountRequests();
    loadInvoices();
  };

  const handleClientSelect = (entityId) => {
    if (!entityId) { setForm(emptyForm); setClientSelected(false); return; }
    const client = clients.find(c => c.id === entityId);
    if (!client) return;
    setClientSelected(true);
    setForm(p => ({
      ...p,
      client_id: client.client_id,
      client_name: client.full_name,
      client_email: client.email,
      client_company: client.company_name || '',
      client_address: client.address || '',
      client_pan: client.pan_number || '',
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.service || !form.amount) { setError('Client, service and amount are required'); return; }
    setSaving(true);
    const inv_num = 'INV-' + Date.now().toString().slice(-6);
    await base44.entities.Invoice.create({ ...form, invoice_number: inv_num, amount: Number(form.amount) });
    setForm(emptyForm);
    setClientSelected(false);
    setShowForm(false);
    setSaving(false);
    setError('');
    loadInvoices();
  };

  const handleDelete = async (id) => {
    const inv = invoices.find(i => i.id === id);
    // Prevent deletion after payment request
    if (inv?.notes?.includes('Payment requested')) {
      alert('Cannot delete an invoice after a payment request has been made.');
      return;
    }
    if (confirm('Delete this invoice?')) {
      await base44.entities.Invoice.delete(id);
      loadInvoices();
    }
  };

  const handleSendEmail = async (inv) => {
    setEmailSending(true);
    const taxable = Number(inv.amount);
    const vat = (taxable * (inv.tax_rate || 13)) / 100;
    const total = taxable + vat;
    await base44.integrations.Core.SendEmail({
      to: inv.client_email,
      subject: `Invoice ${inv.invoice_number} from M. Bista & Associates`,
      body: `Dear ${inv.client_name},\n\nPlease find your invoice details below:\n\nInvoice No: ${inv.invoice_number}\nService: ${inv.service}\nAmount: NPR ${taxable.toLocaleString('en-IN')}\nVAT (${inv.tax_rate || 13}%): NPR ${vat.toFixed(2)}\nTotal: NPR ${total.toFixed(2)}\nDue Date: ${inv.due_date || 'N/A'}\n\nPlease contact us for any queries.\n\nBest regards,\nM. Bista & Associates`,
    });
    setEmailSending(false);
    setEmailingInv(null);
    alert('Email sent successfully.');
  };

  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      const matchSearch = !search || inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) || inv.client_name?.toLowerCase().includes(search.toLowerCase()) || inv.service?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = filterStatus === 'all' || inv.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [invoices, search, filterStatus]);

  const stats = useMemo(() => ({
    total: invoices.length,
    paid: invoices.filter(i => i.status === 'paid').length,
    unpaid: invoices.filter(i => i.status === 'unpaid').length,
    overdue: invoices.filter(i => i.status === 'overdue').length,
    totalRevenue: invoices.filter(i => i.status === 'paid').reduce((s, i) => s + Number(i.amount) * (1 + (i.tax_rate || 13) / 100), 0),
    totalDue: invoices.filter(i => i.status !== 'paid' && i.status !== 'cancelled').reduce((s, i) => s + Number(i.amount) * (1 + (i.tax_rate || 13) / 100), 0),
  }), [invoices]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  const fmt = n => 'NPR ' + Math.round(n).toLocaleString('en-IN');

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl text-chalk font-light">Invoices</h3>
          <p className="font-body text-xs text-chalk/35 mt-0.5">{invoices.length} total invoices</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowDiscounts(v => !v)}
            className={`relative flex items-center gap-2 font-body text-xs px-4 py-2.5 border transition-all min-h-[44px] ${
              showDiscounts ? 'border-amber-400 text-amber-400 bg-amber-400/5' : 'border-basalt/30 text-chalk/40 hover:text-chalk'
            }`}>
            <Tag className="w-4 h-4" /> Discounts
            {discountRequests.filter(d => d.status === 'pending').length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-400 text-background text-[9px] font-bold rounded-full flex items-center justify-center">
                {discountRequests.filter(d => d.status === 'pending').length}
              </span>
            )}
          </button>
          <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background font-medium uppercase tracking-wider hover:bg-saffron/90 transition-all min-h-[44px]">
            <Plus className="w-4 h-4" /> New Invoice
          </button>
        </div>
      </div>

      {/* Discount Requests Panel */}
      <AnimatePresence>
        {showDiscounts && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="border border-amber-400/20 bg-amber-400/5 p-5 mb-6">
            <p className="font-body text-xs tracking-widest uppercase text-amber-400 mb-4">Discount Requests</p>
            {discountRequests.length === 0 ? (
              <p className="font-body text-xs text-chalk/30 text-center py-4">No discount requests.</p>
            ) : (
              <div className="space-y-3">
                {discountRequests.map(dr => (
                  <div key={dr.id} className="flex items-center justify-between gap-3 border border-basalt/20 bg-background p-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
                          dr.status === 'pending' ? 'text-amber-400 border-amber-400/30 bg-amber-400/5' :
                          dr.status === 'approved' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' :
                          'text-red-400 border-red-400/30 bg-red-400/5'
                        }`}>{dr.status}</span>
                        <span className="font-body text-xs text-chalk/40 font-mono">{dr.invoice_number}</span>
                      </div>
                      <p className="font-body text-sm text-chalk">{dr.client_name} — NPR {Number(dr.requested_amount).toLocaleString('en-IN')} discount</p>
                      {dr.reason && <p className="font-body text-xs text-chalk/40 mt-0.5">{dr.reason}</p>}
                      <p className="font-body text-[10px] text-chalk/25 mt-0.5">Requested by: {dr.requested_by} ({dr.requested_by_type})</p>
                    </div>
                    {dr.status === 'pending' && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => handleDiscountAction(dr, 'approved')} disabled={discountSaving === dr.id}
                          className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/5 transition-all min-h-[36px]">
                          {discountSaving === dr.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Approve
                        </button>
                        <button onClick={() => handleDiscountAction(dr, 'rejected')} disabled={discountSaving === dr.id}
                          className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-all min-h-[36px]">
                          <XCircle className="w-3.5 h-3.5" /> Reject
                        </button>
                      </div>
                    )}
                    {dr.status !== 'pending' && dr.reviewed_by && (
                      <span className="font-body text-[10px] text-chalk/30 flex-shrink-0">by {dr.reviewed_by}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Revenue', value: fmt(stats.totalRevenue), icon: TrendingUp, color: 'text-emerald-400', border: 'border-emerald-400/20' },
          { label: 'Amount Due', value: fmt(stats.totalDue), icon: Clock, color: 'text-amber-400', border: 'border-amber-400/20' },
          { label: 'Paid Invoices', value: stats.paid, icon: CheckCircle2, color: 'text-emerald-400', border: 'border-border' },
          { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-400', border: 'border-red-400/20' },
        ].map(s => (
          <div key={s.label} className={`border ${s.border} p-5 relative overflow-hidden`}>
            <div className="flex items-start justify-between mb-3">
              <p className="font-body text-[10px] tracking-widest uppercase text-chalk/35">{s.label}</p>
              <s.icon className={`w-4 h-4 ${s.color} opacity-60`} />
            </div>
            <p className={`font-display text-2xl font-light ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices, clients, services..."
            className="w-full bg-transparent border-b border-basalt/30 py-2 pl-6 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['all','All'], ['unpaid','Unpaid'], ['paid','Paid'], ['overdue','Overdue'], ['cancelled','Cancelled']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              className={`font-body text-xs px-3 py-2 border transition-all ${filterStatus === val ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:text-chalk'}`}>
              {label}{val !== 'all' ? ` (${invoices.filter(i => i.status === val).length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-border p-6 mb-6 relative">
          <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
          <div className="flex items-center justify-between mb-5">
            <p className="font-body text-xs tracking-widest uppercase text-saffron">New Invoice</p>
            <button onClick={() => { setShowForm(false); setForm(emptyForm); setClientSelected(false); }} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleCreate} className="space-y-5">

            {/* Client Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="font-body text-xs tracking-widest uppercase text-chalk/35">Select Client *</label>
                {clientSelected && (
                  <button type="button" onClick={() => { setClientSelected(false); setForm(emptyForm); }} className="font-body text-[10px] text-saffron hover:underline">Change Client</button>
                )}
              </div>
              <select onChange={e => handleClientSelect(e.target.value)} disabled={clientSelected}
                className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                <option value="" className="bg-background">— Select a client —</option>
                {clients.map(c => <option key={c.id} value={c.id} className="bg-background">{c.client_id} · {c.full_name} ({c.company_name})</option>)}
              </select>
            </div>

            {/* Auto-filled client details */}
            {clientSelected && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-saffron/20 bg-saffron/5 p-4">
                <div>
                  <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">Client ID</p>
                  <p className="font-body text-sm text-saffron">{form.client_id}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">Client Name</p>
                  <p className="font-body text-sm text-chalk">{form.client_name}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">Email</p>
                  <p className="font-body text-sm text-chalk">{form.client_email || '—'}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">Company</p>
                  <p className="font-body text-sm text-chalk">{form.client_company || '—'}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">PAN</p>
                  <p className="font-body text-sm text-chalk">{form.client_pan || '—'}</p>
                </div>
                <div>
                  <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">Address</p>
                  <p className="font-body text-sm text-chalk">{form.client_address || '—'}</p>
                </div>
              </div>
            )}

            {/* Invoice fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Service *</label>
                <select value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                  <option value="" className="bg-background">Select service</option>
                  {ALL_SERVICES.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Description</label>
                <input type="text" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..."
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Amount (NPR) *</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 85000"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Tax Rate (%)</label>
                <input type="number" value={form.tax_rate} onChange={e => setForm(p => ({ ...p, tax_rate: Number(e.target.value) }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Invoice Date</label>
                <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
            </div>

            {error && <p className="font-body text-xs text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving || !clientSelected}
                className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? 'Creating...' : 'Create Invoice'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setClientSelected(false); }}
                className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <Search className="w-8 h-8 text-chalk/15 mx-auto mb-3" />
          <p className="font-body text-sm text-chalk/25">No invoices match your search.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((inv, i) => {
            const total = Number(inv.amount) * (1 + (inv.tax_rate || 13) / 100);
            const isOverdue = inv.status === 'overdue';
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`border p-5 transition-colors hover:border-basalt/50 ${isOverdue ? 'border-red-400/20 bg-red-400/3' : 'border-border'}`}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2.5 py-1 border ${STATUS_COLORS[inv.status]}`}>{inv.status}</span>
                      <span className="font-body text-xs text-chalk/30 font-mono">{inv.invoice_number}</span>
                      {inv.late_fine_applied && <span className="font-body text-[10px] uppercase px-2 py-0.5 border text-red-400 border-red-400/30 bg-red-400/5">Fine Applied</span>}
                    </div>
                    <p className="font-body text-sm text-chalk font-medium">{inv.service}</p>
                    <p className="font-body text-xs text-chalk/40 mt-0.5">{inv.client_name} · <span className="font-mono">{inv.client_id}</span></p>
                    {inv.task_id && (
                      <span className="inline-block font-body text-[10px] text-saffron/70 border border-saffron/20 bg-saffron/5 px-2 py-0.5 mt-1">Linked Task: {inv.task_id}</span>
                    )}
                    {/* Discount badges */}
                    {inv.discount_status === 'pending' && (
                      <span className="inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-widest px-2 py-0.5 border text-amber-400 border-amber-400/30 bg-amber-400/5 mt-1"><Tag className="w-2.5 h-2.5" /> Discount Pending</span>
                    )}
                    {inv.discount_status === 'approved' && (
                      <span className="inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-widest px-2 py-0.5 border text-emerald-400 border-emerald-400/30 bg-emerald-400/5 mt-1"><Tag className="w-2.5 h-2.5" /> Discount Applied: NPR {Number(inv.discount_amount || 0).toLocaleString('en-IN')}</span>
                    )}
                    {inv.discount_status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 font-body text-[10px] uppercase tracking-widest px-2 py-0.5 border text-red-400 border-red-400/30 bg-red-400/5 mt-1"><Tag className="w-2.5 h-2.5" /> Discount Rejected</span>
                    )}
                    <div className="flex items-baseline gap-3 mt-2">
                      {inv.discount_status === 'approved' && Number(inv.discount_amount) > 0 ? (
                        <>
                          <span className="font-display text-base text-chalk/40 font-light line-through">{fmt(total)}</span>
                          <span className="font-display text-xl text-emerald-400 font-light">{fmt(total - Number(inv.discount_amount))}</span>
                        </>
                      ) : (
                        <span className="font-display text-xl text-chalk font-light">{fmt(total)}</span>
                      )}
                      <span className="font-body text-[10px] text-chalk/30">incl. {inv.tax_rate || 13}% VAT</span>
                      {inv.due_date && <span className="font-body text-xs text-chalk/30">Due: {inv.due_date}</span>}
                    </div>
                  </div>
                  {/* Days indicator */}
                  {inv.status === 'payment_requested' && inv.payment_due_date && (() => {
                    const d = daysUntil(inv.payment_due_date);
                    return (
                      <div className={`mt-2 inline-flex items-center gap-1.5 font-body text-xs px-3 py-1 border ${
                        d < 0 ? 'text-red-400 border-red-400/30 bg-red-400/5' : 'text-blue-400 border-blue-400/30 bg-blue-400/5'
                      }`}>
                        <Clock className="w-3 h-3" />
                        {d < 0 ? `${Math.abs(d)} days overdue · ` : `${d} days remaining · `}
                        Due: {inv.payment_due_date}
                      </div>
                    );
                  })()}

                  <div className="flex gap-2 flex-shrink-0 flex-wrap mt-2 sm:mt-0">
                    {/* View — always available */}
                    <button onClick={() => setViewing(inv)}
                      className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      <Eye className="w-3.5 h-3.5" /> View
                    </button>

                    {/* Email — always available */}
                    {inv.status !== 'paid' && inv.status !== 'cancelled' && (
                      <button onClick={() => setEmailingInv(inv)}
                        className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-violet-400/30 text-violet-400 hover:bg-violet-400/5 transition-all min-h-[36px]">
                        <Mail className="w-3.5 h-3.5" /> Email
                      </button>
                    )}

                    {/* Request Payment — only when not paid/cancelled/payment_requested (unless re-request enabled) */}
                    {inv.status === 'paid' || inv.status === 'cancelled' ? null
                      : inv.status === 'payment_requested' ? (() => {
                          const canReRequest = inv.payment_due_date && daysUntil(inv.payment_due_date) < 0;
                          return (
                            <button onClick={() => canReRequest ? setRequesting(inv) : undefined}
                              disabled={!canReRequest}
                              title={canReRequest ? 'Re-request payment' : 'Payment period not yet expired'}
                              className={`flex items-center gap-1.5 font-body text-xs px-3 py-2 border transition-all min-h-[36px] ${
                                canReRequest
                                  ? 'border-blue-400/30 text-blue-400 hover:bg-blue-400/5 cursor-pointer'
                                  : 'border-basalt/20 text-chalk/20 cursor-not-allowed'
                              }`}>
                              <Send className="w-3.5 h-3.5" />
                              {canReRequest ? 'Re-Request' : 'Requested'}
                            </button>
                          );
                        })()
                      : (
                        <button onClick={() => setRequesting(inv)}
                          className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-blue-400/30 text-blue-400 hover:bg-blue-400/5 transition-all min-h-[36px]">
                          <Send className="w-3.5 h-3.5" /> Request
                        </button>
                      )
                    }

                    {/* Delete — blocked for paid */}
                    {inv.status !== 'paid' && (
                      <button onClick={() => handleDelete(inv.id)}
                        className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-all min-h-[36px]">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {viewing && <VATInvoicePreview inv={viewing} onClose={() => setViewing(null)} />}
        {requesting && <PaymentRequestModal inv={requesting} admin={admin} onClose={() => setRequesting(null)} onSuccess={loadInvoices} />}
        {emailingInv && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={() => setEmailingInv(null)}>
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="relative bg-background border border-border w-full max-w-sm p-8" onClick={e => e.stopPropagation()}>
              <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
              <p className="font-display text-xl text-chalk font-light mb-2">Email Invoice</p>
              <p className="font-body text-xs text-chalk/40 mb-5">Send invoice {emailingInv.invoice_number} to <strong>{emailingInv.client_email}</strong></p>
              <div className="flex gap-3">
                <button onClick={() => handleSendEmail(emailingInv)} disabled={emailSending}
                  className="flex-1 flex items-center justify-center gap-2 font-body text-xs py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                  {emailSending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Email'}
                </button>
                <button onClick={() => setEmailingInv(null)} className="font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">Cancel</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}