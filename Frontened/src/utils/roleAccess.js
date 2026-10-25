export const ROLE_PERMISSIONS = {
  admin: [
    '/dashboard',
    '/employees',
    '/attendance',
    '/leaves',
    '/payroll',
    '/org-setup',
    '/announcements',
    '/audit-logs',
    '/profile',
    '/change-password',
  ],
  hr: [
    '/dashboard',
    '/employees',
    '/attendance',
    '/leaves',
    '/payroll',
    '/announcements',
    '/profile',
    '/change-password',
  ],
  employee: [
    '/dashboard',
    '/attendance',
    '/leaves',
    '/payroll',
    '/announcements',
    '/profile',
    '/change-password',
  ],
};

export function canAccessRoute(role, pathname) {
  if (!role || !pathname) return false;
  const allowedRoutes = ROLE_PERMISSIONS[role] || [];
  return allowedRoutes.includes(pathname);
}
