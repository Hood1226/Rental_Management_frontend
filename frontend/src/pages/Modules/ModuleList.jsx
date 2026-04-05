import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import api from '../../services/api';
import PermissionGuard from '../../components/PermissionGuard';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';

const ModuleList = () => {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingModule, setEditingModule] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { moduleKey: '', moduleName: '', description: '' },
  });

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    try {
      const response = await api.get('/modules');
      const data = response.data?.data ?? response.data;
      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching modules', error);
      setModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this module?')) {
      try {
        await api.delete(`/modules/${id}`);
        toast.success('Module deleted');
        fetchModules();
      } catch (error) {
        console.error('Error deleting module', error);
        toast.error(error.response?.data?.message || 'Failed to delete module');
      }
    }
  };

  const openAddModal = () => {
    setEditingModule(null);
    reset({ moduleKey: '', moduleName: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (mod) => {
    setEditingModule(mod);
    reset({
      moduleKey: mod.moduleKey ?? '',
      moduleName: mod.moduleName ?? mod.moduleKey ?? '',
      description: mod.description ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingModule(null);
  };

  const onFormSubmit = async (data) => {
    setSubmitLoading(true);
    try {
      if (editingModule) {
        const res = await api.put(`/modules/${editingModule.moduleId ?? editingModule.id}`, data);
        if (res.data?.success === false) {
          toast.error(res.data?.message || 'Failed to update module');
          setSubmitLoading(false);
          return;
        }
        toast.success('Module updated');
      } else {
        const res = await api.post('/modules', data);
        if (res.data?.success === false) {
          toast.error(res.data?.message || 'Failed to create module');
          setSubmitLoading(false);
          return;
        }
        toast.success('Module created');
      }
      closeModal();
      fetchModules();
    } catch (error) {
      toast.error(error.response?.data?.message || (editingModule ? 'Failed to update module' : 'Failed to create module'));
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Module Management</h1>
        <PermissionGuard moduleKey="MODULE_MANAGEMENT" action="CREATE">
          <button
            type="button"
            onClick={openAddModal}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg"
          >
            Add Module
          </button>
        </PermissionGuard>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="min-w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Module Key</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Module Name</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Description</th>
              <th className="py-3 px-4 text-left text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {modules.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-gray-500">
                  No modules found. Add a module to get started.
                </td>
              </tr>
            ) : (
              modules.map((mod) => (
                <tr key={mod.moduleId ?? mod.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium text-gray-900">{mod.moduleKey}</td>
                  <td className="py-3 px-4 text-gray-900">{mod.moduleName ?? mod.moduleKey}</td>
                  <td className="py-3 px-4 text-gray-600">{mod.description ?? '-'}</td>
                  <td className="py-3 px-4">
                    <PermissionGuard moduleKey="MODULE_MANAGEMENT" action="UPDATE">
                      <button
                        type="button"
                        onClick={() => openEditModal(mod)}
                        className="text-primary-600 hover:text-primary-700 font-medium mr-3"
                      >
                        Edit
                      </button>
                    </PermissionGuard>
                    <PermissionGuard moduleKey="MODULE_MANAGEMENT" action="DELETE">
                      <button
                        type="button"
                        onClick={() => handleDelete(mod.moduleId ?? mod.id)}
                        className="text-red-600 hover:text-red-700 font-medium"
                      >
                        Delete
                      </button>
                    </PermissionGuard>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={modalOpen} onClose={closeModal} title={editingModule ? 'Edit Module' : 'Add Module'} size="md">
        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Key <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register('moduleKey', { required: 'Module key is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. BOOKING_MANAGEMENT"
              disabled={!!editingModule}
            />
            {editingModule && <p className="text-xs text-gray-500 mt-1">Module key cannot be changed.</p>}
            {errors.moduleKey && <p className="text-red-500 text-sm mt-1">{errors.moduleKey.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Module Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              {...register('moduleName', { required: 'Module name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="e.g. Booking Management"
            />
            {errors.moduleName && <p className="text-red-500 text-sm mt-1">{errors.moduleName.message}</p>}
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
              {submitLoading ? 'Saving...' : editingModule ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default ModuleList;
