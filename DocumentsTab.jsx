import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, X, Check, Loader2, FileText, Eye, Trash2 } from 'lucide-react';
import ContractViewerModal from '@/components/ContractViewerModal';
import { ALL_SERVICES } from '@/utils/constants';

const STATUS_COLORS = {
  draft: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  signed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  active: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  expired: 'text-red-400 border-red-400/30 bg-red-400/5',
  terminated: 'text-red-400 border-red-400/30 bg-red-400/5',
};

export default function ContractsManagement() {
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);

  const [form, setForm] = useState({
    contract_number: '',
    client_id: '',
    client_name: '',
    client_pan: '',
    client_registration: '',
    client_address: '',
    firm_name: 'M. Bista & Associates',
    firm_pan: '',
    firm_registration: '',
    firm_address: 'Kathmandu, Nepal',
    service_type: '',
    contract_terms: '',
    contract_date: '',
    effective_date: '',
    end_date: '',
    client_signatory_name: '',
    client_signatory_title: '',
    firm_signatory_name: '',
    firm_signatory_title: '',
    status: 'draft',
    notes: '',
  });

  const loadContracts = async () => {
    setLoading(true);
    const data = await base44.entities.Contract.list('-created_date', 100);
    setContracts(data);
    setLoading(false);
  };

  useEffect(() => { loadContracts(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.contract_number || !form.client_id || !form.service_type) return;
    setSaving(true);
    if (editing) {
      await base44.entities.Contract.update(editing.id, form);
    } else {
      await base44.entities.Contract.create(form);
    }
    setSaving(false);
    setForm({
      contract_number: '',
      client_id: '',
      client_name: '',
      client_pan: '',
      client_registration: '',
      client_address: '',
      firm_name: 'M. Bista & Associates',
      firm_pan: '',
      firm_registration: '',
      firm_address: 'Kathmandu, Nepal',
      service_type: '',
      contract_terms: '',
      contract_date: '',
      effective_date: '',
      end_date: '',
      client_signatory_name: '',
      client_signatory_title: '',
      firm_signatory_name: '',
      firm_signatory_title: '',
      status: 'draft',
      notes: '',
    });
    setEditing(null);
    setShowForm(false);
    loadContracts();
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this contract?')) {
      setDeleting(id);
      await base44.entities.Contract.delete(id);
      setDeleting(null);
      loadContracts();
    }
  };

  const handleStatusChange = async (contract, newStatus) => {
    await base44.entities.Contract.update(contract.id, { status: newStatus });
    loadContracts();
  };

  const handleEdit = (contract) => {
    setEditing(contract);
    setForm(contract);
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditing(null);
    setShowForm(false);
    setForm({
      contract_number: '',
      client_id: '',
      client_name: '',
      client_pan: '',
      client_registration: '',
      client_address: '',
      firm_name: 'M. Bista & Associates',
      firm_pan: '',
      firm_registration: '',
      firm_address: 'Kathmandu, Nepal',
      service_type: '',
      contract_terms: '',
      contract_date: '',
      effective_date: '',
      end_date: '',
      client_signatory_name: '',
      client_signatory_title: '',
      firm_signatory_name: '',
      firm_signatory_title: '',
      status: 'draft',
      notes: '',
    });
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-chalk font-light">Contracts</h2>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 min-h-[44px]">
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 mb-8 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">{editing ? 'Edit Contract' : 'New Contract'}</p>
              <button onClick={handleCancelEdit} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Contract Number *</label>
                <input type="text" value={form.contract_number} onChange={e => setForm(p => ({ ...p, contract_number: e.target.value }))}
                  placeholder="e.g., CT-2026-001"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client ID *</label>
                <input type="text" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                  placeholder="MB-XXXXXX"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Official Name</label>
                <input type="text" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                  placeholder="Official registered name"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client PAN</label>
                <input type="text" value={form.client_pan} onChange={e => setForm(p => ({ ...p, client_pan: e.target.value }))}
                  placeholder="PAN number"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Registration #</label>
                <input type="text" value={form.client_registration} onChange={e => setForm(p => ({ ...p, client_registration: e.target.value }))}
                  placeholder="Registration number"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Address</label>
                <input type="text" value={form.client_address} onChange={e => setForm(p => ({ ...p, client_address: e.target.value }))}
                  placeholder="Full address"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Firm PAN</label>
                <input type="text" value={form.firm_pan} onChange={e => setForm(p => ({ ...p, firm_pan: e.target.value }))}
                  placeholder="Firm PAN number"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Firm Registration #</label>
                <input type="text" value={form.firm_registration} onChange={e => setForm(p => ({ ...p, firm_registration: e.target.value }))}
                  placeholder="Firm registration number"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Service Type *</label>
                <select value={form.service_type} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                  <option value="" className="bg-background">Select service</option>
                  {ALL_SERVICES.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Contract Date</label>
                <input type="date" value={form.contract_date} onChange={e => setForm(p => ({ ...p, contract_date: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Effective Date</label>
                <input type="date" value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">End Date</label>
                <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Signatory Name</label>
                <input type="text" value={form.client_signatory_name} onChange={e => setForm(p => ({ ...p, client_signatory_name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client Signatory Title</label>
                <input type="text" value={form.client_signatory_title} onChange={e => setForm(p => ({ ...p, client_signatory_title: e.target.value }))}
                  placeholder="Title/Designation"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Firm Signatory Name</label>
                <input type="text" value={form.firm_signatory_name} onChange={e => setForm(p => ({ ...p, firm_signatory_name: e.target.value }))}
                  placeholder="Full name"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Firm Signatory Title</label>
                <input type="text" value={form.firm_signatory_title} onChange={e => setForm(p => ({ ...p, firm_signatory_title: e.target.value }))}
                  placeholder="Title/Designation"
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Contract Terms & Conditions</label>
                <textarea rows={3} value={form.contract_terms} onChange={e => setForm(p => ({ ...p, contract_terms: e.target.value }))}
                  placeholder="Enter terms and conditions..."
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                  <option value="draft" className="bg-background">Draft</option>
                  <option value="signed" className="bg-background">Signed</option>
                  <option value="active" className="bg-background">Active</option>
                  <option value="expired" className="bg-background">Expired</option>
                  <option value="terminated" className="bg-background">Terminated</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" disabled={saving}
                  className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                  <Check className="w-4 h-4" /> {saving ? (editing ? 'Updating...' : 'Creating...') : (editing ? 'Update Contract' : 'Create Contract')}
                </button>
                <button type="button" onClick={handleCancelEdit}
                  className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk transition-all min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {contracts.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <FileText className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No Contracts</p>
        </div>
      ) : (
        <div className="space-y-3">
          {contracts.map((contract, i) => (
            <motion.div key={contract.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
              className="border border-border p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[contract.status]}`}>{contract.status}</span>
                    <span className="font-body text-xs text-chalk/30">{contract.contract_number}</span>
                  </div>
                  <p className="font-body text-sm text-chalk">{contract.service_type}</p>
                  <p className="font-body text-xs text-chalk/40 mt-0.5">{contract.client_name} ({contract.client_id})</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button onClick={() => setViewing(contract)}
                    className="flex items-center gap-1.5 font-body text-xs px-4 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button onClick={() => handleEdit(contract)}
                    className="flex items-center gap-1.5 font-body text-xs px-4 py-2 border border-violet-500/30 text-violet-400 hover:bg-violet-500/10 transition-all min-h-[36px]">
                    Edit
                  </button>
                  {contract.status === 'draft' && (
                    <button onClick={() => handleStatusChange(contract, 'signed')}
                      className="font-body text-xs px-4 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 transition-all min-h-[36px]">
                      Mark Signed
                    </button>
                  )}
                  {contract.status === 'signed' && (
                    <button onClick={() => handleStatusChange(contract, 'active')}
                      className="font-body text-xs px-4 py-2 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-all min-h-[36px]">
                      Activate
                    </button>
                  )}
                  <button onClick={() => handleDelete(contract.id)} disabled={deleting === contract.id}
                    className="flex items-center gap-1.5 font-body text-xs px-4 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 disabled:opacity-50 transition-all min-h-[36px]">
                    {deleting === contract.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {viewing && <ContractViewerModal contract={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}