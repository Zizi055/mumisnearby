import { adminApi } from './adminClient';

// Авторизация админки. Вход ОДИН — POST /auth/admin/login (form-urlencoded,
// как обычный /auth/login), но это ДРУГАЯ таблица учётных записей на бэке,
// не пользователи.
//
// Отдельного входа для супер-админа не существует: маршрутов
// /auth/super_admin/login, /create и /me на бэке нет (проверено по
// openapi.json на сервере). Права супер-админа определяются по самому
// токену: если аккаунт ими обладает, GET /auth/super_admin/admins ответит
// списком, если нет — 403. Раньше фронт предлагал галочку «Я супер-
// администратор» и слал запрос на несуществующий адрес — вход просто
// падал с 404.

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

// Есть ли у текущего токена права супер-админа. Признака в AdminOut нет,
// поэтому проверяем делом: пробуем получить список администраторов.
export async function checkSuperAdmin() {
  try {
    await adminApi.get('/auth/super_admin/admins');
    localStorage.setItem('adminIsSuper', '1');
    return true;
  } catch {
    localStorage.removeItem('adminIsSuper');
    return false;
  }
}

export function isStoredSuperAdmin() {
  return localStorage.getItem('adminIsSuper') === '1';
}

export async function loginAdmin({ username, password }) {
  const data = await loginRequest('/auth/admin/login', { username, password });
  storeSession(data, 'admin', username);
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

// GET /auth/admin/me — единственный маршрут профиля админа.
// /auth/super_admin/me на бэке не существует.
export async function getAdminMe() {
  return adminApi.get('/auth/admin/me');
}

// GET /auth/super_admin/admins — список всех администраторов, только для
// супер-админа. Отдаёт AdminOut[]: {id, username, is_admin, created_at}.
export async function getAdmins() {
  return adminApi.get('/auth/super_admin/admins');
}

// ─────────────────────────────────────────────────────────────────────
// ОТСУТСТВУЕТ НА БЭКЕ: POST /auth/super_admin/create.
// Создание администратора из интерфейса невозможно — маршрута нет
// (проверено по openapi.json). Функция удалена, форма на странице
// «Админы» скрыта. Вернуть, когда бэк добавит эндпоинт.
// ─────────────────────────────────────────────────────────────────────

function parseErrorDetail(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — вернём null, вызывающий код подставит текст как есть
  }
  return null;
}
