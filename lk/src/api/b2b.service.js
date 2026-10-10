import { hrApi } from './hrClient';
import { api } from './client';

// ─────────────────────────────────────────────────────────────────────
// Корпоративный слой: компания, промокоды, сотрудники, статистика.
//
// Всё, что делает HR, идёт через hrApi (токен role: hr).
// Активация промокода сотрудником — через обычный api: это действие
// пользователя, не администратора.
//
// Схемы — по B2B_BACKEND_SPEC.md в корне репозитория.
// ─────────────────────────────────────────────────────────────────────

// ─── Компания ───────────────────────────────────────────────────────

export function getCompany() {
  return hrApi.get('/b2b/company');
}

export function updateCompany({ name, inn, contactName, contactPhone }) {
  return hrApi.patch('/b2b/company', {
    name,
    // Только цифры — как и при регистрации. Иначе один и тот же телефон
    // хранится в базе в трёх видах и не ищется поиском.
    inn: String(inn).replace(/\D/g, ''),
    contact_name: contactName,
    contact_phone: String(contactPhone).replace(/[^\d+]/g, ''),
  });
}

// ─── Промокоды ──────────────────────────────────────────────────────

// POST /b2b/promocodes/batch — генерация пачкой.
//
// expires_at отправляем в ISO: бэк ждёт datetime, а <input type="date">
// отдаёт «2026-12-31». Без приведения получали 422.
export async function createPromoCodes({ count, planId, expiresAt, maxActivations = 1 }) {
  const data = await hrApi.post('/b2b/promocodes/batch', {
    count: Number(count),
    plan_id: Number(planId),
    expires_at: toIsoEndOfDay(expiresAt),
    max_activations: Number(maxActivations),
  });

  return Array.isArray(data) ? data : (data?.items ?? []);
}

export async function getPromoCodes({ status = 'all', page = 1, pageSize = 20 } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (status && status !== 'all') params.set('status', status);

  const data = await hrApi.get(`/b2b/promocodes?${params}`);

  return {
    items: Array.isArray(data) ? data : (data?.items ?? []),
    total: data?.total ?? (Array.isArray(data) ? data.length : 0),
    page: data?.page ?? page,
    pageSize: data?.page_size ?? pageSize,
  };
}

export function deactivatePromoCode(code) {
  return hrApi.patch(`/b2b/promocodes/${encodeURIComponent(code)}/deactivate`);
}

// ─── Сотрудники и статистика ────────────────────────────────────────

export async function getEmployees({ page = 1, pageSize = 20, query = '' } = {}) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  const q = query.trim();
  if (q) params.set('q', q);

  const data = await hrApi.get(`/b2b/employees?${params}`);

  return {
    items: Array.isArray(data) ? data : (data?.items ?? []),
    total: data?.total ?? (Array.isArray(data) ? data.length : 0),
    page: data?.page ?? page,
    pageSize: data?.page_size ?? pageSize,
  };
}

export function getCompanyStats() {
  return hrApi.get('/b2b/stats');
}

// ─── Активация промокода сотрудником ────────────────────────────────

// POST /promo/validate — проверка ДО регистрации.
//
// Бэк отвечает 200 и в обоих случаях: { valid: true, ... } либо
// { valid: false, reason }. Поэтому не-200 здесь означает только то, что
// эндпоинта нет или сервер упал, а не «код неверный».
export async function validatePromoCode(code) {
  return api.post('/promo/validate', { code: normalizePromoCode(code) });
}

export async function activatePromoCode({ code, email, username, password, phoneNumber }) {
  return api.post('/promo/activate', {
    code: normalizePromoCode(code),
    email,
    username,
    password,
    phone_number: phoneNumber || null,
  });
}

// Привязать код к УЖЕ существующему аккаунту: человек мог быть частным
// клиентом, а потом компания выдала ему корпоративный доступ. Создавать
// второго пользователя на ту же почту нельзя.
export async function attachPromoCode(code) {
  return api.post('/promo/attach', { code: normalizePromoCode(code) });
}

// ─── Формат промокода ───────────────────────────────────────────────
//
// RODN-GOLOS-{COMPANY_ID}-{8 символов}
// пример: RODN-GOLOS-17-K4P9TXM2
//
// Алфавит без визуально похожих знаков: нет 0/O, 1/I/L. Человек диктует
// код по телефону и переписывает с QR-кода глазами — на полном UUID из
// ТЗ (36 символов) это было бы гарантированной опечаткой.

const PROMO_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

/** Привести к виду, который понимает бэк: верхний регистр, без пробелов. */
export function normalizePromoCode(raw) {
  return String(raw || '')
    .toUpperCase()
    .replace(/\s+/g, '')
    .replace(/[^A-Z0-9-]/g, '');
}

/**
 * Автоформатирование при вводе: человек печатает «rodngolos17k4p9txm2»
 * или вставляет код с дефисами — на экране получается единый вид.
 *
 * Дефисы не обязательны, регистр не важен, похожие символы подменяются
 * (O→0 нельзя, потому что 0 не в алфавите; наоборот: 0→O, 1→J, I→J, L→J).
 */
export function formatPromoInput(raw) {
  let s = String(raw || '')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  // Частая ошибка переписывания: в нашем алфавите этих знаков нет,
  // поэтому однозначно восстанавливаем, что человек имел в виду.
  s = s.replace(/0/g, 'O').replace(/[1IL]/g, 'J');

  // Префикс RODNGOLOS может быть не введён — не требуем его.
  const withoutPrefix = s.startsWith('RODNGOLOS') ? s.slice(9) : s;

  const digits = withoutPrefix.match(/^\d+/)?.[0] ?? '';
  const tail = withoutPrefix
    .slice(digits.length)
    .split('')
    .filter((c) => PROMO_ALPHABET.includes(c))
    .join('')
    .slice(0, 8);

  if (!digits) return s.slice(0, 9) === 'RODNGOLOS' ? 'RODN-GOLOS-' : withoutPrefix;

  return tail
    ? `RODN-GOLOS-${digits}-${tail}`
    : `RODN-GOLOS-${digits}`;
}

/** Код введён полностью: есть ID компании и 8 символов хвоста. */
export function isPromoCodeComplete(value) {
  return /^RODN-GOLOS-\d+-[A-Z0-9]{8}$/.test(normalizePromoCode(value));
}

function toIsoEndOfDay(dateStr) {
  if (!dateStr) return null;

  // Срок действия до конца указанного дня, а не до 00:00 — иначе код,
  // выданный «до 31 декабря», перестаёт работать 30-го вечером.
  return new Date(`${dateStr}T23:59:59`).toISOString();
}
