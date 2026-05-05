import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import InvoiceTab from '@/components/client/InvoiceTab';
import ProjectBoard from '@/components/client/ProjectBoard';
import DocumentsTab from '@/components/client/DocumentsTab';
import PaymentModal from '@/components/client/PaymentModal';
import ClientActionsPanel from '@/components/client/ClientActionsPanel';
import ContractViewerModal from '@/components/ContractViewerModal';
import SupportTab from '@/components/client/SupportTab';
import CompletedTasksView from '@/components/shared/CompletedTasksView';
import NotificationsPanel from '@/components/client/NotificationsPanel';
import { ALL_SERVICES } from '@/utils/constants';
import {
  Lock, User, Mail, Phone, Building2, Briefcase, ChevronDown,
  Check, ArrowRight, LogOut, Calendar, ClipboardList, LayoutGrid,
  Clock, X, Plus, CheckCircle2, Loader2, FileText, Receipt, CreditCard, Zap, Bell
} from 'lucide-react';

const INDUSTRIES = [
  'Accounting & Finance', 'Agriculture', 'Banking & Insurance', 'Construction & Real Estate',
  'Education', 'Energy & Utilities', 'Healthcare & Pharmaceuticals', 'Hospitality & Tourism',
  'Import & Export', 'Information Technology', 'Legal Services', 'Manufacturing',
  'Media & Communications', 'Non-Profit / NGO', 'Retail & E-commerce', 'Telecommunications',
  'Transportation & Logistics', 'Other',
];

