const BASE_URL = import.meta.env.VITE_API_URL || '';

// Отдельный HTTP-клиент для админки. /admin/* и /auth/*_admin/* эндпоинты
// проверяют СВОЙ токен (выданный через /auth/admin/login или
// /auth/admin/login), а не пользовательский из client.js — это два
// разных набора учётных данных на бэке. Поэтому храним токен отдельно
// (localStorage.adminToken), чтобы не конфликтовать с сессией обычного
// пользователя в том же браузере.

// Админские токены с 14.08.2026 подписываются отдельным ключом
// (ADMIN_SECRET_KEY) и несут role: admin / super_admin. Все выданные
// до выката — невалидны, нужен повторный вход.
function handleAdminUnauthorized() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRole');
  localStorage.removeItem('adminUsername');
  localStorage.removeItem('adminIsSuper');

  if (!window.location.hash.includes('/admin/login')) {
    window.location.hash = '/admin/login';
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem('adminToken');

  const headers = {
    ...(options.headers || {}),
  };

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

  if (res.status === 401) {
    handleAdminUnauthorized();
    throw new Error('Сессия администратора истекла. Войдите снова.');
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

export const adminApi = {
  get: (path) =>
    request(path),

  post: (path, body, options = {}) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
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
