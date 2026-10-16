const BASE_URL = import.meta.env.VITE_API_URL || '';

// Отдельный HTTP-клиент для админки. /admin/* и /auth/*_admin/* эндпоинты
// проверяют СВОЙ токен (выданный через /auth/admin/login или
// /auth/admin/login), а не пользовательский из client.js — это два
// разных набора учётных данных на бэке. Поэтому храним токен отдельно
// (localStorage.adminToken), чтобы не конфликтовать с сессией обычного
// пользователя в том же браузере.

// Админские токены с 14.08.2026 подписываются отдельным ключом
// (ADMIN_SECRET_KEY) и несут role: admin / super_admin. Все выданные
// до выката — невалидны, нужен повторный вход.
function handleAdminUnauthorized() {
  localStorage.removeItem('adminToken');
  localStorage.removeItem('adminRole');
  localStorage.removeItem('adminUsername');
  localStorage.removeItem('adminIsSuper');

  if (!window.location.hash.includes('/admin/login')) {
    window.location.hash = '/admin/login';
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem('adminToken');

  const headers = {
    ...(options.headers || {}),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (res.status === 401) {
    handleAdminUnauthorized();
    throw new Error('Сессия администратора истекла. Войдите снова.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(describeAdminError(res.status, text));
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

// Бэк отвечает { detail: "текст" } — показываем его как есть, он
// написан для человека.
//
// Отдельный случай — HTML в ответе. На /admin/* у бэкенда живёт ещё и
// собственная серверная админка, и на неизвестный адрес она отдаёт
// свою страницу 404 целиком. Вываливать её разметку в интерфейс
// бессмысленно: человек видит простыню тегов вместо сообщения.
function describeAdminError(status, text) {
  const trimmed = text.trim();

  if (trimmed.startsWith('{')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (typeof parsed.detail === 'string') return parsed.detail;
    } catch {
      // не JSON — ниже по коду
    }
  }

  if (trimmed.startsWith('<')) {
    return status === 404
      ? 'Этого раздела нет в API сервера — корпоративный модуль ещё не выкачен.'
      : `Сервер ответил страницей, а не данными (код ${status}).`;
  }

  if (status === 403) return 'Недостаточно прав для этого действия.';
  if (status === 404) return 'Раздел не найден на сервере.';
  if (status >= 500) return 'Ошибка на сервере. Мы уже знаем о проблеме.';

  return `Запрос не выполнен (код ${status}).`;
}

export const adminApi = {
  get: (path) =>
    request(path),

  post: (path, body, options = {}) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  // Тело необязательно: у ряда PATCH-ручек его нет вовсе, а
  // JSON.stringify(undefined) даёт строку "undefined", которую бэк не
  // разберёт и ответит 422.
  patch: (path, body) =>
    request(path, {
      method: 'PATCH',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),

  del: (path) =>
    request(path, {
      method: 'DELETE',
    }),
};