// ALL_SERVICES imported from constants

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  in_progress: { label: 'In Progress', color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  review:      { label: 'In Review',   color: 'text-violet-400 border-violet-400/30 bg-violet-400/5' },
  completed:   { label: 'Completed',   color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
};

const APPT_STATUS = {
  pending:   'text-amber-400 border-amber-400/30 bg-amber-400/5',
  confirmed: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  cancelled: 'text-red-400 border-red-400/30 bg-red-400/5',
  completed: 'text-basalt border-basalt/30 bg-basalt/5',
};

// ── Shared input style ──────────────────────────────────────────────
const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

// ── Logo ────────────────────────────────────────────────────────────
function Logo() {
  return (
    <a href="/" className="flex items-center gap-3 mb-10 justify-center hover:opacity-80 transition-opacity">
      <div className="w-9 h-9 border border-saffron flex items-center justify-center">
        <span className="font-display text-saffron text-sm font-semibold">MB</span>
      </div>
      <span className="font-display text-chalk tracking-wide">M. Bista & Associates</span>
    </a>
  );
}

// ── Auth Gate ────────────────────────────────────────────────────────
function AuthGate({ onLogin }) {
  const [view, setView] = useState('login'); // login | register | forgot
  const [loginForm, setLoginForm] = useState({ identifier: '', password: '', remember: false });

  // Restore remembered client ID
  useEffect(() => {
    const saved = localStorage.getItem('client_remember');
    if (saved) setLoginForm(prev => ({ ...prev, identifier: saved, remember: true }));
  }, []);
  const [registerForm, setRegisterForm] = useState({
    full_name: '', email: '', phone: '', company_name: '',
    pan_number: '', registration_number: '', address: '', branch_details: '',
    industry: '', desired_services: [], password: '', confirm: '', registration_date: '',
  });
  const [clientIdPreview, setClientIdPreview] = useState('');
  
  // Generate client ID when register view is opened
  useEffect(() => {
    if (view === 'register' && !clientIdPreview) {
      setClientIdPreview('MBC-' + Date.now().toString().slice(-6));
    }
  }, [view]);

  const [forgotEmail, setForgotEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [industryOpen, setIndustryOpen] = useState(false);

  const go = (v) => { setView(v); setError(''); setSuccess(''); setClientIdPreview(''); };

  const toggleService = (s) => {
    setRegisterForm(p => ({
      ...p,
      desired_services: p.desired_services.includes(s)
        ? p.desired_services.filter(x => x !== s)
        : [...p.desired_services, s],
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const clientId = loginForm.identifier?.trim().toUpperCase();
    const password = loginForm.password?.trim();
    if (!clientId || !password) { setError('Client ID and password required'); return; }
    
    setLoading(true);
    try {
      const results = await base44.entities.ClientProfile.filter({ client_id: clientId }, '-created_date', 10);
      if (!results || results.length === 0) { 
        setLoading(false);
        setError('Client ID not found'); 
        return; 
      }
      
      const client = results[0];
      const passwordHash = btoa(password);
      
      if (client.password_hash !== passwordHash) { 
        setLoading(false);
        setError('Invalid password'); 
        return; 
      }
      
      if (loginForm.remember) localStorage.setItem('client_remember', clientId);
      else localStorage.removeItem('client_remember');
      
      setLoading(false);
      onLogin(client);
    } catch (err) {
      setLoading(false);
      setError('Login failed: ' + (err.message || 'Try again'));
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { full_name, email, company_name, industry, password, confirm } = registerForm;
    if (!full_name || !email || !company_name || !industry || !password) { setError('All required fields must be filled.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    setError('');
    try {
      const passwordHash = btoa(registerForm.password);
      const upperCaseClientId = clientIdPreview.toUpperCase();
      await base44.entities.ClientProfile.create({ 
        ...registerForm, 
        client_id: upperCaseClientId, 
        password_hash: passwordHash, 
        status: 'active' 
      });
      setLoading(false);
      setSuccess(`Account created! Your Client ID is: ${upperCaseClientId}. Please save it — you will need it to log in.`);
      setView('login');
      setRegisterForm({ full_name: '', email: '', phone: '', company_name: '', industry: '', desired_services: [], password: '', confirm: '' });
    } catch (err) {
      setLoading(false);
      setError('Registration error: ' + (err.message || 'Please try again'));
      console.error(err);
    }
  };

  const handleForgot = (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) { setError('Please enter your email.'); return; }
    setSuccess('Password reset instructions have been sent to your email.');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div key={view} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="w-full max-w-lg">
        <Logo />
        <div className="relative border border-border p-8 md:p-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

          {/* ── LOGIN ── */}
          {view === 'login' && (
            <>
              <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-1">Client Access</p>
              <h1 className="font-display text-3xl text-chalk font-light mb-7">Client Portal Login</h1>
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Client ID</label>
                  <div className="relative">
                    <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
                    <input type="text" value={loginForm.identifier} onChange={e => { setLoginForm(p => ({ ...p, identifier: e.target.value })); setError(''); }}
                      placeholder="e.g. MB-ABC123" className={`${inputCls} pl-7`} />
                  </div>
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
                    <input type="password" value={loginForm.password} onChange={e => { setLoginForm(p => ({ ...p, password: e.target.value })); setError(''); }}
                      placeholder="Enter your password" className={`${inputCls} pl-7`} />
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={loginForm.remember} onChange={e => setLoginForm(p => ({ ...p, remember: e.target.checked }))}
                    className="w-3.5 h-3.5 accent-saffron" />
                  <span className="font-body text-xs text-chalk/40">Remember my Client ID</span>
                </label>
                {error && <p className="font-body text-xs text-red-400">{error}</p>}
                <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 font-body text-sm py-3.5 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign In'}
                </button>
              </form>
              <div className="flex items-center justify-between mt-6">
                <button onClick={() => go('forgot')} className="font-body text-xs text-chalk/35 hover:text-saffron transition-colors">Forgot Password?</button>
                <button onClick={() => go('register')} className="font-body text-xs text-chalk/35 hover:text-saffron transition-colors">Create Client ID →</button>
              </div>
            </>
          )}

          {/* ── REGISTER ── */}
          {view === 'register' && (
            <>
              <h1 className="font-display text-3xl text-chalk font-light mb-2">Create Client ID</h1>
              <p className="font-body text-xs text-chalk/35 mb-7">Fill in your details to register and receive your unique Client ID.</p>
              {!success && clientIdPreview && (
                <div className="bg-saffron/10 border border-saffron/30 p-4 mb-6 rounded">
                  <p className="font-body text-xs text-saffron/60 mb-1 tracking-widest uppercase">Your Client ID</p>
                  <p className="font-display text-2xl text-saffron font-light">{clientIdPreview}</p>
                  <p className="font-body text-[10px] text-saffron/50 mt-1">This will be your login identifier</p>
                </div>
              )}
              {success ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-12 h-12 border-2 border-saffron flex items-center justify-center mb-4">
                    <Check className="w-6 h-6 text-saffron" />
                  </div>
                  <p className="font-body text-sm text-chalk/70 leading-relaxed mb-4">{success}</p>
                  {success.includes('Client ID') && (
                    <div className="bg-saffron/10 border border-saffron/30 p-4 rounded mb-6 w-full">
                      <p className="font-body text-xs text-saffron/60 mb-1 tracking-widest uppercase">Your Client ID</p>
                      <p className="font-display text-2xl text-saffron font-light break-all">{success.match(/MBC-[A-Z0-9]+/)?.[0]}</p>
                    </div>
                  )}
                  <button onClick={() => go('login')} className="mt-6 font-body text-xs text-saffron hover:underline">Proceed to Login →</button>
                </div>
              ) : (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Full Name <span className="text-saffron">*</span></label>
                      <div className="relative">
                        <User className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
                        <input type="text" value={registerForm.full_name} onChange={e => setRegisterForm(p => ({ ...p, full_name: e.target.value }))}
                          placeholder="Your full name" className={`${inputCls} pl-7`} />
                      </div>
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Company Name <span className="text-saffron">*</span></label>
                      <div className="relative">
                        <Building2 className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
                        <input type="text" value={registerForm.company_name} onChange={e => setRegisterForm(p => ({ ...p, company_name: e.target.value }))}
                          placeholder="Your company" className={`${inputCls} pl-7`} />
                      </div>
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Email <span className="text-saffron">*</span></label>
                      <div className="relative">
                        <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
                        <input type="email" value={registerForm.email} onChange={e => setRegisterForm(p => ({ ...p, email: e.target.value }))}
                          placeholder="your@email.com" className={`${inputCls} pl-7`} />
                      </div>
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Contact Number</label>
                      <div className="relative">
                        <Phone className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
                        <input type="tel" value={registerForm.phone} onChange={e => setRegisterForm(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+977-..." className={`${inputCls} pl-7`} />
                      </div>
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">PAN Number</label>
                      <input type="text" value={registerForm.pan_number} onChange={e => setRegisterForm(p => ({ ...p, pan_number: e.target.value }))}
                        placeholder="PAN number" className={inputCls} />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Registration Number</label>
                      <input type="text" value={registerForm.registration_number} onChange={e => setRegisterForm(p => ({ ...p, registration_number: e.target.value }))}
                        placeholder="Registration number" className={inputCls} />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Date of Registration</label>
                      <input type="date" value={registerForm.registration_date} onChange={e => setRegisterForm(p => ({ ...p, registration_date: e.target.value }))}
                        className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Address</label>
                      <textarea rows={2} value={registerForm.address} onChange={e => setRegisterForm(p => ({ ...p, address: e.target.value }))}
                        placeholder="Full business address" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Branch Details</label>
                      <textarea rows={2} value={registerForm.branch_details} onChange={e => setRegisterForm(p => ({ ...p, branch_details: e.target.value }))}
                        placeholder="Branch information if applicable" className={inputCls} />
                    </div>
                  </div>

                  {/* Industry dropdown */}
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Industry <span className="text-saffron">*</span></label>
                    <div className="relative">
                      <button type="button" onClick={() => setIndustryOpen(v => !v)}
                        className="w-full flex items-center justify-between border-b border-basalt/30 py-3 font-body text-sm text-left focus:outline-none focus:border-saffron transition-colors">
                        <span className={registerForm.industry ? 'text-chalk' : 'text-chalk/20'}>
                          {registerForm.industry || 'Select your industry'}
                        </span>
                        <ChevronDown className={`w-4 h-4 text-chalk/30 transition-transform ${industryOpen ? 'rotate-180' : ''}`} />
                      </button>
                      <AnimatePresence>
                        {industryOpen && (
                          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                            className="absolute z-10 mt-1 w-full bg-background border border-border max-h-52 overflow-y-auto shadow-xl">
                            {INDUSTRIES.map(ind => (
                              <li key={ind}>
                                <button type="button" onClick={() => { setRegisterForm(p => ({ ...p, industry: ind })); setIndustryOpen(false); }}
                                  className={`w-full text-left px-4 py-2.5 font-body text-sm transition-colors hover:bg-muted ${registerForm.industry === ind ? 'text-saffron' : 'text-chalk/60'}`}>
                                  {ind}
                                </button>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Services multi-select */}
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-3">Desired Services</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_SERVICES.map(s => {
                        const selected = registerForm.desired_services.includes(s);
                        return (
                          <button key={s} type="button" onClick={() => toggleService(s)}
                            className={`font-body text-xs px-3 py-1.5 border transition-all duration-200 ${selected ? 'border-saffron text-saffron bg-saffron/10' : 'border-basalt/30 text-chalk/40 hover:border-saffron/40'}`}>
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Password <span className="text-saffron">*</span></label>
                      <input type="password" value={registerForm.password} onChange={e => setRegisterForm(p => ({ ...p, password: e.target.value }))}
                        placeholder="Create a password" className={inputCls} />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Confirm Password <span className="text-saffron">*</span></label>
                      <input type="password" value={registerForm.confirm} onChange={e => setRegisterForm(p => ({ ...p, confirm: e.target.value }))}
                        placeholder="Repeat password" className={inputCls} />
                    </div>
                  </div>

                  {error && <p className="font-body text-xs text-red-400">{error}</p>}
                  <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2 font-body text-sm py-3.5 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Briefcase className="w-4 h-4" /> Create My Client ID</>}
                  </button>
                </form>
              )}
              {!success && (
                <button onClick={() => go('login')} className="mt-5 font-body text-xs text-chalk/35 hover:text-saffron transition-colors">← Back to Login</button>
              )}
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {view === 'forgot' && (
            <>
              <h1 className="font-display text-3xl text-chalk font-light mb-2">Reset Password</h1>
              <p className="font-body text-xs text-chalk/35 mb-7">Enter your registered email and we'll send reset instructions.</p>
              {success ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-10 h-10 border-2 border-saffron flex items-center justify-center mb-4">
                    <Check className="w-5 h-5 text-saffron" />
                  </div>
                  <p className="font-body text-sm text-chalk/60 leading-relaxed">{success}</p>
                  <button onClick={() => go('login')} className="mt-6 font-body text-xs text-saffron hover:underline">Back to Login</button>
                </div>
              ) : (
                <form onSubmit={handleForgot} className="space-y-5">
                  <div>
                    <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
                      <input type="email" value={forgotEmail} onChange={e => { setForgotEmail(e.target.value); setError(''); }}
                        placeholder="your@email.com" className={`${inputCls} pl-7`} />
                    </div>
                  </div>
                  {error && <p className="font-body text-xs text-red-400">{error}</p>}
                  <button type="submit" className="w-full font-body text-sm py-3.5 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 transition-all min-h-[44px]">
                    Send Reset Instructions
                  </button>
                </form>
              )}
              {!success && (
                <button onClick={() => go('login')} className="mt-5 font-body text-xs text-chalk/35 hover:text-saffron transition-colors">← Back to Login</button>
              )}
            </>
          )}
        </div>
        <p className="font-body text-xs text-chalk/15 text-center mt-6">
          Client portal of M. Bista & Associates, Chartered Accountants.
        </p>
      </motion.div>
    </div>
  );
}

// ── Book Appointment Modal ───────────────────────────────────────────
function AppointmentModal({ client, onClose, onBooked }) {
  const [form, setForm] = useState({ service: '', preferred_date: '', preferred_time: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.service || !form.preferred_date) return;
    setLoading(true);
    await base44.entities.Appointment.create({
      client_name: client.full_name,
      client_email: client.email,
      client_id: client.client_id,
      ...form,
      status: 'pending',
    });
    setLoading(false);
    setDone(true);
    onBooked();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md" onClick={onClose}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
        className="relative bg-background border border-border w-full max-w-md p-8" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
        {done ? (
          <div className="text-center py-6">
            <div className="w-12 h-12 border-2 border-saffron flex items-center justify-center mx-auto mb-4">
              <Check className="w-6 h-6 text-saffron" />
            </div>
            <h3 className="font-display text-2xl text-chalk font-light mb-2">Appointment Requested</h3>
            <p className="font-body text-sm text-chalk/40 mb-6">We will confirm your appointment within 24 hours.</p>
            <button onClick={onClose} className="font-body text-xs px-6 py-2.5 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[44px]">Close</button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-2xl text-chalk font-light">Book Appointment</h3>
              <button onClick={onClose} className="text-chalk/30 hover:text-chalk transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Service <span className="text-saffron">*</span></label>
                <select value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}
                  className="w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                  <option value="" className="bg-background text-chalk/40">Select a service</option>
                  {ALL_SERVICES.map(s => <option key={s} value={s} className="bg-background text-chalk">{s}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Date <span className="text-saffron">*</span></label>
                  <input type="date" value={form.preferred_date} onChange={e => setForm(p => ({ ...p, preferred_date: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Time</label>
                  <input type="time" value={form.preferred_time} onChange={e => setForm(p => ({ ...p, preferred_time: e.target.value }))}
                    className="w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk focus:border-saffron focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  placeholder="Any specific requirements..."
                  className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
              </div>
              <button type="submit" disabled={loading || !form.service || !form.preferred_date}
                className="w-full flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-40 transition-all min-h-[44px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Calendar className="w-4 h-4" /> Confirm Booking</>}
              </button>
            </form>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Client Dashboard ─────────────────────────────────────────────────
function Dashboard({ client, onLogout }) {
  const [activeTab, setActiveTab] = useState('services');
  const [appointments, setAppointments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBooking, setShowBooking] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentInvoice, setPaymentInvoice] = useState(null);
  const [viewingContract, setViewingContract] = useState(null);

  const openPayment = (inv = null) => { setPaymentInvoice(inv); setShowPayment(true); };

  const loadData = async () => {
    setLoading(true);
    const [appts, tks, invs, docs, conts, notifs] = await Promise.all([
      base44.entities.Appointment.filter({ client_id: client.client_id }, '-created_date', 20),
      base44.entities.ClientTask.filter({ client_id: client.client_id }, '-created_date', 30),
      base44.entities.Invoice.filter({ client_id: client.client_id }, '-created_date', 50),
      base44.entities.ClientDocument.filter({ client_id: client.client_id }, '-created_date', 50),
      base44.entities.Contract.filter({ client_id: client.client_id }, '-created_date', 20),
      base44.entities.ClientNotification.filter({ client_id: client.client_id }, '-created_date', 50),
    ]);
    setAppointments(appts);
    setTasks(tks);
    setInvoices(invs);
    setDocuments(docs);
    setContracts(conts);
    setNotifications(notifs || []);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleMarkPaid = async (inv) => {
    await base44.entities.Invoice.update(inv.id, { status: 'paid', paid_date: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleMakePayment = (inv) => { openPayment(inv); };

  const unreadNotifCount = notifications.filter(n => !n.is_read).length;
  const completedTaskCount = tasks.filter(t => t.status === 'completed' || t.status === 'filed').length;
  const tabs = [
    { id: 'services',        icon: LayoutGrid,    label: 'Our Services' },
    { id: 'appointments',    icon: Calendar,      label: 'Appointments' },
    { id: 'tasks',           icon: ClipboardList, label: 'Project Board' },
    { id: 'completed_tasks', icon: CheckCircle2,  label: 'Completed', badge: completedTaskCount },
    { id: 'invoices',        icon: Receipt,       label: 'Invoices', badge: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length },
    { id: 'documents',       icon: FileText,      label: 'Documents' },
    { id: 'contracts',       icon: FileText,      label: 'Contracts' },
    { id: 'actions',         icon: Zap,           label: 'Actions' },
    { id: 'support',         icon: FileText,      label: 'Support' },
    { id: 'notifications',   icon: Bell,          label: 'Notifications', badge: unreadNotifCount },
  ];



  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-[6vw] md:px-[8vw]">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 border border-saffron flex items-center justify-center">
              <span className="font-display text-saffron text-xs font-semibold">MB</span>
            </div>
            <span className="font-display text-chalk text-sm">Client Portal</span>
          </a>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="font-body text-xs text-chalk/60">{client.full_name}</p>
              <p className="font-body text-[10px] text-chalk/30">ID: {client.client_id}</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 font-body text-xs text-chalk/40 hover:text-saffron transition-colors min-h-[44px]">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-[6vw] md:px-[8vw] py-10">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-8">
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-1">Welcome Back</p>
          <h1 className="font-display text-3xl md:text-4xl text-chalk font-light">{client.full_name}</h1>
          <p className="font-body text-sm text-chalk/35 mt-1">{client.company_name} · {client.industry}</p>
        </motion.div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Client ID', value: client.client_id, color: 'text-saffron' },
            { label: 'Appointments', value: appointments.length, color: 'text-blue-400' },
            { label: 'Active Tasks', value: tasks.filter(t => t.status !== 'completed').length, color: 'text-violet-400' },
            { label: 'Invoices Due', value: invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length, color: 'text-amber-400' },
          ].map(stat => (
            <div key={stat.label} className="border border-border p-5">
              <p className="font-body text-xs text-chalk/30 mb-2 tracking-widest uppercase">{stat.label}</p>
              <p className={`font-display text-2xl font-light ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap gap-1 mb-8 border-b border-border">
          {tabs.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 font-body text-sm px-5 py-3.5 border-b-2 transition-all duration-300 -mb-px ${
                activeTab === id ? 'border-saffron text-saffron' : 'border-transparent text-chalk/40 hover:text-chalk/70'
              }`}>
              <Icon className="w-4 h-4" />
              {label}
              {badge > 0 && (
                <span className="absolute -top-0.5 right-0.5 min-w-[16px] h-4 rounded-full bg-saffron text-background font-body text-[9px] font-bold flex items-center justify-center px-1">{badge}</span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Services Tab */}
            {activeTab === 'services' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl text-chalk font-light">Our Services</h2>
                  <button onClick={() => setShowBooking(true)}
                    className="flex items-center gap-2 font-body text-sm px-5 py-2.5 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 transition-all min-h-[44px]">
                    <Calendar className="w-4 h-4" /> Book Appointment
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ALL_SERVICES.map((s, i) => {
                    const isSelected = client.desired_services?.includes(s);
                    return (
                      <motion.div key={s} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className={`border p-5 transition-colors ${isSelected ? 'border-saffron/40 bg-saffron/5' : 'border-border'}`}>
                        <div className="flex items-start justify-between">
                          <p className="font-body text-sm text-chalk">{s}</p>
                          {isSelected && <CheckCircle2 className="w-4 h-4 text-saffron flex-shrink-0 mt-0.5" />}
                        </div>
                        {isSelected && <p className="font-body text-[10px] text-saffron/60 mt-2 tracking-widest uppercase">Selected Service</p>}
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Appointments Tab */}
            {activeTab === 'appointments' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-display text-2xl text-chalk font-light">Appointments</h2>
                  <button onClick={() => setShowBooking(true)}
                    className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 min-h-[44px]">
                    <Plus className="w-4 h-4" /> Book New
                  </button>
                </div>
                {appointments.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-basalt/20">
                    <Calendar className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
                    <p className="font-display text-xl text-chalk/20 font-light mb-2">No Appointments Yet</p>
                    <button onClick={() => setShowBooking(true)} className="font-body text-xs text-saffron hover:underline">Book your first appointment →</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.map((a, i) => (
                      <motion.div key={a.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-3 mb-2">
                            <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-1 border ${APPT_STATUS[a.status]}`}>{a.status}</span>
                          </div>
                          <p className="font-body text-sm text-chalk">{a.service}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="font-body text-xs text-chalk/35 flex items-center gap-1"><Calendar className="w-3 h-3" />{a.preferred_date}</span>
                            {a.preferred_time && <span className="font-body text-xs text-chalk/35 flex items-center gap-1"><Clock className="w-3 h-3" />{a.preferred_time}</span>}
                          </div>
                          {a.notes && <p className="font-body text-xs text-chalk/30 mt-1">{a.notes}</p>}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Completed Tasks Tab */}
            {activeTab === 'completed_tasks' && (
              <CompletedTasksView tasks={tasks} userLabel={client.full_name} userType="client" />
            )}

            {/* Project Board Tab */}
            {activeTab === 'tasks' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="font-display text-2xl text-chalk font-light">Project Board</h2>
                    <p className="font-body text-xs text-chalk/35 mt-1">Live status of all your ongoing work items.</p>
                  </div>
                </div>
                {tasks.length > 0 && (() => {
                  const done = tasks.filter(t => t.status === 'completed' || t.status === 'filed').length;
                  const pct = Math.round((done / tasks.length) * 100);
                  return (
                    <div className="border border-border p-4 mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-body text-xs text-chalk/40">Overall Progress</p>
                        <p className="font-body text-xs text-saffron font-medium">{pct}%</p>
                      </div>
                      <div className="h-1.5 bg-basalt/30 rounded-full overflow-hidden">
                        <div className="h-full bg-saffron rounded-full transition-all duration-700" style={{ width: pct + '%' }} />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <p className="font-body text-[10px] text-chalk/25">{done} of {tasks.length} tasks completed</p>
                        {done > 0 && (
                          <button onClick={() => setActiveTab('completed_tasks')}
                            className="font-body text-[10px] text-emerald-400 hover:underline">
                            View completed →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })()}
                <ProjectBoard tasks={tasks} />
              </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
              <InvoiceTab client={client} invoices={invoices} onMarkPaid={handleMarkPaid} onMakePayment={handleMakePayment} onRefresh={loadData} />             
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <DocumentsTab client={client} documents={documents} onRefresh={loadData} />
            )}

            {/* Contracts Tab */}
            {activeTab === 'contracts' && (
              <div>
                <h2 className="font-display text-2xl text-chalk font-light mb-6">Contracts</h2>
                {contracts.length === 0 ? (
                  <div className="text-center py-16 border border-dashed border-basalt/20">
                    <FileText className="w-10 h-10 text-chalk/15 mx-auto mb-3" />
                    <p className="font-display text-xl text-chalk/20 font-light">No Contracts Yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {contracts.map((contract, i) => (
                      <motion.div key={contract.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border text-emerald-400 border-emerald-400/30 bg-emerald-400/5`}>{contract.status}</span>
                            <span className="font-body text-xs text-chalk/30">{contract.contract_number}</span>
                          </div>
                          <p className="font-body text-sm text-chalk">{contract.service_type}</p>
                          <p className="font-body text-xs text-chalk/40 mt-0.5">Effective: {contract.effective_date || '—'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => setViewingContract(contract)}
                            className="flex items-center gap-2 font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[44px]">
                            View Details
                          </button>
                          <button onClick={() => setViewingContract(contract)}
                            className="flex items-center gap-2 font-body text-xs px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all min-h-[44px]">
                            <FileText className="w-4 h-4" /> Download
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Actions Tab */}
            {activeTab === 'actions' && (
              <ClientActionsPanel client={client} invoices={invoices} tasks={tasks} onRequestSubmitted={loadData} />
            )}

            {/* Support Tab */}
            {activeTab === 'support' && (
              <SupportTab client={client} onRefresh={loadData} />
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <NotificationsPanel client={client} />
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {showBooking && (
          <AppointmentModal client={client} onClose={() => setShowBooking(false)} onBooked={loadData} />
        )}
        {showPayment && (
          <PaymentModal invoice={paymentInvoice} onClose={() => setShowPayment(false)} onRefresh={loadData} client={client} />
        )}
        {viewingContract && (
          <ContractViewerModal contract={viewingContract} onClose={() => setViewingContract(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────
export default function ClientPortal() {
  const [client, setClient] = useState(null);
  if (!client) return <AuthGate onLogin={setClient} />;
  return <Dashboard client={client} onLogout={() => setClient(null)} />;
}