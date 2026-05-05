import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { Plus, Edit2, Trash2, Loader2, AlertCircle, Check } from 'lucide-react';

const AVAILABLE_PERMISSIONS = [
  'manage_staff',
  'manage_roles',
  'view_finances',
  'manage_invoices',
  'view_clients',
  'manage_clients',
  'review_documents',
  'manage_notifications',
  'view_reports',
];

const inputCls = 'w-full bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk placeholder:text-chalk/20 focus:border-saffron focus:outline-none transition-colors';

export default function RoleManagement({ isAdmin }) {
  const [roles, setRoles] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [form, setForm] = useState({ role_name: '', description: '', permissions: [] });
  const [selectedAdminRole, setSelectedAdminRole] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('roles');

  useEffect(() => {
    loadRoles();
    loadAdmins();
  }, []);

  const loadRoles = async () => {
    const data = await base44.entities.AdminRole.list('-created_date', 100);
    setRoles(data);
  };

  const loadAdmins = async () => {
    const data = await base44.entities.Admin.list('-created_date', 100);
    setAdmins(data);
    const roleMap = {};
    data.forEach(admin => {
      roleMap[admin.id] = admin.role_id || '';
    });
    setSelectedAdminRole(roleMap);
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!form.role_name.trim() || form.permissions.length === 0) {
      setError('Role name and at least one permission required');
      return;
    }

    setLoading(true);
    try {
      if (editingRole) {
        await base44.entities.AdminRole.update(editingRole.id, {
          role_name: form.role_name,
          description: form.description,
          permissions: form.permissions,
        });
        setSuccess('Role updated successfully');
      } else {
        await base44.entities.AdminRole.create({
          role_name: form.role_name,
          description: form.description,
          permissions: form.permissions,
        });
        setSuccess('Role created successfully');
      }

      setForm({ role_name: '', description: '', permissions: [] });
      setEditingRole(null);
      setShowForm(false);
      loadRoles();
    } catch (err) {
      setError(err.message || 'Failed to save role');
    }
    setLoading(false);
  };

  const handleDeleteRole = async (id) => {
    if (confirm('Are you sure? Admins with this role will lose access.')) {
      await base44.entities.AdminRole.delete(id);
      setSuccess('Role deleted');
      loadRoles();
    }
  };

  const handleTogglePermission = (perm) => {
    setForm(p => ({
      ...p,
      permissions: p.permissions.includes(perm)
        ? p.permissions.filter(x => x !== perm)
        : [...p.permissions, perm]
    }));
  };

  const handleAssignRole = async (adminId, roleId) => {
    setLoading(true);
    await base44.entities.Admin.update(adminId, { role_id: roleId || null });
    setSelectedAdminRole(p => ({ ...p, [adminId]: roleId }));
    setSuccess('Admin role assigned');
    setLoading(false);
  };

  const handleEditRole = (role) => {
    setEditingRole(role);
    setForm({
      role_name: role.role_name,
      description: role.description,
      permissions: role.permissions,
    });
    setShowForm(true);
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-4 mb-8 border-b border-border">
        <button
          onClick={() => setActiveTab('roles')}
          className={`py-3 px-4 font-body text-sm tracking-wider uppercase border-b-2 transition-colors ${
            activeTab === 'roles'
              ? 'border-saffron text-saffron'
              : 'border-transparent text-chalk/40 hover:text-chalk'
          }`}
        >
          Roles
        </button>
        <button
          onClick={() => setActiveTab('admins')}
          className={`py-3 px-4 font-body text-sm tracking-wider uppercase border-b-2 transition-colors ${
            activeTab === 'admins'
              ? 'border-saffron text-saffron'
              : 'border-transparent text-chalk/40 hover:text-chalk'
          }`}
        >
          Admin Assignments
        </button>
      </div>

      {/* ROLES TAB */}
      {activeTab === 'roles' && (
        <div>
          {!showForm ? (
            <button
              onClick={() => { setShowForm(true); setEditingRole(null); setForm({ role_name: '', description: '', permissions: [] }); }}
              className="flex items-center gap-2 font-body text-sm px-5 py-2.5 border border-saffron text-saffron hover:bg-saffron hover:text-background transition-all mb-8 min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> Create Role
            </button>
          ) : (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="border border-border p-6 mb-8 max-w-2xl">
              <h3 className="font-display text-xl text-chalk font-light mb-6">{editingRole ? 'Edit Role' : 'Create New Role'}</h3>
              <form onSubmit={handleAddRole} className="space-y-5">
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Role Name *</label>
                  <input
                    type="text"
                    value={form.role_name}
                    onChange={e => setForm(p => ({ ...p, role_name: e.target.value }))}
                    placeholder="e.g., HR Manager"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-2">Description</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="Role description"
                    className={`${inputCls} resize-none h-20`}
                  />
                </div>
                <div>
                  <label className="block font-body text-xs tracking-widest uppercase text-chalk/35 mb-3">Permissions *</label>
                  <div className="grid grid-cols-2 gap-3">
                    {AVAILABLE_PERMISSIONS.map(perm => (
                      <label key={perm} className="flex items-center gap-3 cursor-pointer hover:bg-basalt/5 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(perm)}
                          onChange={() => handleTogglePermission(perm)}
                          className="w-4 h-4 border border-saffron rounded accent-saffron"
                        />
                        <span className="font-body text-xs text-chalk/60 capitalize">{perm.replace(/_/g, ' ')}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {error && <p className="font-body text-xs text-red-400 flex items-center gap-2"><AlertCircle className="w-3 h-3" />{error}</p>}
                {success && <p className="font-body text-xs text-emerald-400 flex items-center gap-2"><Check className="w-3 h-3" />{success}</p>}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 font-body text-xs px-4 py-2.5 bg-saffron text-background uppercase tracking-wider hover:bg-saffron/90 disabled:opacity-50 min-h-[44px]"
                  >
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : editingRole ? 'Update Role' : 'Create Role'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 font-body text-xs px-4 py-2.5 border border-basalt/30 text-chalk/40 uppercase tracking-wider hover:text-chalk min-h-[44px]"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {/* Roles List */}
          {roles.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-basalt/20">
              <p className="font-body text-chalk/30">No roles created yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {roles.map((role, i) => (
                <motion.div
                  key={role.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-border p-5"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-display text-lg text-chalk font-light">{role.role_name}</p>
                      {role.description && <p className="font-body text-xs text-chalk/40 mt-1">{role.description}</p>}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditRole(role)}
                        className="p-2 text-chalk/40 hover:text-saffron transition-colors min-h-[36px] min-w-[36px]"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRole(role.id)}
                        className="p-2 text-chalk/40 hover:text-red-400 transition-colors min-h-[36px] min-w-[36px]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {role.permissions.map(perm => (
                      <span key={perm} className="font-body text-[10px] px-2 py-1 bg-basalt/20 text-chalk/60 rounded capitalize">
                        {perm.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ADMIN ASSIGNMENTS TAB */}
      {activeTab === 'admins' && (
        <div>
          <h3 className="font-display text-xl text-chalk font-light mb-6">Assign Roles to Admins</h3>
          {admins.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-basalt/20">
              <p className="font-body text-chalk/30">No admin users yet.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {admins.map((admin, i) => (
                <motion.div
                  key={admin.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="border border-border p-5 flex items-center justify-between"
                >
                  <div>
                    <p className="font-display text-lg text-chalk font-light">{admin.full_name}</p>
                    <p className="font-body text-xs text-chalk/40">{admin.email}</p>
                  </div>
                  <select
                    value={selectedAdminRole[admin.id] || ''}
                    onChange={e => handleAssignRole(admin.id, e.target.value)}
                    disabled={loading}
                    className="bg-transparent border-b border-basalt/30 py-2 font-body text-sm text-chalk focus:border-saffron focus:outline-none appearance-none min-w-[150px]"
                  >
                    <option value="">No Role (Default Access)</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id} className="bg-background">
                        {role.role_name}
                      </option>
                    ))}
                  </select>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}