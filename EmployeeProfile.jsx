import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { FileText, Plus, Download, X, Loader2, Check, Share2, Upload } from 'lucide-react';
import { ALL_SERVICES } from '@/utils/constants';

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';
const labelCls = 'block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2';

export default function ServiceContractManager() {
  const [showForm, setShowForm] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const previewRef = useRef();

  const [form, setForm] = useState({
    service: '',
    partyA_name: 'M. Bista & Associates',
    partyA_address: 'Kathmandu, Nepal',
    partyA_pan: '',
    partyA_reg: '',
    partyA_sign: '',
    partyA_stamp: '',
    partyB_name: '',
    partyB_address: '',
    partyB_pan: '',
    partyB_reg: '',
    partyB_sign: '',
    partyB_stamp: '',
    effectiveDate: new Date().toISOString().split('T')[0],
  });
  const [uploading, setUploading] = useState('');

  const serviceDescriptions = {
    'Audit & Assurance': 'Comprehensive audit and assurance services including financial statement audits, internal audits, and compliance reviews.',
    'Tax Advisory': 'Professional tax planning, tax compliance, and advisory services to minimize tax liability and ensure regulatory compliance.',
    'Financial Advisory': 'Strategic financial planning, business valuation, and advisory services for financial optimization.',
    'Bookkeeping': 'Professional bookkeeping and accounting services for accurate financial record maintenance.',
    'GST/VAT Compliance': 'Full GST/VAT registration, filing, and compliance services as per regulations.',
  };

  const generateContractBody = () => {
    const service = form.service;
    const description = serviceDescriptions[service] || 'Professional accounting and financial services.';

    return `WHEREAS, the Service Provider is a professional firm engaged in providing accounting, audit, tax, and financial advisory services;

AND WHEREAS, the Client wishes to engage the Service Provider to provide the hereinafter described services on the terms and conditions herein set forth;

NOW, THEREFORE, in consideration of the mutual covenants and agreements herein contained, the parties hereto agree as follows:

1. SERVICES TO BE PROVIDED
   The Service Provider shall provide the following service(s):
   - ${service}: ${description}

2. SCOPE OF WORK
   The Service Provider shall perform all tasks and deliverables as mutually agreed upon and shall maintain professional standards in accordance with applicable accounting and auditing standards in Nepal.

3. FEES AND PAYMENT TERMS
   - Service fees shall be as per the quotation provided separately by the Service Provider
   - Payment shall be made within 30 days of invoice issuance
   - Late payments may attract interest as per agreed terms

4. DURATION AND TERMINATION
   - This contract shall be effective from ${form.effectiveDate}
   - Either party may terminate this contract with 30 days written notice
   - Upon termination, all outstanding fees must be settled within 15 days

5. CONFIDENTIALITY
   Both parties agree to maintain the confidentiality of all information shared during the engagement and not to disclose any proprietary information without written consent.

6. LIABILITY AND INDEMNIFICATION
   The Service Provider shall exercise due professional care in performing the services. However, the Service Provider shall not be liable for losses arising from circumstances beyond its control or from the Client's failure to provide required information.

7. COMPLIANCE AND TAX MATTERS
   The Client is responsible for timely submission of all returns and filings. The Service Provider provides advisory services but the Client remains responsible for all compliance obligations.

8. GOVERNING LAW
   This agreement shall be governed by the laws of Nepal and subject to the jurisdiction of the courts in Kathmandu.

9. AMENDMENTS
   Any modifications to this contract must be made in writing and signed by both parties.

10. ENTIRE AGREEMENT
    This contract constitutes the entire agreement between the parties and supersedes all prior negotiations and understandings.`;
  };

  const handleUpload = async (field, e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(field);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(p => ({ ...p, [field]: file_url }));
    setUploading('');
  };

  const handleDownloadPDF = async () => {
    if (!form.service || !form.partyB_name) return;
    setDownloading(true);

    const escape = (str) => (str || '').replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const contractBody = generateContractBody();
    const today = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' });
    const signA = form.partyA_sign ? `<img src="${form.partyA_sign}" style="width: 80px; height: 60px; object-fit: contain; margin-top: 10px;"/>` : '';
    const stampA = form.partyA_stamp ? `<img src="${form.partyA_stamp}" style="width: 80px; height: 60px; object-fit: contain; margin-top: 10px;"/>` : '<div class="stamp-area">Stamp</div>';
    const signB = form.partyB_sign ? `<img src="${form.partyB_sign}" style="width: 80px; height: 60px; object-fit: contain; margin-top: 10px;"/>` : '';
    const stampB = form.partyB_stamp ? `<img src="${form.partyB_stamp}" style="width: 80px; height: 60px; object-fit: contain; margin-top: 10px;"/>` : '<div class="stamp-area">Stamp</div>';
    const html = '<html><head><meta charset="UTF-8"/><style>' +
      '@import url("https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap");' +
      'body { font-family: "Times New Roman", "Noto Serif", serif; color: #000; padding: 40px; max-width: 900px; margin: auto; line-height: 2; font-size: 12px; }' +
      '.header { text-align: center; margin-bottom: 30px; border-bottom: 3px double #000; padding-bottom: 20px; }' +
      '.firm-name { font-size: 18px; font-weight: 700; letter-spacing: 0.05em; }' +
      '.firm-sub { font-size: 11px; margin-top: 3px; }' +
      'h1 { font-size: 14px; font-weight: 700; text-align: center; margin: 30px 0 10px; text-transform: uppercase; letter-spacing: 0.1em; }' +
      '.parties { margin: 20px 0; }' +
      '.party { margin-bottom: 20px; }' +
      '.party-label { font-weight: 700; margin-bottom: 8px; text-decoration: underline; }' +
      '.party-details { font-size: 12px; line-height: 1.8; margin-left: 30px; }' +
      '.contract-body { font-size: 11px; line-height: 1.9; margin: 30px 0; white-space: pre-wrap; text-align: justify; }' +
      '.signature-section { margin-top: 60px; }' +
      '.signature-block { display: inline-block; width: 48%; margin-right: 2%; vertical-align: top; }' +
      '.signature-block:last-child { margin-right: 0; }' +
      '.sig-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 40px; }' +
      '.sig-name { margin-top: 30px; font-weight: 700; font-size: 11px; }' +
      '.stamp-area { border: 2px dashed #000; width: 80px; height: 60px; display: flex; align-items: center; justify-content: center; font-size: 9px; margin-top: 10px; }' +
      '.sig-item { margin: 15px 0; }' +
      '.date-line { margin-top: 50px; font-size: 11px; }' +
      '@media print { body { padding: 0; margin: 0; } }' +
      '</style></head><body>' +
      '<div class="header">' +
      '<div class="firm-name">M. BISTA & ASSOCIATES</div>' +
      '<div class="firm-sub">Chartered Accountants · Kathmandu, Nepal</div>' +
      '</div>' +
      '<h1>SERVICE CONTRACT</h1>' +
      '<h1 style="font-size: 14px; margin-bottom: 10px;">For ' + escape(form.service) + '</h1>' +
      '<div class="parties">' +
      '<div class="party">' +
      '<div class="party-label">SERVICE PROVIDER (PARTY A):</div>' +
      '<div class="party-details">' +
      'Name: ' + escape(form.partyA_name) + '<br/>' +
      'Address: ' + escape(form.partyA_address) + '<br/>' +
      'PAN: ' + escape(form.partyA_pan || 'N/A') + '<br/>' +
      'Registration No.: ' + escape(form.partyA_reg || 'N/A') +
      '</div></div>' +
      '<div class="party">' +
      '<div class="party-label">CLIENT / CUSTOMER (PARTY B):</div>' +
      '<div class="party-details">' +
      'Name: ' + escape(form.partyB_name) + '<br/>' +
      'Address: ' + escape(form.partyB_address) + '<br/>' +
      'PAN: ' + escape(form.partyB_pan || 'N/A') + '<br/>' +
      'Registration No.: ' + escape(form.partyB_reg || 'N/A') +
      '</div></div>' +
      '</div>' +
      '<div class="contract-body">' + escape(contractBody) + '</div>' +
      '<div class="signature-section">' +
      '<div style="text-align: center; margin-bottom: 50px; font-size: 12px; font-weight: 700;">' +
      'IN WITNESS WHEREOF, both parties have executed this contract on ' + today +
      '</div>' +
      '<div class="signature-block">' +
      '<div class="sig-label">For M. Bista & Associates (Service Provider)</div>' +
      '<div class="sig-item">' +
      '<div style="margin-bottom: 5px;">Signature:</div>' +
      (signA || '<div style="border-top: 1px solid #000; width: 80px; height: 40px;"></div>') +
      '</div>' +
      '<div class="sig-item">' +
      '<div style="margin-bottom: 5px; margin-top: 15px;">Stamp:</div>' +
      stampA +
      '</div>' +
      '<div class="sig-name">' + escape(form.partyA_name) + '</div>' +
      '</div>' +
      '<div class="signature-block" style="text-align: center;">' +
      '<div class="sig-label">For ' + escape(form.partyB_name) + ' (Client/Customer)</div>' +
      '<div class="sig-item">' +
      '<div style="margin-bottom: 5px;">Signature:</div>' +
      (signB || '<div style="border-top: 1px solid #000; width: 80px; height: 40px;"></div>') +
      '</div>' +
      '<div class="sig-item">' +
      '<div style="margin-bottom: 5px; margin-top: 15px;">Stamp:</div>' +
      stampB +
      '</div>' +
      '<div class="sig-name">' + escape(form.partyB_name) + '</div>' +
      '</div>' +
      '</div>' +
      '<div class="date-line" style="margin-top: 60px;">Date: _______________</div>' +
      '</body></html>';

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
    win.print();
    setDownloading(false);
  };

  const ContractPreview = () => (
    <div className="border border-border p-8 bg-card text-card-foreground font-serif text-sm leading-relaxed max-h-[600px] overflow-y-auto">
      <div className="text-center mb-6 border-b border-basalt/20 pb-4">
        <p className="font-semibold">M. BISTA & ASSOCIATES</p>
        <p className="text-xs text-chalk/40">Chartered Accountants · Kathmandu, Nepal</p>
      </div>

      <h2 className="text-center font-bold text-base mb-2">SERVICE CONTRACT</h2>
      <h3 className="text-center font-semibold text-sm mb-6">For {form.service || '[Service]'}</h3>

      <div className="space-y-4 mb-6">
        <div>
          <p className="font-semibold text-xs">SERVICE PROVIDER (PARTY A):</p>
          <p className="text-xs ml-4 mt-1">Name: {form.partyA_name}</p>
          <p className="text-xs ml-4">Address: {form.partyA_address}</p>
          <p className="text-xs ml-4">PAN: {form.partyA_pan || 'N/A'}</p>
          <p className="text-xs ml-4">Registration No.: {form.partyA_reg || 'N/A'}</p>
        </div>
        <div>
          <p className="font-semibold text-xs">CLIENT / CUSTOMER (PARTY B):</p>
          <p className="text-xs ml-4 mt-1">Name: {form.partyB_name || '[To be filled]'}</p>
          <p className="text-xs ml-4">Address: {form.partyB_address || '[To be filled]'}</p>
          <p className="text-xs ml-4">PAN: {form.partyB_pan || 'N/A'}</p>
          <p className="text-xs ml-4">Registration No.: {form.partyB_reg || 'N/A'}</p>
        </div>
      </div>

      <div className="text-xs whitespace-pre-wrap text-chalk/70 mb-8 max-h-48 overflow-y-auto">
        {generateContractBody()}
      </div>

      <div className="border-t border-basalt/20 pt-4">
        <p className="text-xs text-center mb-6 mt-6">IN WITNESS WHEREOF, both parties have executed this contract</p>
        <div className="flex justify-between">
          <div className="text-center text-xs">
            <p className="border-t border-basalt/20 w-24 h-12 flex items-end justify-center pb-1">Stamp & Sign</p>
            <p className="font-semibold mt-2">{form.partyA_name}</p>
          </div>
          <div className="text-center text-xs">
            <p className="border-t border-basalt/20 w-24 h-12 flex items-end justify-center pb-1">Stamp & Sign</p>
            <p className="font-semibold mt-2">{form.partyB_name || '[Party B]'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-chalk font-light">Service Contracts</h2>
          <p className="font-body text-xs text-chalk/35 mt-1">Create and manage service contracts with clients.</p>
        </div>
        {!showForm && (
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 min-h-[44px]">
            <Plus className="w-4 h-4" /> New Contract
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="border border-border p-6 mb-6 relative">
            <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
            <div className="flex items-center justify-between mb-4">
              <p className="font-body text-xs tracking-widest uppercase text-saffron">Create Service Contract</p>
              <button onClick={() => { setShowForm(false); setPreviewMode(false); }} className="text-chalk/30 hover:text-chalk">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!previewMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
                <div className="sm:col-span-2">
                  <label className={labelCls}>Service *</label>
                  <select value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                    <option value="">Select service</option>
                    {ALL_SERVICES.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className={labelCls}>Effective Date *</label>
                  <input type="date" value={form.effectiveDate} onChange={e => setForm(p => ({ ...p, effectiveDate: e.target.value }))}
                    className={inputCls} />
                </div>

                <div className="sm:col-span-2 border-t border-basalt/20 pt-4 mt-2">
                  <p className="font-body text-xs tracking-widest uppercase text-saffron mb-4">Service Provider (Party A)</p>
                </div>

                <div>
                  <label className={labelCls}>Name</label>
                  <input value={form.partyA_name} disabled className={inputCls + ' opacity-50'} />
                </div>
                <div>
                  <label className={labelCls}>PAN Number</label>
                  <input value={form.partyA_pan} onChange={e => setForm(p => ({ ...p, partyA_pan: e.target.value }))}
                    placeholder="e.g. XXXXXXXXX" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input value={form.partyA_address} onChange={e => setForm(p => ({ ...p, partyA_address: e.target.value }))}
                    className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Registration Number</label>
                  <input value={form.partyA_reg} onChange={e => setForm(p => ({ ...p, partyA_reg: e.target.value }))}
                    placeholder="e.g. XXXXXXXXX" className={inputCls} />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Signature</label>
                  <div className="flex items-center gap-3">
                    {form.partyA_sign && <img src={form.partyA_sign} alt="Sig" className="w-12 h-12 object-contain border border-basalt/30" />}
                    <label className="flex items-center gap-2 cursor-pointer font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      {uploading === 'partyA_sign' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading === 'partyA_sign' ? 'Uploading...' : 'Upload Signature'}
                      <input type="file" accept="image/*" onChange={(e) => handleUpload('partyA_sign', e)} className="hidden" />
                    </label>
                    {form.partyA_sign && <button onClick={() => setForm(p => ({ ...p, partyA_sign: '' }))} className="text-chalk/30 hover:text-red-400 text-xs">Remove</button>}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Stamp</label>
                  <div className="flex items-center gap-3">
                    {form.partyA_stamp && <img src={form.partyA_stamp} alt="Stamp" className="w-12 h-12 object-contain border border-basalt/30" />}
                    <label className="flex items-center gap-2 cursor-pointer font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      {uploading === 'partyA_stamp' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading === 'partyA_stamp' ? 'Uploading...' : 'Upload Stamp'}
                      <input type="file" accept="image/*" onChange={(e) => handleUpload('partyA_stamp', e)} className="hidden" />
                    </label>
                    {form.partyA_stamp && <button onClick={() => setForm(p => ({ ...p, partyA_stamp: '' }))} className="text-chalk/30 hover:text-red-400 text-xs">Remove</button>}
                  </div>
                </div>

                <div className="sm:col-span-2 border-t border-basalt/20 pt-4 mt-2">
                  <p className="font-body text-xs tracking-widest uppercase text-saffron mb-4">Client / Customer (Party B) *</p>
                </div>

                <div>
                  <label className={labelCls}>Name *</label>
                  <input value={form.partyB_name} onChange={e => setForm(p => ({ ...p, partyB_name: e.target.value }))}
                    placeholder="Client name" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>PAN Number</label>
                  <input value={form.partyB_pan} onChange={e => setForm(p => ({ ...p, partyB_pan: e.target.value }))}
                    placeholder="e.g. XXXXXXXXX" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Address</label>
                  <input value={form.partyB_address} onChange={e => setForm(p => ({ ...p, partyB_address: e.target.value }))}
                    placeholder="Client address" className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Registration Number</label>
                  <input value={form.partyB_reg} onChange={e => setForm(p => ({ ...p, partyB_reg: e.target.value }))}
                    placeholder="e.g. XXXXXXXXX" className={inputCls} />
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Signature</label>
                  <div className="flex items-center gap-3">
                    {form.partyB_sign && <img src={form.partyB_sign} alt="Sig" className="w-12 h-12 object-contain border border-basalt/30" />}
                    <label className="flex items-center gap-2 cursor-pointer font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      {uploading === 'partyB_sign' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading === 'partyB_sign' ? 'Uploading...' : 'Upload Signature'}
                      <input type="file" accept="image/*" onChange={(e) => handleUpload('partyB_sign', e)} className="hidden" />
                    </label>
                    {form.partyB_sign && <button onClick={() => setForm(p => ({ ...p, partyB_sign: '' }))} className="text-chalk/30 hover:text-red-400 text-xs">Remove</button>}
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className={labelCls}>Stamp</label>
                  <div className="flex items-center gap-3">
                    {form.partyB_stamp && <img src={form.partyB_stamp} alt="Stamp" className="w-12 h-12 object-contain border border-basalt/30" />}
                    <label className="flex items-center gap-2 cursor-pointer font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      {uploading === 'partyB_stamp' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      {uploading === 'partyB_stamp' ? 'Uploading...' : 'Upload Stamp'}
                      <input type="file" accept="image/*" onChange={(e) => handleUpload('partyB_stamp', e)} className="hidden" />
                    </label>
                    {form.partyB_stamp && <button onClick={() => setForm(p => ({ ...p, partyB_stamp: '' }))} className="text-chalk/30 hover:text-red-400 text-xs">Remove</button>}
                  </div>
                </div>

                <div className="sm:col-span-2 flex gap-3 mt-4">
                  <button onClick={() => { if (form.service && form.partyB_name) setPreviewMode(true); }}
                    disabled={!form.service || !form.partyB_name}
                    className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-40 transition-all min-h-[44px]">
                    <FileText className="w-4 h-4" /> Preview Contract
                  </button>
                  <button onClick={() => { setShowForm(false); setPreviewMode(false); }}
                    className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk transition-all min-h-[44px]">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4 flex gap-3 flex-wrap">
                  <button onClick={() => setPreviewMode(false)}
                    className="font-body text-xs px-4 py-2 border border-basalt/30 text-chalk/40 hover:text-chalk transition-all min-h-[36px]">
                    ← Back to Edit
                  </button>
                  <button onClick={() => {
                    const subject = 'Service Contract - ' + form.service;
                    const body = 'Service Contract for ' + form.service + ' with ' + form.partyB_name + '. Please review and sign.';
                    window.location.href = 'mailto:' + (form.partyB_email || '') + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
                  }}
                    className="flex items-center gap-2 font-body text-xs px-4 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                    <Share2 className="w-3.5 h-3.5" /> Share via Email
                  </button>
                  <button onClick={handleDownloadPDF} disabled={downloading}
                    className="flex items-center gap-2 font-body text-xs px-4 py-2 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[36px]">
                    {downloading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                    Download PDF
                  </button>
                </div>
                <ContractPreview />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!showForm && (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <FileText className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No contracts yet</p>
          <p className="font-body text-sm text-chalk/20 mt-1">Click "New Contract" to create a service agreement.</p>
        </div>
      )}
    </div>
  );
}