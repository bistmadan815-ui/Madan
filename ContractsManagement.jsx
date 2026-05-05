import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import {
  Plus, Trash2, Edit2, X, Loader2, Search, Check, Eye,
  Clock, CreditCard
} from 'lucide-react';
import CompletedTasksView from '@/components/shared/CompletedTasksView';
import TaskDetailModal from '@/components/client/TaskDetailModal';

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
  low:      { label: 'Low',      color: 'text-chalk/40',   dot: 'bg-chalk/20' },
  medium:   { label: 'Medium',   color: 'text-amber-400',  dot: 'bg-amber-400' },
  high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
  critical: { label: 'Critical', color: 'text-red-400',    dot: 'bg-red-400' },
};

const STATUSES = Object.keys(STATUS_CONFIG);
const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

const emptyForm = {
  title: '', description: '', service: '', client_id: '', client_name: '', client_email: '',
  assigned_to: '', assigned_staff_id: '', status: 'draft', priority: 'medium',
  start_date: '', due_date: '', progress_notes: '', invoice_id: '',
};

function isOverdue(task) {
  return task.due_date && task.status !== 'completed' && task.status !== 'filed' &&
    new Date(task.due_date) < new Date();
}

export default function TasksTab({ admin }) {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [viewing, setViewing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterStaff, setFilterStaff] = useState('all');
  const [view, setView] = useState('list'); // list | completed

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [taskData, staffData, clientData] = await Promise.all([
      base44.entities.ClientTask.list('-created_date', 200),
      base44.entities.StaffAccount.list('-created_date', 100),
      base44.entities.ClientProfile.list('-created_date', 100),
    ]);
    const updated = await Promise.all(taskData.map(async t => {
      if (isOverdue(t) && t.status !== 'overdue') {
        await base44.entities.ClientTask.update(t.id, { status: 'overdue' });
        return { ...t, status: 'overdue' };
      }
      return t;
    }));
    setTasks(updated);
    setStaff(staffData);
    setClients(clientData);
    setLoading(false);
  };

  const handleClientSelect = (clientId) => {
    const c = clients.find(cl => cl.id === clientId);
    if (c) setForm(p => ({ ...p, client_id: c.client_id || c.id, client_name: c.full_name, client_email: c.email }));
    else setForm(p => ({ ...p, client_id: '', client_name: '', client_email: '' }));
  };

  const handleStaffSelect = (staffId) => {
    const s = staff.find(st => st.id === staffId);
    if (s) setForm(p => ({ ...p, assigned_to: s.full_name, assigned_staff_id: s.id }));
    else setForm(p => ({ ...p, assigned_to: '', assigned_staff_id: '' }));
  };

  const notifyClient = async (clientId, title, message, type, refId) => {
    if (!clientId) return;
    await base44.entities.ClientNotification.create({
      client_id: clientId, title, message, type,
      reference_id: refId || '', reference_type: 'ClientTask', is_read: false,
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    const ref = editingTask ? editingTask.task_ref : 'TASK-' + Date.now().toString().slice(-6);
    const payload = { ...form, task_ref: ref, last_updated_by: admin?.full_name || 'Admin', last_updated_by_type: 'admin' };
    if (editingTask) {
      await base44.entities.ClientTask.update(editingTask.id, payload);
      await base44.entities.AuditLog.create({
        actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin',
        action: 'updated_task', entity_type: 'ClientTask', entity_id: editingTask.id,
        details: `Updated task: ${form.title}`,
      });
      if (form.client_id) {
        await notifyClient(form.client_id, `Task Updated: ${form.title}`,
          `Your task has been updated. Status: ${STATUS_CONFIG[payload.status]?.label || payload.status}${form.due_date ? '. Due: ' + form.due_date : ''}.`,
          'task_updated', editingTask.id);
      }
    } else {
      if (payload.assigned_to && payload.status === 'draft') payload.status = 'assigned';
      const created = await base44.entities.ClientTask.create(payload);
      await base44.entities.AuditLog.create({
        actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin',
        action: 'created_task', entity_type: 'ClientTask', entity_id: created.id,
        details: `Created task: ${form.title}`,
      });
      if (payload.client_id) {
        await notifyClient(payload.client_id, `New Task Assigned: ${form.title}`,
          `${form.description ? form.description + ' ' : ''}${form.due_date ? 'Due: ' + form.due_date + '.' : ''}${form.assigned_to ? ' Handled by: ' + form.assigned_to + '.' : ''}`,
          'task_created', created.id);
      }
    }
    setSaving(false);
    setShowForm(false);
    setEditingTask(null);
    setForm(emptyForm);
    loadAll();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this task?')) return;
    await base44.entities.ClientTask.delete(id);
    await base44.entities.AuditLog.create({
      actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin',
      action: 'deleted_task', entity_type: 'ClientTask', entity_id: id, details: 'Task deleted',
    });
    loadAll();
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setForm({ ...emptyForm, ...task });
    setShowForm(true);
  };

  const handleStatusOverride = async (task, newStatus) => {
    await base44.entities.ClientTask.update(task.id, {
      status: newStatus, last_updated_by: admin?.full_name, last_updated_by_type: 'admin',
    });
    await base44.entities.AuditLog.create({
      actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin',
      action: 'override_task_status', entity_type: 'ClientTask', entity_id: task.id,
      details: `Status overridden to: ${newStatus}`,
    });
    if (task.client_id) {
      await base44.entities.ClientNotification.create({
        client_id: task.client_id, is_read: false,
        title: `Task Status Updated: ${task.title}`,
        message: `Your task status has been updated to: ${STATUS_CONFIG[newStatus]?.label || newStatus}.`,
        type: 'task_updated', reference_id: task.id, reference_type: 'ClientTask',
      });
    }
    loadAll();
  };

  const handleAdvancePaymentRequest = async (task) => {
    const amountStr = prompt(`Request advance payment for "${task.title}"\nEnter amount (NPR):`);
    if (!amountStr) return;
    const amount = parseFloat(amountStr);
    if (isNaN(amount) || amount <= 0) { alert('Invalid amount'); return; }
    await base44.entities.PaymentRequest.create({
      client_id: task.client_id || '',
      client_name: task.client_name || '',
      client_email: task.client_email || '',
      request_type: 'advance_request',
      amount,
      description: `Advance payment for task: ${task.title} (${task.task_ref || task.id})`,
      status: 'pending',
      requested_by: admin?.full_name || 'Admin',
    });
    await base44.entities.AuditLog.create({
      actor_email: admin?.email || '', actor_name: admin?.full_name || '', actor_type: 'admin',
      action: 'advance_payment_requested', entity_type: 'ClientTask', entity_id: task.id,
      details: `Advance NPR ${amount} requested for task: ${task.title}`,
    });
    if (task.client_id) {
      await base44.entities.ClientNotification.create({
        client_id: task.client_id, is_read: false,
        title: `Advance Payment Requested: NPR ${amount.toLocaleString('en-IN')}`,
        message: `An advance payment of NPR ${amount.toLocaleString('en-IN')} has been requested for: ${task.title}. Please check your Invoices tab.`,
        type: 'advance_payment', reference_id: task.id, reference_type: 'ClientTask',
      });
    }
    alert('Advance payment request sent to client.');
  };

  const filtered = useMemo(() => tasks.filter(t => {
    const matchSearch = !search ||
      t.title?.toLowerCase().includes(search.toLowerCase()) ||
      t.client_name?.toLowerCase().includes(search.toLowerCase()) ||
      t.task_ref?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === 'all' || t.status === filterStatus;
    const matchPriority = filterPriority === 'all' || t.priority === filterPriority;
    const matchStaff = filterStaff === 'all' || t.assigned_to === filterStaff;
    return matchSearch && matchStatus && matchPriority && matchStaff;
  }), [tasks, search, filterStatus, filterPriority, filterStaff]);

  const stats = useMemo(() => ({
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed' || t.status === 'filed').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    pending: tasks.filter(t => t.status === 'draft' || t.status === 'assigned').length,
  }), [tasks]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-6 h-6 border-2 border-saffron border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display text-2xl text-chalk font-light">Task Management</h3>
          <p className="font-body text-xs text-chalk/35 mt-0.5">{tasks.length} total tasks</p>
        </div>
        <button onClick={() => { setEditingTask(null); setForm(emptyForm); setShowForm(true); }}
          className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background font-medium uppercase tracking-wider hover:bg-saffron/90 transition-all min-h-[44px]">
          <Plus className="w-4 h-4" /> New Task
        </button>
      </div>

      {/* View Toggle */}
      <div className="flex gap-1 mb-4">
        {[['list', 'All Tasks'], ['completed', 'Completed']].map(([v, l]) => (
          <button key={v} onClick={() => setView(v)}
            className={`font-body text-xs px-4 py-2 border transition-all ${view === v ? 'border-saffron text-saffron bg-saffron/5' : 'border-basalt/30 text-chalk/40 hover:text-chalk'}`}>
            {l}{v === 'completed' ? ` (${stats.completed})` : ''}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        {[
          { label: 'Total',       value: stats.total,      color: 'text-chalk' },
          { label: 'Completed',   value: stats.completed,  color: 'text-emerald-400', click: true },
          { label: 'In Progress', value: stats.inProgress, color: 'text-blue-400' },
          { label: 'Pending',     value: stats.pending,    color: 'text-amber-400' },
          { label: 'Overdue',     value: stats.overdue,    color: 'text-red-400' },
        ].map(s => (
          <div key={s.label} onClick={s.click ? () => setView('completed') : undefined}
            className={`border border-border p-4 ${s.click ? 'cursor-pointer hover:border-emerald-400/40 transition-colors' : ''}`}>
            <p className="font-body text-[10px] uppercase tracking-widest text-chalk/30 mb-1">{s.label}</p>
            <p className={`font-display text-2xl font-light ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Completed View */}
      {view === 'completed' && (
        <CompletedTasksView
          tasks={tasks}
          userLabel={admin?.full_name || 'Admin'}
          userType="admin"
          staffList={[...new Set(tasks.map(t => t.assigned_to).filter(Boolean))]}
          clientList={[...new Set(tasks.map(t => t.client_name).filter(Boolean))]}
        />
      )}

      {/* List View */}
      {view === 'list' && (
        <div>
          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-5">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-chalk/25" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search tasks, clients, task ID..."
                className="w-full bg-transparent border-b border-basalt/30 py-2 pl-6 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none" />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-transparent border-b border-basalt/30 py-2 px-2 font-body text-xs text-chalk/60 focus:border-saffron focus:outline-none appearance-none">
              <option value="all" className="bg-background">All Statuses</option>
              {STATUSES.map(s => <option key={s} value={s} className="bg-background">{STATUS_CONFIG[s].label}</option>)}
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}
              className="bg-transparent border-b border-basalt/30 py-2 px-2 font-body text-xs text-chalk/60 focus:border-saffron focus:outline-none appearance-none">
              <option value="all" className="bg-background">All Priorities</option>
              {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k} className="bg-background">{v.label}</option>)}
            </select>
            <select value={filterStaff} onChange={e => setFilterStaff(e.target.value)}
              className="bg-transparent border-b border-basalt/30 py-2 px-2 font-body text-xs text-chalk/60 focus:border-saffron focus:outline-none appearance-none">
              <option value="all" className="bg-background">All Staff</option>
              {staff.map(s => <option key={s.id} value={s.full_name} className="bg-background">{s.full_name}</option>)}
            </select>
          </div>

          {/* Create / Edit Form */}
          <AnimatePresence>
            {showForm && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                className="border border-border p-6 mb-6 relative">
                <div className="absolute top-0 left-0 right-0 h-px bg-saffron" />
                <div className="flex items-center justify-between mb-5">
                  <p className="font-body text-xs tracking-widest uppercase text-saffron">{editingTask ? 'Edit Task' : 'New Task'}</p>
                  <button onClick={() => { setShowForm(false); setEditingTask(null); setForm(emptyForm); }} className="text-chalk/30 hover:text-chalk"><X className="w-4 h-4" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Title *</label>
                      <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Task title" className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Description</label>
                      <textarea rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the task..."
                        className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Priority</label>
                      <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                        className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                        {Object.entries(PRIORITY_CONFIG).map(([k, v]) => <option key={k} value={k} className="bg-background">{v.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Status</label>
                      <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                        className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                        {STATUSES.map(s => <option key={s} value={s} className="bg-background">{STATUS_CONFIG[s].label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Assign Staff</label>
                      <select onChange={e => handleStaffSelect(e.target.value)} defaultValue=""
                        className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                        <option value="" className="bg-background">— Select Staff —</option>
                        {staff.map(s => <option key={s.id} value={s.id} className="bg-background">{s.full_name}</option>)}
                      </select>
                      {form.assigned_to && <p className="font-body text-[10px] text-saffron mt-1">Assigned to: {form.assigned_to}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Link Client</label>
                      <select onChange={e => handleClientSelect(e.target.value)} defaultValue=""
                        className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none">
                        <option value="" className="bg-background">— Select Client (optional) —</option>
                        {clients.map(c => <option key={c.id} value={c.id} className="bg-background">{c.full_name} ({c.company_name})</option>)}
                      </select>
                      {form.client_name && <p className="font-body text-[10px] text-saffron mt-1">Linked: {form.client_name}</p>}
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Service</label>
                      <input value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))} placeholder="e.g. Tax Filing" className={inputCls} />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Invoice ID (optional)</label>
                      <input value={form.invoice_id} onChange={e => setForm(p => ({ ...p, invoice_id: e.target.value }))} placeholder="Linked invoice ID" className={inputCls} />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Start Date</label>
                      <input type="date" value={form.start_date} onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))} className={inputCls} />
                    </div>
                    <div>
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Due Date</label>
                      <input type="date" value={form.due_date} onChange={e => setForm(p => ({ ...p, due_date: e.target.value }))} className={inputCls} />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-1">Progress Notes</label>
                      <textarea rows={2} value={form.progress_notes} onChange={e => setForm(p => ({ ...p, progress_notes: e.target.value }))} placeholder="Initial notes..."
                        className="w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none resize-none" />
                    </div>
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={saving || !form.title.trim()}
                      className="flex items-center gap-2 font-body text-xs px-5 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]">
                      {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      {editingTask ? 'Update Task' : 'Create Task'}
                    </button>
                    <button type="button" onClick={() => { setShowForm(false); setEditingTask(null); setForm(emptyForm); }}
                      className="font-body text-xs px-5 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider min-h-[44px]">Cancel</button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Task List */}
          {filtered.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-basalt/20">
              <p className="font-body text-sm text-chalk/25">No tasks match your filters.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((task, i) => {
                const sc = STATUS_CONFIG[task.status] || STATUS_CONFIG.draft;
                const pc = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;
                const overdue = isOverdue(task);
                return (
                  <motion.div key={task.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                    className={`border p-5 transition-all hover:border-basalt/50 ${overdue ? 'border-red-400/20' : 'border-border'}`}>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className={`font-body text-[10px] tracking-widest uppercase px-2 py-0.5 border ${sc.color}`}>{sc.label}</span>
                          <span className="flex items-center gap-1 font-body text-[10px]">
                            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`}></span>
                            <span className={pc.color}>{pc.label}</span>
                          </span>
                          {task.task_ref && <span className="font-body text-[10px] text-chalk/25 font-mono">{task.task_ref}</span>}
                        </div>
                        <p className="font-body text-sm text-chalk font-medium">{task.title}</p>
                        {task.description && <p className="font-body text-xs text-chalk/40 mt-0.5 truncate">{task.description}</p>}
                        <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                          {task.client_name && <span className="font-body text-xs text-chalk/35">Client: {task.client_name}</span>}
                          {task.assigned_to && <span className="font-body text-xs text-chalk/35">→ {task.assigned_to}</span>}
                          {task.due_date && (
                            <span className={`font-body text-xs flex items-center gap-1 ${overdue ? 'text-red-400' : 'text-chalk/30'}`}>
                              <Clock className="w-3 h-3" /> {task.due_date}
                            </span>
                          )}
                          {task.service && <span className="font-body text-xs text-saffron/60">{task.service}</span>}
                        </div>
                      </div>
                      <div className="flex gap-2 flex-shrink-0 flex-wrap">
                        <select onChange={e => handleStatusOverride(task, e.target.value)} value={task.status}
                          className="bg-transparent border border-basalt/30 px-2 py-1.5 font-body text-[10px] text-chalk/50 focus:border-saffron focus:outline-none appearance-none min-h-[36px]">
                          {STATUSES.map(s => <option key={s} value={s} className="bg-background">{STATUS_CONFIG[s].label}</option>)}
                        </select>
                        <button onClick={() => setViewing(task)}
                          className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleEdit(task)}
                          className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-basalt/30 text-chalk/50 hover:border-saffron hover:text-saffron transition-all min-h-[36px]">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        {task.status !== 'completed' && task.status !== 'filed' && task.client_id && (
                          <button onClick={() => handleAdvancePaymentRequest(task)} title="Request Advance Payment"
                            className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-saffron/30 text-saffron hover:bg-saffron/5 transition-all min-h-[36px]">
                            <CreditCard className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(task.id)}
                          className="flex items-center gap-1.5 font-body text-xs px-3 py-2 border border-red-400/30 text-red-400 hover:bg-red-400/5 transition-all min-h-[36px]">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          <AnimatePresence>
            {viewing && (
              <TaskDetailModal task={viewing} user={admin?.full_name || 'Admin'} userType="admin"
                onClose={() => { setViewing(null); loadAll(); }} />
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}