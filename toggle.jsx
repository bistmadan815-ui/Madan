import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Save, Plus, Trash2, Loader2, Check, Building2, FileText, CreditCard, Bell, ShieldCheck, Upload } from 'lucide-react';

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

const SECTIONS = [
  { id: 'company',      label: 'Company Details',    icon: Building2 },
  { id: 'invoice',      label: 'Invoice Settings',   icon: FileText },
  { id: 'payment',      label: 'Payment Settings',   icon: CreditCard },
  { id: 'notifications',label: 'Notifications',      icon: Bell },
  { id: 'access',       label: 'Access Control',     icon: ShieldCheck },
];

const DEFAULT_SETTINGS = {
  company_name: 'M. BISTA & ASSOCIATES',
  company_name_np: 'एम. बिस्ता र एसोसिएट्स',
  company_address: 'Kathmandu, Nepal',
  company_pan: '300XXXXXX',
  company_vat: 'VAT-300XXXXXX',
  company_phone: '+977-1-XXXXXXX',
  company_email: 'info@mbista.com.np',
  company_logo_url: '',
  company_signature_url: '',
  invoice_prefix: 'INV',
  invoice_vat_rate: '13',
  invoice_fiscal_year_auto: 'true',
  invoice_number_sequence: '1',
  payment_default_method: 'bank',
  notif_payment_request: 'true',
  notif_client_request: 'true',
  notif_overdue: 'true',
};

