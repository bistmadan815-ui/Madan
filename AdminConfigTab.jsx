import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import ContractViewerModal from '../ContractViewerModal';
import { Plus, FileText, Download, Trash2, Loader2, Eye } from 'lucide-react';

const CONTRACT_TEMPLATE = (clientName, service, fees) => `
SERVICE AGREEMENT

This Agreement is entered into between M. BISTA & ASSOCIATES (hereinafter referred to as "Service Provider") 
and ${clientName} (hereinafter referred to as "Client").

1. SCOPE OF SERVICES
The Service Provider agrees to provide the following service(s):
${service}

2. FEES AND PAYMENT TERMS
Total Service Fee: NPR ${fees}
Payment Terms: As mutually agreed

3. TERM AND TERMINATION
This agreement shall commence from the date hereof and continue until completion of services.

4. CONFIDENTIALITY
Both parties agree to maintain confidentiality of all proprietary information.

5. GOVERNING LAW
This agreement shall be governed by the laws of Nepal.

Authorized by: M. BISTA & ASSOCIATES
Date: ${new Date().toLocaleDateString()}
`;

export default function ContractsTab() {
  const [contracts, setContracts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
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
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadContracts();
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await base44.entities.ClientProfile.list('-created_date', 100);
      setClients(data);
    } catch (e) {
      console.error('Error loading clients:', e);
    }
  };

  const handleClientSelect = (clientId) => {
    const selectedClient = clients.find(c => c.id === clientId);
    if (selectedClient) {
      setForm(p => ({
        ...p,
        client_id: selectedClient.client_id,
        client_name: selectedClient.company_name,
        client_pan: selectedClient.pan_number || '',
        client_registration: selectedClient.registration_number || '',
        client_address: selectedClient.address || '',
      }));
    }
  };

  const loadContracts = async () => {
    setLoading(true);
    try {
      const data = await base44.entities.Contract.list('-created_date', 50);
      setContracts(data);
    } catch (e) {
      setContracts([]);
    }
    setLoading(false);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.client_name || !form.service_type) {
      setError('Client Name and Service Type are required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const contractNumber = form.contract_number || 'MBC-' + Date.now().toString().slice(-6);
      await base44.entities.Contract.create({ ...form, contract_number: contractNumber });
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
      setShowForm(false);
      loadContracts();
    } catch (e) {
      setError('Error creating contract: ' + (e.message || 'Unknown error'));
      console.error(e);
    }
    setSaving(false);
  };

  const handleDownload = (contract) => {
    const content = contract.description || CONTRACT_TEMPLATE(contract.client_name, '', '');
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', `contract-${contract.client_name}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this contract?')) {
      await base44.entities.Contract.delete(id);
      loadContracts();
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display text-xl text-chalk font-light">Service Contracts</h3>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 font-body text-xs px-4 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all min-h-[44px]">
          <Plus className="w-4 h-4" /> New Contract
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-border p-6 mb-6 max-h-[70vh] overflow-y-auto">
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Contract Basics */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Contract Number</label>
                <input type="text" value={form.contract_number} onChange={e => setForm(p => ({ ...p, contract_number: e.target.value }))}
                  placeholder="Auto-generated" className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk/50 focus:border-saffron focus:outline-none" />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Contract Date</label>
                <input type="date" value={form.contract_date} onChange={e => setForm(p => ({ ...p, contract_date: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
              </div>
            </div>

            {/* Client Selection */}
            <div className="border-t border-basalt/20 pt-4 mt-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">Select Client</p>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Choose Client</label>
                <select onChange={e => handleClientSelect(e.target.value)}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                  <option value="" className="bg-background text-chalk/40">Select a client...</option>
                  {clients.map(c => <option key={c.id} value={c.id} className="bg-background text-chalk">{c.client_id} - {c.company_name}</option>)}
                </select>
              </div>
            </div>

            {/* Client Details */}
            <div className="border-t border-basalt/20 pt-4 mt-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">Client Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Client ID</label>
                  <input type="text" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}
                    placeholder="MB-XXXXXX" className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Client Name *</label>
                  <input type="text" value={form.client_name} onChange={e => setForm(p => ({ ...p, client_name: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Client PAN</label>
                  <input type="text" value={form.client_pan} onChange={e => setForm(p => ({ ...p, client_pan: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Client Registration</label>
                  <input type="text" value={form.client_registration} onChange={e => setForm(p => ({ ...p, client_registration: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div className="col-span-2">
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Client Address</label>
                  <textarea value={form.client_address} onChange={e => setForm(p => ({ ...p, client_address: e.target.value }))} rows={2}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* Firm Details */}
            <div className="border-t border-basalt/20 pt-4 mt-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">Firm Information</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Firm Name</label>
                  <input type="text" value={form.firm_name} onChange={e => setForm(p => ({ ...p, firm_name: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Firm PAN</label>
                  <input type="text" value={form.firm_pan} onChange={e => setForm(p => ({ ...p, firm_pan: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Firm Registration</label>
                  <input type="text" value={form.firm_registration} onChange={e => setForm(p => ({ ...p, firm_registration: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Firm Address</label>
                  <input type="text" value={form.firm_address} onChange={e => setForm(p => ({ ...p, firm_address: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Service & Dates */}
            <div className="border-t border-basalt/20 pt-4 mt-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">Service Details</p>
              <div className="space-y-3">
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Service Type *</label>
                  <textarea value={form.service_type} onChange={e => setForm(p => ({ ...p, service_type: e.target.value }))} rows={2}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Effective Date</label>
                    <input type="date" value={form.effective_date} onChange={e => setForm(p => ({ ...p, effective_date: e.target.value }))}
                      className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                  </div>
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">End / Termination Date</label>
                    <input type="date" value={form.end_date} onChange={e => setForm(p => ({ ...p, end_date: e.target.value }))}
                      className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Terms & Conditions</label>
                  <textarea value={form.contract_terms} onChange={e => setForm(p => ({ ...p, contract_terms: e.target.value }))} rows={3}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none resize-none" />
                </div>
              </div>
            </div>

            {/* Signatories */}
            <div className="border-t border-basalt/20 pt-4 mt-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">Signatories</p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Client Signatory Name</label>
                  <input type="text" value={form.client_signatory_name} onChange={e => setForm(p => ({ ...p, client_signatory_name: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Client Signatory Title</label>
                  <input type="text" value={form.client_signatory_title} onChange={e => setForm(p => ({ ...p, client_signatory_title: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Firm Signatory Name</label>
                  <input type="text" value={form.firm_signatory_name} onChange={e => setForm(p => ({ ...p, firm_signatory_name: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Firm Signatory Title</label>
                  <input type="text" value={form.firm_signatory_title} onChange={e => setForm(p => ({ ...p, firm_signatory_title: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
              </div>
            </div>

            {/* Additional */}
            <div className="border-t border-basalt/20 pt-4 mt-4">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Additional Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none resize-none" />
              </div>
            </div>
            {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded font-body text-xs">{error}</div>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 font-body text-xs px-4 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Create Contract'}
              </button>
              <button type="button" onClick={() => setShowForm(false)}
                className="font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid gap-3">
        {contracts.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-basalt/20">
            <FileText className="w-8 h-8 text-chalk/15 mx-auto mb-2" />
            <p className="font-body text-xs text-chalk/30">No contracts</p>
          </div>
        ) : (
          contracts.map((contract, i) => (
            <motion.div key={contract.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="border border-border p-4 flex items-center justify-between gap-3">
              <div className="flex-1">
                <p className="font-body text-sm text-chalk">{contract.client_name || 'N/A'}</p>
                <p className="font-body text-xs text-chalk/40 mt-1 truncate">{contract.contract_number}</p>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setViewing(contract)}
                  className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                  <Eye className="w-3.5 h-3.5" /> View
                </button>
                <button onClick={() => handleDelete(contract.id)}
                  className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-all min-h-[36px]">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>

      {viewing && <ContractViewerModal contract={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}