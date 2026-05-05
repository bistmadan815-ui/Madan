import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Upload, Loader2, Check, X } from 'lucide-react';

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';
const labelCls = 'block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2';

export default function EmployeeProfile({ user, onSaved }) {
  const [edit, setEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    full_name: user?.full_name || '',
    photo_url: user?.photo_url || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
  });

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, photo_url: file_url }));
    setUploading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({
      photo_url: form.photo_url,
      phone: form.phone,
      bio: form.bio,
    });
    setSaving(false);
    setEdit(false);
    if (onSaved) onSaved();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-chalk font-light">Profile</h2>
          <p className="font-body text-xs text-chalk/35 mt-1">Update your personal details and profile picture.</p>
        </div>
        {!edit && (
          <button onClick={() => setEdit(true)}
            className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 min-h-[44px]">
            Edit Profile
          </button>
        )}
      </div>

      <AnimatePresence>
        {edit ? (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 max-w-xl relative mb-6">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <p className="font-body text-xs tracking-widest uppercase text-saffron mb-4">Edit Your Profile</p>
            
            <div className="space-y-5">
              <div>
                <label className={labelCls}>Full Name</label>
                <input type="text" value={form.full_name} disabled placeholder="Name set by admin"
                  className={`${inputCls} opacity-50 cursor-not-allowed`} />
                <p className="font-body text-xs text-chalk/25 mt-1">Name is managed by administrators</p>
              </div>

              <div>
                <label className={labelCls}>Phone</label>
                <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+977-..." className={inputCls} />
              </div>

              <div>
                <label className={labelCls}>Bio</label>
                <textarea rows={3} value={form.bio} onChange={e => setForm(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Brief personal bio or professional summary..."
                  className={`${inputCls} resize-none`} />
              </div>

              <div>
                <label className={labelCls}>Profile Photo</label>
                <div className="flex items-center gap-4">
                  {form.photo_url && (
                    <img src={form.photo_url} alt="Profile" className="w-16 h-16 rounded-full object-cover border border-saffron/30" />
                  )}
                  <div className="flex-1">
                    <label className="flex items-center gap-2 cursor-pointer font-body text-xs px-4 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[44px]">
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploading ? 'Uploading...' : 'Upload Photo'}
                      <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
                    </label>
                    {form.photo_url && (
                      <button onClick={() => setForm(p => ({ ...p, photo_url: '' }))}
                        className="ml-2 font-body text-xs text-chalk/30 hover:text-red-400 transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
              <button onClick={() => setEdit(false)}
                className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk transition-all min-h-[44px]">
                Cancel
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="border border-border p-6 max-w-xl">
            <div className="flex items-start gap-6">
              <div>
                {form.photo_url ? (
                  <img src={form.photo_url} alt={user?.full_name} className="w-20 h-20 rounded-full object-cover border border-saffron/30" />
                ) : (
                  <div className="w-20 h-20 border border-basalt/30 flex items-center justify-center rounded-full">
                    <span className="font-display text-xl text-chalk/40">
                      {user?.full_name?.split(' ').map(n => n[0]).join('') || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-display text-lg text-chalk font-light mb-1">{form.full_name}</p>
                <p className="font-body text-xs text-chalk/40 mb-3">{user?.email}</p>
                {form.phone && (
                  <p className="font-body text-xs text-chalk/40 mb-1">📞 {form.phone}</p>
                )}
                {form.bio && (
                  <p className="font-body text-sm text-chalk/50 leading-relaxed mt-3">{form.bio}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}