function useSettings(admin) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (async () => {
      const data = await base44.entities.SiteSettings.list('-created_date', 200);
      if (data.length > 0) {
        const map = {};
        data.forEach(s => { map[s.key] = s.value; });
        setSettings(prev => ({ ...prev, ...map }));
      }
      setLoading(false);
    })();
  }, []);

  const save = async (updates) => {
    setSaving(true);
    const merged = { ...settings, ...updates };
    setSettings(merged);
    const existing = await base44.entities.SiteSettings.list('-created_date', 200);
    const existingMap = {};
    existing.forEach(s => { existingMap[s.key] = s.id; });
    for (const [key, value] of Object.entries(updates)) {
      if (existingMap[key]) {
        await base44.entities.SiteSettings.update(existingMap[key], { value: String(value) });
      } else {
        await base44.entities.SiteSettings.create({ key, label: key.replace(/_/g, ' '), value: String(value) });
      }
    }
    // Audit log
    await base44.entities.AuditLog.create({
      actor_email: admin?.email || '',
      actor_name: admin?.full_name || '',
      actor_type: 'admin',
      action: 'updated_settings',
      entity_type: 'SiteSettings',
      entity_id: '',
      details: 'Config keys updated: ' + Object.keys(updates).join(', '),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return { settings, loading, saving, saved, save, setSettings };
}

// ── Company Settings Section ──────────────────────────────
function CompanySection({ settings, save, saving, saved }) {
  const [form, setForm] = useState({
    company_name: settings.company_name || '',
    company_name_np: settings.company_name_np || '',
    company_address: settings.company_address || '',
    company_pan: settings.company_pan || '',
    company_vat: settings.company_vat || '',
    company_phone: settings.company_phone || '',
    company_email: settings.company_email || '',
  });
  const [uploading, setUploading] = useState('');
  const logoRef = useRef();
  const sigRef = useRef();

  useEffect(() => {
    setForm({
      company_name: settings.company_name || '',
      company_name_np: settings.company_name_np || '',
      company_address: settings.company_address || '',
      company_pan: settings.company_pan || '',
      company_vat: settings.company_vat || '',
      company_phone: settings.company_phone || '',
      company_email: settings.company_email || '',
    });
  }, [settings.company_name]);

  const handleUpload = async (file, key) => {
    setUploading(key);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    await save({ [key]: file_url });
    setUploading('');
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[
          { key: 'company_name', label: 'Company Name (English)' },
          { key: 'company_name_np', label: 'Company Name (Nepali)' },
          { key: 'company_address', label: 'Address' },
          { key: 'company_pan', label: 'PAN Number' },
          { key: 'company_vat', label: 'VAT Registration Number' },
          { key: 'company_phone', label: 'Phone' },
          { key: 'company_email', label: 'Email' },
        ].map(({ key, label }) => (
          <div key={key}>
            <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">{label}</label>
            <input type="text" value={form[key] || ''} onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
          </div>
        ))}
      </div>

      {/* Logo & Signature uploads */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border-t border-basalt/20 pt-5">
        {[
          { key: 'company_logo_url', label: 'Company Logo', ref: logoRef },
          { key: 'company_signature_url', label: 'Authorized Signature', ref: sigRef },
        ].map(({ key, label, ref }) => (
          <div key={key}>
            <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">{label}</label>
            {settings[key] && <img src={settings[key]} alt={label} className="w-32 h-16 object-contain border border-basalt/20 p-2 mb-2" />}
            <button type="button" onClick={() => ref.current?.click()} disabled={uploading === key}
              className="flex items-center gap-2 font-body text-xs px-4 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all">
              {uploading === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading === key ? 'Uploading...' : 'Upload'}
            </button>
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleUpload(e.target.files[0], key)} />
          </div>
        ))}
      </div>

      <button onClick={() => save(form)} disabled={saving}
        className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Company Details'}
      </button>
    </div>
  );
}

// ── Invoice Settings Section ──────────────────────────────
function InvoiceSection({ settings, save, saving, saved }) {
  const [form, setForm] = useState({
    invoice_prefix: settings.invoice_prefix || 'INV',
    invoice_vat_rate: settings.invoice_vat_rate || '13',
    invoice_fiscal_year_auto: settings.invoice_fiscal_year_auto || 'true',
    invoice_number_sequence: settings.invoice_number_sequence || '1',
  });

  useEffect(() => {
    setForm({
      invoice_prefix: settings.invoice_prefix || 'INV',
      invoice_vat_rate: settings.invoice_vat_rate || '13',
      invoice_fiscal_year_auto: settings.invoice_fiscal_year_auto || 'true',
      invoice_number_sequence: settings.invoice_number_sequence || '1',
    });
  }, [settings.invoice_prefix]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Invoice Number Prefix</label>
          <input type="text" value={form.invoice_prefix} onChange={e => setForm(p => ({ ...p, invoice_prefix: e.target.value }))} placeholder="e.g. INV" className={inputCls} />
        </div>
        <div>
          <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">VAT Rate (%)</label>
          <input type="number" value={form.invoice_vat_rate} onChange={e => setForm(p => ({ ...p, invoice_vat_rate: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Invoice Sequence Start</label>
          <input type="number" value={form.invoice_number_sequence} onChange={e => setForm(p => ({ ...p, invoice_number_sequence: e.target.value }))} className={inputCls} />
        </div>
        <div>
          <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Fiscal Year (Auto-detect)</label>
          <select value={form.invoice_fiscal_year_auto} onChange={e => setForm(p => ({ ...p, invoice_fiscal_year_auto: e.target.value }))}
            className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
            <option value="true" className="bg-background">Auto (based on invoice date)</option>
            <option value="false" className="bg-background">Manual</option>
          </select>
        </div>
      </div>
      <div className="border border-saffron/20 bg-saffron/5 p-4 font-body text-xs text-chalk/50 space-y-1">
        <p className="text-saffron/70 uppercase tracking-widest">Invoice Number Preview</p>
        <p className="text-chalk/60 text-sm">{form.invoice_prefix}-{String(form.invoice_number_sequence).padStart(4, '0')} &nbsp;|&nbsp; Next: {form.invoice_prefix}-{String(Number(form.invoice_number_sequence) + 1).padStart(4, '0')}</p>
      </div>
      <button onClick={() => save(form)} disabled={saving}
        className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saved ? 'Saved!' : 'Save Invoice Settings'}
      </button>
    </div>
  );
}

// ── Payment Settings Section ──────────────────────────────
function PaymentSection({ settings, save, saving, saved, admin }) {
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBank, setEditingBank] = useState(null);
  const [bankForm, setBankForm] = useState({ bank_name: '', account_name: '', account_number: '', branch: '', is_default: false });
  const [bankSaving, setBankSaving] = useState(false);
  const BANK_ENTITY_KEY = 'bank_account';

  useEffect(() => { loadBanks(); }, []);

  const loadBanks = async () => {
    setLoading(true);
    const data = await base44.entities.SiteSettings.filter({ key: BANK_ENTITY_KEY }, '-created_date', 50);
    setBanks(data.map(d => ({ id: d.id, ...JSON.parse(d.value || '{}') })));
    setLoading(false);
  };

  const saveBank = async (e) => {
    e.preventDefault();
    setBankSaving(true);
    const val = JSON.stringify(bankForm);
    if (editingBank) {
      await base44.entities.SiteSettings.update(editingBank.id, { key: BANK_ENTITY_KEY, label: bankForm.bank_name, value: val });
    } else {
      await base44.entities.SiteSettings.create({ key: BANK_ENTITY_KEY, label: bankForm.bank_name, value: val });
    }
    await base44.entities.AuditLog.create({ actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin', action: editingBank ? 'updated_bank_account' : 'added_bank_account', entity_type: 'SiteSettings', entity_id: '', details: bankForm.bank_name });
    setBankSaving(false);
    setBankForm({ bank_name: '', account_name: '', account_number: '', branch: '', is_default: false });
    setEditingBank(null);
    setShowForm(false);
    loadBanks();
  };

  const deleteBank = async (id) => {
    if (confirm('Delete this bank account?')) {
      await base44.entities.SiteSettings.delete(id);
      loadBanks();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Default Payment Method</label>
        <select value={settings.payment_default_method || 'bank'} onChange={e => save({ payment_default_method: e.target.value })}
          className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none max-w-xs">
          {['cash', 'bank', 'other'].map(m => <option key={m} value={m} className="bg-background capitalize">{m.charAt(0).toUpperCase() + m.slice(1)}</option>)}
        </select>
      </div>

      <div className="border-t border-basalt/20 pt-5">
        <div className="flex items-center justify-between mb-4">
          <p className="font-body text-xs tracking-widest uppercase text-chalk/50">Bank Accounts</p>
          <button onClick={() => { setShowForm(true); setEditingBank(null); setBankForm({ bank_name: '', account_name: '', account_number: '', branch: '', is_default: false }); }}
            className="flex items-center gap-2 font-body text-xs px-4 py-2 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all min-h-[36px]">
            <Plus className="w-3.5 h-3.5" /> Add Bank
          </button>
        </div>

        {showForm && (
          <motion.form initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} onSubmit={saveBank} className="border border-border p-5 mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            {[['bank_name', 'Bank Name'], ['account_name', 'Account Name'], ['account_number', 'Account Number'], ['branch', 'Branch']].map(([key, label]) => (
              <div key={key}>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">{label}</label>
                <input type="text" value={bankForm[key] || ''} onChange={e => setBankForm(p => ({ ...p, [key]: e.target.value }))} className={inputCls} />
              </div>
            ))}
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" disabled={bankSaving}
                className="flex items-center gap-2 font-body text-xs px-4 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                {bankSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Bank'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">Cancel</button>
            </div>
          </motion.form>
        )}

        {loading ? (
          <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>
        ) : banks.length === 0 ? (
          <p className="font-body text-xs text-chalk/25 py-6 text-center">No bank accounts configured.</p>
        ) : (
          <div className="space-y-3">
            {banks.map(b => (
              <div key={b.id} className="border border-border p-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-body text-sm text-chalk font-medium">{b.bank_name}</p>
                  <p className="font-body text-xs text-chalk/40 mt-0.5">{b.account_name} · {b.account_number}</p>
                  <p className="font-body text-xs text-chalk/30">{b.branch}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => { setEditingBank(b); setBankForm({ bank_name: b.bank_name, account_name: b.account_name, account_number: b.account_number, branch: b.branch }); setShowForm(true); }}
                    className="font-body text-xs px-3 py-1.5 border border-basalt/30 text-chalk/40 hover:border-saffron hover:text-saffron transition-all">Edit</button>
                  <button onClick={() => deleteBank(b.id)}
                    className="font-body text-xs px-3 py-1.5 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-all">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notifications Section ──────────────────────────────
function NotificationsSection({ settings, save, saving, saved }) {
  const toggles = [
    { key: 'notif_payment_request', label: 'Payment Request Alerts', desc: 'Notify admin when a payment is requested' },
    { key: 'notif_client_request', label: 'Client Request Alerts', desc: 'Notify admin when a client submits a request' },
    { key: 'notif_overdue', label: 'Overdue Invoice Alerts', desc: 'Notify admin when invoices become overdue' },
  ];
  return (
    <div className="space-y-4">
      {toggles.map(({ key, label, desc }) => {
        const enabled = settings[key] === 'true';
        return (
          <div key={key} className={`flex items-center justify-between p-5 border transition-all ${enabled ? 'border-saffron/30 bg-saffron/5' : 'border-border'}`}>
            <div>
              <p className="font-body text-sm text-chalk">{label}</p>
              <p className="font-body text-xs text-chalk/35 mt-0.5">{desc}</p>
            </div>
            <button onClick={() => save({ [key]: String(!enabled) })} disabled={saving}
              className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${enabled ? 'bg-saffron' : 'bg-basalt/30'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
          </div>
        );
      })}
      {saved && <p className="font-body text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />Settings saved.</p>}
    </div>
  );
}

// ── Access Control Section ──────────────────────────────
function AccessSection({ admin }) {
  const MODULE_LIST = ['Invoices', 'Clients', 'Documents', 'Payments', 'Client Requests', 'Dashboard', 'Contracts'];
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.AdminRole.list('-created_date', 50).then(data => { setRoles(data); setLoading(false); });
  }, []);

  return (
    <div>
      <p className="font-body text-xs text-chalk/40 mb-5">Role-based module access is managed through the <strong className="text-saffron">Roles tab</strong> in the Admin Portal. Below is a read-only overview of current roles and their permissions.</p>
      {loading ? (
        <div className="flex justify-center py-8"><div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>
      ) : roles.length === 0 ? (
        <p className="font-body text-xs text-chalk/25 py-6 text-center">No roles defined. Go to the Roles tab to create roles.</p>
      ) : (
        <div className="space-y-4">
          {roles.map(role => (
            <div key={role.id} className="border border-border p-5">
              <div className="flex items-center gap-3 mb-3">
                <p className="font-body text-sm text-chalk font-medium">{role.role_name}</p>
                {role.is_system_role && <span className="font-body text-[10px] text-saffron border border-saffron/30 px-2 py-0.5">System</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {(role.permissions || []).map(p => (
                  <span key={p} className="font-body text-[10px] tracking-widest uppercase px-2 py-1 border border-saffron/20 text-saffron/70">{p}</span>
                ))}
                {(!role.permissions || role.permissions.length === 0) && <span className="font-body text-xs text-chalk/25">No permissions defined</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────
export default function AdminConfigTab({ admin }) {
  const [section, setSection] = useState('company');
  const { settings, loading, saving, saved, save } = useSettings(admin);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex flex-col sm:flex-row gap-8">
      {/* Sidebar */}
      <div className="sm:w-52 flex-shrink-0">
        <nav className="space-y-1">
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setSection(id)}
              className={`w-full flex items-center gap-3 px-4 py-3 font-body text-sm transition-all text-left ${
                section === id ? 'text-saffron border-l-2 border-saffron bg-saffron/5 pl-3.5' : 'text-chalk/40 hover:text-chalk border-l-2 border-transparent'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" /> {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <motion.div key={section} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
          <div className="mb-6">
            <p className="font-body text-xs tracking-widest uppercase text-saffron mb-1">{SECTIONS.find(s => s.id === section)?.label}</p>
            <div className="h-px w-12 bg-saffron/30 mt-1" />
          </div>
          {section === 'company'       && <CompanySection settings={settings} save={save} saving={saving} saved={saved} />}
          {section === 'invoice'       && <InvoiceSection settings={settings} save={save} saving={saving} saved={saved} />}
          {section === 'payment'       && <PaymentSection settings={settings} save={save} saving={saving} saved={saved} admin={admin} />}
          {section === 'notifications' && <NotificationsSection settings={settings} save={save} saving={saving} saved={saved} />}
          {section === 'access'        && <AccessSection admin={admin} />}
        </motion.div>
      </div>
    </div>
  );
}