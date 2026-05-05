/**
 * RelatedItemsPanel — shows documents, invoices and contracts linked to a task or client.
 * Read-only display. Pass any subset of props.
 */
import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { FileText, Receipt, ScrollText, Eye, Clock, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

const DOC_STATUS = {
  pending_review:  { label: 'Pending',  color: 'text-amber-400' },
  reviewed:        { label: 'Reviewed', color: 'text-blue-400' },
  requires_action: { label: 'Action',   color: 'text-red-400' },
  approved:        { label: 'Approved', color: 'text-emerald-400' },
};

const INV_STATUS = {
  unpaid:            { label: 'Unpaid',     color: 'text-amber-400' },
  paid:              { label: 'Paid',       color: 'text-emerald-400' },
  overdue:           { label: 'Overdue',    color: 'text-red-400' },
  payment_requested: { label: 'Pmt. Req.', color: 'text-blue-400' },
  cancelled:         { label: 'Cancelled', color: 'text-chalk/30' },
};

const CONTRACT_STATUS = {
  draft:      { label: 'Draft',       color: 'text-chalk/40' },
  signed:     { label: 'Signed',      color: 'text-blue-400' },
  active:     { label: 'Active',      color: 'text-emerald-400' },
  expired:    { label: 'Expired',     color: 'text-amber-400' },
  terminated: { label: 'Terminated', color: 'text-red-400' },
};

const TABS = [
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'invoices',  label: 'Invoices',  icon: Receipt },
  { id: 'contracts', label: 'Contracts', icon: ScrollText },
];

export default function RelatedItemsPanel({ taskId, clientId, invoiceId }) {
  const [tab, setTab] = useState('documents');
  const [docs, setDocs] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, [taskId, clientId, invoiceId]);

  const loadAll = async () => {
    setLoading(true);
    await Promise.all([loadDocs(), loadInvoices(), loadContracts()]);
    setLoading(false);
  };

  const loadDocs = async () => {
    const filters = [];
    if (taskId) filters.push(base44.entities.ClientDocument.filter({ task_id: taskId }, '-created_date', 50));
    else if (invoiceId) filters.push(base44.entities.ClientDocument.filter({ invoice_id: invoiceId }, '-created_date', 50));
    else if (clientId) filters.push(base44.entities.ClientDocument.filter({ client_id: clientId }, '-created_date', 50));
    if (filters.length === 0) { setDocs([]); return; }
    const results = await Promise.all(filters);
    const merged = results.flat();
    const unique = merged.filter((d, i, arr) => arr.findIndex(x => x.id === d.id) === i);
    setDocs(unique);
  };

  const loadInvoices = async () => {
    if (!taskId && !clientId) { setInvoices([]); return; }
    const filter = taskId ? { invoice_id: taskId } : { client_id: clientId };
    // Invoices linked to task via invoice_id field on task, or client_id on invoice
    if (taskId) {
      // fetch invoice where linked task_id matches — we store this via ClientTask.invoice_id
      // also just load by client if we have it
      if (clientId) {
        const data = await base44.entities.Invoice.filter({ client_id: clientId }, '-created_date', 50);
        setInvoices(data);
      } else {
        setInvoices([]);
      }
    } else if (clientId) {
      const data = await base44.entities.Invoice.filter({ client_id: clientId }, '-created_date', 50);
      setInvoices(data);
    }
  };

  const loadContracts = async () => {
    if (!clientId) { setContracts([]); return; }
    const data = await base44.entities.Contract.filter({ client_id: clientId }, '-created_date', 20);
    setContracts(data);
  };

  const counts = { documents: docs.length, invoices: invoices.length, contracts: contracts.length };

  return (
    <div className="border-t border-basalt/20 pt-6 mt-2">
      <p className="font-body text-xs tracking-widest uppercase text-chalk/30 mb-4">Related Items</p>

      {/* Tab bar */}
      <div className="flex gap-0.5 mb-4 border-b border-basalt/20">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 font-body text-xs px-4 py-2.5 border-b-2 -mb-px transition-all ${
              tab === id ? 'border-saffron text-saffron' : 'border-transparent text-chalk/35 hover:text-chalk'
            }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
            {counts[id] > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === id ? 'bg-saffron/20 text-saffron' : 'bg-basalt/30 text-chalk/30'}`}>
                {counts[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><div className="w-4 h-4 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <>
          {tab === 'documents' && (
            docs.length === 0 ? (
              <p className="font-body text-xs text-chalk/25 text-center py-6">No linked documents.</p>
            ) : (
              <div className="space-y-2">
                {docs.map(doc => {
                  const sc = DOC_STATUS[doc.status] || DOC_STATUS.pending_review;
                  return (
                    <div key={doc.id} className="flex items-center justify-between gap-3 border border-basalt/20 bg-basalt/5 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-4 h-4 text-chalk/30 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-body text-xs text-chalk truncate">{doc.file_name}</p>
                          <p className="font-body text-[10px] text-chalk/30">{doc.document_type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`font-body text-[10px] ${sc.color}`}>{sc.label}</span>
                        <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                          className="text-chalk/30 hover:text-saffron transition-colors"><Eye className="w-3.5 h-3.5" /></a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'invoices' && (
            invoices.length === 0 ? (
              <p className="font-body text-xs text-chalk/25 text-center py-6">No linked invoices.</p>
            ) : (
              <div className="space-y-2">
                {invoices.map(inv => {
                  const sc = INV_STATUS[inv.status] || INV_STATUS.unpaid;
                  const total = Number(inv.amount) * (1 + (inv.tax_rate || 13) / 100);
                  return (
                    <div key={inv.id} className="flex items-center justify-between gap-3 border border-basalt/20 bg-basalt/5 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <Receipt className="w-4 h-4 text-chalk/30 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-body text-xs text-chalk font-mono">{inv.invoice_number}</p>
                          <p className="font-body text-[10px] text-chalk/30">{inv.service}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="font-body text-xs text-chalk">NPR {Math.round(total).toLocaleString('en-IN')}</span>
                        <span className={`font-body text-[10px] ${sc.color}`}>{sc.label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {tab === 'contracts' && (
            contracts.length === 0 ? (
              <p className="font-body text-xs text-chalk/25 text-center py-6">No linked contracts.</p>
            ) : (
              <div className="space-y-2">
                {contracts.map(c => {
                  const sc = CONTRACT_STATUS[c.status] || CONTRACT_STATUS.draft;
                  return (
                    <div key={c.id} className="flex items-center justify-between gap-3 border border-basalt/20 bg-basalt/5 px-4 py-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <ScrollText className="w-4 h-4 text-chalk/30 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="font-body text-xs text-chalk">{c.contract_number}</p>
                          <p className="font-body text-[10px] text-chalk/30">{c.service_type}</p>
                        </div>
                      </div>
                      <span className={`font-body text-[10px] ${sc.color} flex-shrink-0`}>{sc.label}</span>
                    </div>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}