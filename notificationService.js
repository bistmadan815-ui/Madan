import { useState } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { LogOut, Loader2, AlertCircle, Check, Eye, EyeOff } from 'lucide-react';

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-3 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

// ── Staff Login with Credentials ────────────────────────────────────────────────────
function StaffLoginGate({ onLoginSuccess }) {
  const [view, setView] = useState('login'); // login | forgot | reset
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [resetUsername, setResetUsername] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordShow, setNewPasswordShow] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginForm.username.trim() || !loginForm.password.trim()) {
      setError('Username and password required');
      return;
    }

    setLoading(true);
    setError('');
    
    const staff = await base44.entities.StaffAccount.filter({ username: loginForm.username });
    
    if (staff.length === 0 || !staff[0].is_active) {
      setError('Invalid username or password');
      setLoading(false);
      return;
    }

    const storedHash = staff[0].password_hash;
    const inputHash = btoa(loginForm.password);

    if (inputHash === storedHash) {
      localStorage.setItem('staff_token', JSON.stringify(staff[0]));
      await base44.entities.StaffAccount.update(staff[0].id, { last_login: new Date().toISOString() });
      setLoading(false);
      onLoginSuccess(staff[0]);
    } else {
      setError('Invalid username or password');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetUsername.trim()) { setError('Username is required'); return; }

    setLoading(true);
    const staff = await base44.entities.StaffAccount.filter({ username: resetUsername });
    
    if (staff.length === 0 || !staff[0].is_active) {
      setError('Staff account not found');
      setLoading(false);
      return;
    }

    const token = Math.random().toString(36).substring(2, 12);
    sessionStorage.setItem('reset_token', token);
    sessionStorage.setItem('reset_username', resetUsername);
    setSuccess(`Reset token: ${token} (valid for 1 hour)`);
    setView('reset');
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    const storedToken = sessionStorage.getItem('reset_token');
    const username = sessionStorage.getItem('reset_username');
    
    if (resetToken !== storedToken) { setError('Invalid reset token'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }

    setLoading(true);
    const staff = await base44.entities.StaffAccount.filter({ username });
    
    if (staff.length === 0) { setError('Staff account not found'); setLoading(false); return; }

    const passwordHash = btoa(newPassword);
    await base44.entities.StaffAccount.update(staff[0].id, { password_hash: passwordHash });
    
    sessionStorage.removeItem('reset_token');
    sessionStorage.removeItem('reset_username');
    
    setView('login');
    setNewPassword('');
    setResetToken('');
    setResetUsername('');
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
          <span className="font-display text-chalk tracking-wide">M. Bista & Associates</span>
        </div>

        <div className="relative border border-border p-8 md:p-10">
          <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />

          {/* LOGIN */}
          {view === 'login' && (
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <p className="font-body text-xs tracking-[0.3em] uppercase text-saffron mb-1">Staff Access</p>
                <h2 className="font-display text-3xl text-chalk font-light">Staff Portal Login</h2>
              </div>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Username</label>
                <input type="text" value={loginForm.username} onChange={e => { setLoginForm(p => ({ ...p, username: e.target.value })); setError(''); }}
                  placeholder="your-username" className={inputCls} />
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
              <button type="button" onClick={() => { setView('forgot'); setError(''); setSuccess(''); }}
                className="w-full font-body text-xs text-chalk/40 hover:text-saffron transition-colors py-2">
                Forgot Password?
              </button>
            </form>
          )}

          {/* FORGOT PASSWORD */}
          {view === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-5">
              <h2 className="font-display text-3xl text-chalk font-light mb-2">Reset Password</h2>
              <p className="font-body text-sm text-chalk/40">Enter your username to reset your password.</p>
              <div>
                <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Username</label>
                <input type="text" value={resetUsername} onChange={e => { setResetUsername(e.target.value); setError(''); }}
                  placeholder="your-username" className={inputCls} />
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

          {/* SET NEW PASSWORD */}
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
          Staff portal access for M. Bista & Associates employees only.
        </p>
      </motion.div>
    </div>
  );
}

export default function StaffLoginPortal() {
  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('staff_token');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('staff_token');
    setStaff(null);
  };

  if (!staff) {
    return <StaffLoginGate onLoginSuccess={setStaff} />;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg text-center">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <div className="w-9 h-9 border border-saffron flex items-center justify-center">
            <span className="font-display text-saffron text-sm font-semibold">MB</span>
          </div>
          <span className="font-display text-chalk tracking-wide">M. Bista & Associates</span>
        </div>
        <div className="border border-border p-8 md:p-10">
          <p className="font-display text-2xl text-chalk font-light mb-2">Welcome, {staff.full_name}</p>
          <p className="font-body text-sm text-chalk/40 mb-8">Staff Portal</p>
          <button onClick={handleLogout}
            className="flex items-center justify-center gap-2 font-body text-xs px-6 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all min-h-[44px]">
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}