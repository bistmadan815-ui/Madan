import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, X, Check, Trash2, Loader2, Edit2 } from 'lucide-react';

const INDUSTRIES = [
  'Accounting & Finance', 'Agriculture', 'Banking & Insurance', 'Construction & Real Estate',
  'Education', 'Energy & Utilities', 'Healthcare & Pharmaceuticals', 'Hospitality & Tourism',
  'Import & Export', 'Information Technology', 'Legal Services', 'Manufacturing',
  'Media & Communications', 'Non-Profit / NGO', 'Retail & E-commerce', 'Telecommunications',
  'Transportation & Logistics', 'Other',
];

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none';

export default function ClientsManagement({ clients, onRefresh }) {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', company_name: '',
    pan_number: '', registration_number: '', address: '', branch_details: '',
    industry: '', status: 'active', registration_date: '', client_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const resetForm = () => {
    setForm({
      full_name: '', email: '', phone: '', company_name: '',
      pan_number: '', registration_number: '', address: '', branch_details: '',
      industry: '', status: 'active', registration_date: '', client_id: '',
    });
    setEditingId(null);
  };

  const openEdit = (client) => {
    setForm(client);
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.company_name || !form.industry) return;
    
    setSaving(true);
    if (editingId) {
      await base44.entities.ClientProfile.update(editingId, form);
    } else {
      const client_id = 'MBC-' + Math.random().toString(36).substr(2, 6).toUpperCase();
      await base44.entities.ClientProfile.create({ ...form, client_id, status: 'active' });
    }
    setSaving(false);
    resetForm();
    setShowForm(false);
    onRefresh();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this client?')) {
      setDeleting(id);
      await base44.entities.ClientProfile.delete(id);
      setDeleting(null);
      onRefresh();
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-chalk font-light">Client Management</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all min-h-[44px]">
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">{editingId ? 'Edit Client' : 'New Client'}</p>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Name *</label>
                <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Full name" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Company Name *</label>
                <input type="text" value={form.company_name} onChange={e => setForm(p => ({ ...p, company_name: e.target.value }))}
                  placeholder="Company name" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="email@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Contact Number</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+977-..." className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">PAN Number</label>
                <input type="text" value={form.pan_number} onChange={e => setForm(p => ({ ...p, pan_number: e.target.value }))}
                  placeholder="PAN number" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Registration Number</label>
                <input type="text" value={form.registration_number} onChange={e => setForm(p => ({ ...p, registration_number: e.target.value }))}
                  placeholder="Registration number" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Industry *</label>
                <select value={form.industry} onChange={e => setForm(p => ({ ...p, industry: e.target.value }))}
                  className={inputCls}>
                  <option value="">Select industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Date of Registration</label>
                <input type="date" value={form.registration_date} onChange={e => setForm(p => ({ ...p, registration_date: e.target.value }))}
                  className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Address</label>
                <textarea rows={2} value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
                  placeholder="Business address" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Branch Details</label>
                <textarea rows={2} value={form.branch_details} onChange={e => setForm(p => ({ ...p, branch_details: e.target.value }))}
                  placeholder="Branch information if applicable" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className={inputCls}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                  <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                </button>
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }}
                  className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {clients.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <p className="font-display text-xl text-chalk/20 font-light">No clients yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {clients.map((client, i) => (
            <motion.div key={client.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="border border-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
                      client.status === 'active' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' : 'text-amber-400 border-amber-400/30 bg-amber-400/5'
                    }`}>{client.status}</span>
                    <span className="font-body text-xs text-saffron font-medium">{client.client_id}</span>
                  </div>
                  <p className="font-body text-sm text-chalk mb-1">{client.full_name}</p>
                  <p className="font-body text-xs text-chalk/40">{client.company_name} · {client.industry}</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 text-xs text-chalk/30">
                    {client.phone && <p>📞 {client.phone}</p>}
                    {client.pan_number && <p>PAN: {client.pan_number}</p>}
                    {client.registration_number && <p>Reg: {client.registration_number}</p>}
                    {client.address && <p>📍 {client.address}</p>}
                    {client.branch_details && <p>Branch: {client.branch_details}</p>}
                    {client.registration_date && <p>Registered: {client.registration_date}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(client)}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron min-h-[36px]">
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button onClick={() => handleDelete(client.id)} disabled={deleting === client.id}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 disabled:opacity-50 min-h-[36px]">
                    {deleting === client.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}