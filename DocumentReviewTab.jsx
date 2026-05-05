import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  Clock, CheckCircle2, AlertCircle, CircleDot, FileSearch,
  FolderOpen, Loader2, Eye, ChevronRight, AlertOctagon, Search
} from 'lucide-react';
import TaskDetailModal from '@/components/client/TaskDetailModal';
import CompletedTasksView from '@/components/shared/CompletedTasksView';

const STATUS_CONFIG = {
  draft:              { label: 'Draft',          color: 'text-chalk/40 border-basalt/30 bg-basalt/5' },
  assigned:           { label: 'Assigned',       color: 'text-blue-300 border-blue-300/30 bg-blue-300/5' },
  in_progress:        { label: 'In Progress',    color: 'text-blue-400 border-blue-400/30 bg-blue-400/5' },
  awaiting_documents: { label: 'Awaiting Docs',  color: 'text-amber-400 border-amber-400/30 bg-amber-400/5' },
  pending_review:     { label: 'Pending Review', color: 'text-violet-300 border-violet-300/30 bg-violet-300/5' },
  review:             { label: 'In Review',      color: 'text-violet-400 border-violet-400/30 bg-violet-400/5' },
  filed:              { label: 'Filed',          color: 'text-saffron border-saffron/30 bg-saffron/5' },
  completed:          { label: 'Completed',      color: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/5' },
  overdue:            { label: 'Overdue',        color: 'text-red-400 border-red-400/30 bg-red-400/5' },
};

const PRIORITY_CONFIG = {
  low:      { label: 'Low',      color: 'text-chalk/40', dot: 'bg-chalk/20' },
  medium:   { label: 'Medium',   color: 'text-amber-400', dot: 'bg-amber-400' },
  high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
  critical: { label: 'Critical', color: 'text-red-400', dot: 'bg-red-400' },
};

// Staff can only move to these statuses (no skipping to completed from assigned)
const STAFF_ALLOWED_TRANSITIONS = {
  draft:              ['in_progress'],
  assigned:           ['in_progress'],
  in_progress:        ['awaiting_documents', 'pending_review'],
  awaiting_documents: ['in_progress', 'pending_review'],
  pending_review:     ['in_progress', 'completed'],
  review:             ['in_progress', 'completed'],
  filed:              [],
  completed:          [],
  overdue:            ['in_progress'],
};

function isOverdue(task) {
  return task.due_date && task.status !== 'completed' && task.status !== 'filed' &&
    new Date(task.due_date) < new Date();
}

function isToday(dateStr) {
  if (!dateStr) return false;
  const today = new Date().toISOString().split('T')[0];
  return dateStr === today;
}

export default function StaffTasksTab({ staff }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState('');
  const [viewing, setViewing] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState('active'); // active | completed
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadTasks();
  }, [staff]);

  const loadTasks = async () => {
    setLoading(true);
    // Staff sees only tasks assigned to them
    const data = await base44.entities.ClientTask.filter(
      { assigned_to: staff?.full_name }, '-created_date', 200
    );
    // Also fetch by staff id if available
    let byId = [];
    if (staff?.id) {
      byId = await base44.entities.ClientTask.filter({ assigned_staff_id: staff.id }, '-created_date', 200);
    }
    // Deduplicate
    const all = [...data, ...byId.filter(b => !data.find(d => d.id === b.id))];
    // Auto-mark overdue
    const updated = await Promise.all(all.map(async t => {
      if (isOverdue(t) && t.status !== 'overdue') {
        await base44.entities.ClientTask.update(t.id, { status: 'overdue' });
        return { ...t, status: 'overdue' };
      }
      return t;
    }));
    setTasks(updated);
    setLoading(false);
  };

  const handleStatusUpdate = async (task, newStatus) => {
    setUpdatingId(task.id);
    await base44.entities.ClientTask.update(task.id, {
      status: newStatus,
      last_updated_by: staff?.full_name,
      last_updated_by_type: 'staff',
    });
    await base44.entities.AuditLog.create({
      actor_email: staff?.email || '', actor_name: staff?.full_name || '', actor_type: 'staff',
      action: 'updated_task_status', entity_type: 'ClientTask', entity_id: task.id,
      details: `Status changed to: ${newStatus}`,
    });
    setUpdatingId('');
    loadTasks();
  };

  const filtered = useMemo(() => tasks.filter(t => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchSearch && matchStatus;
  }), [tasks, search, filterStatus]);

  const stats = useMemo(() => ({
    total: tasks.length,
    dueToday: tasks.filter(t => isToday(t.due_date) && t.status !== 'completed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
  }), [tasks]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl text-chalk font-light">My Tasks</h3>
          <p className="font-body text-xs text-chalk/35 mt-0.5">Tasks assigned to {staff?.full_name}</p>
        </div>
        <div className="flex gap-1">
          {[['active','Active'],['completed','Completed']].map(([v,l]) => (
            <button key={v} onClick={() => setViewMode(v)}
              className={`font-body text-xs px-4 py-2 border transition-all ${viewMode === v ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:text-chalk'}`}>
              {l}{v === 'completed' ? ` (${tasks.filter(t => t.status === 'completed' || t.status === 'filed').length})` : ''}
            </button>
          ))}
        </div>
      </div>

      {viewMode === 'completed' && (
        <CompletedTasksView tasks={tasks} userLabel={staff?.full_name || 'Staff'} userType="staff" />
      )}

      {viewMode === 'active' && (<>
      {/* Staff Dashboard Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'My Tasks', value: stats.total, color: 'text-chalk' },
          { label: 'Due Today', value: stats.dueToday, color: 'text-amber-400' },
          { label: 'Overdue', value: stats.overdue, color: 'text-red-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
        ].map(s => (
          <div key={s.label} className="border border-border p-4">
            <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">{s.label}</p>
            <p className={`font-display text-2xl font-light ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search tasks..."
            className="w-full bg-transparent border-b border-basalt/30 py-2 pl-6 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {[['all', 'All'], ['in_progress', 'In Progress'], ['overdue', 'Overdue'], ['pending_review', 'For Review'], ['completed', 'Completed']].map(([val, label]) => (
            <button key={val} onClick={() => setFilterStatus(val)}
              className={`font-body text-xs px-3 py-2 border transition-all ${filterStatus === val ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:text-chalk'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-basalt/20">
          <p className="font-body text-sm text-chalk/25">No tasks found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((task, i) => {
            const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.assigned;
            const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
            const overdue = task.status === 'overdue';
            const allowedNext = STAFF_ALLOWED_TRANSITIONS[task.status] || [];
            return (
              <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`border p-5 ${overdue ? 'border-red-400/20 bg-red-400/3' : 'border-border'}`}>
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc.color}`}>{sc.label}</span>
                      <span className="flex items-center gap-1 font-body text-[10px]">
                        <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                        <span className={pc.color}>{pc.label}</span>
                      </span>
                      {task.task_ref && <span className="font-body text-[10px] text-chalk/25 font-mono">{task.task_ref}</span>}
                      {isToday(task.due_date) && task.status !== 'completed' && (
                        <span className="font-body text-[10px] text-amber-400 border border-amber-400/30 bg-amber-400/5 px-2 py-0.5">Due Today</span>
                      )}
                    </div>
                    <p className="font-body text-sm text-chalk font-medium">{task.title}</p>
                    {task.description && <p className="font-body text-xs text-chalk/40 mt-0.5">{task.description}</p>}
                    <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                      {task.client_name && <span className="font-body text-xs text-chalk/35">Client: {task.client_name}</span>}
                      {task.service && <span className="font-body text-xs text-saffron/60">{task.service}</span>}
                      {task.due_date && (
                        <span className={`font-body text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-chalk/30'}`}>
                          <Clock className="w-3 h-3" /> {task.due_date}
                        </span>
                      )}
                    </div>
                    {task.progress_notes && (
                      <p className="font-body text-xs text-chalk/30 mt-2 italic border-l-2 border-basalt/20 pl-2">{task.progress_notes}</p>
                    )}
                  </div>

                  <div className="flex flex-col gap-2 flex-shrink-0 min-w-[150px]">
                    <button onClick={() => setViewing(task)}
                      className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                      <Eye className="w-3.5 h-3.5" /> View & Comment
                    </button>
                    {allowedNext.length > 0 && allowedNext.map(next => (
                      <button key={next} onClick={() => handleStatusUpdate(task, next)} disabled={updatingId === task.id}
                        className={`flex items-center justify-center gap-1.5 font-body text-xs px-3 py-2 border transition-all min-h-[36px] disabled:opacity-50 ${STATUS_CONFIG[next]?.color || 'border-basalt/30 text-chalk/40'}`}>
                        {updatingId === task.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : STATUS_CONFIG[next]?.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {viewing && (
          <TaskDetailModal task={viewing} user={staff?.full_name || 'Staff'} userType="staff"
            onClose={() => { setViewing(null); loadTasks(); }} />
        )}
      </AnimatePresence>
      </>)}
    </div>
  );
}