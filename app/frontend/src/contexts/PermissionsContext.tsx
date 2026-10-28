'use client';

import React, { createContext, useContext, ReactNode } from 'react';

type Permission = 'view' | 'create' | 'edit' | 'delete';
type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'PARTNER' | 'MECHANIC' | 'CLIENT' | 'QC';

interface PermissionMatrix {
  [module: string]: {
    [key in Permission]?: boolean;
  };
}

// Role-based permission matrix
const ROLE_PERMISSIONS: Record<UserRole, PermissionMatrix> = {
  SUPER_ADMIN: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    units: { view: true, create: true, edit: true, delete: true },
    operational: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: true },
    masterData: { view: true, create: true, edit: true, delete: true },
    partners: { view: true, create: true, edit: true, delete: true },
    audit: { view: true, create: true, edit: true, delete: true },
  },
  ADMIN: {
    dashboard: { view: true, create: true, edit: true, delete: true },
    units: { view: true, create: true, edit: true, delete: true },
    operational: { view: true, create: true, edit: true, delete: true },
    reports: { view: true, create: true, edit: true, delete: true },
    users: { view: true, create: true, edit: true, delete: false },
    masterData: { view: true, create: true, edit: true, delete: true },
    partners: { view: true, create: true, edit: true, delete: true },
    audit: { view: true, create: false, edit: false, delete: false },
  },
  PARTNER: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    units: { view: true, create: false, edit: false, delete: false },
    operational: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: true, edit: true, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    masterData: { view: true, create: false, edit: false, delete: false },
    partners: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
  },
  MECHANIC: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    units: { view: true, create: false, edit: false, delete: false },
    operational: { view: true, create: true, edit: true, delete: false },
    reports: { view: true, create: true, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    masterData: { view: true, create: false, edit: false, delete: false },
    partners: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
  },
  CLIENT: {
    dashboard: { view: true, create: false, edit: false, delete: false },
    units: { view: true, create: false, edit: false, delete: false },
    operational: { view: true, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: false, delete: false },
    users: { view: false, create: false, edit: false, delete: false },
    masterData: { view: false, create: false, edit: false, delete: false },
    partners: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
  },
  QC: {
    dashboard: { view: false, create: false, edit: false, delete: false }, // QC tidak akses dashboard umum
    units: { view: true, create: false, edit: false, delete: false }, // QC hanya view units, tidak bisa registrasi
    operational: { view: false, create: false, edit: false, delete: false },
    reports: { view: true, create: false, edit: true, delete: false }, // QC bisa edit reports untuk QC notes
    users: { view: false, create: false, edit: false, delete: false },
    masterData: { view: false, create: false, edit: false, delete: false },
    partners: { view: false, create: false, edit: false, delete: false },
    audit: { view: false, create: false, edit: false, delete: false },
  },
};

interface PermissionsContextValue {
  can: (module: string, permission: Permission) => boolean;
  canAny: (module: string, permissions: Permission[]) => boolean;
  canAll: (module: string, permissions: Permission[]) => boolean;
  role: UserRole | null;
  isQC: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

const PermissionsContext = createContext<PermissionsContextValue | undefined>(undefined);

export function PermissionsProvider({
  children,
  userRole,
}: {
  children: ReactNode;
  userRole: string | null;
}) {
  const role = userRole as UserRole | null;
  const [dynamicPermissions, setDynamicPermissions] = React.useState<Record<string, PermissionMatrix> | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('app_role_permissions');
        if (cached) return JSON.parse(cached);
      } catch { /* ignore */ }
    }
    return null;
  });

  React.useEffect(() => {
    const handleUpdate = () => {
      try {
        const cached = localStorage.getItem('app_role_permissions');
        if (cached) setDynamicPermissions(JSON.parse(cached));
      } catch { /* ignore */ }
    };
    window.addEventListener('role_permissions_updated', handleUpdate);
    return () => window.removeEventListener('role_permissions_updated', handleUpdate);
  }, []);

  const permissions = role 
    ? (dynamicPermissions?.[role] || ROLE_PERMISSIONS[role]) 
    : null;

  const can = (module: string, permission: Permission): boolean => {
    if (!permissions || !permissions[module]) return false;
    return permissions[module][permission] === true;
  };

  const canAny = (module: string, perms: Permission[]): boolean => {
    return perms.some((perm) => can(module, perm));
  };

  const canAll = (module: string, perms: Permission[]): boolean => {
    return perms.every((perm) => can(module, perm));
  };

  const value: PermissionsContextValue = {
    can,
    canAny,
    canAll,
    role,
    isQC: role === 'QC',
    isAdmin: role === 'ADMIN',
    isSuperAdmin: role === 'SUPER_ADMIN',
  };

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within a PermissionsProvider');
  }
  return context;
}
