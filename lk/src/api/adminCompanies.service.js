import { adminApi } from './adminClient';

// ─────────────────────────────────────────────────────────────────────
// Админка юрлиц — /admin/companies/*. Токен из POST /auth/admin/login,
// подходит и обычному админу, и супер-админу.
//
// Компании заводит ТОЛЬКО администратор: самостоятельной регистрации на
// сайте нет. Поэтому на лендинге кнопка ведёт в заявку, а не в форму.
//
// Тариф компании — это не один план, а ПАКЕТ СЛОТОВ по уровням:
// сколько сотрудников можно завести на уровень 1, 2 и 3. Сумма
// счётчиков обязана равняться staff_limit, иначе бэк отвечает 400.
// ─────────────────────────────────────────────────────────────────────

export async function getPlansCatalog() {
  const data = await adminApi.get('/admin/companies/plans');
  return Array.isArray(data) ? data : [];
}

export async function getCompanies({ query = '', skip = 0, limit = 50 } = {}) {
  const params = new URLSearchParams({
    skip: String(skip),
    limit: String(limit),
  });

  const q = query.trim();
  if (q) params.set('q', q);

  const data = await adminApi.get(`/admin/companies?${params}`);

  return Array.isArray(data) ? data : (data?.items ?? []);
}

export function getCompany(companyId) {
  return adminApi.get(`/admin/companies/${companyId}`);
}

export function createCompany(payload) {
  return adminApi.post('/admin/companies', buildCompanyBody(payload));
}

// Пакет слотов меняется только целиком: бэк требует все четыре поля
// сразу, иначе 400. Поэтому собираем их вместе, а не по одному.
export function updateCompany(companyId, payload) {
  return adminApi.patch(`/admin/companies/${companyId}`, buildCompanyBody(payload, true));
}

// Мягкое выключение: is_active=false, данные остаются. Сотрудники сразу
// получают 403 в приложении. Включается обратно через PATCH.
export function deactivateCompany(companyId) {
  return adminApi.del(`/admin/companies/${companyId}`);
}

export function setCompanyActive(companyId, isActive) {
  return adminApi.patch(`/admin/companies/${companyId}`, { is_active: isActive });
}

export function getCompanySlots(companyId) {
  return adminApi.get(`/admin/companies/${companyId}/slots`);
}

export function getCompanyStats(companyId) {
  return adminApi.get(`/admin/companies/${companyId}/stats`);
}

// ─── Сотрудники любой компании ───────────────────────────────────────
// Тела совпадают с кабинетом компании — отличается только путь.

export async function getCompanyStaff(companyId) {
  const data = await adminApi.get(`/admin/companies/${companyId}/staff`);
  return Array.isArray(data) ? data : (data?.items ?? []);
}

export function createCompanyStaff(companyId, { email, username, password, phoneNumber, planId }) {
  return adminApi.post(`/admin/companies/${companyId}/staff`, {
    email,
    username,
    password,
    phone_number: phoneNumber ? String(phoneNumber).replace(/[^\d+]/g, '') : null,
    ...(planId ? { plan_id: Number(planId) } : {}),
  });
}

export function updateCompanyStaff(companyId, userId, body) {
  return adminApi.patch(`/admin/companies/${companyId}/staff/${userId}`, body);
}

export function resetCompanyStaffPassword(companyId, userId, newPassword) {
  return adminApi.post(`/admin/companies/${companyId}/staff/${userId}/password`, {
    new_password: newPassword,
  });
}

export function deleteCompanyStaff(companyId, userId) {
  return adminApi.del(`/admin/companies/${companyId}/staff/${userId}`);
}

// ─── Сборка тела ─────────────────────────────────────────────────────

function buildCompanyBody(p, partial = false) {
  const body = {};

  const put = (key, value) => {
    if (partial && (value === undefined || value === '')) return;
    body[key] = value;
  };

  put('name', p.name);
  // ИНН только цифрами: бэк проверяет длину 10 или 12, а скобки и
  // пробелы из буфера обмена эту проверку ломают.
  if (p.inn !== undefined) put('inn', String(p.inn).replace(/\D/g, ''));
  put('email', p.email);
  if (p.phone !== undefined) {
    put('phone', p.phone ? String(p.phone).replace(/[^\d+]/g, '') : null);
  }
  if (p.password) body.password = p.password;

  // Пакет слотов — всё вместе или ничего.
  const hasPackage =
    p.staffLimit !== undefined ||
    p.tariff1 !== undefined ||
    p.tariff2 !== undefined ||
    p.tariff3 !== undefined;

  if (hasPackage) {
    body.staff_limit = Number(p.staffLimit) || 0;
    body.tariff1_count = Number(p.tariff1) || 0;
    body.tariff2_count = Number(p.tariff2) || 0;
    body.tariff3_count = Number(p.tariff3) || 0;
  }

  if (p.expiresAt) body.expires_at = toIsoEndOfDay(p.expiresAt);

  return body;
}

// <input type="date"> отдаёт «2027-01-01», а бэк ждёт datetime с
// таймзоной. Берём конец дня: договор «до 31 декабря» должен работать
// весь тридцать первый день, а не истекать в полночь на его входе.
function toIsoEndOfDay(dateStr) {
  if (!dateStr) return null;
  if (String(dateStr).includes('T')) return dateStr;
  return new Date(`${dateStr}T23:59:59`).toISOString();
}

// ─── Проверки пакета до отправки ─────────────────────────────────────

/**
 * Бэк отвечает 400 с текстом «Сумма тарифов 1+2+3 (...) должна быть
 * равна числу сотрудников (...)». Ловим это в форме заранее: админ
 * вводит четыре числа, и ошибиться в сумме проще простого.
 */
export function validatePackage({ staffLimit, tariff1, tariff2, tariff3 }) {
  const limit = Number(staffLimit);
  const t1 = Number(tariff1) || 0;
  const t2 = Number(tariff2) || 0;
  const t3 = Number(tariff3) || 0;

  if (!Number.isInteger(limit) || limit < 1) {
    return 'Укажите количество сотрудников — минимум одного.';
  }

  if ([t1, t2, t3].some((n) => !Number.isInteger(n) || n < 0)) {
    return 'Количество слотов не может быть отрицательным.';
  }

  const sum = t1 + t2 + t3;

  if (sum !== limit) {
    return `Сумма слотов по уровням (${sum}) должна равняться числу сотрудников (${limit}).`;
  }

  return null;
}

export function validateInn(inn) {
  const digits = String(inn || '').replace(/\D/g, '');

  if (digits.length !== 10 && digits.length !== 12) {
    return 'ИНН состоит из 10 цифр у юридического лица или 12 у ИП.';
  }

  return null;
}
