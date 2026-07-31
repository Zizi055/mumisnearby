import { api } from './client';

// ─────────────────────────────────────────────────────────────────────
// Префикс профильных эндпоинтов.
//
// По документации бэкенда базовый путь — /profile. Но на боевом сервере
// nginx этот путь НЕ проксирует на бэкенд: запрос падает на статику.
// Проверено на rodnyegolosa.ru:
//   GET  /profile                  → HTML лендинга (не JSON)
//   POST /profile/change-password  → 405 Not Allowed от nginx
// При этом /api/* на бэкенд проксируется — там уже живут
// /api/payments/* и /api/subscription/bonus.
//
// Правильное решение — добавить location /profile/ в конфиг nginx.
// Если разработчик решит повесить профиль под /api, достаточно
// поменять одну строку ниже на '/api/profile'.
// ─────────────────────────────────────────────────────────────────────
const PROFILE_BASE = '/profile';

// GET /profile
export async function getProfile() {
  return api.get(PROFILE_BASE);
}

// PATCH /profile — по спеке можно менять только username и/или
// phone_number. Email через этот эндпоинт НЕ меняется — смена почты
// это отдельный подтверждаемый процесс (см. requestEmailChange ниже):
// новая почта уходит в pending_email, письмо со ссылкой подтверждения
// летит на неё, текущая остаётся рабочей до перехода по ссылке.
export async function updateProfile({ username, phone_number }) {
  const body = {};
  if (username !== undefined) body.username = username;
  if (phone_number !== undefined) body.phone_number = phone_number;
  return api.patch(PROFILE_BASE, body);
}

// POST /profile/change-password
// После успеха все старые токены становятся невалидными на бэке —
// текущую сессию тоже надо считать завершённой и увести на /auth.
export async function changePassword({ old_password, new_password }) {
  return api.post(`${PROFILE_BASE}/change-password`, { old_password, new_password });
}

// GET /profile/password-changed-at — { password_changed_at: string|null }
export async function getPasswordChangedAt() {
  return api.get(`${PROFILE_BASE}/password-changed-at`);
}

// POST /profile/change-email — { new_email } -> { message, pending_email }
export async function requestEmailChange({ new_email }) {
  return api.post(`${PROFILE_BASE}/change-email`, { new_email });
}

// POST /profile/cancel-email-change — сбрасывает pending_email
export async function cancelEmailChange() {
  return api.post(`${PROFILE_BASE}/cancel-email-change`);
}
