const API_BASE = '';

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

function extractError(res, fallback) {
  return res.text().then(text => {
    try {
      const data = JSON.parse(text);
      if (typeof data.detail === 'string') return data.detail;
      if (typeof data.detail === 'object') return JSON.stringify(data.detail);
      if (data.message) return data.message;
      return fallback;
    } catch {
      return text || fallback;
    }
  });
}

async function apiPost(endpoint, body) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const msg = await extractError(res, `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return res.json();
}

async function apiGet(endpoint) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    const msg = await extractError(res, `Request failed (${res.status})`);
    throw new Error(msg);
  }
  return res.json();
}

async function apiUpload(endpoint, file) {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  if (!res.ok) {
    const msg = await extractError(res, `Upload failed (${res.status})`);
    throw new Error(msg);
  }
  return res.json();
}

export const register = (data) => apiPost('/api/auth/register', data);
export const login = (data) => apiPost('/api/auth/login', data);
export const getMe = () => apiGet('/api/auth/me');
export const uploadResume = (file) => apiUpload('/api/upload-resume', file);
export const analyze = (data) => apiPost('/api/analyze', data);
export const rewriteResume = (data) => apiPost('/api/rewrite-resume', data);
export const mentorChat = (data) => apiPost('/api/mentor-chat', data);
export const getHistory = () => apiGet('/api/history');
export const getAnalysisDetail = (id) => apiGet(`/api/history/${id}`);
export const healthCheck = () => apiGet('/api/health');
export const updateProgress = (sessionId, data) => apiPost(`/api/progress/${sessionId}`, data);
export const getProgress = (sessionId) => apiGet(`/api/progress/${sessionId}`);
export const generateResume = (data) => apiPost('/api/generate-resume', data);
export const getLatestAnalysis = () => apiGet('/api/latest-analysis');
