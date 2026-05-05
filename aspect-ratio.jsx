import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { FileText, Eye, Trash2, Loader2, AlertCircle } from 'lucide-react';

const STATUS_CONFIG = {
  pending_review: { label: 'Pending Review', color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  reviewed: { label: 'Reviewed', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  requires_action: { label: 'Requires Action', color: 'text-red-400 border-red-400/30 bg-red-400/5' },
  approved: { label: 'Approved', color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
};

export default function DocumentsTab() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    const data = await base44.entities.ClientDocument.list('-created_date', 100);
    setDocuments(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (confirm('Delete this document?')) {
      setDeleting(id);
      await base44.entities.ClientDocument.delete(id);
      loadDocuments();
      setDeleting(null);
    }
  };

  const filtered = filter === 'all' ? documents : documents.filter(d => d.status === filter);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <h3 className="font-display text-xl text-chalk font-light mb-4">Client Documents</h3>

      <div className="flex flex-wrap gap-2 mb-6">
        {[['all', 'All'], ['pending_review', 'Pending'], ['reviewed', 'Reviewed'], ['requires_action', 'Action'], ['approved', 'Approved']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            className={`font-body text-xs px-4 py-2 border transition-all min-h-[36px] ${
              filter === val ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:border-saffron/50'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-basalt/20">
            <FileText className="w-8 h-8 text-chalk/15 mx-auto mb-2" />
            <p className="font-body text-xs text-chalk/30">No documents</p>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const sc = STATUS_CONFIG[doc.status] || STATUS_CONFIG.pending_review;
            return (
              <motion.div key={doc.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="border border-border p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-chalk truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc.color}`}>{sc.label}</span>
                    <span className="font-body text-xs text-chalk/40">{doc.document_type}</span>
                  </div>
                  <p className="font-body text-xs text-chalk/30 mt-1">{doc.client_name} · {doc.client_id}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                    <Eye className="w-3.5 h-3.5" /> View
                  </a>
                  <button onClick={() => handleDelete(doc.id)} disabled={deleting === doc.id}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 disabled:opacity-50 transition-all min-h-[36px]">
                    {deleting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}