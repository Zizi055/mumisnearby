const BASE_URL = import.meta.env.VITE_API_URL || '';

// ─────────────────────────────────────────────────────────────────────
// HTTP-клиент кабинета HR.
//
// На бэке это ТРЕТЬЯ независимая роль, помимо пользователя и админа
// поддержки: своя таблица учёток, свой эндпоинт входа (/auth/hr/login) и
// токен с role: hr. Поэтому и токен храним отдельно — иначе HR, который
// заодно является клиентом сервиса, выбивал бы сам себя из личного
// кабинета при каждом входе в корпоративную часть.
//
// Та же причина, по которой adminClient.js живёт отдельно от client.js.
// ─────────────────────────────────────────────────────────────────────

export const HR_TOKEN_KEY = 'hrToken';
export const HR_COMPANY_KEY = 'hrCompanyName';

function handleUnauthorized() {
  localStorage.removeItem(HR_TOKEN_KEY);
  localStorage.removeItem(HR_COMPANY_KEY);

  if (!window.location.hash.includes('/hr/login')) {
    window.location.hash = '/hr/login';
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem(HR_TOKEN_KEY);

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
    throw new Error('Сессия истекла. Войдите снова.');
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

// Человеческий текст вместо сырого ответа.
//
// 404 здесь особый случай: пока бэкендер не реализовал корпоративный
// модуль, все /b2b/* отвечают 404, и это НЕ «не найдено» в смысле данных,
// а «эндпоинта ещё нет». Экраны показывают из-за этого понятную заглушку
// вместо пустоты, по которой не ясно, сломано или просто нет данных.
function describeError(status, text) {
  const detail = parseDetail(text);
  if (detail) return detail;

  if (status === 404) return 'NOT_IMPLEMENTED';
  if (status === 403) return 'Недостаточно прав для этого действия.';
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер не отвечает. Попробуйте через минуту.';
  }
  if (status >= 500) return 'Ошибка на сервере. Мы уже знаем о проблеме.';

  return `Запрос не выполнен (код ${status}).`;
}

function parseDetail(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — пусть вызывающий покажет текст по коду
  }
  return null;
}

/** Эндпоинта ещё нет на бэке — отличаем от «данных нет». */
export function isNotImplemented(error) {
  return error?.status === 404 && error?.message === 'NOT_IMPLEMENTED';
}

export const hrApi = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    }),
  // Тело необязательно: у /promocodes/{code}/deactivate его нет вовсе, а
  // JSON.stringify(undefined) даёт строку "undefined", которую бэк не
  // разберёт и ответит 422.
  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
};
