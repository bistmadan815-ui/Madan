import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Search, Calendar, User, Clock, Eye } from 'lucide-react';
import TaskDetailModal from '@/components/client/TaskDetailModal';

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: 'text-chalk/40',   dot: 'bg-chalk/20' },
  medium:   { label: 'Medium',   color: 'text-amber-400',  dot: 'bg-amber-400' },
  high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
  critical: { label: 'Critical', color: 'text-red-400',    dot: 'bg-red-400' },
};

/**
 * CompletedTasksView — shared across Admin, Staff, Client portals.
 * Props:
 *   tasks        - array of ALL tasks (will filter to completed/filed)
 *   userLabel    - string passed to TaskDetailModal
 *   userType     - 'admin' | 'staff' | 'client'
 *   staffList    - optional array of staff for the staff filter (admin only)
 *   clientList   - optional array of client names for the client filter (admin only)
 */
export default function CompletedTasksView({ tasks = [], userLabel = 'User', userType = 'client', staffList = [], clientList = [] }) {
  const [search, setSearch] = useState('');
  const [filterStaff, setFilterStaff] = useState('all');
  const [filterClient, setFilterClient] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [viewing, setViewing] = useState(null);

  const completedTasks = useMemo(() => tasks.filter(t => t.status === 'completed' || t.status === 'filed'), [tasks]);

  const filtered = useMemo(() => completedTasks.filter(t => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.task_ref?.toLowerCase().includes(search.toLowerCase()) ||
      t.assigned_to?.toLowerCase().includes(search.toLowerCase());
    const matchStaff = filterStaff === 'all' || t.assigned_to === filterStaff;
    const matchClient = filterClient === 'all' || t.client_name === filterClient;
    const completedDate = t.updated_date?.split('T')[0] || '';
    const matchFrom = !filterDateFrom || completedDate >= filterDateFrom;
    const matchTo = !filterDateTo || completedDate <= filterDateTo;
    return matchSearch && matchStaff && matchClient && matchFrom && matchTo;
  }), [completedTasks, search, filterStaff, filterClient, filterDateFrom, filterDateTo]);

  const handleExportCSV = () => {
    const headers = ['Task Ref', 'Title', 'Client', 'Assigned To', 'Service', 'Status', 'Due Date', 'Completed Date'];
    const rows = filtered.map(t => [
      t.task_ref || '',
      `"${t.title || ''}"`,
      t.client_name || '',
      t.assigned_to || '',
      t.service || '',
      t.status || '',
      t.due_date || '',
      t.updated_date?.split('T')[0] || '',
    ]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'completed_tasks.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl text-chalk font-light flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            Completed Tasks
          </h3>
          <p className="font-body text-xs text-chalk/35 mt-0.5">{completedTasks.length} tasks completed</p>
        </div>
        {filtered.length > 0 && (
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 font-body text-xs px-4 py-2.5 border border-emerald-400/30 text-emerald-400 hover:bg-emerald-400/5 transition-all min-h-[36px]">
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title, client, task ID..."
            className="w-full bg-transparent border-b border-basalt/30 py-2 pl-6 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
        </div>
        {staffList.length > 0 && (
          <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
            className="bg-transparent border-b border-basalt/30 py-2 px-2 font-body text-xs text-chalk/60 focus:border-saffron focus:outline-none appearance-none">
            <option value="all" className="bg-background">All Staff</option>
            {staffList.map(s => <option key={s} value={s} className="bg-background">{s}</option>)}
          </select>
        )}
        {clientList.length > 0 && (
          <select value={filterClient} onChange={e => setFilterClient(e.target.value)}
            className="bg-transparent border-b border-basalt/30 py-2 px-2 font-body text-xs text-chalk/60 focus:border-saffron focus:outline-none appearance-none">
            <option value="all" className="bg-background">All Clients</option>
            {clientList.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
          </select>
        )}
        <div className="flex items-center gap-2">
          <Calendar className="w-3.5 h-3.5 text-chalk/25 flex-shrink-0" />
          <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)}
            className="bg-transparent border-b border-basalt/30 py-2 px-1 font-body text-xs text-chalk/60 focus:border-saffron focus:outline-none w-32" />
          <span className="font-body text-xs text-chalk/30">–</span>
          <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)}
            className="bg-transparent border-b border-basalt/30 py-2 px-1 font-body text-xs text-chalk/60 focus:border-saffron focus:outline-none w-32" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <CheckCircle2 className="w-10 h-10 text-chalk/10 mx-auto mb-3" />
          <p className="font-display text-xl text-chalk/20 font-light">No Completed Tasks</p>
          <p className="font-body text-sm text-chalk/15 mt-1">Tasks marked as completed will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task, i) => {
            const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
            const completedDate = task.updated_date?.split('T')[0];
            return (
              <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                className="border border-emerald-400/10 bg-emerald-400/3 p-5 hover:border-emerald-400/25 transition-all cursor-pointer"
                onClick={() => setViewing(task)}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="flex items-center gap-1.5 font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border text-emerald-400 border-emerald-400/30 bg-emerald-400/5">
                        <CheckCircle2 className="w-3 h-3" />
                        {task.status === 'filed' ? 'Filed' : 'Completed'}
                      </span>
                      <span className="flex items-center gap-1 font-body text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                        <span className={pc.color}>{pc.label}</span>
                      </span>
                      {task.task_ref && <span className="font-body text-[10px] text-chalk/25 font-mono">{task.task_ref}</span>}
                    </div>
                    <p className="font-body text-sm text-chalk font-medium">{task.title}</p>
                    {task.description && <p className="font-body text-xs text-chalk/40 mt-0.5 truncate">{task.description}</p>}
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      {task.client_name && (
                        <span className="font-body text-xs text-chalk/35 flex items-center gap-1">
                          <User className="w-3 h-3" /> {task.client_name}
                        </span>
                      )}
                      {task.assigned_to && <span className="font-body text-xs text-chalk/35">→ {task.assigned_to}</span>}
                      {task.service && <span className="font-body text-xs text-saffron/60">{task.service}</span>}
                      {task.due_date && (
                        <span className="font-body text-xs text-chalk/30 flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Due: {task.due_date}
                        </span>
                      )}
                      {completedDate && (
                        <span className="font-body text-xs text-emerald-400/70 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {completedDate}
                        </span>
                      )}
                    </div>
                    {task.progress_notes && (
                      <p className="font-body text-xs text-chalk/30 mt-2 italic border-l-2 border-emerald-400/20 pl-2">{task.progress_notes}</p>
                    )}
                  </div>
                  <button onClick={e => { e.stopPropagation(); setViewing(task); }}
                    className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px] flex-shrink-0">
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {viewing && (
          <TaskDetailModal task={viewing} user={userLabel} userType={userType}
            onClose={() => setViewing(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}