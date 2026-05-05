/**
 * LateFinePanel — rendered inside InvoiceManagementTab for each invoice.
 * Shows the fine calculator, Penalize button, and waiver accept/deny.
 */
import { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { AlertOctagon, Calculator, Check, X, Loader2, ShieldCheck, ShieldX } from 'lucide-react';

// Fine rate: 2% of total per 30-day period after due date
const FINE_RATE_PER_PERIOD = 0.02;
const PERIOD_DAYS = 30;

function calcFine(inv) {
  if (!inv.due_date) return { days: 0, fine: 0 };
  const due = new Date(inv.due_date);
  const today = new Date();
  const msPerDay = 86400000;
  const days = Math.max(0, Math.floor((today - due) / msPerDay));
  if (days <= 0) return { days: 0, fine: 0 };
  const periods = Math.floor(days / PERIOD_DAYS);
  const total = inv.amount * (1 + (inv.tax_rate || 13) / 100);
  const fine = Math.round(total * FINE_RATE_PER_PERIOD * Math.max(periods, 1));
  return { days, fine };
}

export default function LateFinePanel({ inv, onRefresh }) {
  const [loading, setLoading] = useState('');
  const { days, fine } = calcFine(inv);
  const totalWithTax = Math.round(inv.amount * (1 + (inv.tax_rate || 13) / 100));
  const grandTotal = totalWithTax + (inv.late_fine_applied ? (inv.late_fine_amount || fine) : 0);

  const penalize = async () => {
    setLoading('penalize');
    await base44.entities.Invoice.update(inv.id, {
      late_fine_applied: true,
      late_fine_amount: fine,
      late_fine_days: days,
      status: 'overdue',
    });
    setLoading('');
    onRefresh();
  };

  const handleWaiver = async (approve) => {
    setLoading(approve ? 'approve' : 'deny');
    const updates = approve
      ? { waiver_status: 'approved', late_fine_applied: false, late_fine_amount: 0 }
      : { waiver_status: 'denied' };
    await base44.entities.Invoice.update(inv.id, updates);

    setLoading('');
    onRefresh();
  };

  // Do not render for paid/cancelled invoices unless fine already applied
  if ((inv.status === 'paid' || inv.status === 'cancelled') && !inv.late_fine_applied) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="mt-3 border border-red-500/20 bg-red-500/5 p-4 space-y-3">

      {/* Fine calculation display */}
      <div className="flex items-start gap-2">
        <AlertOctagon className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="font-body text-xs text-red-300 font-medium">
            {inv.late_fine_applied ? 'Late Fine Applied' : `${days} days overdue — Fine calculable`}
          </p>
          <div className="flex items-center gap-4 mt-1 flex-wrap">
            <span className="font-body text-xs text-chalk/40">
              <Calculator className="inline w-3 h-3 mr-1" />
              {inv.late_fine_applied ? `Fine: NPR ${(inv.late_fine_amount || 0).toLocaleString('en-IN')}` : `Calculated fine: NPR ${fine.toLocaleString('en-IN')} (2% × ${Math.ceil(days/30)} period${Math.ceil(days/30) > 1 ? 's' : ''})`}
            </span>
            {inv.late_fine_applied && (
              <span className="font-body text-xs text-red-300">
                Grand Total: NPR {grandTotal.toLocaleString('en-IN')}
              </span>
            )}
          </div>
          {inv.waiver_requested && (
            <span className={`inline-block mt-1 font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${
              inv.waiver_status === 'pending' ? 'text-amber-400 border-amber-400/30 bg-amber-400/5' :
              inv.waiver_status === 'approved' ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' :
              'text-red-400 border-red-400/30 bg-red-400/5'
            }`}>
              Waiver: {inv.waiver_status}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2">
        {/* Penalize — only if not yet applied */}
        {!inv.late_fine_applied && days > 30 && (
          <button onClick={penalize} disabled={!!loading}
            className="flex items-center gap-1.5 font-body text-xs px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all min-h-[36px]">
            {loading === 'penalize' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertOctagon className="w-3.5 h-3.5" />}
            Apply Fine (NPR {fine.toLocaleString('en-IN')})
          </button>
        )}

        {/* Waiver approve/deny — only if client requested */}
        {inv.waiver_requested && inv.waiver_status === 'pending' && (
          <>
            <button onClick={() => handleWaiver(true)} disabled={!!loading}
              className="flex items-center gap-1.5 font-body text-xs px-4 py-2 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50 transition-all min-h-[36px]">
              {loading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              Approve Waiver
            </button>
            <button onClick={() => handleWaiver(false)} disabled={!!loading}
              className="flex items-center gap-1.5 font-body text-xs px-4 py-2 border border-red-500/40 text-red-400 hover:bg-red-500/10 disabled:opacity-50 transition-all min-h-[36px]">
              {loading === 'deny' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldX className="w-3.5 h-3.5" />}
              Deny Waiver
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}