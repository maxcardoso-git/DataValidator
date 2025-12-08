import { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const { t } = useTranslation('common');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      // Validar token
      authService.me()
        .then((response) => {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        })
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await authService.login({ username, password });
      const { token, role, username: user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({ username: user, role }));
      setUser({ username: user, role });

      toast.success(t('auth.loginSuccess'));
      return true;
    } catch (error) {
      const message = error.response?.data?.error || t('errors.loginFailed');
      toast.error(message);
      return false;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setUser(null);
      toast.success(t('auth.logoutSuccess'));
    }
  };

  const hasPermission = (permission) => {
    if (!user) return false;

    const permissions = {
      ADMIN: ['UPLOAD_DATA', 'MANAGE_USERS', 'FULL_ACCESS', 'SEARCH_HCP', 'VALIDATE_HCP', 'COMPARE_HCP', 'EXPORT_HCP', 'VIEW_HCP'],
      STEWARD: ['SEARCH_HCP', 'VALIDATE_HCP', 'COMPARE_HCP', 'EXPORT_HCP', 'VIEW_HCP'],
      VIEWER: ['SEARCH_HCP', 'VIEW_HCP']
    };

    const userPermissions = permissions[user.role] || [];
    return userPermissions.includes(permission) || userPermissions.includes('FULL_ACCESS');
  };

  const hasRole = (...roles) => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      hasPermission,
      hasRole,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
