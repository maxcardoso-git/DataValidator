import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../services/api';
import { formatDate } from '../i18n';
import toast from 'react-hot-toast';
import {
  UserPlus,
  Edit2,
  Trash2,
  Check,
  X,
  Loader2,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

export default function Users() {
  const { t } = useTranslation(['users', 'common']);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const ROLES = [
    { value: 'ADMIN', label: t('common:roles.admin'), description: t('common:roles.adminDesc') },
    { value: 'STEWARD', label: t('common:roles.steward'), description: t('common:roles.stewardDesc') },
    { value: 'VIEWER', label: t('common:roles.viewer'), description: t('common:roles.viewerDesc') }
  ];

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'VIEWER'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminService.getUsers();
      setUsers(response.data.users || []);
    } catch (error) {
      toast.error(t('errors.loadFailed'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '',
        role: user.role
      });
    } else {
      setEditingUser(null);
      setFormData({
        username: '',
        password: '',
        role: 'VIEWER'
      });
    }
    setShowPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ username: '', password: '', role: 'VIEWER' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingUser) {
        const updateData = { role: formData.role };
        if (formData.password) {
          updateData.password = formData.password;
        }
        await adminService.updateUser(editingUser._id, updateData);
        toast.success(t('messages.updated'));
      } else {
        if (!formData.password) {
          toast.error(t('common:errors.passwordRequired'));
          setSaving(false);
          return;
        }
        await adminService.createUser(formData);
        toast.success(t('messages.created'));
      }
      handleCloseModal();
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.error || t('errors.saveFailed');
      toast.error(message);
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (user) => {
    try {
      if (user.active) {
        await adminService.deleteUser(user._id);
        toast.success(t('messages.deactivated'));
      } else {
        await adminService.updateUser(user._id, { active: true });
        toast.success(t('messages.activated'));
      }
      fetchUsers();
    } catch (error) {
      const message = error.response?.data?.error || t('errors.toggleFailed');
      toast.error(message);
      console.error(error);
    }
  };

  const getRoleBadge = (role) => {
    const styles = {
      'ADMIN': 'badge-error',
      'STEWARD': 'badge-info',
      'VIEWER': 'badge-gray'
    };
    return styles[role] || 'badge-gray';
  };

  const getRoleLabel = (role) => {
    const roleMap = {
      'ADMIN': t('common:roles.admin'),
      'STEWARD': t('common:roles.steward'),
      'VIEWER': t('common:roles.viewer')
    };
    return roleMap[role] || role;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 mt-1">{t('subtitle')}</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn-primary">
          <UserPlus className="h-4 w-4 mr-2" />
          {t('buttons.newUser')}
        </button>
      </div>

      {/* Users List */}
      <div className="card">
        <div className="table-container">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {t('common:empty.noRecords')}
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('table.username')}</th>
                  <th>{t('table.role')}</th>
                  <th>{t('table.status')}</th>
                  <th>{t('table.createdAt')}</th>
                  <th className="w-32">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id} className={!user.active ? 'opacity-50' : ''}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-primary-700 font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="font-medium">{user.username}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${user.active ? 'badge-success' : 'badge-gray'}`}>
                        {user.active ? t('common:status.ativo') : t('common:status.inativo')}
                      </span>
                    </td>
                    <td className="text-gray-500 text-sm">
                      {formatDate(user.created_at)}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                          title={t('buttons.edit')}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={`p-2 hover:bg-gray-100 rounded-lg ${
                            user.active ? 'text-red-500 hover:text-red-700' : 'text-green-500 hover:text-green-700'
                          }`}
                          title={user.active ? t('buttons.deactivate') : t('buttons.activate')}
                        >
                          {user.active ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Roles Info */}
      <div className="card">
        <div className="card-header">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('table.role')}
          </h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ROLES.map((role) => (
              <div key={role.value} className="p-4 bg-gray-50 rounded-lg">
                <span className={`badge ${getRoleBadge(role.value)}`}>{role.label}</span>
                <p className="text-sm text-gray-600 mt-2">{role.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4">
            <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />

            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingUser ? t('modal.editUser') : t('modal.newUser')}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">{t('form.username')}</label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="form-input w-full border border-gray-300 rounded-lg p-2"
                    placeholder={t('form.usernamePlaceholder')}
                    required
                    disabled={!!editingUser}
                    minLength={3}
                  />
                </div>

                <div>
                  <label className="form-label">
                    {t('form.password')} {editingUser && `(${t('form.passwordHelp')})`}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="form-input w-full border border-gray-300 rounded-lg p-2 pr-10"
                      placeholder={t('form.passwordPlaceholder')}
                      required={!editingUser}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="form-label">{t('form.role')}</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="form-input w-full border border-gray-300 rounded-lg p-2"
                  >
                    {ROLES.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="btn-secondary"
                  >
                    {t('common:buttons.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {t('common:buttons.processing')}
                      </>
                    ) : (
                      t('common:buttons.save')
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
