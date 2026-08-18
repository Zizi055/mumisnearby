import { adminApi } from './adminClient';

// Авторизация админки — /auth/admin/login и /auth/super_admin/login,
// оба form-urlencoded (как обычный /auth/login). Это ДРУГАЯ таблица
// учётных записей, не пользователи, и с 14.08.2026 токены подписываются
// отдельным ключом (ADMIN_SECRET_KEY) и несут role: admin / super_admin.
//
// AdminOut одинаковый для обеих ролей и явного признака «это супер-админ»
// не содержит, поэтому роль запоминаем по тому, через какой эндпоинт был
// вход, и дополнительно проверяем делом — запросом к
// GET /auth/super_admin/admins (см. checkSuperAdmin).

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

export async function loginSuperAdmin({ username, password }) {
  const data = await loginRequest('/auth/super_admin/login', { username, password });
  storeSession(data, 'super_admin', username);
  localStorage.setItem('adminIsSuper', '1');
  return data;
}

// Единый вход в панель.
//
// На бэке две независимые таблицы учёток — admins и super_admin — и два
// эндпоинта. Раньше выбор был на человеке: галочка «Я супер-администратор».
// Её постоянно забывали поставить, запрос уходил в admins, там логина нет,
// и 401 выглядел как «неверный пароль», хотя учётка нормальная.
//
// Теперь пробуем обычного администратора, а на 401 — суперадмина. Лишний
// запрос только в случае суперадминского входа, зато ошибиться нельзя.
export async function loginToAdminPanel({ username, password }) {
  try {
    return await loginAdmin({ username, password });
  } catch (adminError) {
    try {
      return await loginSuperAdmin({ username, password });
    } catch {
      // Возвращаем ошибку первой попытки: она и есть «неверный логин
      // или пароль», текст второй ничего не добавляет.
      throw adminError;
    }
  }
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

function parseErrorDetail(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — вернём null, вызывающий код подставит текст как есть
  }
  return null;
}
