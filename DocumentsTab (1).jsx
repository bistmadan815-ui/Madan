import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { FileText, Tag, Activity, XCircle, Check, X, Loader2, AlertTriangle, MessageCircle, ChevronDown, Zap, Clock, AlertOctagon, RefreshCw } from 'lucide-react';

const REQUEST_TYPES = [
  { id: 'invoice_request',  label: 'Request Invoice',        icon: FileText,      color: 'border-saffron/40 text-saffron hover:bg-saffron/5',         desc: 'Request a formal invoice for a specific service.' },
  { id: 'discount_request', label: 'Request Discount',       icon: Tag,           color: 'border-violet-400/40 text-violet-400 hover:bg-violet-400/5', desc: 'Apply early payment discount or view late fine policy.' },
  { id: 'work_progress',    label: 'Work Progress Inquiry',  icon: Activity,      color: 'border-blue-400/40 text-blue-400 hover:bg-blue-400/5',       desc: 'Ask for a status update on your assigned work.' },
  { id: 'general',          label: 'General Inquiry',        icon: MessageCircle, color: 'border-emerald-400/40 text-emerald-400 hover:bg-emerald-400/5', desc: 'Send any message or inquiry to our team.' },
  { id: 'terminate_work',   label: 'Terminate Engagement',   icon: XCircle,       color: 'border-red-400/40 text-red-400 hover:bg-red-400/5',          desc: 'Request to terminate the current work engagement.', requiresPayment: true },
];

