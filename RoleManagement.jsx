import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { MessageSquare, Check, X, Loader2, Send, Paperclip, ChevronRight, Mail, Tag, AlertTriangle, RefreshCw } from 'lucide-react';

const TYPE_CONFIG = {
  invoice_request:  { label: 'Invoice Request',  color: 'text-saffron border-saffron/30 bg-saffron/5' },
  discount_request: { label: 'Discount Request', color: 'text-violet-400 border-violet-400/30 bg-violet-400/5' },
  work_progress:    { label: 'Work Progress',    color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  terminate_work:   { label: 'Terminate Work',   color: 'text-red-400 border-red-400/30 bg-red-400/5' },
  general:          { label: 'General',          color: 'text-chalk/40 border-basalt/30 bg-basalt/5' },
  support:          { label: 'Support',          color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
};

const PRIORITY_CONFIG = {
  low:    { label: 'Low',    color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
  medium: { label: 'Medium', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  high:   { label: 'High',   color: 'text-red-400 border-red-400/30 bg-red-400/5' },
};

const STATUS_COLORS = {
  pending:     'text-amber-400 border-amber-400/30 bg-amber-400/5',
  in_review:   'text-blue-400 border-blue-400/30 bg-blue-400/5',
  negotiating: 'text-violet-400 border-violet-400/30 bg-violet-400/5',
  resolved:    'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  rejected:    'text-red-400 border-red-400/30 bg-red-400/5',
};

function TicketModal({ ticket, admin, onClose, onUpdated }) {
  const [comment, setComment] = useState('');
  const [status, setStatus] = useState(ticket.status);
  const [saving, setSaving] = useState(false);
  const [discountSaving, setDiscountSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState('');
  const [showEmailDraft, setShowEmailDraft] = useState(false);
  const bottomRef = useRef();

  const comments = ticket.comments || [];
  const isDiscount = ticket.request_type === 'discount_request';

  const handleReply = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSaving(true);
    const newComment = { author: admin?.full_name || 'Admin', role: 'admin', text: comment.trim(), ts: new Date().toISOString() };
    const updatedComments = [...comments, newComment];
    const timeline = [...(ticket.timeline || []), { status, ts: new Date().toISOString(), note: `Reply by ${admin?.email}` }];
    await base44.entities.ClientRequest.update(ticket.id, {
      comments: updatedComments, status, staff_response: comment.trim(), resolved_by: admin?.email, timeline,
    });
    // Notify client
    if (ticket.client_id) {
      await base44.entities.ClientNotification.create({
        client_id: ticket.client_id, is_read: false,
        title: `Response to your request: ${ticket.subject || ticket.request_type?.replace('_', ' ')}`,
        message: comment.trim(), type: 'general', reference_id: ticket.id, reference_type: 'ClientRequest',
      });
    }
    setSaving(false);
    setComment('');
    onUpdated();
  };

  const handleStatusChange = async (newStatus) => {
    setStatus(newStatus);
    const timeline = [...(ticket.timeline || []), { status: newStatus, ts: new Date().toISOString(), note: `Status changed by ${admin?.email}` }];
    await base44.entities.ClientRequest.update(ticket.id, { status: newStatus, timeline });
    onUpdated();
  };

  // Discount-specific: Approve / Decline / Negotiate
  const handleDiscountAction = async (action) => {
    setDiscountSaving(true);
    const newStatus = action === 'approved' ? 'resolved' : action === 'rejected' ? 'rejected' : 'negotiating';
    const timeline = [...(ticket.timeline || []), { status: newStatus, ts: new Date().toISOString(), note: `Discount ${action} by ${admin?.email}` }];
    await base44.entities.ClientRequest.update(ticket.id, { status: newStatus, resolved_by: admin?.email, timeline });
    setStatus(newStatus);
    // If approved: update the linked invoice discount
    if (action === 'approved' && ticket.linked_invoice_id && ticket.requested_discount_amount) {
      await base44.entities.Invoice.update(ticket.linked_invoice_id, {
        discount_amount: ticket.requested_discount_amount,
        discount_status: 'approved',
      });
      // Create DiscountRequest record for audit
      await base44.entities.DiscountRequest.create({
        invoice_id: ticket.linked_invoice_id,
        invoice_number: ticket.linked_invoice_number || '',
        client_id: ticket.client_id, client_name: ticket.client_name,
        requested_by: ticket.client_name, requested_by_type: 'client',
        requested_amount: ticket.requested_discount_amount,
        approved_amount: ticket.requested_discount_amount,
        status: 'approved', reviewed_by: admin?.full_name || 'Admin',
        reason: ticket.description || '',
      });
    } else if (action === 'rejected' && ticket.linked_invoice_id) {
      await base44.entities.Invoice.update(ticket.linked_invoice_id, { discount_status: 'rejected' });
    }
    // Notify client
    if (ticket.client_id) {
      const msgMap = { approved: 'Your discount request has been approved.', rejected: 'Your discount request was declined.', negotiating: 'Admin is reviewing your discount request and may negotiate.' };
      await base44.entities.ClientNotification.create({
        client_id: ticket.client_id, is_read: false,
        title: `Discount Request ${action === 'approved' ? 'Approved' : action === 'rejected' ? 'Declined' : 'In Negotiation'}`,
        message: msgMap[action], type: 'general', reference_id: ticket.id, reference_type: 'ClientRequest',
      });
    }
    await base44.entities.AuditLog.create({
      actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin',
      action: `discount_request_${action}`, entity_type: 'ClientRequest', entity_id: ticket.id,
      details: `Discount request ${action} for ${ticket.client_name}, invoice ${ticket.linked_invoice_number || ticket.linked_invoice_id}`,
    });
    setDiscountSaving(false);
    onUpdated();
  };

  const handleSendEmail = async () => {
    if (!emailDraft.trim()) return;
    setSendingEmail(true);
    await base44.integrations.Core.SendEmail({
      to: ticket.client_email,
      subject: `Re: ${ticket.subject || 'Your Support Request'} [#${ticket.id?.slice(-6)}]`,
      body: emailDraft,
    });
    setSendingEmail(false);
    setShowEmailDraft(false);
    setEmailDraft('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="relative bg-background border border-border w-full sm:max-w-2xl h-full sm:h-auto sm:max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border flex-shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${PRIORITY_CONFIG[ticket.priority]?.color || PRIORITY_CONFIG.medium.color}`}>
                {ticket.priority || 'medium'}
              </span>
              <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[status]}`}>{status.replace('_', ' ')}</span>
              <span className="font-body text-xs text-chalk/30">#{ticket.id?.slice(-6)}</span>
            </div>
            <p className="font-display text-xl text-chalk font-light">{ticket.subject || ticket.description?.slice(0, 60)}</p>
            <p className="font-body text-xs text-chalk/40 mt-1">{ticket.client_name} · {ticket.client_email}</p>
          </div>
          <button onClick={onClose} className="text-chalk/30 hover:text-chalk ml-4 flex-shrink-0"><X className="w-5 h-5" /></button>
        </div>

        {/* Status controls + discount actions */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-border flex-shrink-0 flex-wrap">
          <span className="font-body text-xs text-chalk/35 mr-1">Status:</span>
          {[['pending', 'Pending'], ['in_review', 'In Progress'], ['negotiating', 'Negotiating'], ['resolved', 'Resolved'], ['rejected', 'Reject']].map(([val, label]) => (
            <button key={val} onClick={() => handleStatusChange(val)}
              className={`font-body text-[10px] tracking-widest uppercase px-2 py-1 border transition-all ${status === val ? STATUS_COLORS[val] : 'border-basalt/30 text-chalk/30 hover:text-chalk'}`}>
              {label}
            </button>
          ))}
          {isDiscount && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="font-body text-[10px] text-violet-400">Discount:</span>
              <button onClick={() => handleDiscountAction('approved')} disabled={discountSaving || status === 'resolved'}
                className="flex items-center gap-1 font-body text-[10px] px-2 py-1 border border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/10 disabled:opacity-40 transition-all">
                {discountSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
              </button>
              <button onClick={() => handleDiscountAction('rejected')} disabled={discountSaving || status === 'rejected'}
                className="flex items-center gap-1 font-body text-[10px] px-2 py-1 border border-red-400/40 text-red-400 hover:bg-red-400/10 disabled:opacity-40 transition-all">
                <X className="w-3 h-3" /> Decline
              </button>
              <button onClick={() => handleDiscountAction('negotiating')} disabled={discountSaving || status === 'negotiating'}
                className="flex items-center gap-1 font-body text-[10px] px-2 py-1 border border-violet-400/40 text-violet-400 hover:bg-violet-400/10 disabled:opacity-40 transition-all">
                <RefreshCw className="w-3 h-3" /> Negotiate
              </button>
            </div>
          )}
          <button onClick={() => { setShowEmailDraft(v => !v); setEmailDraft(`Dear ${ticket.client_name},\n\nThank you for reaching out.\n\n[Your response here]\n\nBest regards,\nM. Bista & Associates`); }}
            className="ml-auto flex items-center gap-1.5 font-body text-xs px-3 py-1.5 border border-violet-400/30 text-violet-400 hover:bg-violet-400/5 transition-all">
            <Mail className="w-3.5 h-3.5" /> Send Email
          </button>
        </div>

        {/* Email draft (manual trigger only) */}
        <AnimatePresence>
          {showEmailDraft && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="border-b border-border px-6 py-4 bg-violet-500/5 flex-shrink-0">
              <p className="font-body text-xs text-violet-400 mb-2 tracking-widest uppercase">Email to Client — Preview & Send</p>
              <textarea rows={4} value={emailDraft} onChange={e => setEmailDraft(e.target.value)}
                className="w-full bg-transparent border border-basalt/30 px-3 py-2 font-body text-xs text-chalk focus:border-violet-400 focus:outline-none resize-none" />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSendEmail} disabled={sendingEmail}
                  className="flex items-center gap-2 font-body text-xs px-4 py-2 bg-violet-500 text-white uppercase tracking-wider hover:bg-violet-600 disabled:opacity-50 min-h-[36px]">
                  {sendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  {sendingEmail ? 'Sending...' : 'Send Email Now'}
                </button>
                <button onClick={() => setShowEmailDraft(false)} className="font-body text-xs px-4 py-2 border border-basalt/30 text-chalk/40 min-h-[36px]">Cancel</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Thread */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-saffron/10 border border-saffron/30 flex items-center justify-center flex-shrink-0">
              <span className="font-body text-xs text-saffron">{ticket.client_name?.[0]}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-body text-xs text-chalk/60">{ticket.client_name}</span>
                <span className="font-body text-[10px] text-chalk/25">{new Date(ticket.created_date).toLocaleDateString('en-GB')}</span>
              </div>
              <div className="bg-saffron/5 border border-saffron/20 p-3">
                <p className="font-body text-sm text-chalk/80 leading-relaxed">{ticket.description}</p>
                {isDiscount && ticket.requested_discount_amount && (
                  <p className="font-body text-xs text-violet-400 mt-2 font-medium">Requested discount: NPR {Number(ticket.requested_discount_amount).toLocaleString('en-IN')}</p>
                )}
                {ticket.linked_invoice_number && (
                  <p className="font-body text-xs text-chalk/40 mt-1">Invoice: {ticket.linked_invoice_number}</p>
                )}
                {ticket.attachment_url && (
                  <a href={ticket.attachment_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 mt-2 font-body text-xs text-saffron hover:underline">
                    <Paperclip className="w-3 h-3" /> {ticket.attachment_name || 'Attachment'}
                  </a>
                )}
              </div>
            </div>
          </div>

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
                    <span className="font-body text-[10px] text-chalk/25">{new Date(c.ts).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className={`p-3 border ${isStaff ? 'bg-violet-500/5 border-violet-400/20' : 'bg-basalt/5 border-basalt/20'}`}>
                    <p className="font-body text-sm text-chalk/80 leading-relaxed">{c.text}</p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Reply */}
        <div className="border-t border-border p-4 flex-shrink-0">
          <form onSubmit={handleReply} className="flex gap-3">
            <textarea rows={2} value={comment} onChange={e => setComment(e.target.value)}
              placeholder="Write a response to the client..."
              className="flex-1 bg-transparent border border-basalt/30 px-3 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
            <button type="submit" disabled={saving || !comment.trim()}
              className="flex items-center gap-2 font-body text-xs px-4 py-2 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-40 self-end">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function ClientTicketsTab({ admin }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewing, setViewing] = useState(null);

  const loadTickets = async () => {
    setLoading(true);
    // Load ALL request types — not just support
    const data = await base44.entities.ClientRequest.list('-created_date', 200);
    setTickets(data);
    setLoading(false);
  };

  useEffect(() => { loadTickets(); }, []);

  const filtered = tickets.filter(t => {
    const matchStatus = filter === 'all' || t.status === filter;
    const matchType = typeFilter === 'all' || t.request_type === typeFilter;
    return matchStatus && matchType;
  });

  const refreshViewing = async () => {
    await loadTickets();
    if (viewing) {
      const all = await base44.entities.ClientRequest.list('-created_date', 200);
      const fresh = all.find(t => t.id === viewing.id);
      if (fresh) setViewing(fresh);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-chalk font-light">Client Requests</h2>
          <p className="font-body text-xs text-chalk/35 mt-0.5">{tickets.length} total · {tickets.filter(t => t.status === 'pending').length} pending</p>
        </div>
      </div>

      {/* Type filter */}
      <div className="flex flex-wrap gap-2 mb-3">
        {[['all', 'All Types'], ['support', 'Support'], ['discount_request', 'Discount'], ['invoice_request', 'Invoice'], ['work_progress', 'Work Progress'], ['general', 'General']].map(([val, label]) => (
          <button key={val} onClick={() => setTypeFilter(val)}
            className={`font-body text-[10px] tracking-widest uppercase px-3 py-1.5 border transition-all ${
              typeFilter === val
                ? val === 'discount_request' ? 'border-violet-400 text-violet-400 bg-violet-400/5'
                : 'border-saffron text-saffron bg-saffron/5'
                : 'border-basalt/30 text-chalk/30 hover:text-chalk'
            }`}>
            {label}
            {val !== 'all' && tickets.filter(t => t.request_type === val).length > 0 && (
              <span className="ml-1 opacity-60">({tickets.filter(t => t.request_type === val).length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[['all', 'All'], ['pending', 'Pending'], ['in_review', 'In Progress'], ['negotiating', 'Negotiating'], ['resolved', 'Resolved'], ['rejected', 'Rejected']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`font-body text-xs px-4 py-2 border transition-all min-h-[36px] ${filter === val ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:border-saffron/50'}`}>
            {label}
            {val !== 'all' && tickets.filter(t => t.status === val).length > 0 && <span className="ml-1.5 text-chalk/30">({tickets.filter(t => t.status === val).length})</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-5 h-5 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <MessageSquare className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No tickets</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket, i) => {
            const pc = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium;
            const tc = TYPE_CONFIG[ticket.request_type] || TYPE_CONFIG.general;
            return (
              <motion.div key={ticket.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                onClick={() => setViewing(ticket)} className="border border-border p-5 cursor-pointer hover:border-saffron/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${tc.color}`}>{tc.label}</span>
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${STATUS_COLORS[ticket.status]}`}>{ticket.status.replace('_', ' ')}</span>
                      <span className="font-body text-[10px] text-chalk/25">#{ticket.id?.slice(-6)}</span>
                      {ticket.requested_discount_amount && (
                        <span className="font-body text-[10px] text-violet-400 border border-violet-400/30 bg-violet-400/5 px-1.5 py-0.5">NPR {Number(ticket.requested_discount_amount).toLocaleString('en-IN')} discount</span>
                      )}
                    </div>
                    <p className="font-body text-sm text-chalk">{ticket.subject || ticket.description?.slice(0, 80)}</p>
                    <p className="font-body text-xs text-chalk/40 mt-0.5">{ticket.client_name} · {ticket.client_id}</p>
                    {ticket.linked_invoice_number && <p className="font-body text-[10px] text-saffron/60 mt-0.5">Invoice: {ticket.linked_invoice_number}</p>}
                    <div className="flex items-center gap-3 mt-1">
                      <span className="font-body text-[10px] text-chalk/20">{new Date(ticket.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {ticket.comments?.length > 0 && <span className="font-body text-[10px] text-chalk/30">{ticket.comments.length} message{ticket.comments.length > 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-chalk/25 flex-shrink-0 mt-1" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {viewing && <TicketModal ticket={viewing} admin={admin} onClose={() => setViewing(null)} onUpdated={async () => { await loadTickets(); const all = await base44.entities.ClientRequest.filter({ request_type: 'support' }, '-created_date', 200); const fresh = all.find(t => t.id === viewing.id); if (fresh) setViewing(fresh); }} />}
      </AnimatePresence>
    </div>
  );
}