import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Loader2, Check, AlertCircle } from 'lucide-react';

export default function NotificationSettings({ admin }) {
  const [settings, setSettings] = useState(admin.notification_settings || {
    enable_alerts: true,
    alert_types: ['access_request', 'overdue_invoice', 'document_review'],
    email_on_critical: true,
    email_on_high: false,
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const alertTypes = [
    { value: 'access_request', label: 'New Staff Access Requests' },
    { value: 'overdue_invoice', label: 'Overdue Invoices' },
    { value: 'document_review', label: 'Document Reviews' },
    { value: 'staff_alert', label: 'Staff Alerts' },
    { value: 'system_alert', label: 'System Alerts' },
  ];

  const handleToggleAlertType = (type) => {
    setSettings(p => ({
      ...p,
      alert_types: p.alert_types.includes(type)
        ? p.alert_types.filter(x => x !== type)
        : [...p.alert_types, type]
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await base44.entities.Admin.update(admin.id, { notification_settings: settings });
      setSuccess('Notification settings updated');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl space-y-6">
      <div className="border border-border p-6">
        <h3 className="font-display text-xl text-chalk font-light mb-5">Notification Preferences</h3>

        {/* Master toggle */}
        <div className="mb-6 pb-6 border-b border-basalt/20">
          <label className="flex items-center gap-4 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enable_alerts}
              onChange={e => setSettings(p => ({ ...p, enable_alerts: e.target.checked }))}
              className="w-5 h-5 border border-saffron rounded accent-saffron"
            />
            <div>
              <p className="font-body font-semibold text-sm text-chalk">Enable Real-time Alerts</p>
              <p className="font-body text-xs text-chalk/40">Receive notifications for key events</p>
            </div>
          </label>
        </div>

        {/* Alert types */}
        {settings.enable_alerts && (
          <div className="mb-6 pb-6 border-b border-basalt/20">
            <p className="font-body text-xs tracking-widest uppercase text-saffron mb-4">Alert Types</p>
            <div className="space-y-3">
              {alertTypes.map(type => (
                <label key={type.value} className="flex items-center gap-3 cursor-pointer hover:bg-basalt/5 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={settings.alert_types.includes(type.value)}
                    onChange={() => handleToggleAlertType(type.value)}
                    className="w-4 h-4 border border-saffron rounded accent-saffron"
                  />
                  <span className="font-body text-sm text-chalk/60">{type.label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* Email settings */}
        {settings.enable_alerts && (
          <div>
            <p className="font-body text-xs tracking-widest uppercase text-saffron mb-4">Email Notifications</p>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer hover:bg-basalt/5 p-2 rounded">
                <input
                  type="checkbox"
                  checked={settings.email_on_critical}
                  onChange={e => setSettings(p => ({ ...p, email_on_critical: e.target.checked }))}
                  className="w-4 h-4 border border-saffron rounded accent-saffron"
                />
                <span className="font-body text-sm text-chalk/60">Email on Critical Alerts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer hover:bg-basalt/5 p-2 rounded">
                <input
                  type="checkbox"
                  checked={settings.email_on_high}
                  onChange={e => setSettings(p => ({ ...p, email_on_high: e.target.checked }))}
                  className="w-4 h-4 border border-saffron rounded accent-saffron"
                />
                <span className="font-body text-sm text-chalk/60">Email on High Priority Alerts</span>
              </label>
            </div>
          </div>
        )}

        {error && <p className="font-body text-xs text-red-400 flex items-center gap-2 mt-6"><AlertCircle className="w-3 h-3" />{error}</p>}
        {success && <p className="font-body text-xs text-emerald-400 flex items-center gap-2 mt-6"><Check className="w-3 h-3" />{success}</p>}

        <button
          onClick={handleSave}
          disabled={loading}
          className="mt-6 flex items-center gap-2 font-body text-xs px-6 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save Preferences'}
        </button>
      </div>
    </motion.div>
  );
}