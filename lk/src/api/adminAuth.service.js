import { adminApi } from './adminClient';

// Авторизация админки — /auth/admin/login и /auth/super_admin/login,
// оба ждут form-urlencoded (как обычный /auth/login), но это ДРУГАЯ
// таблица учётных записей на бэке, не пользователи. AdminOut одинаковый
// для обеих ролей ({id, username, is_admin, created_at}) — сам бэк не
// возвращает явный признак "это супер-админ", поэтому роль запоминаем
// на фронте по тому, через какой эндпоинт был вход.

async function loginRequest(path, { username, password }) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text) || `HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

function storeSession(data, role, username) {
  if (data.access_token) {
    localStorage.setItem('adminToken', data.access_token);
    localStorage.setItem('adminRole', role);
    localStorage.setItem('adminUsername', username);
  }
}

export async function loginAdmin({ username, password }) {
  const data = await loginRequest('/auth/admin/login', { username, password });
  storeSession(data, 'admin', username);
  return data;
}

export async function loginSuperAdmin({ username, password }) {
  const data = await loginRequest('/auth/super_admin/login', { username, password });
  storeSession(data, 'super_admin', username);
  return data;
}

export function logoutAdmin() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRole');
  localStorage.removeItem('adminUsername');
}

export function getStoredAdminRole() {
  return localStorage.getItem('adminRole');
}

// GET /auth/admin/me или /auth/super_admin/me — зависит от того, как
// логинились. Обе отдают одинаковый AdminOut.
export async function getAdminMe() {
  const role = getStoredAdminRole();
  const path = role === 'super_admin' ? '/auth/super_admin/me' : '/auth/admin/me';
  return adminApi.get(path);
}

// GET /auth/super_admin/admins — список всех администраторов, только для
// супер-админа. Отдаёт AdminOut[]: {id, username, is_admin, created_at}.
export async function getAdmins() {
  return adminApi.get('/auth/super_admin/admins');
}

// POST /auth/super_admin/create — доступно только супер-админу (проверяет
// бэк по токену в запросе). Тело: { username, password }.
export async function createAdmin({ username, password }) {
  return adminApi.post('/auth/super_admin/create', { username, password });
}

function parseErrorDetail(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — вернём null, вызывающий код подставит текст как есть
  }
  return null;
}
