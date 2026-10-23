import { companyApi, COMPANY_TOKEN_KEY, COMPANY_NAME_KEY } from './companyClient';

// ─────────────────────────────────────────────────────────────────────
// Кабинет компании: вход, профиль, каталог тарифов, слоты, сотрудники,
// статистика.
//
// Ключевое отличие от того, что мы заложили раньше: промокодов нет.
// Компания заводит сотрудника сама — с почтой и паролем — и передаёт
// ему эти данные. Сотрудник входит в обычное приложение через
// POST /auth/login, подтверждение почты ему не нужно.
//
// Тариф назначается по plan_id из каталога, НЕ по уровню доступа.
// Слоты при этом списываются по access_lvl выбранного тарифа: несколько
// тарифов одного уровня делят одну кучу слотов.
// ─────────────────────────────────────────────────────────────────────

// ─── Вход ────────────────────────────────────────────────────────────

// Форма, а не JSON: эндпоинт построен на OAuth2PasswordRequestForm.
// Поле называется username, но по смыслу это ПОЧТА компании — не
// название и не логин.
export async function loginCompany({ email, password }) {
  const res = await fetch('/companies/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(describeLoginError(res.status, text));
    err.status = res.status;
    throw err;
  }

  const data = await res.json();

  if (data?.access_token) {
    localStorage.setItem(COMPANY_TOKEN_KEY, data.access_token);
  }

  return data;
}

export function logoutCompany() {
  localStorage.removeItem(COMPANY_TOKEN_KEY);
  localStorage.removeItem(COMPANY_NAME_KEY);
}

export function hasCompanySession() {
  return !!localStorage.getItem(COMPANY_TOKEN_KEY);
}

export function getStoredCompanyName() {
  return localStorage.getItem(COMPANY_NAME_KEY) || '';
}

function describeLoginError(status, text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — ниже по коду
  }

  if (status === 401) return 'Неверный логин или пароль.';
  // 403 здесь означает выключенную компанию, а не отсутствие прав.
  if (status === 403) {
    return 'Доступ компании приостановлен. Обратитесь к вашему менеджеру.';
  }
  if (status === 404) {
    return 'Вход для компаний ещё не подключён на сервере.';
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер не отвечает. Попробуйте через минуту.';
  }
  if (status >= 500) return 'Ошибка на сервере. Мы уже знаем о проблеме.';

  return `Не удалось войти (код ${status}).`;
}

// ─── Профиль ─────────────────────────────────────────────────────────

export async function getCompanyProfile() {
  const data = await companyApi.get('/companies/me');

  if (data?.name) localStorage.setItem(COMPANY_NAME_KEY, data.name);

  return data;
}

export function changeCompanyPassword({ oldPassword, newPassword }) {
  return companyApi.post('/companies/me/password', {
    old_password: oldPassword,
    new_password: newPassword,
  });
}

// ─── Каталог тарифов и слоты ─────────────────────────────────────────

export async function getPlans() {
  const data = await companyApi.get('/companies/plans');
  return Array.isArray(data) ? data : [];
}

export function getSlots() {
  return companyApi.get('/companies/slots');
}

// ─── Сотрудники ──────────────────────────────────────────────────────

export async function getStaff() {
  const data = await companyApi.get('/companies/staff');
  return Array.isArray(data) ? data : (data?.items ?? []);
}

export function getStaffMember(userId) {
  return companyApi.get(`/companies/staff/${userId}`);
}

// plan_id необязателен: сотрудника можно завести без тарифа и назначить
// его позже. Такой человек занимает место в staff_limit, но не занимает
// тарифный слот — это разные счётчики.
export function createStaff({ email, username, password, phoneNumber, planId }) {
  return companyApi.post('/companies/staff', {
    email,
    username,
    password,
    phone_number: phoneNumber ? String(phoneNumber).replace(/[^\d+]/g, '') : null,
    ...(planId ? { plan_id: Number(planId) } : {}),
  });
}

export function updateStaff(userId, { username, phoneNumber, planId }) {
  const body = {};

  if (username !== undefined) body.username = username;
  if (phoneNumber !== undefined) {
    body.phone_number = phoneNumber ? String(phoneNumber).replace(/[^\d+]/g, '') : null;
  }
  if (planId !== undefined) body.plan_id = planId === null ? null : Number(planId);

  return companyApi.patch(`/companies/staff/${userId}`, body);
}

export function resetStaffPassword(userId, newPassword) {
  return companyApi.post(`/companies/staff/${userId}/password`, {
    new_password: newPassword,
  });
}

// Удаление полное: аккаунт, голоса и генерации сотрудника. Слот
// освобождается. Восстановить нельзя — предупреждаем в интерфейсе.
export function deleteStaff(userId) {
  return companyApi.delete(`/companies/staff/${userId}`);
}

// ─── Статистика ──────────────────────────────────────────────────────

export function getCompanyStats({ dateFrom, dateTo } = {}) {
  const params = new URLSearchParams();

  if (dateFrom) params.set('date_from', dateFrom);
  if (dateTo) params.set('date_to', dateTo);

  const qs = params.toString();
  return companyApi.get(`/companies/stats${qs ? `?${qs}` : ''}`);
}

// ─── Разбор слотов для интерфейса ────────────────────────────────────

// Ключи уровней в JSON приходят СТРОКАМИ ("1", "2", "3"). Числовой
// индекс по ним молча даёт undefined, поэтому приводим один раз здесь,
// а не в каждом компоненте.
export function readSlotLevel(slots, accessLvl) {
  const level = slots?.tariffs?.[String(accessLvl)];

  if (!level) return { limit: 0, used: 0, free: 0, plans: [] };

  const limit = level.limit ?? 0;
  const used = level.used ?? 0;

  return { limit, used, free: Math.max(0, limit - used), plans: level.plans ?? [] };
}

/** Можно ли выдать ещё один тариф этого уровня. */
export function hasFreeSlot(slots, accessLvl) {
  return readSlotLevel(slots, accessLvl).free > 0;
}

/** Остались ли места под нового сотрудника вообще. */
export function hasFreeStaffSeat(slots) {
  if (!slots) return true;
  return (slots.staff_used ?? 0) < (slots.staff_limit ?? 0);
}
