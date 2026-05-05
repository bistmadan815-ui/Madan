import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, Trash2, Edit2, Loader2, Search, X, ChevronRight, FileText, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

const STATUS_COLORS = {
  active:    'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  pending:   'text-amber-400 border-amber-400/30 bg-amber-400/5',
  suspended: 'text-red-400 border-red-400/30 bg-red-400/5',
};

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

const emptyForm = {
  full_name: '', email: '', phone: '', company_name: '', industry: '',
  pan_number: '', registration_number: '', address: '', branch_details: '', status: 'active',
};

// ── Client Dashboard View ──────────────────────────────
function ClientDashboardModal({ client, onClose }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const data = await base44.entities.Invoice.filter({ client_id: client.client_id }, '-created_date', 100);
      setInvoices(data);
      setLoading(false);
    })();
  }, []);

  const totalInvoices = invoices.length;
  const paid = invoices.filter(i => i.status === 'paid');
  const pending = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
  const totalPaid = paid.reduce((s, i) => s + (Number(i.amount) * (1 + (i.tax_rate || 13) / 100)), 0);
  const totalPending = pending.reduce((s, i) => s + (Number(i.amount) * (1 + (i.tax_rate || 13) / 100)), 0);
  const fmt = n => 'NPR ' + Math.round(n).toLocaleString('en-IN');

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/80 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
        className="relative bg-background border border-border w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div>
            <p className="font-body text-xs tracking-widest uppercase text-saffron mb-1">Client Profile</p>
            <h2 className="font-display text-2xl text-chalk font-light">{client.full_name}</h2>
            <p className="font-body text-sm text-chalk/40 mt-0.5">{client.company_name} · {client.client_id}</p>
          </div>
          <button onClick={onClose} className="text-chalk/30 hover:text-chalk"><X className="w-5 h-5" /></button>
        </div>

        {/* Details */}
        <div className="p-6 border-b border-border">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Email',           value: client.email },
              { label: 'Phone',           value: client.phone || '—' },
              { label: 'Industry',        value: client.industry || '—' },
              { label: 'PAN Number',      value: client.pan_number || '—' },
              { label: 'Reg. Number',     value: client.registration_number || '—' },
              { label: 'Address',         value: client.address || '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-0.5">{label}</p>
                <p className="font-body text-sm text-chalk/70">{value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 mt-4">
            <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[client.status]}`}>{client.status}</span>
            {client.desired_services?.length > 0 && (
              <span className="font-body text-[10px] text-chalk/30">{client.desired_services.length} service(s) enrolled</span>
            )}
          </div>
        </div>

        {/* Invoice Summary */}
        <div className="p-6">
          <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-4">Invoice Summary</p>
          {loading ? (
            <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Invoices',    value: totalInvoices,    color: 'text-chalk' },
                  { label: 'Paid',              value: paid.length,      color: 'text-emerald-400' },
                  { label: 'Pending / Overdue', value: pending.length,   color: 'text-amber-400' },
                  { label: 'Total Paid',        value: fmt(totalPaid),   color: 'text-emerald-400' },
                ].map(s => (
                  <div key={s.label} className="border border-border p-4">
                    <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">{s.label}</p>
                    <p className={`font-display text-xl font-light ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent transactions */}
              {invoices.length > 0 && (
                <div>
                  <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-3">Recent Transactions</p>
                  <div className="space-y-2 max-h-52 overflow-y-auto">
                    {invoices.slice(0, 8).map(inv => {
                      const total = Number(inv.amount) * (1 + (inv.tax_rate || 13) / 100);
                      const StatusIcon = inv.status === 'paid' ? CheckCircle2 : inv.status === 'overdue' ? AlertCircle : Clock;
                      const sc = inv.status === 'paid' ? 'text-emerald-400' : inv.status === 'overdue' ? 'text-red-400' : 'text-amber-400';
                      return (
                        <div key={inv.id} className="flex items-center justify-between gap-3 py-2 border-b border-basalt/10">
                          <div className="flex items-center gap-2 min-w-0">
                            <StatusIcon className={`w-3.5 h-3.5 ${sc} flex-shrink-0`} />
                            <p className="font-body text-xs text-chalk/60 truncate">{inv.service}</p>
                          </div>
                          <div className="flex items-center gap-3 flex-shrink-0">
                            <span className="font-body text-xs text-chalk">{fmt(total)}</span>
                            <span className="font-body text-[10px] text-chalk/30">{inv.due_date || '—'}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {totalPending > 0 && (
                    <div className="mt-3 border border-amber-400/20 bg-amber-400/5 p-3">
                      <p className="font-body text-xs text-amber-400">Outstanding Balance: <strong>{fmt(totalPending)}</strong></p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Main Component ──────────────────────────────
export default function ClientsTab() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewing, setViewing] = useState(null);

  useEffect(() => { loadClients(); }, []);

  const loadClients = async () => {
    setLoading(true);
    const data = await base44.entities.ClientProfile.list('-created_date', 200);
    setClients(data);
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.company_name) { setError('Name, email and company are required'); return; }
    setSaving(true);
    try {
      if (editingClient) {
        await base44.entities.ClientProfile.update(editingClient.id, form);
      } else {
        await base44.entities.ClientProfile.create(form);
      }
      setForm(emptyForm);
      setEditingClient(null);
      setShowForm(false);
      loadClients();
    } catch (err) { setError(err.message); }
    setSaving(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this client?')) {
      await base44.entities.ClientProfile.delete(id);
      loadClients();
    }
  };

  const handleEdit = (client) => {
    setEditingClient(client);
    setForm({ ...emptyForm, ...client });
    setShowForm(true);
  };

  const toggleStatus = async (client) => {
    const newStatus = client.status === 'active' ? 'suspended' : 'active';
    await base44.entities.ClientProfile.update(client.id, { status: newStatus });
    loadClients();
  };

  const filtered = clients.filter(c => {
    const matchSearch = !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.pan_number?.includes(search) || c.client_id?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || c.status === filterStatus;
    return matchSearch && matchStatus;
  });

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl text-chalk font-light">Clients Management <span className="font-body text-sm text-chalk/30 ml-2">({clients.length})</span></h3>
        <button onClick={() => { setEditingClient(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 font-body text-xs px-4 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all min-h-[44px]">
          <Plus className="w-4 h-4" /> New Client
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name, PAN, Client ID..."
            className="w-full bg-transparent border-b border-basalt/30 py-2 pl-6 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
        </div>
        <div className="flex gap-2">
          {[['all', 'All'], ['active', 'Active'], ['suspended', 'Inactive'], ['pending', 'Pending']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              className={`font-body text-xs px-3 py-2 border transition-all ${filterStatus === val ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:text-chalk'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 mb-6 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <div className="flex items-center justify-between mb-5">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">{editingClient ? 'Edit Client' : 'New Client'}</p>
              <button onClick={() => setShowForm(false)} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-5">
              {/* Basic Info */}
              <div>
                <p className="font-body text-xs tracking-widest uppercase text-saffron/70 mb-3">Basic Information</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'full_name',   label: 'Full Name *',    type: 'text' },
                    { key: 'email',       label: 'Email *',        type: 'email' },
                    { key: 'phone',       label: 'Phone Number',   type: 'tel' },
                    { key: 'company_name',label: 'Company Name *', type: 'text' },
                    { key: 'industry',    label: 'Industry',       type: 'text' },
                  ].map(({ key, label, type }) => (
                    <div key={key}>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">{label}</label>
                      <input type={type} value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Business Details */}
              <div className="border-t border-basalt/20 pt-4">
                <p className="font-body text-xs tracking-widest uppercase text-saffron/70 mb-3">Business & Compliance</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'pan_number',          label: 'PAN Number' },
                    { key: 'registration_number',  label: 'Registration Number' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">{label}</label>
                      <input type="text" value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Address</label>
                    <input type="text" value={form.address || ''} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} className={inputCls} />
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Status</label>
                    <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                      className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                      <option value="active" className="bg-background">Active</option>
                      <option value="pending" className="bg-background">Pending</option>
                      <option value="suspended" className="bg-background">Suspended (Inactive)</option>
                    </select>
                  </div>
                </div>
              </div>

              {error && <p className="font-body text-xs text-red-400">{error}</p>}
              <div className="flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingClient ? 'Update Client' : 'Create Client'}
                </button>
                <button type="button" onClick={() => setShowForm(false)}
                  className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">Cancel</button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Client List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <p className="font-body text-sm text-chalk/25">No clients found.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((client, i) => (
            <motion.div key={client.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
              className="border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[client.status]}`}>{client.status}</span>
                    {client.client_id && <span className="font-body text-[10px] text-chalk/30">{client.client_id}</span>}
                  </div>
                  <p className="font-body text-sm text-chalk font-medium">{client.full_name}</p>
                  <p className="font-body text-xs text-chalk/40 mt-0.5">{client.company_name} {client.industry ? `· ${client.industry}` : ''}</p>
                  <div className="flex items-center gap-4 mt-1 flex-wrap">
                    <span className="font-body text-xs text-chalk/30">{client.email}</span>
                    {client.pan_number && <span className="font-body text-xs text-chalk/25">PAN: {client.pan_number}</span>}
                    {client.phone && <span className="font-body text-xs text-chalk/25">{client.phone}</span>}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap">
                  <button onClick={() => setViewing(client)}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-saffron/30 text-saffron hover:bg-saffron/10 transition-all min-h-[36px]">
                    <FileText className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => toggleStatus(client)}
                    className={`font-body text-xs px-3 py-2 border transition-all min-h-[36px] ${client.status === 'active' ? 'border-amber-400/30 text-amber-400 hover:bg-amber-400/5' : 'border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/5'}`}>
                    {client.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                  <button onClick={() => handleEdit(client)}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleDelete(client.id)}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-all min-h-[36px]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {viewing && <ClientDashboardModal client={viewing} onClose={() => setViewing(null)} />}
      </AnimatePresence>
    </div>
  );
}