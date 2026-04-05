import React from 'react';
import { useAuth } from '../context/AuthContext';

const PermissionGuard = ({ moduleKey, action, children, fallback = null }) => {
  const { hasPermission } = useAuth();

  if (hasPermission(moduleKey, action)) {
    return <>{children}</>;
  }

  return fallback;
};

export default PermissionGuard;
