import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { LogOut, Lock, Loader2, AlertCircle, Check, Eye, EyeOff, LayoutDashboard, Receipt, FileText, MessageSquare, ClipboardList } from 'lucide-react';
import { checkAndNotifyOverdueInvoices } from '@/utils/overdueChecker';
import DocumentReviewTab from '@/components/staff/DocumentReviewTab';
import AdminContentManager from '@/components/staff/AdminContentManager';
import ClientRequestsTab from '@/components/staff/ClientRequestsTab';
import ConfigureClientsTab from '@/components/staff/ConfigureClientsTab';
import DashboardTab from '@/components/staff/DashboardTab';
import StaffInvoiceView from '@/components/staff/StaffInvoiceView';
import StaffTasksTab from '@/components/staff/StaffTasksTab';

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

// ── Staff Login ────────────────────────────────────────────────────
function StaffLoginGate({ onLoginSuccess }) {
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError('Email and password required');
      return;
    }

    setLoading(true);
    setError('');
    
    const staff = await base44.entities.StaffAccount.filter({ email: loginForm.email.toLowerCase() });
    
    if (staff.length === 0 || !staff[0].is_active) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    const storedHash = staff[0].password_hash;
    const inputHash = btoa(loginForm.password);

    if (inputHash === storedHash) {
      localStorage.setItem('staff_token', JSON.stringify(staff[0]));
      await base44.entities.StaffAccount.update(staff[0].id, { last_login: new Date().toISOString() });
      // Audit log
      await base44.entities.AuditLog.create({ actor_email: staff[0].email, actor_name: staff[0].full_name, actor_type: 'staff', action: 'login', entity_type: 'StaffAccount', entity_id: staff[0].id, details: 'Staff login' });
      setLoading(false);
      onLoginSuccess(staff[0]);
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 border border-saffron flex items-center justify-center">
            <span className="font-display text-saffron text-sm font-semibold">MB</span>
          </div>
          <span className="font-display text-chalk tracking-wide">M. Bista & Associates</span>
        </div>

        <div className="relative border border-border p-8 md:p-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-1">Staff Access</p>
              <h2 className="font-display text-3xl text-chalk font-light">Staff Portal</h2>
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Email</label>
              <input type="email" value={loginForm.email} onChange={e => { setLoginForm(p => ({ ...p, email: e.target.value })); setError(''); }}
                placeholder="your-email@company.com" className={inputCls} />
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={loginForm.password} 
                  onChange={e => { setLoginForm(p => ({ ...p, password: e.target.value })); setError(''); }}
                  placeholder="Enter password" className={inputCls} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-chalk/25 hover:text-chalk/50">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="font-body text-xs text-red-400 flex items-center gap-2"><AlertCircle className="w-3 h-3" />{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
            </button>
          </form>
        </div>

        <p className="font-body text-xs text-chalk/15 text-center mt-6">
          Staff portal access for M. Bista & Associates employees only.
        </p>
      </motion.div>
    </div>
  );
}

