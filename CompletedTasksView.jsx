import { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { FileText, Eye, Check, AlertCircle, Clock, MessageSquare, X, ThumbsUp, ThumbsDown, Send, Loader2, Trash2 } from 'lucide-react';

const STATUS_CONFIG = {
  pending_review:  { label: 'Pending Review',   color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  reviewed:        { label: 'Reviewed',          color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  requires_action: { label: 'Requires Action',   color: 'text-red-400 border-red-400/30 bg-red-400/5' },
  approved:        { label: 'Approved',           color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
};

function ReviewModal({ doc, user, onClose, onUpdated }) {
  const [notes, setNotes] = useState(doc.staff_notes || '');
  const [status, setStatus] = useState(doc.status);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await base44.entities.ClientDocument.update(doc.id, {
      status,
      staff_notes: notes,
      reviewed_by: user?.email,
    });
    setSaving(false);
    onUpdated();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-background border border-border w-full max-w-lg p-8" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl text-chalk font-light">Review Document</h3>
          <button onClick={onClose} className="text-chalk/30 hover:text-chalk"><X className="w-5 h-5" /></button>
        </div>
        <div className="border border-border p-4 mb-5">
          <p className="font-body text-sm text-chalk">{doc.file_name}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="font-body text-xs text-chalk/40">{doc.document_type}</span>
            <span className="font-body text-xs text-chalk/30">{doc.client_name} · {doc.client_id}</span>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Update Status</label>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, sc]) => (
                <button key={key} type="button" onClick={() => setStatus(key)}
                  className={`font-body text-xs px-3 py-2.5 border transition-all ${status === key ? `${sc.color} border-current` : 'border-basalt/30 text-chalk/40 hover:text-chalk'}`}>
                  {sc.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Staff Notes</label>
            <textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Add notes for the client..."
              className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[44px]">
            <Eye className="w-4 h-4" /> View File
          </a>
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
            <Check className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Review'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function DocumentReviewTab({ documents, user, onRefresh }) {
  const [reviewing, setReviewing] = useState(null);
  const [filter, setFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);
  const [actedDocs, setActedDocs] = useState(new Set());
  const [deleting, setDeleting] = useState(null);

  const quickAction = async (doc, status) => {
    setActionLoading(doc.id + status);
    await base44.entities.ClientDocument.update(doc.id, { status, reviewed_by: user?.email });
    setActionLoading(null);
    setActedDocs(prev => new Set([...prev, doc.id]));
    onRefresh();
  };

  const handleDelete = async (docId) => {
    if (confirm('Delete this document?')) {
      setDeleting(docId);
      await base44.entities.ClientDocument.delete(docId);
      setDeleting(null);
      onRefresh();
    }
  };

  const filtered = filter === 'all' ? documents : documents.filter(d => d.status === filter);
  const pendingCount = documents.filter(d => d.status === 'pending_review').length;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl text-chalk font-light">Client Documents</h2>
          {pendingCount > 0 && (
            <p className="font-body text-xs text-amber-400 mt-1">{pendingCount} document{pendingCount > 1 ? 's' : ''} awaiting review</p>
          )}
        </div>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[['all', 'All'], ['pending_review', 'Pending'], ['reviewed', 'Reviewed'], ['requires_action', 'Action Required'], ['approved', 'Approved']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`font-body text-xs px-4 py-2 border transition-all min-h-[36px] ${
              filter === val ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:border-saffron/50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <FileText className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No documents</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((doc, i) => {
            const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending_review;
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-4 flex-1">
                  <div className="w-10 h-10 border border-basalt/30 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-chalk/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-chalk truncate">{doc.file_name}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc.color}`}>{sc.label}</span>
                      <span className="font-body text-xs text-chalk/40">{doc.document_type}</span>
                    </div>
                    <p className="font-body text-xs text-chalk/30 mt-1">
                      {doc.client_name} <span className="text-chalk/20">·</span> {doc.client_id} <span className="text-chalk/20">·</span> {doc.client_email}
                    </p>
                    <p className="font-body text-xs text-chalk/20 mt-0.5">
                      {new Date(doc.created_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    {doc.staff_notes && (
                      <p className="font-body text-xs text-chalk/40 mt-1 italic">Note: {doc.staff_notes}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 flex-shrink-0">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </a>
                  <button onClick={() => quickAction(doc, 'approved')} disabled={!!actionLoading || actedDocs.has(doc.id)}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[36px]">
                    {actionLoading === doc.id + 'approved' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsUp className="w-3.5 h-3.5" />} Accept
                  </button>
                  <button onClick={() => quickAction(doc, 'requires_action')} disabled={!!actionLoading || actedDocs.has(doc.id)}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[36px]">
                    {actionLoading === doc.id + 'requires_action' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ThumbsDown className="w-3.5 h-3.5" />} Decline
                  </button>
                  <button onClick={() => setReviewing(doc)} disabled={actedDocs.has(doc.id)}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-saffron/40 text-saffron hover:bg-saffron/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[36px]">
                    <Send className="w-3.5 h-3.5" /> Respond
                  </button>
                  <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 disabled:opacity-50 transition-all min-h-[36px]">
                    {deleting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />} Delete
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {reviewing && (
        <ReviewModal doc={reviewing} user={user} onClose={() => setReviewing(null)} onUpdated={onRefresh} />
      )}
    </div>
  );
}