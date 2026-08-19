import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT and session token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('aq_token');
  const sessionToken = localStorage.getItem('aq_session');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (sessionToken) config.headers['X-Session-Token'] = sessionToken;
  return config;
});

// Handle session revoked / game expired globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const code = error.response?.data?.code;
    if (code === 'SESSION_REVOKED') {
      localStorage.removeItem('aq_token');
      localStorage.removeItem('aq_session');
      localStorage.removeItem('aq_user');
      window.location.href = '/login?reason=session_revoked';
    }
    return Promise.reject(error);
  }
);

export default api;
