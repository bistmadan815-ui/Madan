import { motion } from 'framer-motion';
import { X, Printer, Download } from 'lucide-react';

const COMPANY = {
  name: 'M. BISTA & ASSOCIATES',
  name_np: 'एम. बिस्ता र एसोसिएट्स',
  address: 'Kathmandu, Nepal',
  pan: '300XXXXXX',
  vat_reg: 'VAT-300XXXXXX',
  phone: '+977-1-XXXXXXX',
  email: 'info@mbista.com.np',
};

const BANK_ACCOUNTS = [
  { bank: 'Nabil Bank Limited', account_name: 'M. Bista & Associates', account_number: 'XXXXXXXXXXXXXXXX', branch: 'New Baneshwor, Kathmandu' },
  { bank: 'Nepal Investment Mega Bank', account_name: 'M. Bista & Associates', account_number: 'XXXXXXXXXXXXXXXX', branch: 'Thamel, Kathmandu' },
];

// Number to words (up to crores)
function numberToWords(n) {
  if (!n || isNaN(n)) return 'Zero';
  const ones = ['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
  const tens = ['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
  function words(num) {
    if (num === 0) return '';
    if (num < 20) return ones[num] + ' ';
    if (num < 100) return tens[Math.floor(num/10)] + ' ' + ones[num%10] + ' ';
    if (num < 1000) return ones[Math.floor(num/100)] + ' Hundred ' + words(num%100);
    if (num < 100000) return words(Math.floor(num/1000)) + 'Thousand ' + words(num%1000);
    if (num < 10000000) return words(Math.floor(num/100000)) + 'Lakh ' + words(num%100000);
    return words(Math.floor(num/10000000)) + 'Crore ' + words(num%10000000);
  }
  const intPart = Math.floor(n);
  const decPart = Math.round((n - intPart) * 100);
  let result = words(intPart).trim() + ' Rupees';
  if (decPart > 0) result += ' and ' + words(decPart).trim() + ' Paisa';
  return result + ' Only';
}

function getFiscalYear(dateStr) {
  const d = dateStr ? new Date(dateStr) : new Date();
  const month = d.getMonth() + 1; // 1-based
  const year = d.getFullYear();
  // Nepal fiscal year: mid-July (month 7) to mid-July next year
  // Approximate: if month >= 7 → FY starts this year
  const bsOffset = 56; // approximate BS year offset
  if (month >= 7) {
    return `${year + bsOffset}/${String(year + bsOffset + 1).slice(-2)}`;
  } else {
    return `${year + bsOffset - 1}/${String(year + bsOffset).slice(-2)}`;
  }
}

function PrintableInvoice({ inv }) {
  const taxable = Number(inv.amount) || 0;
  const vatRate = Number(inv.tax_rate) || 13;
  const vatAmt = (taxable * vatRate) / 100;
  const total = taxable + vatAmt;
  const fmt = n => Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fiscalYear = getFiscalYear(inv.due_date || inv.created_date);
  const invoiceDate = inv.due_date
    ? new Date(inv.due_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div id="printable-invoice" style={{ fontFamily: 'Arial, sans-serif', color: '#1a202c', maxWidth: '794px', margin: '0 auto', padding: '32px 40px', background: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '3px double #1e3a5f', paddingBottom: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '900', color: '#1e3a5f', letterSpacing: '0.05em' }}>{COMPANY.name}</div>
          <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '2px' }}>{COMPANY.name_np}</div>
          <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '4px' }}>{COMPANY.address}</div>
          <div style={{ fontSize: '11px', color: '#4a5568' }}>PAN: {COMPANY.pan} | VAT Reg: {COMPANY.vat_reg}</div>
          <div style={{ fontSize: '11px', color: '#4a5568' }}>Tel: {COMPANY.phone} | {COMPANY.email}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#1e3a5f' }}>TAX INVOICE</div>
          <div style={{ fontSize: '11px', color: '#718096', marginTop: '4px' }}>कर बिल</div>
          <div style={{ fontSize: '13px', color: '#2d3748', marginTop: '8px' }}>
            <strong>Invoice No:</strong> {inv.invoice_number}
          </div>
          <div style={{ fontSize: '12px', color: '#4a5568' }}>
            <strong>Date:</strong> {invoiceDate}
          </div>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            Fiscal Year: {fiscalYear}
          </div>
        </div>
      </div>

      {/* Bill To */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
        <div style={{ border: '1px solid #e2e8f0', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a0aec0', marginBottom: '6px' }}>Bill To / खरिदकर्ता</div>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a202c' }}>{inv.client_name || '—'}</div>
          {inv.client_company && <div style={{ fontSize: '12px', color: '#4a5568' }}>{inv.client_company}</div>}
          {inv.client_address && <div style={{ fontSize: '11px', color: '#4a5568', marginTop: '2px' }}>{inv.client_address}</div>}
          {inv.client_pan && <div style={{ fontSize: '11px', color: '#4a5568' }}>PAN: {inv.client_pan}</div>}
          {inv.client_email && <div style={{ fontSize: '11px', color: '#4a5568' }}>{inv.client_email}</div>}
        </div>
        <div style={{ border: '1px solid #e2e8f0', padding: '12px 14px' }}>
          <div style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.12em', color: '#a0aec0', marginBottom: '6px' }}>Payment Info</div>
          {BANK_ACCOUNTS.slice(0, 1).map(b => (
            <div key={b.bank} style={{ fontSize: '11px', color: '#4a5568', lineHeight: '1.6' }}>
              <div><strong>{b.bank}</strong></div>
              <div>A/C Name: {b.account_name}</div>
              <div>A/C No: {b.account_number}</div>
              <div>Branch: {b.branch}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0', fontSize: '12px' }}>
        <thead>
          <tr>
            {['S.N.', 'Description of Service', 'Qty', 'Rate (NPR)', 'Taxable Amount (NPR)'].map(h => (
              <th key={h} style={{ background: '#1e3a5f', color: '#fff', padding: '8px 10px', textAlign: h === 'S.N.' || h === 'Qty' ? 'center' : 'left', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #edf2f7' }}>1</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7' }}>
              <div style={{ fontWeight: '600' }}>{inv.service}</div>
              {inv.description && <div style={{ fontSize: '11px', color: '#718096', marginTop: '2px' }}>{inv.description}</div>}
            </td>
            <td style={{ padding: '10px', textAlign: 'center', borderBottom: '1px solid #edf2f7' }}>1</td>
            <td style={{ padding: '10px', borderBottom: '1px solid #edf2f7' }}>{fmt(taxable)}</td>
            <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #edf2f7' }}>{fmt(taxable)}</td>
          </tr>
        </tbody>
      </table>

      {/* Totals */}
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <tbody>
          <tr style={{ background: '#f7fafc' }}>
            <td colSpan={3} style={{ padding: '8px 10px', color: '#718096', fontSize: '11px' }}>Non-Taxable Amount</td>
            <td style={{ padding: '8px 10px', textAlign: 'right', color: '#718096' }}>—</td>
          </tr>
          <tr>
            <td colSpan={3} style={{ padding: '8px 10px', color: '#4a5568' }}>Taxable Amount</td>
            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(taxable)}</td>
          </tr>
          <tr style={{ background: '#f7fafc' }}>
            <td colSpan={3} style={{ padding: '8px 10px', color: '#4a5568' }}>VAT @ {vatRate}% (मूल्य अभिवृद्धि कर)</td>
            <td style={{ padding: '8px 10px', textAlign: 'right' }}>{fmt(vatAmt)}</td>
          </tr>
          <tr style={{ borderTop: '2px solid #1e3a5f', background: '#ebf8ff' }}>
            <td colSpan={3} style={{ padding: '10px', fontWeight: '800', fontSize: '14px', color: '#1e3a5f' }}>Grand Total (जम्मा रकम)</td>
            <td style={{ padding: '10px', fontWeight: '800', fontSize: '14px', color: '#1e3a5f', textAlign: 'right' }}>NPR {fmt(total)}</td>
          </tr>
        </tbody>
      </table>

      {/* Amount in Words */}
      <div style={{ border: '1px solid #e2e8f0', background: '#f7fafc', padding: '10px 14px', marginTop: '10px', fontSize: '12px' }}>
        <span style={{ color: '#718096', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount in Words: </span>
        <strong>{numberToWords(Math.round(total))}</strong>
      </div>

      {inv.notes && (
        <div style={{ marginTop: '12px', fontSize: '11px', color: '#718096', fontStyle: 'italic' }}>Note: {inv.notes}</div>
      )}

      {/* Signature block */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginTop: '40px' }}>
        <div style={{ borderTop: '1px solid #cbd5e0', paddingTop: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#718096' }}>Client Signature / Stamp</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>{inv.client_name}</div>
        </div>
        <div style={{ borderTop: '1px solid #cbd5e0', paddingTop: '8px', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', color: '#718096' }}>Authorized Signature / Stamp</div>
          <div style={{ fontSize: '11px', color: '#718096' }}>For M. Bista & Associates</div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '24px', borderTop: '1px solid #e2e8f0', paddingTop: '10px', fontSize: '9px', color: '#a0aec0', textAlign: 'center' }}>
        This is a computer-generated Tax Invoice as per Value Added Tax Act, 2052 (Nepal). | Subject to Kathmandu Jurisdiction.
        {inv.paid_date && <span style={{ color: '#22543d', fontWeight: '700', marginLeft: '16px' }}>✓ PAID on {inv.paid_date}</span>}
      </div>
    </div>
  );
}

export { BANK_ACCOUNTS };

export default function VATInvoicePreview({ inv, onClose }) {
  const handlePrint = () => {
    const content = document.getElementById('printable-invoice').innerHTML;
    const win = window.open('', '_blank');
    win.document.write(`<html><head><title>Invoice ${inv.invoice_number}</title>
      <style>@page{size:A4;margin:12mm} body{margin:0;font-family:Arial,sans-serif} @media print{.no-print{display:none}}</style>
    </head><body>${content}</body></html>`);
    win.document.close();
    setTimeout(() => { win.print(); }, 300);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-background/90 backdrop-blur-md overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="w-full max-w-3xl my-6" onClick={e => e.stopPropagation()}>
        {/* Controls */}
        <div className="no-print flex items-center justify-between mb-4">
          <p className="font-body text-xs text-chalk/40 tracking-widest uppercase">Invoice Preview — {inv.invoice_number}</p>
          <div className="flex gap-2">
            <button onClick={handlePrint}
              className="flex items-center gap-2 font-body text-xs px-4 py-2 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all min-h-[36px]">
              <Printer className="w-3.5 h-3.5" /> Print / PDF
            </button>
            <button onClick={onClose} className="text-chalk/40 hover:text-chalk p-2"><X className="w-5 h-5" /></button>
          </div>
        </div>
        {/* Invoice */}
        <div className="bg-white shadow-2xl">
          <PrintableInvoice inv={inv} />
        </div>
      </motion.div>
    </div>
  );
}

export { PrintableInvoice, getFiscalYear, numberToWords };