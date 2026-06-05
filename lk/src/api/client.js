const BASE_URL = import.meta.env.VITE_API_URL || '';

// ── Глобальный обработчик истёкшего токена ───────────────────────────────────
function handleUnauthorized() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');

  // Перенаправляем на страницу входа (HashRouter)
  if (!window.location.hash.includes('/auth')) {
    window.location.hash = '/auth';
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
  };

  // Content-Type не ставим для FormData — браузер сам добавит boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  // Токен истёк или невалиден — выходим и редиректим на логин
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  get: (path) =>
    request(path),

  post: (path, body, options = {}) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  put: (path, body) =>
    request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  del: (path) =>
    request(path, {
      method: 'DELETE',
    }),
};
