import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import PermissionGuard from '../../components/PermissionGuard';
import Modal from '../../components/Modal';
import PasswordInput from '../../components/PasswordInput';
import { toast } from 'react-toastify';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const { hasPermission } = useAuth();

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    defaultValues: {
      userName: '',
      email: '',
      contactNumber: '',
      password: '',
      roleId: '',
      status: true,
    },
  });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const mobileRegex = /^(\+?[0-9]{1,4})?[0-9]{10}$/;

  const validatePassword = (value) => {
    if (!value || !value.trim()) return true;
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter';
    if (!/[0-9]/.test(value)) return 'Password must include at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>_\-+=]/.test(value)) return 'Password must include at least one special character (!@#$%^&*(),.?":{}|<>_-+=)';
    return true;
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (modalOpen) {
      fetchRoles();
    }
  }, [modalOpen]);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users');
      const data = response.data?.data ?? response.data;
      setUsers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching users', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const response = await api.get('/roles');
      const data = response.data?.data ?? response.data;
      setRoles(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching roles', error);
      setRoles([]);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await api.delete(`/users/${id}`);
        toast.success('User deleted');
        fetchUsers();
      } catch (error) {
        console.error('Error deleting user', error);
        toast.error(error.response?.data?.message || 'Failed to delete user');
      }
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    reset({
      userName: '',
      email: '',
      contactNumber: '',
      password: '',
      roleId: roles[0]?.roleId ?? '',
      status: true,
    });
    setModalOpen(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    reset({
      userName: user.userName ?? user.username ?? '',
      email: user.email ?? '',
      contactNumber: user.contactNumber ?? '',
      password: '',
      roleId: user.roleId ?? user.role?.roleId ?? '',
      status: user.status !== false,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const onFormSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      const payload = {
        userName: data.userName.trim(),
        email: data.email.trim().toLowerCase(),
        contactNumber: data.contactNumber?.trim() || undefined,
        roleId: data.roleId ? Number(data.roleId) : undefined,
        status: !!data.status,
      };
      if (editingUser) {
        if (data.password && data.password.trim()) {
          payload.password = data.password;
        }
        const res = await api.put(`/users/${editingUser.userId ?? editingUser.id}`, payload);
        if (res.data?.success === false) {
          toast.error(res.data?.message || 'Failed to update user');
          setSubmitLoading(false);
          return;
        }
        toast.success('User updated');
      } else {
        if (!data.password || !data.password.trim()) {
          toast.error('Password is required for new user');
          setSubmitLoading(false);
          return;
        }
        payload.password = data.password;
        const res = await api.post('/users', payload);
        if (res.data?.success === false) {
          toast.error(res.data?.message || 'Failed to create user');
          setSubmitLoading(false);
          return;
        }
        toast.success('User created');
      }
      closeModal();
      fetchUsers();
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data?.error || (editingUser ? 'Failed to update user' : 'Failed to create user');
      toast.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>
        <PermissionGuard moduleKey="USER_MANAGEMENT" action="CREATE">
          <button
            type="button"
            onClick={openAddModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add User
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Username</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Email</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Mobile</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Role</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.userId ?? user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 text-gray-900">{user.userName ?? user.username}</td>
                <td className="py-3 px-4 text-gray-600">{user.email}</td>
                <td className="py-3 px-4 text-gray-600">{user.contactNumber ?? '-'}</td>
                <td className="py-3 px-4 text-gray-600">{user.roleName ?? user.role?.roleName ?? '-'}</td>
                <td className="py-3 px-4">
                  <span className={user.status !== false ? 'text-green-600' : 'text-gray-500'}>
                    {user.status !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <PermissionGuard moduleKey="USER_MANAGEMENT" action="UPDATE">
                    <button
                      type="button"
                      onClick={() => openEditModal(user)}
                      className="text-primary-600 hover:text-primary-700 font-medium mr-3"
                    >
                      Edit
                    </button>
                  </PermissionGuard>
                  <PermissionGuard moduleKey="USER_MANAGEMENT" action="DELETE">
                    <button
                      type="button"
                      onClick={() => handleDelete(user.userId ?? user.id)}
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

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="md"
      >
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register('userName', { required: 'Username is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Enter username"
            />
            {errors.userName && (
              <p className="text-red-500 text-sm mt-1">{errors.userName.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: { value: emailRegex, message: 'Enter a valid email address' },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="user@example.com"
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mobile number</label>
            <input
              type="text"
              {...register('contactNumber', {
                validate: (v) => !v || v.trim() === '' || mobileRegex.test(v.replace(/\s/g, '')) || 'Enter a valid 10-digit mobile number (optional country code, e.g. 9876543210 or +919876543210)',
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="9876543210 or +919876543210"
            />
            {errors.contactNumber && (
              <p className="text-red-500 text-sm mt-1">{errors.contactNumber.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password {editingUser ? '(leave blank to keep unchanged)' : <><span className="text-red-500">*</span></>}
            </label>
            <PasswordInput
              register={register}
              name="password"
              options={
                editingUser
                  ? { validate: validatePassword }
                  : { required: 'Password is required', validate: validatePassword }
              }
              placeholder={editingUser ? 'Leave blank to keep current password' : 'Min 8 chars, 1 uppercase, 1 number, 1 special'}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
            {!editingUser && (
              <p className="text-xs text-gray-500 mt-1">At least 8 characters, one uppercase letter, one number, one special character (!@#$%^&* etc.)</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select
              {...register('roleId')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              <option value="">Select role</option>
              {roles.map((role) => (
                <option key={role.roleId ?? role.id} value={role.roleId ?? role.id}>
                  {role.roleName ?? role.name ?? 'Role'}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                {...register('status')}
                className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm font-medium text-gray-700">Active</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitLoading}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {submitLoading ? 'Saving...' : editingUser ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UserList;
