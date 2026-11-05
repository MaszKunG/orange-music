const rawBase = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_BASE = `${rawBase.replace(/\/$/, '')}/api`;

export function getFullMediaUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const base = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');
  return `${base}${path.startsWith('/') ? path : '/' + path}`;
}

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('orange_music_token');
  const headers = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || `เกิดข้อผิดพลาดในการเชื่อมต่อ (${response.status})`);
  }

  return data;
}

export const api = {
  get: (url) => request(url, { method: 'GET' }),
  post: (url, body) => request(url, { 
    method: 'POST', 
    body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined) 
  }),
  put: (url, body) => request(url, { 
    method: 'PUT', 
    body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined) 
  }),
  patch: (url, body) => request(url, { 
    method: 'PATCH', 
    body: body instanceof FormData ? body : (body !== undefined ? JSON.stringify(body) : undefined) 
  }),
  delete: (url) => request(url, { method: 'DELETE' }),
};
