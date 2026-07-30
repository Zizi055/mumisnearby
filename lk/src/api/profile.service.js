import { api } from './client';

// GET /profile
export async function getProfile() {
  return api.get('/profile');
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
  return api.patch('/profile', body);
}

// POST /profile/change-password
// После успеха все старые токены становятся невалидными на бэке —
// текущую сессию тоже надо считать завершённой и увести на /auth.
export async function changePassword({ old_password, new_password }) {
  return api.post('/profile/change-password', { old_password, new_password });
}

// GET /profile/password-changed-at — { password_changed_at: string|null }
export async function getPasswordChangedAt() {
  return api.get('/profile/password-changed-at');
}

// POST /profile/change-email — { new_email } -> { message, pending_email }
export async function requestEmailChange({ new_email }) {
  return api.post('/profile/change-email', { new_email });
}

// POST /profile/cancel-email-change — сбрасывает pending_email
export async function cancelEmailChange() {
  return api.post('/profile/cancel-email-change');
}
