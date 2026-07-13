import { api } from './client';

export async function register({ name, email, password, referral_code }) {
  // RegisterResponse = { message } — токен не выдаётся, пользователь ещё не
  // подтвердил почту. Не путать с login: здесь НЕЛЬЗЯ считать, что человек
  // залогинен, даже если запрос прошёл успешно.
  const data = await api.post('/auth/register', {
    username: name,
    email,
    password,
    referral_code: referral_code || undefined,
  });

  return { ...data, email, name };
}

export async function login({ email, password }) {
  // FastAPI OAuth2 ждёт form-data, не JSON
  const res = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text) || `HTTP ${res.status}: ${text}`);
  }

  const data = await res.json();

  if (data.access_token) {
    localStorage.setItem('token', data.access_token);
  }

  return { ...data, name: data.username ?? email };
}

export async function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

export async function getMe() {
  return api.get('/auth/who_am_i');
}

// GET /auth/verify-email?token=... — вызывается со страницы, на которую
// ведёт ссылка из письма подтверждения.
export async function verifyEmail(token) {
  const res = await fetch(`/auth/verify-email?token=${encodeURIComponent(token)}`, {
    method: 'GET',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text) || `HTTP ${res.status}: ${text}`);
  }

  return res.json().catch(() => ({}));
}

// POST /auth/resend-verification — на бэке помечен как защищённый
// (нужен Bearer-токен), а токена у неподтверждённого пользователя нет —
// это дыра в самом API (см. bug_email_verification.md), не в этом коде.
// Вызываем через raw fetch, а не через общий `api`, чтобы 401 отсюда не
// триггерил глобальный логаут/редирект из client.js.
export async function resendVerification() {
  const token = localStorage.getItem('token');
  const res = await fetch('/auth/resend-verification', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(parseErrorDetail(text) || `HTTP ${res.status}: ${text}`);
  }

  return res.json().catch(() => ({}));
}

// Бэк отдаёт ошибки как { "detail": "текст" } — достаём человекочитаемый
// текст вместо того чтобы показывать сырой "HTTP 403: {...}" пользователю.
function parseErrorDetail(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — вернём null, вызывающий код подставит текст как есть
  }
  return null;
}
