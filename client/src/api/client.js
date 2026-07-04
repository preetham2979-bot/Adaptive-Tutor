const BASE = '/api';

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
    register: (email, password, preferredLanguage) =>
      request('POST', '/auth/register', { email, password, preferredLanguage }),
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