// ── First Time Password Change ────────────────────────────────────────────────────
function FirstLoginPasswordChange({ staff, onSuccess }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setError('Both fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const passwordHash = btoa(newPassword);
    await base44.entities.StaffAccount.update(staff.id, { password_hash: passwordHash, password_changed: true, is_first_login: false });
    
    const updated = { ...staff, password_hash: passwordHash, password_changed: true };
    localStorage.setItem('staff_token', JSON.stringify(updated));
    
    setLoading(false);
    onSuccess(updated);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 border border-saffron flex items-center justify-center">
            <Lock className="text-saffron w-5 h-5" />
          </div>
          <span className="font-display text-chalk tracking-wide">Set Your Password</span>
        </div>

        <div className="relative border border-border p-8 md:p-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
          <form onSubmit={handleChangePassword} className="space-y-5">
            <div>
              <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-1">Security</p>
              <h2 className="font-display text-3xl text-chalk font-light mb-2">Change Password</h2>
              <p className="font-body text-sm text-chalk/40">This is your first login. Please create a new password to secure your account.</p>
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">New Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} value={newPassword} 
                  onChange={e => { setNewPassword(e.target.value); setError(''); }}
                  placeholder="Enter new password" className={inputCls} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-chalk/25 hover:text-chalk/50">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Confirm Password</label>
              <input type="password" value={confirmPassword} 
                onChange={e => { setConfirmPassword(e.target.value); setError(''); }}
                placeholder="Confirm password" className={inputCls} />
            </div>
            {error && <p className="font-body text-xs text-red-400 flex items-center gap-2"><AlertCircle className="w-3 h-3" />{error}</p>}
            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set Password & Continue'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default function StaffPortal() {
  const { user } = useAuth();
  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('staff_token');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [announcements, setAnnouncements] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allInvoices, setAllInvoices] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [accessRequests, setAccessRequests] = useState([]);
  const [allClientRequests, setAllClientRequests] = useState([]);

  useEffect(() => {
    if (staff) {
      loadData();
    }
  }, [staff]);

  const loadData = async () => {
    setLoading(true);
    const [ann, invs, docs, clientReqs] = await Promise.all([
      base44.entities.Announcement.list('-created_date', 20),
      base44.entities.Invoice.list('-created_date', 100),
      base44.entities.ClientDocument.list('-created_date', 100),
      base44.entities.ClientRequest.list('-created_date', 200),
    ]);
    setAnnouncements(ann);
    setAllInvoices(invs);
    setAllDocuments(docs);
    setAllClientRequests(clientReqs || []);
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    setStaff(null);
  };

  // Show login gate if not authenticated
  if (!staff) {
    return <StaffLoginGate onLoginSuccess={setStaff} />;
  }

  // Show password change if first login (only if password_changed is explicitly false)
  if (staff.password_changed === false || staff.is_first_login === true) {
    return <FirstLoginPasswordChange staff={staff} onSuccess={setStaff} />;
  }

  const priorityStyles = {
    urgent: 'text-red-400 border-red-400/30 bg-red-400/5',
    normal: 'text-blue-400 border-blue-400/30 bg-blue-400/5',
    info: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5',
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-[6vw] md:px-[8vw]">
        <div className="flex items-center justify-between h-16">
          <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-7 h-7 border border-saffron flex items-center justify-center">
              <span className="font-display text-saffron text-xs font-semibold">MB</span>
            </div>
            <div>
              <span className="font-display text-chalk text-sm">M. Bista & Associates</span>
              <span className="hidden sm:inline font-body text-[10px] text-chalk/30 ml-2 tracking-widest uppercase">Staff Portal</span>
            </div>
          </a>
          <div className="flex items-center gap-6">
            <div className="hidden sm:block text-right">
              <p className="font-body text-xs text-chalk/60">{staff.full_name}</p>
              <p className="font-body text-[10px] text-chalk/30">Staff Member</p>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-2 font-body text-xs text-chalk/40 hover:text-saffron transition-colors min-h-[44px]">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-[6vw] md:px-[8vw] py-12">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-2">Staff Portal</p>
          <h1 className="font-display text-3xl md:text-4xl text-chalk font-light mb-8">
            Welcome, {staff.full_name}
          </h1>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-0.5 mb-10 border-b border-border overflow-x-auto scrollbar-none">
          {[
            { id: 'dashboard',       icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'invoices',        icon: Receipt,         label: 'Invoices' },
            { id: 'client-docs',     icon: FileText,        label: 'Client Docs', badge: allDocuments.filter(d => d.status === 'pending_review').length },
            { id: 'client-requests', icon: MessageSquare,   label: 'Requests', badge: allClientRequests.filter(r => r.status === 'pending').length },
            { id: 'tasks',           icon: ClipboardList,   label: 'My Tasks' },
          ].map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`relative flex items-center gap-2 font-body text-sm px-5 py-3.5 border-b-2 transition-all -mb-px whitespace-nowrap ${
                activeTab === id ? 'border-saffron text-saffron bg-saffron/5' : 'border-transparent text-chalk/40 hover:text-chalk/70'
              }`}>
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
              {badge > 0 && (
                <span className="absolute -top-0.5 right-1 w-4 h-4 rounded-full bg-saffron text-background font-body text-[9px] font-bold flex items-center justify-center">{badge}</span>
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
            {activeTab === 'dashboard' && <DashboardTab invoices={allInvoices} documents={allDocuments} clientRequests={allClientRequests} />}
            {activeTab === 'invoices' && <StaffInvoiceView invoices={allInvoices} onRefresh={loadData} staff={staff} />}
            {activeTab === 'client-docs' && <DocumentReviewTab documents={allDocuments} user={staff} onRefresh={loadData} />}

            {activeTab === 'client-requests' && <ClientRequestsTab user={staff} />}
            {activeTab === 'tasks' && <StaffTasksTab staff={staff} />}
          </>
        )}
      </div>
    </div>
  );
}