const DISCOUNT_TIERS = [
  { id: 'early_5',  icon: Zap,  color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5', label: '5% Early Payment Discount',  desc: 'Pay within 5 days of invoice date to receive a 5% discount on your total.' },
  { id: 'early_10', icon: Zap,  color: 'text-saffron border-saffron/30 bg-saffron/5',            label: '10% Prompt Payment Discount', desc: 'Pay on the same day the invoice is issued to unlock a 10% discount.' },
];

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors resize-none';

const STATUS_COLORS = {
  pending:   'text-amber-400 border-amber-400/30 bg-amber-400/5',
  in_review: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  resolved:  'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  rejected:  'text-red-400 border-red-400/30 bg-red-400/5',
};

export default function ClientActionsPanel({ client, invoices, tasks = [], onRequestSubmitted }) {
  const [activeType, setActiveType] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadMyRequests = async () => {
    setLoadingRequests(true);
    const data = await base44.entities.ClientRequest.filter({ client_id: client.client_id }, '-created_date', 20);
    setMyRequests(data);
    setLoadingRequests(false);
  };

  useEffect(() => { loadMyRequests(); }, []);
  // Invoice request — which task/service is this for
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [taskDropOpen, setTaskDropOpen] = useState(false);
  // Discount — which tier
  const [discountTier, setDiscountTier] = useState(null);

  const hasOutstandingInvoices = invoices.some(i => i.status === 'unpaid' || i.status === 'overdue');

  // Active (non-completed) tasks for invoice request picker
  const activeTasks = tasks.filter(t => t.status !== 'completed');
  const selectedTask = activeTasks.find(t => t.id === selectedTaskId);

  const resetForm = () => {
    setMessage('');
    setSelectedTaskId('');
    setTaskDropOpen(false);
    setDiscountTier(null);
  };

  const buildAutoMessage = () => {
    if (activeType === 'invoice_request' && selectedTask) {
      return `Please issue an invoice for the following work:\n\nService: ${selectedTask.service || 'N/A'}\nTask: ${selectedTask.title}\nStatus: ${selectedTask.status?.replace('_', ' ')}\n\n${message ? 'Additional notes: ' + message : ''}`.trim();
    }
    if (activeType === 'discount_request' && discountTier) {
      const tier = DISCOUNT_TIERS.find(d => d.id === discountTier);
      return `I would like to apply for the ${tier?.label || discountTier} on my account.\n\n${message ? 'Additional notes: ' + message : ''}`.trim();
    }
    return message;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const type = REQUEST_TYPES.find(t => t.id === activeType);
    if (type?.requiresPayment && hasOutstandingInvoices) return;
    if (activeType === 'invoice_request' && !selectedTaskId) return;
    if (activeType === 'discount_request' && !discountTier) return;

    setSaving(true);
    const finalMessage = buildAutoMessage();
    const typeLabel = type?.label || activeType;

    await base44.entities.ClientRequest.create({
      client_id: client.client_id,
      client_name: client.full_name,
      client_email: client.email,
      request_type: activeType,
      description: finalMessage,
      status: 'pending',
    });

// Staff notification via DB record (ClientRequest entity) — visible in Staff Portal

    setSaving(false);
    setDone(activeType);
    resetForm();
    setActiveType(null);
    if (onRequestSubmitted) onRequestSubmitted();
    loadMyRequests();
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-display text-2xl text-chalk font-light">Client Actions</h2>
        <p className="font-body text-xs text-chalk/35 mt-1">Submit requests directly to our team.</p>
      </div>

      {done && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="border border-emerald-500/20 bg-emerald-500/5 p-4 mb-6 flex items-center gap-3">
          <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <p className="font-body text-sm text-emerald-300">Your request has been submitted. Our team will respond shortly.</p>
          <button onClick={() => setDone(null)} className="ml-auto text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
        </motion.div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {REQUEST_TYPES.map(type => {
          const Icon = type.icon;
          const blocked = type.requiresPayment && hasOutstandingInvoices;
          return (
            <button key={type.id} onClick={() => { if (!blocked) { setActiveType(type.id); resetForm(); } }}
              className={`relative text-left p-5 border transition-all ${type.color} ${blocked ? 'opacity-50 cursor-not-allowed' : ''} ${activeType === type.id ? 'ring-1 ring-current' : ''}`}>
              <div className="flex items-start gap-3">
                <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-sm font-medium">{type.label}</p>
                  <p className="font-body text-xs opacity-60 mt-0.5 leading-relaxed">{type.desc}</p>
                  {blocked && (
                    <div className="flex items-center gap-1 mt-2">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      <p className="font-body text-[10px] text-amber-400">Clear outstanding invoices first</p>
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {activeType && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <div className="flex items-center justify-between mb-5">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">
                {REQUEST_TYPES.find(t => t.id === activeType)?.label}
              </p>
              <button onClick={() => { setActiveType(null); resetForm(); }} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
            </div>

            {/* ── INVOICE REQUEST ── */}
            {activeType === 'invoice_request' && (
              <div className="mb-5">
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Select Work / Service <span className="text-saffron">*</span></label>
                {activeTasks.length === 0 ? (
                  <p className="font-body text-xs text-chalk/30 py-3">No active work items found. Your task list will appear here once work begins.</p>
                ) : (
                  <div className="relative">
                    <button type="button" onClick={() => setTaskDropOpen(v => !v)}
                      className="w-full flex items-center justify-between border-b border-basalt/30 py-2.5 font-body text-sm text-left focus:outline-none focus:border-saffron transition-colors">
                      <span className={selectedTask ? 'text-chalk' : 'text-chalk/25'}>
                        {selectedTask ? `${selectedTask.title}${selectedTask.service ? ' — ' + selectedTask.service : ''}` : 'Choose the work item to invoice'}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-chalk/30 transition-transform ${taskDropOpen ? 'rotate-180' : ''}`} />
                    </button>
                    <AnimatePresence>
                      {taskDropOpen && (
                        <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="absolute z-10 mt-1 w-full bg-background border border-border max-h-52 overflow-y-auto shadow-xl">
                          {activeTasks.map(t => (
                            <li key={t.id}>
                              <button type="button" onClick={() => { setSelectedTaskId(t.id); setTaskDropOpen(false); }}
                                className={`w-full text-left px-4 py-3 font-body text-sm transition-colors hover:bg-muted ${selectedTaskId === t.id ? 'text-saffron' : 'text-chalk/60'}`}>
                                <span className="text-chalk">{t.title}</span>
                                {t.service && <span className="text-chalk/35 ml-2 text-xs">· {t.service}</span>}
                                <span className="block text-[10px] text-chalk/25 tracking-widest uppercase mt-0.5">{t.status?.replace(/_/g, ' ')}</span>
                              </button>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                )}
                {selectedTask && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="mt-3 border border-saffron/20 bg-saffron/5 p-3 font-body text-xs text-chalk/50 space-y-0.5">
                    <p><span className="text-saffron/60 uppercase tracking-widest text-[10px]">Auto-message preview</span></p>
                    <p className="text-chalk/40 leading-relaxed whitespace-pre-line">{`Please issue an invoice for the following work:\n\nService: ${selectedTask.service || 'N/A'}\nTask: ${selectedTask.title}\nStatus: ${selectedTask.status?.replace(/_/g, ' ')}`}</p>
                  </motion.div>
                )}
              </div>
            )}

            {/* ── DISCOUNT REQUEST ── */}
            {activeType === 'discount_request' && (
              <div className="mb-5 space-y-3">
                <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-3">Select Discount / Policy</p>
                {DISCOUNT_TIERS.map(tier => {
                  const Icon = tier.icon;
                  return (
                    <button key={tier.id} type="button" onClick={() => setDiscountTier(tier.id === discountTier ? null : tier.id)}
                      className={`w-full text-left p-4 border transition-all flex items-start gap-3 ${tier.color} ${discountTier === tier.id ? 'ring-1 ring-current' : ''}`}>
                      <Icon className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-body text-sm font-medium">{tier.label}</p>
                        <p className="font-body text-xs opacity-70 mt-0.5 leading-relaxed">{tier.desc}</p>
                      </div>
                      {discountTier === tier.id && <Check className="w-4 h-4 ml-auto flex-shrink-0 mt-0.5" />}
                    </button>
                  );
                })}
              </div>
            )}

            {/* ── TERMINATE WARNING ── */}
            {activeType === 'terminate_work' && (
              <div className="border border-red-500/20 bg-red-500/5 p-4 mb-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-body text-sm text-red-300 font-medium">Termination requires all payments to be cleared.</p>
                  <p className="font-body text-xs text-red-300/70 mt-1">Ensure all outstanding invoices are paid before submitting this request.</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">
                  {activeType === 'invoice_request' ? 'Additional Notes' : 'Your Message / Details'}
                </label>
                <textarea rows={3} value={message} onChange={e => setMessage(e.target.value)}
                  placeholder={activeType === 'invoice_request' ? 'Any additional notes for this invoice request...' : 'Please describe your request in detail...'}
                  className={inputCls} />
              </div>
              <div className="flex gap-3">
                <button type="submit"
                  disabled={saving || (activeType === 'invoice_request' && !selectedTaskId) || (activeType === 'discount_request' && !discountTier)}
                  className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-40 transition-all min-h-[44px]">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {saving ? 'Submitting...' : 'Submit Request'}
                </button>
                <button type="button" onClick={() => { setActiveType(null); resetForm(); }}
                  className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk transition-all min-h-[44px]">
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past Requests */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-chalk font-light">My Requests</h3>
          <button onClick={loadMyRequests} disabled={loadingRequests}
            className="flex items-center gap-1.5 font-body text-xs text-chalk/30 hover:text-saffron transition-colors">
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRequests ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
        {myRequests.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-basalt/20">
            <MessageCircle className="w-8 h-8 text-chalk/15 mx-auto mb-2" />
            <p className="font-body text-xs text-chalk/25">No requests submitted yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myRequests.map((req, i) => {
              const tc = REQUEST_TYPES.find(t => t.id === req.request_type);
              const sc = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
              const Icon = tc?.icon || MessageCircle;
              const isDiscount = req.request_type === 'discount_request';
              const discountApproved = isDiscount && req.staff_response?.includes('APPROVED');
              const discountRejected = isDiscount && req.staff_response?.includes('REJECTED');
              return (
                <motion.div key={req.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="border border-border p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 border border-basalt/30 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-chalk/40" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-body text-xs text-chalk/60">{tc?.label || req.request_type.replace(/_/g, ' ')}</span>
                        <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc}`}>{req.status.replace('_', ' ')}</span>
                      </div>
                      {req.description && <p className="font-body text-xs text-chalk/40 leading-relaxed mt-1">{req.description}</p>}

                      {isDiscount && (discountApproved || discountRejected) && (
                        <div className={`mt-3 p-3 border flex items-center gap-2 ${
                          discountApproved ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-300' : 'border-red-500/20 bg-red-500/5 text-red-300'
                        }`}>
                          {discountApproved ? <Check className="w-4 h-4 flex-shrink-0" /> : <X className="w-4 h-4 flex-shrink-0" />}
                          <p className="font-body text-sm font-medium">
                            {discountApproved ? 'Discount Approved' : 'Discount Rejected'}
                          </p>
                        </div>
                      )}

                      {req.staff_response && (
                        <div className="mt-3 border border-saffron/20 bg-saffron/5 p-3">
                          <p className="font-body text-[10px] text-saffron/50 uppercase tracking-widest mb-1">Staff Response</p>
                          <p className="font-body text-xs text-chalk/60 leading-relaxed">{req.staff_response}</p>
                        </div>
                      )}

                      <p className="font-body text-[10px] text-chalk/20 mt-2">
                        {new Date(req.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}