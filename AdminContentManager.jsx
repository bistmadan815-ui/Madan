import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Check, X, Loader2, FileText, Tag, Activity, XCircle, Send, ChevronRight, Paperclip } from 'lucide-react';

const TYPE_CONFIG = {
  invoice_request: { label: 'Invoice Request',       color: 'text-saffron border-saffron/30 bg-saffron/5',       icon: FileText },
  discount_request:{ label: 'Discount Request',      color: 'text-violet-400 border-violet-400/30 bg-violet-400/5', icon: Tag },
  work_progress:   { label: 'Work Progress Inquiry', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5',    icon: Activity },
  terminate_work:  { label: 'Terminate Engagement',  color: 'text-red-400 border-red-400/30 bg-red-400/5',       icon: XCircle },
  general:         { label: 'General',               color: 'text-chalk/40 border-basalt/30 bg-basalt/5',        icon: MessageSquare },
};

const STATUS_COLORS = {
  pending:     'text-amber-400 border-amber-400/30 bg-amber-400/5',
  in_review:   'text-blue-400 border-blue-400/30 bg-blue-400/5',
  negotiating: 'text-violet-400 border-violet-400/30 bg-violet-400/5',
  resolved:    'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  rejected:    'text-red-400 border-red-400/30 bg-red-400/5',
};

const STATUS_LABELS = {
  pending: 'Pending', in_review: 'In Review', negotiating: 'Negotiating', resolved: 'Resolved', rejected: 'Rejected',
};

// ThreadModal: full conversation + response UI for staff
function ThreadModal({ req, user, onClose, onUpdated }) {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(req.status);
  const [saving, setSaving] = useState(false);

  const comments = req.comments || [];

  const handleSend = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    const newComment = { author: user?.full_name || user?.email || 'Staff', role: 'staff', text: comment.trim(), ts: new Date().toISOString() };
    const updatedComments = [...comments, newComment];
    const updates = { comments: updatedComments, status, staff_response: comment.trim(), resolved_by: user?.email };
    await base44.entities.ClientRequest.update(req.id, updates);
    // Notify client
    if (req.client_id) {
      await base44.entities.ClientNotification.create({
        client_id: req.client_id, is_read: false,
        title: `Response to your request: ${req.subject || req.request_type?.replace('_', ' ')}`,
        message: comment.trim(),
        type: 'general', reference_id: req.id, reference_type: 'ClientRequest',
      });
    }
    setSaving(false);
    setComment('');
    onUpdated();
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    await base44.entities.ClientRequest.update(req.id, { status: newStatus, resolved_by: user?.email });
    onUpdated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="relative bg-background border border-border w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[88vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {(() => { const tc = TYPE_CONFIG[req.request_type] || TYPE_CONFIG.general; return <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${tc.color}`}>{tc.label}</span>; })()}
              <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[status] || STATUS_COLORS.pending}`}>{STATUS_LABELS[status] || status}</span>
              <span className="font-body text-[10px] text-chalk/25 font-mono">#{req.id?.slice(-6)}</span>
            </div>
            <p className="font-display text-xl text-chalk font-light">{req.subject || req.description?.slice(0, 60)}</p>
            <p className="font-body text-xs text-chalk/40 mt-0.5">{req.client_name} · {req.client_id}</p>
          </div>
          <button onClick={onClose} className="text-chalk/30 hover:text-chalk ml-4"><X className="w-5 h-5" /></button>
        </div>

        {/* Status bar — staff can change status but NOT approve discount */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border flex-shrink-0 flex-wrap">
          <span className="font-body text-xs text-chalk/35 mr-1">Set Status:</span>
          {[['in_review', 'In Review'], ['negotiating', 'Negotiating'], ['resolved', 'Resolved']].map(([val, label]) => (
            <button key={val} onClick={() => handleStatusChange(val)}
              className={`font-body text-[10px] tracking-widest uppercase px-2 py-1 border transition-all ${status === val ? STATUS_COLORS[val] : 'border-basalt/30 text-chalk/30 hover:text-chalk'}`}>
              {label}
            </button>
          ))}
          {req.request_type === 'discount_request' && (
            <span className="ml-auto font-body text-[10px] text-amber-400 border border-amber-400/30 bg-amber-400/5 px-2 py-1">Discount approval is Admin-only</span>
          )}
        </div>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Original request */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-saffron/10 border border-saffron/30 flex items-center justify-center flex-shrink-0">
              <span className="font-body text-xs text-saffron">{req.client_name?.[0]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-body text-xs text-chalk/60">{req.client_name}</span>
                <span className="font-body text-[10px] text-chalk/25">{new Date(req.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
              </div>
              <div className="bg-saffron/5 border border-saffron/20 p-3">
                <p className="font-body text-sm text-chalk/80 leading-relaxed">{req.description}</p>
                {req.requested_discount_amount && (
                  <p className="font-body text-xs text-amber-400 mt-1">Requested discount: NPR {Number(req.requested_discount_amount).toLocaleString('en-IN')}</p>
                )}
                {req.linked_invoice_number && (
                  <p className="font-body text-xs text-chalk/40 mt-1">Invoice: {req.linked_invoice_number}</p>
                )}
                {req.attachment_url && (
                  <a href={req.attachment_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 mt-2 font-body text-xs text-saffron hover:underline">
                    <Paperclip className="w-3 h-3" /> {req.attachment_name || 'Attachment'}
                  </a>
                )}
              </div>
            </div>
          </div>
          {/* Comments thread */}
          {comments.map((c, i) => {
            const isStaff = c.role === 'staff' || c.role === 'admin';
            return (
              <div key={i} className="flex gap-3">
                <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${isStaff ? 'bg-violet-500/10 border-violet-400/40' : 'bg-saffron/10 border-saffron/30'}`}>
                  <span className={`font-body text-xs ${isStaff ? 'text-violet-400' : 'text-saffron'}`}>{c.author?.[0]}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-body text-xs text-chalk/60">{c.author}</span>
                    {isStaff && <span className="font-body text-[10px] text-violet-400 border border-violet-400/30 px-1.5 py-0.5">Staff</span>}
                    <span className="font-body text-[10px] text-chalk/25">{new Date(c.ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className={`p-3 border ${isStaff ? 'bg-violet-500/5 border-violet-400/20' : 'bg-basalt/5 border-basalt/20'}`}>
                    <p className="font-body text-sm text-chalk/80 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Reply box */}
        {status !== 'resolved' && status !== 'rejected' && (
          <div className="border-t border-border p-4 flex-shrink-0">
            <form onSubmit={handleSend} className="flex gap-3">
              <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Write a response (visible to client)..."
                className="flex-1 bg-transparent border border-basalt/30 px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
              <button type="submit" disabled={saving || !comment.trim()}
                className="flex items-center gap-2 font-body text-xs px-4 py-2 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-40 self-end">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <p className="font-body text-[10px] text-chalk/25 mt-1">Responses are visible to the client in their portal</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}

function ClientRequestsTab({ user }) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [viewing, setViewing] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const data = await base44.entities.ClientRequest.list('-created_date', 200);
    setRequests(data);
    setLoading(false);
  };

  const refreshViewing = async () => {
    await loadData();
    if (viewing) {
      const fresh = await base44.entities.ClientRequest.list('-created_date', 200);
      const updated = fresh.find(r => r.id === viewing.id);
      if (updated) setViewing(updated);
    }
  };

  useEffect(() => { loadData(); }, []);

  const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter);
  const pendingCount = requests.filter(r => r.status === 'pending').length;

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-chalk font-light">Client Requests</h2>
        {pendingCount > 0 && <p className="font-body text-xs text-amber-400 mt-1">{pendingCount} pending request{pendingCount > 1 ? 's' : ''}</p>}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {[['all', 'All'], ['pending', 'Pending'], ['in_review', 'In Review'], ['negotiating', 'Negotiating'], ['resolved', 'Resolved'], ['rejected', 'Rejected']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`font-body text-xs px-4 py-2 border transition-all min-h-[36px] ${filter === val ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:border-saffron/50'}`}>
            {label}
            {val !== 'all' && requests.filter(r => r.status === val).length > 0 && (
              <span className="ml-1.5 text-chalk/30">({requests.filter(r => r.status === val).length})</span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <MessageSquare className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No requests</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((req, i) => {
            const tc = TYPE_CONFIG[req.request_type] || TYPE_CONFIG.general;
            const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
            const Icon = tc.icon;
            const hasNewReply = (req.comments || []).length > 0;
            return (
              <motion.div key={req.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                onClick={() => setViewing(req)}
                className="border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-saffron/30 transition-colors">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-9 h-9 border border-basalt/30 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-4 h-4 text-chalk/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${tc.color}`}>{tc.label}</span>
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc}`}>{STATUS_LABELS[req.status] || req.status}</span>
                      <span className="font-body text-[10px] text-chalk/25 font-mono">#{req.id?.slice(-6)}</span>
                    </div>
                    <p className="font-body text-sm text-chalk">{req.subject || req.description?.slice(0, 60)}</p>
                    <p className="font-body text-xs text-chalk/40 mt-0.5">{req.client_name}</p>
                    {req.linked_invoice_number && <p className="font-body text-[10px] text-saffron/60 mt-0.5">Invoice: {req.linked_invoice_number}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-body text-[10px] text-chalk/20">{new Date(req.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {hasNewReply && <span className="font-body text-[10px] text-violet-400">{req.comments.length} message{req.comments.length > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-chalk/25 flex-shrink-0" />
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {viewing && (
          <ThreadModal req={viewing} user={user} onClose={() => setViewing(null)} onUpdated={refreshViewing} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default ClientRequestsTab;