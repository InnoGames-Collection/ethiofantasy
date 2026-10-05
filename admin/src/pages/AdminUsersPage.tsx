import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  UserCheck,
  UserX,
  Shield,
  Edit2,
  AlertTriangle,
} from 'lucide-react';
import { AdminUser, AdminRole } from '../types';
import { api } from '../services/api';
import { ConfirmModal } from '../components/ConfirmModal';

interface AdminUsersPageProps {
  currentRole: AdminRole;
}

export const AdminUsersPage: React.FC<AdminUsersPageProps> = ({ currentRole }) => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New admin modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('Operations');
  const [newRole, setNewRole] = useState<AdminRole>('OPERATIONS_ADMIN');
  const [addReason, setAddReason] = useState('');

  // Confirmation modal
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    actionName: string;
    currentValue?: string;
    newValue?: string;
    warningNote?: string;
    danger?: boolean;
    actionFn: (reason: string) => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    actionName: '',
    actionFn: async () => {},
  });

  const isSuperAdmin = currentRole === 'SUPER_ADMIN';

  const loadAdmins = async () => {
    try {
      setLoading(true);
      const list = await api.getAdminUsers();
      setAdmins(Array.isArray(list) ? list : (list as any)?.admins || []);
    } catch (err: any) {
      setError(err.message);
      setAdmins([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const handleAddAdmin = async () => {
    if (!newName.trim() || !newEmail.trim()) {
      alert('Name and email are required.');
      return;
    }
    if (!addReason.trim() || addReason.trim().length < 4) {
      alert('Operational reason is required for administrative user creation.');
      return;
    }

    try {
      await api.createAdminUser(
        {
          name: newName,
          email: newEmail,
          department: newDepartment,
          role: newRole,
        },
        addReason
      );
      setIsAddModalOpen(false);
      setNewName('');
      setNewEmail('');
      setAddReason('');
      await loadAdmins();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleRoleChange = (admin: AdminUser, targetRole: AdminRole) => {
    setConfirmState({
      isOpen: true,
      title: 'Update Admin Access Role',
      actionName: `Change Role of ${admin.name} to ${targetRole}`,
      currentValue: admin.role,
      newValue: targetRole,
      warningNote: 'Modifying roles reconfigures operational capabilities across competitions, prizes, and unmasking.',
      actionFn: async (reason: string) => {
        await api.updateAdminRole(admin.id, targetRole, reason);
        await loadAdmins();
      },
    });
  };

  const handleToggleActive = (admin: AdminUser) => {
    const nextState = admin.active ? 'INACTIVE' : 'ACTIVE';
    setConfirmState({
      isOpen: true,
      title: `${admin.active ? 'Deactivate' : 'Activate'} Admin User`,
      actionName: `Set Status of ${admin.name} to ${nextState}`,
      currentValue: admin.active ? 'ACTIVE' : 'INACTIVE',
      newValue: nextState,
      danger: admin.active,
      warningNote: admin.active ? 'Deactivated operators are immediately revoked from logging into the portal.' : undefined,
      actionFn: async (reason: string) => {
        await api.toggleAdminActive(admin.id, reason);
        await loadAdmins();
      },
    });
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-blue-700" />
            <span>Authorized Admin Users & Roles</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Role-Based Access Control (RBAC) governance for EthioFantasy operations (Section 26).
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-800 text-white rounded-lg text-xs font-semibold hover:bg-blue-900 shadow-xs transition-colors flex items-center space-x-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin Operator</span>
          </button>
        )}
      </div>

      {/* Role Definitions Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-indigo-200/80 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs uppercase font-mono">
            <Shield className="w-4 h-4 text-indigo-600" />
            <span>Super Admin</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Full operational authority: System settings, post-finalization winner overrides, subscriber MSISDN unmasking, user governance.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-emerald-200/80 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase font-mono">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span>Operations Admin</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Day-to-day game operators: Daily Challenges, Weekly Competitions, Questions draft & publishing, player status modifications.
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200/80 shadow-2xs space-y-2">
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase font-mono">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Reporting Admin</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Telecom auditors & analysts: Read-only access to operational datasets, report generation, and CSV compliance export.
          </p>
        </div>
      </div>

      {/* Admin Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              Operator Directory & Access Levels
            </h3>
            <p className="text-xs text-slate-500">
              Only authorized personnel with verified Ethio Telecom / VAS credentials
            </p>
          </div>
          <span className="text-xs font-mono text-slate-500">
            {admins.length} Operators
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-mono">
              <tr>
                <th className="px-6 py-3">Operator Name</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Department</th>
                <th className="px-6 py-3">Assigned Role</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Last Active</th>
                {isSuperAdmin && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {admins.map((adm) => (
                <tr key={adm.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-slate-900">
                    {adm.name}
                  </td>
                  <td className="px-6 py-3.5 text-slate-600 font-mono">
                    {adm.email}
                  </td>
                  <td className="px-6 py-3.5 text-slate-700">
                    {adm.department}
                  </td>
                  <td className="px-6 py-3.5">
                    {isSuperAdmin ? (
                      <select
                        value={adm.role}
                        onChange={(e) => handleRoleChange(adm, e.target.value as AdminRole)}
                        className="border border-slate-300 rounded p-1 text-[11px] font-mono bg-white"
                      >
                        <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                        <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN</option>
                        <option value="REPORTING_ADMIN">REPORTING_ADMIN</option>
                      </select>
                    ) : (
                      <span className="font-mono font-bold text-blue-900">{adm.role}</span>
                    )}
                  </td>
                  <td className="px-6 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                      adm.active
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {adm.active ? 'ACTIVE' : 'DEACTIVATED'}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-slate-400 font-mono text-[11px]">
                    {adm.lastLogin.includes('T') ? new Date(adm.lastLogin).toLocaleDateString() : adm.lastLogin}
                  </td>
                  {isSuperAdmin && (
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => handleToggleActive(adm)}
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded border transition-colors ${
                          adm.active
                            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        }`}
                      >
                        {adm.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADD ADMIN MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900 text-sm">Add Authorized Administrative Operator</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Operator Full Name</label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Dawit Haile"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="e.g. dawit.h@ethiofantasy.et"
                  className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <input
                  type="text"
                  value={newDepartment}
                  onChange={(e) => setNewDepartment(e.target.value)}
                  placeholder="e.g. VAS Support / Game Operations"
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Role Permissions</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as AdminRole)}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                >
                  <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN (Challenges, Quiz & Players)</option>
                  <option value="REPORTING_ADMIN">REPORTING_ADMIN (Read-Only Telecom Reports)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (Full Administrative Rights)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Reason for Audit Record <span className="text-rose-600">*</span>
                </label>
                <textarea
                  value={addReason}
                  onChange={(e) => setAddReason(e.target.value)}
                  placeholder="e.g. Provisioning new operator account for Telecom VAS team"
                  rows={2}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>
            </div>
            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end space-x-2">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 font-medium text-xs hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleAddAdmin}
                className="px-4 py-2 bg-blue-800 text-white rounded-lg font-semibold text-xs hover:bg-blue-900"
              >
                Add Administrator
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((s) => ({ ...s, isOpen: false }))}
        onConfirm={confirmState.actionFn}
        title={confirmState.title}
        actionName={confirmState.actionName}
        currentValue={confirmState.currentValue}
        newValue={confirmState.newValue}
        warningNote={confirmState.warningNote}
        danger={confirmState.danger}
        confirmButtonText="Confirm Role Change"
      />
    </div>
  );
};
