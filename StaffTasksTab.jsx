import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from 'recharts';
import { TrendingUp, FileText, Receipt, Users, AlertCircle, CheckCircle2, Clock, Activity } from 'lucide-react';

const COLORS = {
  saffron: '#3B82F6',
  emerald: '#10B981',
  red: '#EF4444',
  amber: '#F59E0B',
  violet: '#8B5CF6',
  blue: '#60A5FA',
};

const PIE_COLORS = [COLORS.amber, COLORS.blue, COLORS.red, COLORS.emerald];

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <p className="font-body text-xs tracking-widest uppercase text-chalk/35">{label}</p>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`font-display text-3xl font-light ${color}`}>{value}</p>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-background border border-border px-3 py-2 text-xs font-body">
      {label && <p className="text-chalk/40 mb-1">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || p.fill }}>{p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('npr') ? 'NPR ' + p.value.toLocaleString('en-IN') : p.value}</p>
      ))}
    </div>
  );
};

export default function DashboardTab({ invoices, documents, clientRequests }) {
  // Monthly revenue from paid invoices (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ month: d.toLocaleString('default', { month: 'short' }), year: d.getFullYear(), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    }
    return months.map(m => {
      const revenue = invoices
        .filter(inv => inv.status === 'paid' && inv.paid_date?.startsWith(m.key))
        .reduce((sum, inv) => sum + (inv.amount * (1 + (inv.tax_rate || 13) / 100)), 0);
      return { month: m.month, 'Revenue (NPR)': Math.round(revenue) };
    });
  }, [invoices]);

  // Document status distribution
  const docStatusData = useMemo(() => {
    const counts = { pending_review: 0, reviewed: 0, requires_action: 0, approved: 0 };
    documents.forEach(d => { if (counts[d.status] !== undefined) counts[d.status]++; });
    return [
      { name: 'Pending Review', value: counts.pending_review },
      { name: 'Reviewed', value: counts.reviewed },
      { name: 'Requires Action', value: counts.requires_action },
      { name: 'Approved', value: counts.approved },
    ].filter(d => d.value > 0);
  }, [documents]);

  // Client requests trend (last 6 months)
  const requestsTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      months.push({ month: d.toLocaleString('default', { month: 'short' }), key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}` });
    }
    return months.map(m => ({
      month: m.month,
      Requests: clientRequests.filter(r => r.created_date?.startsWith(m.key)).length,
      Resolved: clientRequests.filter(r => r.status === 'resolved' && r.created_date?.startsWith(m.key)).length,
    }));
  }, [clientRequests]);

  const totalRevenue = invoices.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount * (1 + (i.tax_rate || 13) / 100), 0);
  const pendingDocs = documents.filter(d => d.status === 'pending_review').length;
  const unpaidInvoices = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue');
  const unpaidAmount = unpaidInvoices.reduce((s, i) => s + i.amount * (1 + (i.tax_rate || 13) / 100), 0);
  const pendingRequests = clientRequests.filter(r => r.status === 'pending').length;

  return (
    <div>
      <div className="mb-8">
        <h2 className="font-display text-2xl text-chalk font-light">Dashboard</h2>
        <p className="font-body text-xs text-chalk/35 mt-1">Overview of firm activity and performance.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        <StatCard icon={Receipt} label="Total Revenue" value={'NPR ' + Math.round(totalRevenue).toLocaleString('en-IN')} color="text-saffron" />
        <StatCard icon={AlertCircle} label="Amount Due" value={'NPR ' + Math.round(unpaidAmount).toLocaleString('en-IN')} color="text-amber-400" />
        <StatCard icon={FileText} label="Docs Pending" value={pendingDocs} color="text-blue-400" />
        <StatCard icon={Activity} label="Open Requests" value={pendingRequests} color="text-violet-400" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Monthly Revenue Bar Chart */}
        <div className="border border-border p-6">
          <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-5">Monthly Revenue (Paid Invoices)</p>
          {monthlyRevenue.every(m => m['Revenue (NPR)'] === 0) ? (
            <div className="flex items-center justify-center h-48 text-chalk/20 font-body text-sm">No paid invoices yet</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyRevenue} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(59,130,246,0.05)' }} />
                <Bar dataKey="Revenue (NPR)" fill={COLORS.saffron} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Document Status Pie Chart */}
        <div className="border border-border p-6">
          <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-5">Document Status Distribution</p>
          {docStatusData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-chalk/20 font-body text-sm">No documents yet</div>
          ) : (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="55%" height={200}>
                <PieChart>
                  <Pie data={docStatusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                    {docStatusData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2">
                {docStatusData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="font-body text-xs text-chalk/50">{d.name}</span>
                    <span className="font-body text-xs text-chalk ml-auto">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Client Requests Trend */}
      <div className="border border-border p-6">
        <p className="font-body text-xs tracking-widest uppercase text-chalk/35 mb-5">Client Requests Trend (Last 6 Months)</p>
        {requestsTrend.every(m => m.Requests === 0) ? (
          <div className="flex items-center justify-center h-48 text-chalk/20 font-body text-sm">No client requests yet</div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={requestsTrend} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
              <Line type="monotone" dataKey="Requests" stroke={COLORS.saffron} strokeWidth={2} dot={{ fill: COLORS.saffron, r: 3 }} />
              <Line type="monotone" dataKey="Resolved" stroke={COLORS.emerald} strokeWidth={2} dot={{ fill: COLORS.emerald, r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}