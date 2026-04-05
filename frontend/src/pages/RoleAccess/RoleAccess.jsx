import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PermissionGuard from '../../components/PermissionGuard';
import { toast } from 'react-toastify';
import { KeyRound, Save, Loader2 } from 'lucide-react';

const RoleAccess = () => {
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { hasPermission } = useAuth();

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    if (selectedRole) {
      fetchPermissions(selectedRole);
    } else {
      setPermissions([]);
    }
  }, [selectedRole]);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      const data = response.data?.data ?? response.data;
      const list = Array.isArray(data) ? data : [];
      setRoles(list);
      if (list.length > 0 && !selectedRole) {
        setSelectedRole(list[0].roleId ?? list[0].id);
      }
    } catch (error) {
      console.error('Error fetching roles', error);
      setRoles([]);
      toast.error('Failed to load roles');
    }
  };

  const fetchPermissions = async (roleId) => {
    setLoading(true);
    try {
      const response = await api.get(`/roles/${roleId}/permissions`);
      const data = response.data?.data ?? response.data;
      setPermissions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching permissions', error);
      setPermissions([]);
      toast.error('Failed to load permissions');
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionChange = (moduleId, field) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        (perm.moduleId ?? perm.module_id) === moduleId ? { ...perm, [field]: !perm[field] } : perm
      )
    );
  };

  const handleSelectAllForModule = (moduleId, checked) => {
    setPermissions((prev) =>
      prev.map((perm) =>
        (perm.moduleId ?? perm.module_id) === moduleId
          ? { ...perm, canCreate: checked, canRead: checked, canUpdate: checked, canDelete: checked }
          : perm
      )
    );
  };

  const savePermissions = async () => {
    if (!selectedRole) {
      toast.warning('Select a role first');
      return;
    }
    setSaving(true);
    try {
      const payloads = permissions.map((perm) => ({
        moduleId: perm.moduleId ?? perm.module_id,
        moduleKey: perm.moduleKey ?? perm.module_key,
        moduleName: perm.moduleName ?? perm.module_name,
        canCreate: !!perm.canCreate,
        canRead: !!perm.canRead,
        canUpdate: !!perm.canUpdate,
        canDelete: !!perm.canDelete,
      }));
      await Promise.all(
        payloads.map((payload) => api.put(`/roles/${selectedRole}/permissions`, payload))
      );
      toast.success('Access assigned successfully');
    } catch (error) {
      console.error('Error updating permissions', error);
      toast.error(error.response?.data?.message || 'Failed to assign access');
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('ROLE_ACCESS_MANAGEMENT', 'READ')) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-amber-800">
          Access denied. You do not have permission to view Role Access.
        </div>
      </div>
    );
  }

  const selectedRoleName = roles.find((r) => (r.roleId ?? r.id) === selectedRole)?.roleName ?? '';

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <KeyRound className="w-7 h-7 text-primary-600" />
            Role Access Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign Create, Read, Update, and Delete access per module for each role.
          </p>
        </div>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Role</label>
        <select
          className="w-full sm:w-80 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          value={selectedRole ?? ''}
          onChange={(e) => setSelectedRole(Number(e.target.value) || e.target.value || null)}
        >
          <option value="">-- Select role --</option>
          {roles.map((role) => (
            <option key={role.roleId ?? role.id} value={role.roleId ?? role.id}>
              {role.roleName}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-gray-500">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          Loading permissions...
        </div>
      ) : !selectedRole ? (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center text-gray-500">
          Select a role above to assign module access.
        </div>
      ) : (
        <>
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <span className="font-medium text-gray-700">Assigning access for: </span>
              <span className="text-primary-600 font-semibold">{selectedRoleName}</span>
            </div>
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Module</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-24">Create</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-24">Read</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-24">Update</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-24">Delete</th>
                  <th className="py-3 px-4 text-center text-sm font-semibold text-gray-700 w-28">All</th>
                </tr>
              </thead>
              <tbody>
                {permissions.map((perm) => {
                  const moduleId = perm.moduleId ?? perm.module_id;
                  const allChecked =
                    perm.canCreate && perm.canRead && perm.canUpdate && perm.canDelete;
                  return (
                    <tr key={moduleId ?? perm.moduleKey ?? perm.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {perm.moduleName ?? perm.moduleKey ?? '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!perm.canCreate}
                          onChange={() => handlePermissionChange(moduleId, 'canCreate')}
                          disabled={!hasPermission('ROLE_ACCESS_MANAGEMENT', 'UPDATE')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!perm.canRead}
                          onChange={() => handlePermissionChange(moduleId, 'canRead')}
                          disabled={!hasPermission('ROLE_ACCESS_MANAGEMENT', 'UPDATE')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!perm.canUpdate}
                          onChange={() => handlePermissionChange(moduleId, 'canUpdate')}
                          disabled={!hasPermission('ROLE_ACCESS_MANAGEMENT', 'UPDATE')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={!!perm.canDelete}
                          onChange={() => handlePermissionChange(moduleId, 'canDelete')}
                          disabled={!hasPermission('ROLE_ACCESS_MANAGEMENT', 'UPDATE')}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleSelectAllForModule(moduleId, !allChecked)}
                          disabled={!hasPermission('ROLE_ACCESS_MANAGEMENT', 'UPDATE')}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium disabled:opacity-50"
                        >
                          {allChecked ? 'Clear' : 'All'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {hasPermission('ROLE_ACCESS_MANAGEMENT', 'UPDATE') && (
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={savePermissions}
                disabled={saving || permissions.length === 0}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 font-medium"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save access
                  </>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RoleAccess;
