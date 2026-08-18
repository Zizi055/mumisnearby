import { adminApi } from './adminClient';

// Авторизация админки — /auth/admin/login и /auth/super_admin/login,
// оба form-urlencoded (как обычный /auth/login). Это ДРУГАЯ таблица
// учётных записей, не пользователи, и с 14.08.2026 токены подписываются
// отдельным ключом (ADMIN_SECRET_KEY) и несут role: admin / super_admin.
//
// AdminOut одинаковый для обеих ролей и явного признака «это супер-админ»
// не содержит, поэтому роль запоминаем по тому, через какой эндпоинт был
// вход, и дополнительно проверяем делом — запросом к
// GET /auth/super_admin/admins.
//
// ВАЖНО: роли НЕ наследуются. Суперадминский токен принимают только
// /auth/super_admin/*; на /admin/* он даёт 401 — там нужен токен
// администратора. Это подтверждено на боевом сервере.

async function loginRequest(path, { username, password }) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(describeAuthError(res.status, text));
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

// Роль определяется тем, через какой эндпоинт был вход, и хранится
// рядом с токеном. Раньше здесь был запрос к /auth/super_admin/admins
// «на пробу» — у обычного админа он всегда отвечал 401 и мусорил в
// консоли красной строкой при каждом входе.
export function isStoredSuperAdmin() {
  return getStoredAdminRole() === 'super_admin';
}

export async function loginAdmin({ username, password }) {
  const data = await loginRequest('/auth/admin/login', { username, password });
  storeSession(data, 'admin', username);
  return data;
}

export async function loginSuperAdmin({ username, password }) {
  const data = await loginRequest('/auth/super_admin/login', { username, password });
  storeSession(data, 'super_admin', username);
  localStorage.setItem('adminIsSuper', '1');
  return data;
}

export function logoutAdmin() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRole');
  localStorage.removeItem('adminUsername');
  localStorage.removeItem('adminIsSuper');
}

export function getStoredAdminRole() {
  return localStorage.getItem('adminRole');
}

// GET /auth/admin/me или /auth/super_admin/me — зависит от того, через
// какой эндпоинт логинились. Обе отдают одинаковый AdminOut.
export async function getAdminMe() {
  const path =
    getStoredAdminRole() === 'super_admin'
      ? '/auth/super_admin/me'
      : '/auth/admin/me';
  return adminApi.get(path);
}

// GET /auth/super_admin/admins — список всех администраторов, только для
// супер-админа. Отдаёт AdminOut[]: {id, username, is_admin, created_at}.
export async function getAdmins() {
  return adminApi.get('/auth/super_admin/admins');
}

// POST /auth/super_admin/create — доступно только супер-админу
// (разграничение на бэке по роли в токене). Тело: { username, password },
// ответ — AdminOut созданного администратора.
export async function createAdmin({ username, password }) {
  return adminApi.post('/auth/super_admin/create', { username, password });
}

// Человеческий текст вместо сырого ответа. При 502 nginx отдаёт целую
// HTML-страницу «Bad Gateway» — раньше она вываливалась в форму входа
// как есть, вместе с тегами и комментариями для старых браузеров.
function describeAuthError(status, text) {
  const detail = parseErrorDetail(text);
  if (detail) return detail;

  if (status === 401) return 'Неверный логин или пароль.';
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер не отвечает. Попробуйте через минуту — если не поможет, нужно смотреть логи бэкенда.';
  }
  if (status >= 500) return 'Ошибка на сервере. Мы уже знаем о проблеме.';

  return `Не удалось войти (код ${status}).`;
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
