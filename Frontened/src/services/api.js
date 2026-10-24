// Base API configuration
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Universal fetch wrapper that attaches Authorization token automatically
 */
export async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.message || `Request failed with status ${response.status}`);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

// 1. Setup API
export const setupService = {
  getStatus: () => apiRequest('/setup/status'),
  init: (payload) => apiRequest('/setup/init', { method: 'POST', body: JSON.stringify(payload) }),
  reset: () => apiRequest('/setup/reset', { method: 'POST' }),
};

// 2. Auth API
export const authService = {
  register: (payload) => apiRequest('/auth/register', { method: 'POST', body: JSON.stringify(payload) }),
  login: (email, password) => apiRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => apiRequest('/auth/me'),
  changePassword: (payload) => apiRequest('/auth/change-password', { method: 'POST', body: JSON.stringify(payload) }),
  createHr: (payload) => apiRequest('/auth/create-hr', { method: 'POST', body: JSON.stringify(payload) }),
  listUsers: () => apiRequest('/auth/users'),
  resetPassword: (payload) => apiRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify(payload) }),
  toggleStatus: (id) => apiRequest(`/auth/toggle-status/${id}`, { method: 'PATCH' }),
};

// 3. Organization Setup API
export const orgService = {
  getSettings: () => apiRequest('/org/settings'),
  updateSettings: (payload) => apiRequest('/org/settings', { method: 'PUT', body: JSON.stringify(payload) }),
  getDepartments: () => apiRequest('/org/departments'),
  createDepartment: (payload) => apiRequest('/org/departments', { method: 'POST', body: JSON.stringify(payload) }),
  deleteDepartment: (id) => apiRequest(`/org/departments/${id}`, { method: 'DELETE' }),
  getDesignations: () => apiRequest('/org/designations'),
  createDesignation: (payload) => apiRequest('/org/designations', { method: 'POST', body: JSON.stringify(payload) }),
  getLeaveTypes: () => apiRequest('/org/leave-types'),
  createLeaveType: (payload) => apiRequest('/org/leave-types', { method: 'POST', body: JSON.stringify(payload) }),
  getHolidays: () => apiRequest('/org/holidays'),
  createHoliday: (payload) => apiRequest('/org/holidays', { method: 'POST', body: JSON.stringify(payload) }),
  deleteHoliday: (id) => apiRequest(`/org/holidays/${id}`, { method: 'DELETE' }),
};

// 4. Employees API
export const employeeService = {
  getAll: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/employees?${q}`);
  },
  get360: (id) => apiRequest(`/employees/${id}/360`),
  register: (payload) => apiRequest('/employees', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => apiRequest(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  dryRunCsv: (rows) => apiRequest('/employees/csv/dry-run', { method: 'POST', body: JSON.stringify({ rows }) }),
  commitCsv: (rows) => apiRequest('/employees/csv/commit', { method: 'POST', body: JSON.stringify({ rows }) }),
  exportCsvUrl: () => `${API_BASE_URL}/employees/export/csv`,
};

// 5. Attendance API
export const attendanceService = {
  checkIn: (payload = {}) => apiRequest('/attendance/check-in', { method: 'POST', body: JSON.stringify(payload) }),
  checkOut: () => apiRequest('/attendance/check-out', { method: 'POST' }),
  getToday: () => apiRequest('/attendance/today'),
  getDailyBoard: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/attendance/board?${q}`);
  },
  getHistory: (employeeId = '', month = '') => {
    const path = employeeId ? `/attendance/history/${employeeId}` : '/attendance/history';
    const q = month ? `?month=${month}` : '';
    return apiRequest(`${path}${q}`);
  },
  requestCorrection: (payload) => apiRequest('/attendance/correction/request', { method: 'POST', body: JSON.stringify(payload) }),
  reviewCorrection: (id, payload) => apiRequest(`/attendance/correction/review/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
};

// 6. Leave API
export const leaveService = {
  apply: (payload) => apiRequest('/leaves/apply', { method: 'POST', body: JSON.stringify(payload) }),
  getMy: () => apiRequest('/leaves/my'),
  getPending: () => apiRequest('/leaves/pending'),
  review: (id, payload) => apiRequest(`/leaves/review/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  cancel: (id) => apiRequest(`/leaves/cancel/${id}`, { method: 'PATCH' }),
};

// 7. Payroll API
export const payrollService = {
  runDraft: (month) => apiRequest('/payroll/run', { method: 'POST', body: JSON.stringify({ month }) }),
  getRuns: () => apiRequest('/payroll/runs'),
  getRunDetails: (id) => apiRequest(`/payroll/runs/${id}`),
  finalize: (id) => apiRequest(`/payroll/runs/${id}/finalize`, { method: 'PATCH' }),
  getPayslip: (id) => apiRequest(`/payroll/payslips/${id}`),
  getMyPayslips: () => apiRequest('/payroll/my-payslips'),
};

// 8. Dashboard API
export const dashboardService = {
  getAdmin: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/dashboards/admin?${q}`);
  },
  getHr: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/dashboards/hr?${q}`);
  },
  getEmployee: () => apiRequest('/dashboards/employee'),
};

// 9. AI Assistant API
export const aiService = {
  chat: (prompt) => apiRequest('/ai/chat', { method: 'POST', body: JSON.stringify({ prompt }) }),
  summarize: (kpiData) => apiRequest('/ai/summarize', { method: 'POST', body: JSON.stringify({ kpiData }) }),
  smartLeave: (text) => apiRequest('/ai/smart-leave', { method: 'POST', body: JSON.stringify({ text }) }),
};

// 10. Comms & Audit API
export const commsService = {
  getAnnouncements: () => apiRequest('/comms/announcements'),
  createAnnouncement: (payload) => apiRequest('/comms/announcements', { method: 'POST', body: JSON.stringify(payload) }),
  deleteAnnouncement: (id) => apiRequest(`/comms/announcements/${id}`, { method: 'DELETE' }),
  getNotifications: () => apiRequest('/comms/notifications'),
  markNotificationRead: (id) => apiRequest(`/comms/notifications/read/${id}`, { method: 'PATCH' }),
  markAllNotificationsRead: () => apiRequest('/comms/notifications/read-all', { method: 'PATCH' }),
  getAuditLogs: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return apiRequest(`/comms/audit-logs?${q}`);
  },
};
