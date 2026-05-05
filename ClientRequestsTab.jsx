import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, X, Check, DollarSign, Clock, AlertCircle, MessageSquare, Loader2, Bell } from 'lucide-react';

const ALL_SERVICES = [
  'Statutory Audit', 'Internal Audit', 'Tax Advisory', 'VAT Compliance',
  'Corporate Tax Filing', 'Financial Advisory', 'Business Valuation',
  'Due Diligence', 'Bookkeeping', 'Payroll Management', 'General Consultation',
];

const TYPE_CONFIG = {
  payment_request: { label: 'Payment Request', color: 'text-saffron border-saffron/30 bg-saffron/5' },
  advance_request: { label: 'Advance Request', color: 'text-violet-400 border-violet-400/30 bg-violet-400/5' },
  followup:        { label: 'Follow-up',        color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
};

const STATUS_COLORS = {
  pending:      'text-amber-400 border-amber-400/30 bg-amber-400/5',
  acknowledged: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  paid:         'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  cancelled:    'text-basalt border-basalt/30 bg-basalt/5',
};

function formatNPR(n) {
  return 'NPR ' + Number(n).toLocaleString('en-IN');
}

export default function PaymentRequestTab({ user, isAdmin }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    client_id: '', client_name: '', client_email: '',
    request_type: isAdmin ? 'payment_request' : 'followup',
    amount: '', description: '', due_date: '',
  });
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.PaymentRequest.list('-created_date', 100);
    setRequests(data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client_id || !form.request_type) return;
    setSaving(true);
    await base44.entities.PaymentRequest.create({
     ...form,
     amount: form.amount ? Number(form.amount) : undefined,
     status: 'pending',
     requested_by: user?.email,
    });
    setSaving(false);
    setForm({ client_id: '', client_name: '', client_email: '', request_type: isAdmin ? 'payment_request' : 'followup', amount: '', description: '', due_date: '' });
    setShowForm(false);
    loadData();
  };

  const updateStatus = async (req, status) => {
    await base44.entities.PaymentRequest.update(req.id, { status });
    loadData();
  };

  const availableTypes = isAdmin
    ? [['payment_request', 'Payment Request'], ['advance_request', 'Advance Request'], ['followup', 'Follow-up']]
    : [['followup', 'Follow-up']];

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-chalk font-light">
            {isAdmin ? 'Payment & Follow-up Requests' : 'Client Follow-ups'}
          </h2>
          <p className="font-body text-xs text-chalk/35 mt-1">
            {isAdmin ? 'Request payments, advances, or send follow-ups to clients.' : 'Send follow-up reminders to clients.'}
          </p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 min-h-[44px]">
          <Plus className="w-4 h-4" /> {isAdmin ? 'New Request' : 'New Follow-up'}
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 mb-8 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">New {isAdmin ? 'Request' : 'Follow-up'}</p>
              <button onClick={() => setShowForm(false)} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Type</label>
                <select value={form.request_type} onChange={e => setForm(p => ({ ...p, request_type: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                  {availableTypes.map(([val, label]) => (
                    <option key={val} value={val} className="bg-background">{label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client ID *</label>
                <input type="text" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  placeholder="MB-XXXXXX"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Name</label>
                <input type="text" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Email</label>
                <input type="email" value={form.client_email} onChange={e => setForm(p => ({ ...p, client_email: e.target.value }))}
                  placeholder="email@example.com"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              {(form.request_type === 'payment_request' || form.request_type === 'advance_request') && (
                <>
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Amount (NPR)</label>
                    <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                      placeholder="e.g. 50000"
                      className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Due Date</label>
                    <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))}
                      className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Message / Description</label>
                <textarea rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Details for the client..."
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                  <Check className="w-4 h-4" /> {saving ? 'Sending...' : 'Send Request'}
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

      {requests.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <Bell className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req, i) => {
            const tc = TYPE_CONFIG[req.request_type] || TYPE_CONFIG.followup;
            const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
            return (
              <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${tc.color}`}>{tc.label}</span>
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc}`}>{req.status}</span>
                  </div>
                  <p className="font-body text-sm text-chalk">{req.client_name || req.client_id}</p>
                  {req.amount && <p className="font-display text-lg text-chalk font-light">{formatNPR(req.amount)}</p>}
                  {req.description && <p className="font-body text-xs text-chalk/40 mt-1">{req.description}</p>}
                  <div className="flex items-center gap-4 mt-1">
                    {req.due_date && <span className="font-body text-xs text-chalk/30 flex items-center gap-1"><Clock className="w-3 h-3" /> Due: {req.due_date}</span>}
                    <span className="font-body text-[10px] text-chalk/25">by {req.requested_by}</span>
                  </div>
                </div>
                {req.status === 'pending' && isAdmin && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => updateStatus(req, 'paid')}
                      className="font-body text-xs px-3 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all min-h-[36px]">
                      Mark Paid
                    </button>
                    <button onClick={() => updateStatus(req, 'acknowledged')}
                      className="font-body text-xs px-3 py-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all min-h-[36px]">
                      Acknowledged
                    </button>
                    <button onClick={() => updateStatus(req, 'cancelled')}
                      className="font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/30 hover:text-chalk transition-all min-h-[36px]">
                      Cancel
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}