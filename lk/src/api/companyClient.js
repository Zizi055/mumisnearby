const BASE_URL = import.meta.env.VITE_API_URL || '';

// ─────────────────────────────────────────────────────────────────────
// HTTP-клиент кабинета компании.
//
// На бэке ТРИ независимых токена, и подставлять их друг другу нельзя:
//
//   POST /auth/admin/login      → админ юрлиц  → /admin/companies/*
//   POST /companies/auth/login  → компания     → /companies/*
//   POST /auth/login            → сотрудник    → /voices, /generations, …
//
// Поэтому у компании свой клиент и своё хранилище токена: HR нередко
// сам является клиентом сервиса, и общий ключ выбивал бы его из
// личного кабинета при каждом входе в корпоративный.
//
// Токен живёт 60 минут. После смены пароля компании старый сразу 401.
// ─────────────────────────────────────────────────────────────────────

export const COMPANY_TOKEN_KEY = 'companyToken';
export const COMPANY_NAME_KEY = 'companyName';

function handleUnauthorized() {
  localStorage.removeItem(COMPANY_TOKEN_KEY);
  localStorage.removeItem(COMPANY_NAME_KEY);

  if (!window.location.hash.includes('/company/login')) {
    window.location.hash = '/company/login';
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem(COMPANY_TOKEN_KEY);

  const headers = { ...(options.headers || {}) };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Сессия истекла. Войдите заново.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(describeError(res.status, text));
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;

  return res.json();
}

// Бэк отвечает { detail: "текст на русском" } — показываем его как есть,
// он написан для человека. Исключение — 422: там detail это массив
// объектов валидации, и выводить его целиком нельзя.
function describeError(status, text) {
  try {
    const parsed = JSON.parse(text);

    if (typeof parsed.detail === 'string') return parsed.detail;

    if (Array.isArray(parsed.detail)) {
      const msgs = parsed.detail.map((e) => e.msg).filter(Boolean);
      if (msgs.length) return msgs.join('. ');
    }
  } catch {
    // не JSON — ниже текст по коду
  }

  if (status === 404) return 'NOT_IMPLEMENTED';
  if (status === 403) return 'Недостаточно прав для этого действия.';
  if (status === 429) return 'Свободных мест не осталось.';
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер не отвечает. Попробуйте через минуту.';
  }
  if (status >= 500) return 'Ошибка на сервере. Мы уже знаем о проблеме.';

  return `Запрос не выполнен (код ${status}).`;
}

/** Корпоративный модуль ещё не выкачен на этот сервер. */
export function isNotImplemented(error) {
  return error?.status === 404 && error?.message === 'NOT_IMPLEMENTED';
}

/** Договор истёк или компанию выключили — доступ только на чтение. */
export function isContractBlocked(error) {
  return error?.status === 403;
}

export const companyApi = {
  get: (path) => request(path),

  post: (path, body) =>
    request(path, {
      method: 'POST',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),

  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),

  delete: (path) => request(path, { method: 'DELETE' }),
};
