import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { DEFAULT_TEAM, DEFAULT_SETTINGS, ALL_SERVICES, SPECIALIZATION_COLORS } from '@/utils/constants';
import ServiceContractManager from './ServiceContractManager';
import {
  Users, Settings, Plus, Pencil, Trash2, Check, X, Loader2,
  Upload, Phone, Mail, MapPin, Globe, Linkedin, MessageCircle, Hash, FileText
} from 'lucide-react';

const inputCls = 'w-full bg-transparent border-b border-white/20 py-2 font-body text-sm text-white placeholder:text-white/25 focus:border-saffron focus:outline-none transition-colors';
const labelCls = 'block font-body text-xs tracking-widest uppercase text-white/40 mb-1.5';

// ── Team Management ──────────────────────────────────────────────────
function TeamManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | 'new' | member object
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ name: '', title: '', qualification: '', specialization: 'Audit & Assurance', bio: '', initials: '', photo_url: '', order: 99 });

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.TeamMember.list('order', 50);
    setMembers(data.length > 0 ? data : []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openNew = () => {
    setForm({ name: '', title: '', qualification: '', specialization: 'Audit & Assurance', bio: '', initials: '', photo_url: '', order: members.length + 1 });
    setEditing('new');
  };

  const openEdit = (m) => {
    setForm({ ...m });
    setEditing(m);
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, photo_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.name || !form.title) return;
    setSaving(true);
    if (editing === 'new') {
      await base44.entities.TeamMember.create(form);
    } else {
      await base44.entities.TeamMember.update(editing.id, form);
    }
    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this team member?')) return;
    await base44.entities.TeamMember.delete(id);
    load();
  };

  const seedDefaults = async () => {
    setSaving(true);
    for (const m of DEFAULT_TEAM) {
      await base44.entities.TeamMember.create({ ...m, order: DEFAULT_TEAM.indexOf(m) + 1 });
    }
    setSaving(false);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-saffron" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl text-white font-light">Team Members</h3>
          <p className="font-body text-xs text-white/35 mt-0.5">Manage the team displayed on the homepage.</p>
        </div>
        <div className="flex gap-2">
          {members.length === 0 && (
            <button onClick={seedDefaults} disabled={saving}
              className="font-body text-xs px-4 py-2 border border-white/20 text-white/50 hover:text-white transition-all min-h-[36px]">
              Load Defaults
            </button>
          )}
          <button onClick={openNew}
            className="flex items-center gap-2 font-body text-xs px-4 py-2 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 transition-all min-h-[36px]">
            <Plus className="w-3.5 h-3.5" /> Add Member
          </button>
        </div>
      </div>

      <AnimatePresence>
        {editing && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="border border-saffron/30 bg-saffron/5 p-6 mb-6 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">{editing === 'new' ? 'New Team Member' : 'Edit Member'}</p>
              <button onClick={() => setEditing(null)}><X className="w-4 h-4 text-white/30 hover:text-white" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className={labelCls}>Full Name *</label><input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Full name" className={inputCls} /></div>
              <div><label className={labelCls}>Job Title *</label><input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior Partner" className={inputCls} /></div>
              <div><label className={labelCls}>Qualification</label><input value={form.qualification} onChange={e => setForm(p => ({ ...p, qualification: e.target.value }))} placeholder="e.g. FCA, ICAAN" className={inputCls} /></div>
              <div>
                <label className={labelCls}>Specialization</label>
                <select value={form.specialization} onChange={e => setForm(p => ({ ...p, specialization: e.target.value }))}
                  className="w-full bg-transparent border-b border-white/20 py-2 font-body text-sm text-white focus:border-saffron focus:outline-none appearance-none">
                  {['Audit & Assurance', 'Tax Advisory', 'Financial Advisory', 'Management', 'Other'].map(s => (
                    <option key={s} value={s} className="bg-background">{s}</option>
                  ))}
                </select>
              </div>
              <div><label className={labelCls}>Initials (2 letters)</label><input value={form.initials} onChange={e => setForm(p => ({ ...p, initials: e.target.value.slice(0, 2).toUpperCase() }))} placeholder="e.g. MB" maxLength={2} className={inputCls} /></div>
              <div><label className={labelCls}>Display Order</label><input type="number" value={form.order} onChange={e => setForm(p => ({ ...p, order: Number(e.target.value) }))} className={inputCls} /></div>
              <div className="sm:col-span-2"><label className={labelCls}>Biography</label><textarea rows={3} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))} placeholder="Brief professional biography..." className={`${inputCls} resize-none`} /></div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Profile Photo</label>
                <div className="flex items-center gap-3">
                  {form.photo_url && <img src={form.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border border-saffron/30" />}
                  <label className="flex items-center gap-2 cursor-pointer font-body text-xs px-3 py-2 border border-white/20 text-white/50 hover:text-white transition-all min-h-[36px]">
                    {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading ? 'Uploading...' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                  </label>
                  {form.photo_url && <button onClick={() => setForm(p => ({ ...p, photo_url: '' }))} className="font-body text-xs text-white/30 hover:text-red-400 transition-colors">Remove</button>}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} disabled={saving || !form.name || !form.title}
                className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-40 transition-all min-h-[36px]">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                {saving ? 'Saving...' : 'Save Member'}
              </button>
              <button onClick={() => setEditing(null)} className="font-body text-xs px-5 py-2.5 border border-white/20 text-white/40 uppercase tracking-wider hover:text-white transition-all min-h-[36px]">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {members.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10">
          <Users className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="font-body text-sm text-white/25">No team members yet. Click "Add Member" or "Load Defaults".</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((m, i) => (
            <motion.div key={m.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
              className="border border-white/10 p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {m.photo_url
                  ? <img src={m.photo_url} alt={m.name} className="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-saffron/30" />
                  : <div className="w-10 h-10 border border-white/20 flex items-center justify-center flex-shrink-0"><span className="font-display text-sm text-white/50">{m.initials || m.name.slice(0,2).toUpperCase()}</span></div>
                }
                <div className="min-w-0">
                  <p className="font-body text-sm text-white truncate">{m.name}</p>
                  <p className="font-body text-xs text-white/35 truncate">{m.title} · {m.qualification}</p>
                  <span className={`font-body text-[10px] tracking-widest uppercase px-1.5 py-0.5 border ${SPECIALIZATION_COLORS[m.specialization] || 'text-white/40 border-white/20'}`}>{m.specialization}</span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => openEdit(m)} className="p-2 text-white/30 hover:text-saffron transition-colors min-h-[36px]"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => handleDelete(m.id)} className="p-2 text-white/30 hover:text-red-400 transition-colors min-h-[36px]"><Trash2 className="w-4 h-4" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Site Settings Manager ──────────────────────────────────────────────
const SETTING_ICONS = { phone: Phone, email: Mail, whatsapp: MessageCircle, address: MapPin, website: Globe, linkedin: Linkedin, pan: Hash, vat: Hash };

function SiteSettingsManager() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState('');
  const [editValues, setEditValues] = useState({});
  const [addForm, setAddForm] = useState({ key: '', label: '', value: '' });
  const [showAdd, setShowAdd] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.SiteSettings.list('key', 50);
    setSettings(data);
    const vals = {};
    data.forEach(s => { vals[s.id] = s.value; });
    setEditValues(vals);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const seedDefaults = async () => {
    setSaving('seed');
    for (const s of DEFAULT_SETTINGS) {
      await base44.entities.SiteSettings.create(s);
    }
    setSaving('');
    load();
  };

  const handleSave = async (s) => {
    setSaving(s.id);
    await base44.entities.SiteSettings.update(s.id, { value: editValues[s.id] });
    setSaving('');
    load();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this setting?')) return;
    await base44.entities.SiteSettings.delete(id);
    load();
  };

  const handleAdd = async () => {
    if (!addForm.key || !addForm.value) return;
    setSaving('add');
    await base44.entities.SiteSettings.create(addForm);
    setSaving('');
    setAddForm({ key: '', label: '', value: '' });
    setShowAdd(false);
    load();
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-saffron" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-xl text-white font-light">Contact & Site Settings</h3>
          <p className="font-body text-xs text-white/35 mt-0.5">Phone, email, address, links — shown in the footer and across the site.</p>
        </div>
        <div className="flex gap-2">
          {settings.length === 0 && (
            <button onClick={seedDefaults} disabled={saving === 'seed'}
              className="font-body text-xs px-4 py-2 border border-white/20 text-white/50 hover:text-white transition-all min-h-[36px]">
              Load Defaults
            </button>
          )}
          <button onClick={() => setShowAdd(v => !v)}
            className="flex items-center gap-2 font-body text-xs px-4 py-2 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 transition-all min-h-[36px]">
            <Plus className="w-3.5 h-3.5" /> Add Setting
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="border border-saffron/30 bg-saffron/5 p-5 mb-5">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div><label className={labelCls}>Key (no spaces)</label><input value={addForm.key} onChange={e => setAddForm(p => ({ ...p, key: e.target.value.toLowerCase().replace(/\s/g, '_') }))} placeholder="e.g. phone2" className={inputCls} /></div>
              <div><label className={labelCls}>Label</label><input value={addForm.label} onChange={e => setAddForm(p => ({ ...p, label: e.target.value }))} placeholder="e.g. Office Phone" className={inputCls} /></div>
              <div><label className={labelCls}>Value</label><input value={addForm.value} onChange={e => setAddForm(p => ({ ...p, value: e.target.value }))} placeholder="e.g. +977-..." className={inputCls} /></div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleAdd} disabled={saving === 'add' || !addForm.key || !addForm.value}
                className="flex items-center gap-2 font-body text-xs px-4 py-2 bg-saffron text-background uppercase tracking-wider disabled:opacity-40 transition-all min-h-[34px]">
                {saving === 'add' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Save
              </button>
              <button onClick={() => setShowAdd(false)} className="font-body text-xs px-4 py-2 border border-white/20 text-white/40 hover:text-white transition-all min-h-[34px]">Cancel</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {settings.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10">
          <Settings className="w-8 h-8 text-white/15 mx-auto mb-3" />
          <p className="font-body text-sm text-white/25">No settings yet. Click "Load Defaults" or add manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {settings.map(s => {
            const Icon = SETTING_ICONS[s.key] || Settings;
            return (
              <div key={s.id} className="border border-white/10 p-4 flex items-center gap-4">
                <Icon className="w-4 h-4 text-saffron/60 flex-shrink-0" />
                <div className="w-28 flex-shrink-0">
                  <p className="font-body text-xs text-white/40">{s.label || s.key}</p>
                </div>
                <input
                  value={editValues[s.id] ?? s.value}
                  onChange={e => setEditValues(p => ({ ...p, [s.id]: e.target.value }))}
                  className="flex-1 bg-transparent border-b border-white/15 py-1 font-body text-sm text-white focus:border-saffron focus:outline-none transition-colors"
                />
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => handleSave(s)} disabled={saving === s.id}
                    className="p-1.5 text-white/30 hover:text-emerald-400 transition-colors min-h-[32px]">
                    {saving === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => handleDelete(s.id)} className="p-1.5 text-white/30 hover:text-red-400 transition-colors min-h-[32px]">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Export ─────────────────────────────────────────────────────────
export default function AdminContentManager({ isAdmin = false }) {
  const [tab, setTab] = useState('team');

  if (!isAdmin) {
    return (
      <div className="border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="font-body text-sm text-red-300">Only administrators can access content management.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-1">Admin Only</p>
        <h2 className="font-display text-2xl text-white font-light">Content Management</h2>
        <p className="font-body text-xs text-white/35 mt-1">Manage team members and site-wide settings shown publicly.</p>
      </div>

      <div className="flex gap-1 mb-8 border-b border-white/10">
        {[
          { id: 'team', label: 'Team Members', icon: Users },
          { id: 'settings', label: 'Contact & Links', icon: Settings },
          { id: 'contracts', label: 'Service Contracts', icon: FileText },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 font-body text-sm px-5 py-3 border-b-2 transition-all -mb-px ${
              tab === id ? 'border-saffron text-saffron' : 'border-transparent text-white/40 hover:text-white/70'
            }`}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      {tab === 'team' && <TeamManager />}
      {tab === 'settings' && <SiteSettingsManager />}
      {tab === 'contracts' && <ServiceContractManager />}
    </div>
  );
}