import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import NotificationCenter from '../components/admin/NotificationCenter';
import RoleManagement from '../components/admin/RoleManagement';
import NotificationSettings from '../components/admin/NotificationSettings';
import InvoicesTab from '../components/admin/InvoicesTab';
import DocumentsTab from '../components/admin/DocumentsTab';
import ClientsTab from '../components/admin/ClientsTab';
import ContractsTab from '../components/admin/ContractsTab';
import ClientTicketsTab from '../components/admin/ClientTicketsTab';
import AdminConfigTab from '../components/admin/AdminConfigTab';
import TasksTab from '../components/admin/TasksTab';
import { LogOut, Plus, Trash2, Lock, Mail, Loader2, AlertCircle, Check, X, Eye, EyeOff, Edit2, LayoutDashboard, Users, ShieldCheck, Receipt, FileText, Building2, ScrollText, Bell, HeadphonesIcon, Settings2, ClipboardList } from 'lucide-react';

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

// ── Admin Setup & Login ────────────────────────────────────────────────────
function AdminAuthGate({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // login | setup | forgot | reset
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Setup view states
  const [setupForm, setSetupForm] = useState({ email: '', full_name: '', password: '', confirm_password: '' });
  const [setupShowPassword, setSetupShowPassword] = useState(false);
  
  // Forgot password states
  const [forgotAdminId, setForgotAdminId] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordShow, setNewPasswordShow] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.email.trim() || !loginForm.password.trim()) {
      setError('Email and password required');
      return;
    }

    setLoading(true);
    setError('');
    
    const admins = await base44.entities.Admin.filter({ email: loginForm.email.toLowerCase() });
    
    if (admins.length === 0) {
      setError('Invalid email or password');
      setLoading(false);
      return;
    }

    const storedHash = admins[0].password_hash;
    const inputHash = btoa(loginForm.password);

    if (inputHash === storedHash) {
      localStorage.setItem('admin_token', JSON.stringify(admins[0]));
      await base44.entities.Admin.update(admins[0].id, { last_login: new Date().toISOString() });
      setLoading(false);
      onLoginSuccess(admins[0]);
    } else {
      setError('Invalid email or password');
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    const { email, full_name, password, confirm_password } = setupForm;
    
    if (!email.trim() || !full_name.trim() || !password.trim()) { 
      setError('All fields required'); 
      return; 
    }
    if (password !== confirm_password) { setError('Passwords do not match'); return; }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    
    // Check if email already exists
    const existing = await base44.entities.Admin.filter({ email: email.toLowerCase() });
    if (existing.length > 0) {
      setError('Email already registered');
      setLoading(false);
      return;
    }

    const passwordHash = btoa(password);
    
    const newAdmin = await base44.entities.Admin.create({
      email: email.toLowerCase(),
      full_name,
      password_hash: passwordHash,
      is_verified: true,
      is_active: true,
    });

    localStorage.setItem('admin_token', JSON.stringify(newAdmin));
    setLoading(false);
    onLoginSuccess(newAdmin);
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotAdminId.trim()) { setError('Email is required'); return; }

    setLoading(true);
    const admins = await base44.entities.Admin.filter({ email: forgotAdminId.toLowerCase() });
    
    if (admins.length === 0) {
      setError('Email not found');
      setLoading(false);
      return;
    }

    const token = Math.random().toString(36).substring(2, 12);
    sessionStorage.setItem('reset_token', token);
    sessionStorage.setItem('reset_email', forgotAdminId.toLowerCase());
    setSuccess(`Reset token: ${token} (valid for 1 hour)`);
    setView('reset');
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const storedToken = sessionStorage.getItem('reset_token');
    const email = sessionStorage.getItem('reset_email');
    
    if (resetToken !== storedToken) { setError('Invalid reset token'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    const admins = await base44.entities.Admin.filter({ email });
    
    if (admins.length === 0) { setError('Admin not found'); setLoading(false); return; }

    const passwordHash = btoa(newPassword);
    await base44.entities.Admin.update(admins[0].id, { password_hash: passwordHash });
    
    sessionStorage.removeItem('reset_token');
    sessionStorage.removeItem('reset_email');
    
    setView('login');
    setNewPassword('');
    setResetToken('');
    setForgotAdminId('');
    setSuccess('Password reset successfully. Please login.');
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <motion.div key={view} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="w-full max-w-lg">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 border border-saffron flex items-center justify-center">
            <span className="font-display text-saffron text-sm font-semibold">MB</span>
          </div>
          <span className="font-display text-chalk tracking-wide">Admin Portal</span>
        </div>

        <div className="relative border border-border p-8 md:p-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

          {/* LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-1">Administrator Access</p>
                <h2 className="font-display text-3xl text-chalk font-light">Admin Login</h2>
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
              {success && <p className="font-body text-xs text-emerald-400 flex items-center gap-2"><Check className="w-3 h-3" />{success}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Login'}
              </button>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                  className="flex-1 font-body text-xs text-chalk/40 hover:text-saffron transition-colors py-2">
                  Forgot Password?
                </button>
                <button type="button" onClick={() => { setView('setup'); setError(''); setSuccess(''); setLoginForm({ email: '', password: '' }); }}
                  className="flex-1 font-body text-xs text-chalk/40 hover:text-saffron transition-colors py-2">
                  Create Admin
                </button>
              </div>
            </form>
          )}



          {/* SETUP NEW ADMIN */}
          {view === 'setup' && (
            <form onSubmit={handleCreateAdmin} className="space-y-5">
              <h2 className="font-display text-3xl text-chalk font-light mb-2">Create Admin Account</h2>
              <p className="font-body text-sm text-chalk/40">Setting up your first admin account.</p>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Email *</label>
                <input type="email" value={setupForm.email} onChange={e => setSetupForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="your-email@company.com" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Full Name</label>
                <input type="text" value={setupForm.full_name} onChange={e => setSetupForm(p => ({ ...p, full_name: e.target.value }))}
                  placeholder="Your full name" className={inputCls} />
              </div>

              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Password</label>
                <div className="relative">
                  <input type={setupShowPassword ? 'text' : 'password'} value={setupForm.password} 
                    onChange={e => setSetupForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Create a strong password" className={inputCls} />
                  <button type="button" onClick={() => setSetupShowPassword(!setupShowPassword)} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-chalk/25 hover:text-chalk/50">
                    {setupShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Confirm Password</label>
                <input type="password" value={setupForm.confirm_password} 
                  onChange={e => setSetupForm(p => ({ ...p, confirm_password: e.target.value }))}
                  placeholder="Repeat password" className={inputCls} />
              </div>
              {error && <p className="font-body text-xs text-red-400 flex items-center gap-2"><AlertCircle className="w-3 h-3" />{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Account'}
              </button>
              <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                className="w-full font-body text-xs text-chalk/40 hover:text-saffron transition-colors py-2">
                ← Back to Login
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <h2 className="font-display text-3xl text-chalk font-light mb-2">Reset Password</h2>
              <p className="font-body text-sm text-chalk/40">Enter your Admin ID to reset your password.</p>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Email</label>
                <input type="email" value={forgotAdminId} onChange={e => { setForgotAdminId(e.target.value); setError(''); }}
                  placeholder="your-email@company.com" className={inputCls} />
              </div>
              {error && <p className="font-body text-xs text-red-400 flex items-center gap-2"><AlertCircle className="w-3 h-3" />{error}</p>}
              {success && <p className="font-body text-xs text-emerald-400 flex items-center gap-2"><Check className="w-3 h-3" />{success}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Reset Token'}
              </button>
              <button type="button" onClick={() => { setView('login'); setError(''); setSuccess(''); }}
                className="w-full font-body text-xs text-chalk/40 hover:text-saffron transition-colors py-2">
                ← Back to Login
              </button>
            </form>
          )}

          {/* RESET PASSWORD */}
          {view === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <h2 className="font-display text-3xl text-chalk font-light mb-2">Set New Password</h2>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Reset Token</label>
                <input type="text" value={resetToken} onChange={e => { setResetToken(e.target.value); setError(''); }}
                  placeholder="Token sent to you" className={inputCls} />
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">New Password</label>
                <div className="relative">
                  <input type={newPasswordShow ? 'text' : 'password'} value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    placeholder="New password" className={inputCls} />
                  <button type="button" onClick={() => setNewPasswordShow(!newPasswordShow)} 
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-chalk/25 hover:text-chalk/50">
                    {newPasswordShow ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              {error && <p className="font-body text-xs text-red-400 flex items-center gap-2"><AlertCircle className="w-3 h-3" />{error}</p>}
              {success && <p className="font-body text-xs text-emerald-400 flex items-center gap-2"><Check className="w-3 h-3" />{success}</p>}
              <button type="submit" disabled={loading}
                className="w-full flex items-center justify-center gap-2 font-body text-sm py-3 bg-saffron text-background font-medium tracking-wider uppercase hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Reset Password'}
              </button>
              <button type="button" onClick={() => { setView('login'); setError(''); }}
                className="w-full font-body text-xs text-chalk/40 hover:text-saffron transition-colors py-2">
                ← Back to Login
              </button>
            </form>
          )}
        </div>

        <p className="font-body text-xs text-chalk/15 text-center mt-6">
          Restricted to authorized administrators only.
        </p>
      </motion.div>
    </div>
  );
}

// ── Staff Management Dashboard ────────────────────────────────────────────────
function AdminDashboard({ admin, onLogout }) {
  const [staff, setStaff] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const emptyForm = { email: '', full_name: '', phone: '', address: '', pan_number: '', citizenship_number: '', date_of_joining: '', username: '', password: '', role_id: '' };
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('staff');

  useEffect(() => {
    loadStaff();
    loadRoles();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    const staffAccounts = await base44.entities.StaffAccount.list('-created_date', 100);
    setStaff(staffAccounts);
    setLoading(false);
  };

  const loadRoles = async () => {
    const data = await base44.entities.AdminRole.list('-created_date', 100);
    setRoles(data);
  };

  const autoGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#$!';
    let pwd = '';
    for (let i = 0; i < 12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setForm(p => ({ ...p, password: pwd }));
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    if (!form.email || !form.full_name || !form.username) { setError('Email, Full Name, and Username are required'); return; }
    if (!editingStaff && !form.password) { setError('Password is required'); return; }
    if (form.password && form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    setError('');
    try {
      // Check email uniqueness
      if (!editingStaff) {
        const existing = await base44.entities.StaffAccount.filter({ email: form.email.toLowerCase() });
        if (existing.length > 0) { setError('Email already exists'); setLoading(false); return; }
      }

      const selectedRole = roles.find(r => r.id === form.role_id);
      const staffData = {
        email: form.email.toLowerCase(),
        full_name: form.full_name,
        username: form.username,
        is_active: true,
        role_id: form.role_id || null,
        role_name: selectedRole?.role_name || '',
      };
      if (form.password) staffData.password_hash = btoa(form.password);

      let staffId;
      if (editingStaff) {
        await base44.entities.StaffAccount.update(editingStaff.id, staffData);
        staffId = editingStaff.id;
        setSuccess('Staff updated successfully');
      } else {
        staffData.password_changed = false;
        staffData.is_first_login = true;
        const created = await base44.entities.StaffAccount.create(staffData);
        staffId = created.id;
        setSuccess('Staff member added successfully');
      }

      // Save/update employee profile
      const empData = {
        full_name: form.full_name,
        email: form.email.toLowerCase(),
        phone: form.phone || '',
        address: form.address || '',
        pan_number: form.pan_number || '',
        citizenship_number: form.citizenship_number || '',
        date_of_joining: form.date_of_joining || '',
        username: form.username,
        staff_account_id: staffId,
        role_id: form.role_id || '',
        role_name: selectedRole?.role_name || '',
        is_active: true,
      };
      const existingEmps = await base44.entities.Employee.filter({ email: form.email.toLowerCase() });
      if (existingEmps.length > 0) {
        await base44.entities.Employee.update(existingEmps[0].id, empData);
      } else {
        await base44.entities.Employee.create(empData);
      }

      // Audit log
      await base44.entities.AuditLog.create({ actor_email: admin.email, actor_name: admin.full_name, actor_type: 'admin', action: editingStaff ? 'updated_staff' : 'created_staff', entity_type: 'StaffAccount', entity_id: staffId, details: `Staff: ${form.full_name} (${form.email})` });

      setForm(emptyForm);
      setEditingStaff(null);
      setShowForm(false);
      loadStaff();
    } catch (err) {
      setError(err.message || 'Failed to save staff');
    }
    setLoading(false);
  };

  const handleDeleteStaff = async (id) => {
    if (confirm('Are you sure you want to delete this staff member?')) {
      await base44.entities.StaffAccount.delete(id);
      setSuccess('Staff member deleted');
      loadStaff();
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setForm({
      email: staffMember.email,
      full_name: staffMember.full_name,
      phone: staffMember.phone || '',
      address: staffMember.address || '',
      pan_number: staffMember.pan_number || '',
      citizenship_number: staffMember.citizenship_number || '',
      date_of_joining: staffMember.date_of_joining || '',
      username: staffMember.username || '',
      password: '',
      role_id: staffMember.role_id || '',
    });
    setShowForm(true);
  };

  const handleResetPassword = async (staffMember) => {
    const newPassword = prompt('Enter new password for ' + staffMember.full_name + ':');
    if (newPassword && newPassword.length >= 6) {
      const passwordHash = btoa(newPassword);
      await base44.entities.StaffAccount.update(staffMember.id, { password_hash: passwordHash });
      setSuccess(`Password reset for ${staffMember.full_name}`);
      loadStaff();
    } else if (newPassword) {
      setError('Password must be at least 6 characters');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="border-b border-border px-[6vw] md:px-[8vw]">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 border border-saffron flex items-center justify-center">
              <span className="font-display text-saffron text-xs font-semibold">MB</span>
            </div>
            <div>
              <span className="font-display text-chalk text-sm">Admin Portal</span>
              <span className="hidden sm:inline font-body text-[10px] text-chalk/30 ml-2">Management</span>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <NotificationCenter adminId={admin.id} />
            <div className="hidden sm:block text-right">
              <p className="font-body text-xs text-chalk/60">{admin.full_name}</p>
              <p className="font-body text-[10px] text-chalk/30">Administrator</p>
            </div>
            <button onClick={onLogout} className="flex items-center gap-2 font-body text-xs text-chalk/40 hover:text-saffron transition-colors min-h-[44px]">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      <div className="px-[6vw] md:px-[8vw] py-12">
        {/* Tabs */}
        <div className="flex gap-0.5 mb-8 border-b border-border overflow-x-auto scrollbar-none">
          {[
            { id: 'staff',         label: 'Staff',          icon: Users },
            { id: 'roles',         label: 'Roles',          icon: ShieldCheck },
            { id: 'invoices',      label: 'Invoices',       icon: Receipt },
            { id: 'documents',     label: 'Documents',      icon: FileText },
            { id: 'clients',       label: 'Clients',        icon: Building2 },
            { id: 'contracts',     label: 'Contracts',      icon: ScrollText },
            { id: 'notifications', label: 'Alerts',         icon: Bell },
            { id: 'tickets',       label: 'Support',        icon: HeadphonesIcon },
            { id: 'tasks',         label: 'Tasks',          icon: ClipboardList },
            { id: 'config',        label: 'Config',         icon: Settings2 },
          ].map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 py-3 px-4 font-body text-sm border-b-2 transition-all -mb-px whitespace-nowrap ${
                activeTab === id
                  ? 'border-saffron text-saffron bg-saffron/5'
                  : 'border-transparent text-chalk/40 hover:text-chalk hover:bg-white/3'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {activeTab === 'staff' && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-2">Management</p>
            <h1 className="font-display text-3xl md:text-4xl text-chalk font-light mb-8">Staff Members</h1>
          </motion.div>
        )}

        {activeTab === 'staff' && (
        <>
        {/* Add Staff Form */}
        <div className="mb-10">
          {!showForm ? (
            <button onClick={() => { setShowForm(true); setEditingStaff(null); setForm({ email: '', full_name: '', username: '', password: '' }); }}
              className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all duration-300 min-h-[44px]">
              <Plus className="w-4 h-4" /> {editingStaff ? 'Update Staff' : 'Add New Staff'}
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-border p-6 max-w-2xl relative">
                 <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
                 <h2 className="font-display text-2xl text-chalk font-light mb-6">{editingStaff ? 'Update Staff' : 'Add New Staff Member'}</h2>
                 <form onSubmit={handleAddStaff} className="space-y-6">

                   {/* Personal Info */}
                   <div>
                     <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">Personal Information</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Full Name *</label>
                         <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Full name" className={inputCls} />
                       </div>
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Email *</label>
                         <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="staff@mbista.com.np" className={inputCls} />
                       </div>
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Phone Number</label>
                         <input type="tel" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+977-98XXXXXXXX" className={inputCls} />
                       </div>
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">PAN Number</label>
                         <input type="text" value={form.pan_number} onChange={e => setForm(p => ({ ...p, pan_number: e.target.value }))} placeholder="PAN number" className={inputCls} />
                       </div>
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Citizenship / ID Number</label>
                         <input type="text" value={form.citizenship_number} onChange={e => setForm(p => ({ ...p, citizenship_number: e.target.value }))} placeholder="Citizenship number" className={inputCls} />
                       </div>
                       <div className="sm:col-span-2">
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Address</label>
                         <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Full address" className={inputCls} />
                       </div>
                     </div>
                   </div>

                   {/* Official Info */}
                   <div className="border-t border-basalt/20 pt-5">
                     <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">Official Information</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Date of Joining</label>
                         <input type="date" value={form.date_of_joining} onChange={e => setForm(p => ({ ...p, date_of_joining: e.target.value }))} className={inputCls} />
                       </div>
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Assign Role</label>
                         <select value={form.role_id} onChange={e => setForm(p => ({ ...p, role_id: e.target.value }))} className="w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                           <option value="" className="bg-background">No Role Assigned</option>
                           {roles.map(r => <option key={r.id} value={r.id} className="bg-background">{r.role_name}</option>)}
                         </select>
                       </div>
                     </div>
                   </div>

                   {/* System Access */}
                   <div className="border-t border-basalt/20 pt-5">
                     <p className="font-body text-xs tracking-widest uppercase text-saffron mb-3">System Access</p>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Username *</label>
                         <input type="text" value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))} placeholder="Login username" className={inputCls} />
                       </div>
                       <div>
                         <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Password {editingStaff ? '(leave empty to keep)' : '*'}</label>
                         <div className="flex gap-2 items-end">
                           <input type="text" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} placeholder={editingStaff ? 'New password (optional)' : 'Min 8 characters'} className={`${inputCls} flex-1`} />
                           <button type="button" onClick={autoGeneratePassword} className="font-body text-[10px] text-saffron border border-saffron/30 px-2 py-1.5 hover:bg-saffron/10 transition-colors whitespace-nowrap">Auto Generate</button>
                         </div>
                         {form.password && <p className="font-body text-[10px] text-chalk/30 mt-1">Password: <span className="text-saffron/70">{form.password}</span> — save this!</p>}
                       </div>
                     </div>
                   </div>

                   {error && <p className="font-body text-xs text-red-400">{error}</p>}
                   {success && <p className="font-body text-xs text-emerald-400">{success}</p>}
                   <div className="flex gap-3 pt-2">
                     <button type="submit" disabled={loading}
                       className="flex-1 flex items-center justify-center gap-2 font-body text-xs px-4 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 transition-all min-h-[44px]">
                       {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingStaff ? 'Update Staff' : 'Add Staff Member'}
                     </button>
                     <button type="button" onClick={() => { setShowForm(false); setForm(emptyForm); setEditingStaff(null); }}
                       className="flex-1 font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk transition-all min-h-[44px]">
                       Cancel
                     </button>
                   </div>
                 </form>
               </motion.div>
          )}
        </div>

        {/* Staff List */}
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div>
            <h2 className="font-display text-2xl text-chalk font-light mb-6">Staff Members ({staff.length})</h2>
            {staff.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-basalt/20">
                <p className="font-body text-chalk/30">No staff members yet. Add your first staff member above.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {staff.map((member, i) => (
                  <motion.div key={member.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                    className="border border-border p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <p className="font-display text-lg text-chalk font-light">{member.full_name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="font-body text-xs text-chalk/40">{member.email}</span>
                        <span className="font-body text-xs text-chalk/30">User: {member.username}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-1 border ${member.is_active ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' : 'text-red-400 border-red-400/30 bg-red-400/5'}`}>
                          {member.is_active ? 'Active' : 'Inactive'}
                        </span>
                        <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-1 border ${member.password_changed ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' : 'text-amber-400 border-amber-400/30 bg-amber-400/5'}`}>
                          {member.password_changed ? 'Password Set' : 'Needs Password'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEditStaff(member)}
                        className="flex items-center gap-1 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/40 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button onClick={() => handleResetPassword(member)}
                        className="flex items-center gap-1 font-body text-xs px-3 py-2 border border-blue-400/30 text-blue-400 hover:bg-blue-400/5 transition-all min-h-[36px]">
                        <Lock className="w-3 h-3" /> Reset
                      </button>
                      <button onClick={() => handleDeleteStaff(member.id)}
                        className="flex items-center gap-1 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-all min-h-[36px]">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                    </motion.div>
                    ))}
                    </div>
                    )}
                    </div>
                    )}
                    </>
                    )}

                    {activeTab === 'roles' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <RoleManagement isAdmin={true} />
                    </motion.div>
                    )}

                    {activeTab === 'notifications' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <NotificationSettings admin={admin} />
                    </motion.div>
                    )}

                    {activeTab === 'invoices' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <InvoicesTab admin={admin} />
                    </motion.div>
                    )}

                    {activeTab === 'documents' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <DocumentsTab />
                    </motion.div>
                    )}

                    {activeTab === 'clients' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <ClientsTab />
                    </motion.div>
                    )}

                    {activeTab === 'contracts' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <ContractsTab />
                    </motion.div>
                    )}

                    {activeTab === 'tickets' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <ClientTicketsTab admin={admin} />
                    </motion.div>
                    )}

                    {activeTab === 'tasks' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <TasksTab admin={admin} />
                    </motion.div>
                    )}

                    {activeTab === 'config' && (
                    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                    <AdminConfigTab admin={admin} />
                    </motion.div>
                    )}
      </div>
    </div>
  );
}

export default function AdminPortal() {
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('admin_token');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setAdmin(null);
  };

  if (!admin) {
    return <AdminAuthGate onLoginSuccess={setAdmin} />;
  }

  return <AdminDashboard admin={admin} onLogout={handleLogout} />;
}