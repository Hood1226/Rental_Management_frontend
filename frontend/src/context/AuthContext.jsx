import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) loadUser();
    else setLoading(false);
  }, []);

  const loadUser = async () => {
    try {
      const userResponse = await api.get('/auth/me');
      // Support both raw body and ApiResponse wrapper { data: ... }
      const userData = userResponse.data?.data ?? userResponse.data;
      if (!userData) throw new Error('No user data');
      setUser(userData);

      // Fetch permissions for the user's role (roleId from CurrentUserResponse)
      const roleId = userData.roleId;
      if (roleId != null) {
        const permissionsResponse = await api.get(`/roles/${roleId}/permissions`);
        const permData = permissionsResponse.data?.data ?? permissionsResponse.data;
        setPermissions(Array.isArray(permData) ? permData : []);
      } else {
        setPermissions([]);
      }
    } catch (error) {
      console.error('Failed to load user', error);
      setUser(null);
      setPermissions([]);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    const response = await api.post('/auth/login', { emailOrMobile: identifier, password });
    // Token may be in cookie only; keep a flag for client-side auth state
    const token = response.data?.token ?? response.data?.data?.token;
    if (token) localStorage.setItem('token', token);
    else localStorage.setItem('token', 'cookie');
    await loadUser();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setPermissions([]);
  };

  const hasPermission = (moduleKey, action) => {
    if (!user) return false;
    // Admin override when backend does not expose role permissions
    if (user.roleName === 'ADMIN') return true;
    const permission = permissions.find(p => p.moduleKey === moduleKey || p.moduleName === moduleKey);
    if (!permission) return false;
    switch (action.toUpperCase()) {
      case 'CREATE': return permission.canCreate;
      case 'READ': return permission.canRead;
      case 'UPDATE': return permission.canUpdate;
      case 'DELETE': return permission.canDelete;
      default: return false;
    }
  };

  return (
    <AuthContext.Provider value={{ user, permissions, login, logout, hasPermission, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
