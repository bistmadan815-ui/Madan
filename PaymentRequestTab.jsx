import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { AlertTriangle, Check, Loader2, RefreshCw, Key } from 'lucide-react';

export default function ConfigureClientsTab() {
  const [unconfigured, setUnconfigured] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState('');
  const [tempPassword, setTempPassword] = useState({});

  const loadUnconfigured = async () => {
    setLoading(true);
    const response = await base44.functions.invoke('getUnconfiguredClients', {});
    setUnconfigured(response.data?.unconfigured || []);
    setLoading(false);
  };

  useEffect(() => { loadUnconfigured(); }, []);

  const fixAccount = async (client) => {
    const pwd = tempPassword[client.id];
    if (!pwd || pwd.length < 4) return;
    
    setFixing(client.id);
    try {
      await base44.functions.invoke('configureClientPassword', {
        client_id: client.client_id,
        new_password: pwd,
      });
      setTempPassword(p => { delete p[client.id]; return p; });
      loadUnconfigured();
    } catch (err) {
      console.error(err);
    }
    setFixing('');
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-chalk font-light">Configure Accounts</h2>
          <p className="font-body text-xs text-chalk/35 mt-1">Set passwords for unconfigured client accounts.</p>
        </div>
        <button onClick={loadUnconfigured}
          className="flex items-center gap-2 font-body text-xs px-4 py-2 border border-basalt/30 text-chalk/40 hover:text-saffron transition-all min-h-[36px]">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {unconfigured.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <Check className="w-10 h-10 text-emerald-400/40 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">All accounts configured</p>
          <p className="font-body text-xs text-chalk/30 mt-1">No unconfigured accounts found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unconfigured.map((client, i) => (
            <motion.div key={client.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="border border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-start gap-4">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-chalk">{client.full_name}</p>
                  <p className="font-body text-xs text-chalk/40">{client.client_id} · {client.company_name}</p>
                  <p className="font-body text-[10px] text-red-300/70 mt-1">⚠ No password set — account cannot be accessed</p>
                </div>
                <div className="flex items-end gap-2 flex-shrink-0">
                  <div className="flex flex-col gap-1">
                    <input
                      type="password"
                      placeholder="Temp password"
                      value={tempPassword[client.id] || ''}
                      onChange={e => setTempPassword(p => ({ ...p, [client.id]: e.target.value }))}
                      className="w-32 bg-transparent border-b border-basalt/30 py-1.5 font-body text-xs text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none"
                    />
                    <span className="font-body text-[10px] text-chalk/30">Min 4 chars</span>
                  </div>
                  <button
                    onClick={() => fixAccount(client)}
                    disabled={fixing === client.id || !tempPassword[client.id] || tempPassword[client.id].length < 4}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2.5 bg-saffron text-background hover:bg-saffron/90 disabled:opacity-40 transition-all min-h-[36px]">
                    {fixing === client.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Key className="w-3 h-3" />}
                    {fixing === client.id ? 'Setting...' : 'Set'}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}