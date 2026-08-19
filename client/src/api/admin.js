import api from './axios';

export const adminLogin = (data) => api.post('/admin/login', data);
export const getStats = () => api.get('/admin/stats');
export const getPlayers = (params) => api.get('/admin/players', { params });
export const getAuditLogs = (params) => api.get('/admin/audit-logs', { params });
export const getFullLeaderboard = () => api.get('/admin/leaderboard');
export const resetPlayer = (id) => api.post(`/admin/player/${id}/reset`);
export const updateQuestion = (id, data) => api.put(`/admin/questions/${id}`, data);
export const getQuestions = (params) => api.get('/admin/questions', { params });
export const exportCSV = () =>
  api.get('/admin/leaderboard?format=csv', { responseType: 'blob' });
