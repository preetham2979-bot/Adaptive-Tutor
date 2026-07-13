// Development: Vite proxies /api → localhost:3001
// Production: calls Render backend directly
const IS_DEV = window.location.hostname === 'localhost';
const BASE = IS_DEV
  ? '/api'
  : 'https://adaptive-tutor-api-3qqr.onrender.com/api';

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || 'Request failed');
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  auth: {
    register: (email, password, languages, dsaLanguage) =>
      request('POST', '/auth/register', { email, password, languages, dsaLanguage }),
    login:  (email, password) => request('POST', '/auth/login', { email, password }),
    logout: ()               => request('POST', '/auth/logout'),
    me:     ()               => request('GET',  '/auth/me'),
  },
  topics: {
    list:  ()   => request('GET', '/topics'),
    stats: (id) => request('GET', `/topics/${id}/stats`),
  },
  session: {
    next:         ()                             => request('GET',  '/session/next'),
    answer:       (topicId, selectedOptionIndex) => request('POST', '/session/answer', { topicId, selectedOptionIndex }),
    advanceLevel: (confirm)                      => request('POST', '/session/advance-level', { confirm }),
  },
  stats: {
    activity: () => request('GET', '/stats/activity'),
    recent:   () => request('GET', '/stats/recent'),
  },
};
