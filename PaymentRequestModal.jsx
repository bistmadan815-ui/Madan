import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Bell, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const priorityConfig = {
  low: { icon: Info, color: 'text-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/30' },
  medium: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-400/5', border: 'border-yellow-400/30' },
  high: { icon: AlertCircle, color: 'text-orange-400', bg: 'bg-orange-400/5', border: 'border-orange-400/30' },
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/5', border: 'border-red-500/30' },
};

export default function NotificationCenter({ adminId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadNotifications();
    const unsubscribe = base44.entities.Notification.subscribe((event) => {
      if (event.data.admin_id === adminId) {
        loadNotifications();
      }
    });
    return unsubscribe;
  }, [adminId]);

  const loadNotifications = async () => {
    const data = await base44.entities.Notification.filter({ admin_id: adminId }, '-created_date', 50);
    setNotifications(data);
    setUnreadCount(data.filter(n => !n.is_read).length);
  };

  const handleMarkAsRead = async (id) => {
    await base44.entities.Notification.update(id, { is_read: true });
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    setLoading(true);
    const unread = notifications.filter(n => !n.is_read);
    await Promise.all(unread.map(n => base44.entities.Notification.update(n.id, { is_read: true })));
    loadNotifications();
    setLoading(false);
  };

  const handleDelete = async (id) => {
    await base44.entities.Notification.delete(id);
    loadNotifications();
  };

  const getIcon = (priority) => {
    const Icon = priorityConfig[priority]?.icon || Info;
    return Icon;
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-chalk/60 hover:text-saffron transition-colors min-h-[44px] min-w-[44px]"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowDropdown(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute right-0 top-full mt-2 w-96 bg-background border border-border shadow-lg rounded-sm z-50"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-display text-sm text-chalk font-light">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    disabled={loading}
                    className="text-xs text-saffron hover:text-saffron/80 transition-colors disabled:opacity-50"
                  >
                    Mark all as read
                  </button>
                )}
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-chalk/40">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p className="text-xs">No notifications yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {notifications.map((notif) => {
                      const Icon = getIcon(notif.priority);
                      const config = priorityConfig[notif.priority];
                      return (
                        <motion.div
                          key={notif.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 border-l-4 ${config.border} ${
                            notif.is_read ? 'bg-background' : 'bg-basalt/5'
                          } hover:bg-basalt/10 transition-colors group`}
                        >
                          <div className="flex gap-3">
                            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${config.color}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-xs font-semibold text-chalk">
                                {notif.title}
                              </p>
                              <p className="font-body text-xs text-chalk/50 mt-1 leading-relaxed">
                                {notif.message}
                              </p>
                              <p className="font-body text-[10px] text-chalk/30 mt-2">
                                {new Date(notif.created_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex gap-1 flex-shrink-0">
                              {!notif.is_read && (
                                <button
                                  onClick={() => handleMarkAsRead(notif.id)}
                                  className="p-1 text-chalk/30 hover:text-saffron opacity-0 group-hover:opacity-100 transition-all"
                                  title="Mark as read"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(notif.id)}
                                className="p-1 text-chalk/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                title="Delete"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}