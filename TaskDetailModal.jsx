import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCheck, ClipboardList, FileText, Receipt, MessageSquare, Info, X } from 'lucide-react';

const TYPE_CONFIG = {
  task_created:     { label: 'New Task',         icon: ClipboardList, color: 'text-blue-400 border-blue-400/20 bg-blue-400/5' },
  task_updated:     { label: 'Task Updated',     icon: ClipboardList, color: 'text-violet-400 border-violet-400/20 bg-violet-400/5' },
  document_request: { label: 'Document Request', icon: FileText,      color: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
  advance_payment:  { label: 'Payment Request',  icon: Receipt,       color: 'text-saffron border-saffron/20 bg-saffron/5' },
  invoice_ready:    { label: 'Invoice Ready',    icon: Receipt,       color: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' },
  general:          { label: 'Notice',           icon: Info,          color: 'text-chalk/50 border-basalt/20 bg-basalt/5' },
};

export default function NotificationsPanel({ client, onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, [client?.client_id]);

  const load = async () => {
    setLoading(true);
    const data = await base44.entities.ClientNotification.filter({ client_id: client.client_id }, '-created_date', 50);
    setNotifications(data);
    setLoading(false);
  };

  const markRead = async (n) => {
    if (n.is_read) return;
    await base44.entities.ClientNotification.update(n.id, { is_read: true });
    setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
  };

  const markAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.ClientNotification.update(n.id, { is_read: true })));
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-chalk font-light">Notifications</h2>
          <p className="font-body text-xs text-chalk/35 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead}
            className="flex items-center gap-2 font-body text-xs px-4 py-2 border border-saffron/30 text-saffron hover:bg-saffron/5 transition-all min-h-[36px]">
            <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <Bell className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light mb-1">No Notifications</p>
          <p className="font-body text-xs text-chalk/20">You'll be notified here when tasks are assigned or updates are made.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n, i) => {
            const tc = TYPE_CONFIG[n.type] || TYPE_CONFIG.general;
            const Icon = tc.icon;
            return (
              <motion.div key={n.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                onClick={() => markRead(n)}
                className={`border p-4 cursor-pointer transition-all ${n.is_read ? 'border-basalt/15 bg-transparent opacity-60' : `${tc.color} border`}`}>
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 border flex items-center justify-center flex-shrink-0 ${n.is_read ? 'border-basalt/20' : tc.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-body text-sm text-chalk font-medium">{n.title}</p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-saffron flex-shrink-0" />
                      )}
                    </div>
                    <p className="font-body text-xs text-chalk/50 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="font-body text-[10px] text-chalk/25 mt-1">
                      {new Date(n.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      {!n.is_read && <span className="ml-2 text-chalk/20">· Click to mark read</span>}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}