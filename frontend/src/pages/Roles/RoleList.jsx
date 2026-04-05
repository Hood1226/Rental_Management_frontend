import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';

const RoleList = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { roleName: '', description: '' },
  });

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      const data = response.data?.data ?? response.data;
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching roles', error);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this role?')) {
      try {
        await api.delete(`/roles/${id}`);
        toast.success('Role deleted');
        fetchRoles();
      } catch (error) {
        console.error('Error deleting role', error);
        toast.error(error.response?.data?.message || 'Failed to delete role');
      }
    }
  };

  const openAddModal = () => {
    setEditingRole(null);
    reset({ roleName: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    reset({
      roleName: role.roleName ?? '',
      description: role.description ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingRole(null);
  };

  const onFormSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      if (editingRole) {
        const res = await api.put(`/roles/${editingRole.roleId ?? editingRole.id}`, data);
        const result = res.data?.data ?? res.data;
        if (res.data?.success === false) {
          toast.error(res.data?.message || 'Failed to update role');
          setSubmitLoading(false);
          return;
        }
        toast.success('Role updated');
      } else {
        const res = await api.post('/roles', data);
        if (res.data?.success === false) {
          toast.error(res.data?.message || 'Failed to create role');
          setSubmitLoading(false);
          return;
        }
        toast.success('Role created');
      }
      closeModal();
      fetchRoles();
    } catch (error) {
      toast.error(error.response?.data?.message || (editingRole ? 'Failed to update role' : 'Failed to create role'));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Role Management</h1>
        <PermissionGuard moduleKey="ROLE_MANAGEMENT" action="CREATE">
          <button
            type="button"
            onClick={openAddModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Role
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Role Name</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.roleId ?? role.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{role.roleName}</td>
                <td className="py-3 px-4 text-gray-600">{role.description ?? '-'}</td>
                <td className="py-3 px-4">
                  <PermissionGuard moduleKey="ROLE_MANAGEMENT" action="UPDATE">
                    <button
                      type="button"
                      onClick={() => openEditModal(role)}
                      className="text-primary-600 hover:text-primary-700 font-medium mr-3"
                    >
                      Edit
                    </button>
                  </PermissionGuard>
                  <PermissionGuard moduleKey="ROLE_MANAGEMENT" action="DELETE">
                    <button
                      type="button"
                      onClick={() => handleDelete(role.roleId ?? role.id)}
                      className="text-red-600 hover:text-red-700 font-medium"
                    >
                      Delete
                    </button>
                  </PermissionGuard>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingRole ? 'Edit Role' : 'Add Role'} size="md">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register('roleName', { required: 'Role name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. MANAGER"
            />
            {errors.roleName && <p className="text-red-500 text-sm mt-1">{errors.roleName.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitLoading ? 'Saving...' : editingRole ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default RoleList;
