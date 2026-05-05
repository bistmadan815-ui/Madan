import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, Loader2 } from 'lucide-react';

const STATUS_COLORS = {
  draft: 'text-amber-400 border-amber-400/30 bg-amber-400/5',
  signed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  active: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
  expired: 'text-red-400 border-red-400/30 bg-red-400/5',
  terminated: 'text-red-400 border-red-400/30 bg-red-400/5',
};

function generateContractPDF(contract) {
  const fmt = (str) => str || '—';
  const html = `<html><head><meta charset='UTF-8'/><style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Noto Sans', Arial, sans-serif; color: #1a202c; background: #fff; }
    .page { max-width: 794px; margin: auto; padding: 40px 48px; line-height: 1.6; }
    .header { border-bottom: 3px double #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
    .firm-name { font-size: 20px; font-weight: 800; color: #1e3a5f; letter-spacing: 0.02em; }
    .firm-sub { font-size: 11px; color: #718096; margin-top: 4px; }
    .title { font-size: 18px; font-weight: 700; color: #1e3a5f; text-align: center; margin: 20px 0; text-transform: uppercase; letter-spacing: 0.05em; }
    .subtitle { font-size: 12px; color: #718096; text-align: center; margin-bottom: 20px; }
    .section-title { font-size: 12px; font-weight: 700; color: #1e3a5f; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 20px; margin-bottom: 10px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; }
    .content { font-size: 11px; line-height: 1.7; color: #4a5568; margin-bottom: 12px; }
    .party-box { border: 1px solid #e2e8f0; padding: 12px; margin: 10px 0; }
    .party-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: #a0aec0; font-weight: 700; margin-bottom: 4px; }
    .party-value { font-size: 11px; color: #1a202c; margin-bottom: 4px; }
    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .signature-area { margin-top: 30px; border-top: 2px solid #1e3a5f; padding-top: 20px; }
    .sig-block { margin-bottom: 20px; }
    .sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #718096; font-weight: 600; }
    .sig-line { border-top: 1px solid #1a202c; margin: 40px 0 4px 0; }
    .sig-name { font-size: 11px; font-weight: 600; color: #1a202c; }
    .sig-title { font-size: 10px; color: #718096; }
    .stamp-area { border: 2px dashed #cbd5e0; width: 100px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 9px; color: #cbd5e0; text-align: center; margin-top: 10px; }
    .footer { margin-top: 30px; padding-top: 12px; border-top: 2px solid #1e3a5f; font-size: 9px; color: #a0aec0; }
    .status { display: inline-block; padding: 3px 10px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; background: #c6f6d5; color: #22543d; border: 1px solid #9ae6b4; margin-bottom: 10px; }
  </style></head><body><div class='page'>
    <div class='header'>
      <div class='firm-name'>M. BISTA & ASSOCIATES</div>
      <div class='firm-sub'>Chartered Accountants · Kathmandu, Nepal</div>
    </div>

    <div class='title'>Service Agreement / Contract</div>
    <div class='subtitle'>Contract No. ${fmt(contract.contract_number)}</div>
    <div><span class='status'>${contract.status?.toUpperCase()}</span></div>

    <div class='section-title'>Parties to the Agreement</div>
    <div class='grid-2'>
      <div class='party-box'>
        <div class='party-label'>Service Provider (Firm)</div>
        <div class='party-value'><strong>${fmt(contract.firm_name)}</strong></div>
        <div class='party-value'>PAN: ${fmt(contract.firm_pan)}</div>
        <div class='party-value'>Reg. No.: ${fmt(contract.firm_registration)}</div>
        <div class='party-value'>Address: ${fmt(contract.firm_address)}</div>
      </div>
      <div class='party-box'>
        <div class='party-label'>Service Recipient (Client)</div>
        <div class='party-value'><strong>${fmt(contract.client_name)}</strong></div>
        <div class='party-value'>PAN: ${fmt(contract.client_pan)}</div>
        <div class='party-value'>Reg. No.: ${fmt(contract.client_registration)}</div>
        <div class='party-value'>Address: ${fmt(contract.client_address)}</div>
      </div>
    </div>

    <div class='section-title'>Service Details</div>
    <div class='party-box'>
      <div class='content'><strong>Service Type:</strong> ${fmt(contract.service_type)}</div>
      <div class='content'><strong>Contract Date:</strong> ${fmt(contract.contract_date)}</div>
      <div class='content'><strong>Effective Date:</strong> ${fmt(contract.effective_date)}</div>
      <div class='content'><strong>End Date:</strong> ${fmt(contract.end_date)}</div>
    </div>

    <div class='section-title'>Terms & Conditions</div>
    <div class='content' style='white-space: pre-line;'>${fmt(contract.contract_terms)}</div>

    ${contract.notes ? `<div class='section-title'>Additional Notes</div><div class='content'>${contract.notes}</div>` : ''}

    <div class='signature-area'>
      <div style='display: grid; grid-template-columns: 1fr 1fr; gap: 30px;'>
        <div class='sig-block'>
          <div class='sig-label'>For M. Bista & Associates</div>
          <div class='sig-line'></div>
          <div class='sig-name'>${fmt(contract.firm_signatory_name)}</div>
          <div class='sig-title'>${fmt(contract.firm_signatory_title)}</div>
          <div class='sig-title'>Date: _______________</div>
          <div class='stamp-area'>Stamp &<br/>Sign</div>
        </div>
        <div class='sig-block'>
          <div class='sig-label'>For ${fmt(contract.client_name)}</div>
          <div class='sig-line'></div>
          <div class='sig-name'>${fmt(contract.client_signatory_name)}</div>
          <div class='sig-title'>${fmt(contract.client_signatory_title)}</div>
          <div class='sig-title'>Date: _______________</div>
          <div class='stamp-area'>Stamp &<br/>Sign</div>
        </div>
      </div>
    </div>

    <div class='footer'>
      <p>This contract is legally binding and subject to the laws of Nepal.</p>
      <p style='margin-top: 6px;'>Subject to Kathmandu jurisdiction.</p>
    </div>
  </div></body></html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.print();
}

export default function ContractViewerModal({ contract, onClose }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    generateContractPDF(contract);
    setDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative bg-background border border-border w-full max-w-2xl max-h-[80vh] overflow-y-auto p-8" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display text-2xl text-chalk font-light">Contract Details</h3>
            <p className="font-body text-xs text-chalk/35 mt-1">{contract.contract_number}</p>
          </div>
          <button onClick={onClose} className="text-chalk/30 hover:text-chalk"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="border border-border p-4">
            <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Contract Status</p>
            <span className={`inline-block font-body text-xs tracking-widest uppercase px-2 py-1 border ${STATUS_COLORS[contract.status] || STATUS_COLORS.draft}`}>
              {contract.status}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-border p-4">
              <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Service Provider</p>
              <p className="font-body text-sm text-chalk font-medium">{contract.firm_name}</p>
              <p className="font-body text-xs text-chalk/50 mt-1">PAN: {contract.firm_pan}</p>
              <p className="font-body text-xs text-chalk/50">Reg: {contract.firm_registration}</p>
            </div>
            <div className="border border-border p-4">
              <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client</p>
              <p className="font-body text-sm text-chalk font-medium">{contract.client_name}</p>
              <p className="font-body text-xs text-chalk/50 mt-1">PAN: {contract.client_pan}</p>
              <p className="font-body text-xs text-chalk/50">Reg: {contract.client_registration}</p>
            </div>
          </div>

          <div className="border border-border p-4">
            <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Service Type</p>
            <p className="font-body text-sm text-chalk">{contract.service_type}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="border border-border p-4">
              <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Contract Date</p>
              <p className="font-body text-sm text-chalk">{contract.contract_date}</p>
            </div>
            <div className="border border-border p-4">
              <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Effective Date</p>
              <p className="font-body text-sm text-chalk">{contract.effective_date}</p>
            </div>
            <div className="border border-border p-4">
              <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">End Date</p>
              <p className="font-body text-sm text-chalk">{contract.end_date || '—'}</p>
            </div>
          </div>

          {contract.contract_terms && (
            <div className="border border-border p-4">
              <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Terms & Conditions</p>
              <p className="font-body text-sm text-chalk/70 whitespace-pre-line leading-relaxed">{contract.contract_terms}</p>
            </div>
          )}

          {contract.notes && (
            <div className="border border-border p-4">
              <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Notes</p>
              <p className="font-body text-sm text-chalk/70">{contract.notes}</p>
            </div>
          )}
        </div>

        <button onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px] w-full justify-center">
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Generating PDF...' : 'Download Contract (PDF)'}
        </button>
      </motion.div>
    </div>
  );
}