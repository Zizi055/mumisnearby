import {
  detectCompanyBlock,
  detectCompanyStaffFromPaymentError,
} from '../utils/companyBlock';

const BASE_URL = import.meta.env.VITE_API_URL || '';

// Бэк отдаёт ошибки как { "detail": "текст" } — вытаскиваем человеко-
// читаемый текст вместо сырого "HTTP 400: {...}" во всех местах, где
// используется общий клиент `api`.
function parseErrorDetail(text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — вернём null, вызывающий код подставит текст как есть
  }
  return null;
}

// ── Глобальный обработчик истёкшего токена ───────────────────────────────────
//
// После выката security-правок 14.08.2026 все ранее выданные JWT стали
// невалидными: в токене теперь обязательны role и type. Пользователя
// нельзя оставлять в бесконечных повторах с тем же Bearer — чистим
// сохранённое и уводим на вход, а на экране входа поясняем причину.
function handleUnauthorized() {
  const hadToken = Boolean(localStorage.getItem('token'));

  localStorage.removeItem('token');
  localStorage.removeItem('user');

  if (hadToken) {
    sessionStorage.setItem('authNotice', 'session_expired');
  }

  // Перенаправляем на страницу входа (HashRouter)
  if (!window.location.hash.includes('/auth')) {
    window.location.hash = '/auth';
  }
}

async function request(path, options = {}) {
  const token = localStorage.getItem('token');

  const headers = {
    ...(options.headers || {}),
  };

  // Content-Type не ставим для FormData — браузер сам добавит boundary
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

  // Токен истёк или невалиден — выходим и редиректим на логин
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Сессия истекла. Пожалуйста, войдите снова.');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const detail = parseErrorDetail(text);

    const err = new Error(detail || `HTTP ${res.status}: ${text}`);

    // Сотрудник корпоративного клиента: компанию выключили или договор
    // истёк. Бэк отвечает 403 на ЛЮБОЙ его запрос, поэтому ловим это
    // здесь, а не в каждом экране — один всё равно забыли бы. Оболочка
    // кабинета покажет объяснение вместо пейволла: платить сотруднику
    // нечего, ему нужно к администратору своей компании.
    const blocked = detectCompanyBlock(res.status, detail);
    if (blocked) err.companyBlock = blocked;

    // Отдельный признак: попытка оплаты у сотрудника даёт 403 с текстом
    // «Тариф сотрудника оплачивает компания». Пока who_am_i не отдаёт
    // company_id, это единственный надёжный способ его распознать.
    detectCompanyStaffFromPaymentError(res.status, detail);

    // Код нужен вызывающей стороне, чтобы отличить поломку на сервере (5xx)
    // от «не нашли» и от обрыва сети. Раньше наружу шла только строка, и
    // любая неудача выглядела одинаково — «не удалось загрузить». На 500 в
    // одном разделе библиотеки это читалось как ошибка фронта, и мы сутки
    // искали её не там.
    err.status = res.status;

    throw err;
  }

  if (res.status === 204) {
    return null;
  }

  return res.json();
}

export const api = {
  get: (path) =>
    request(path),

  post: (path, body, options = {}) =>
    request(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
      ...options,
    }),

  put: (path, body) =>
    request(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  // Тело необязательно: у /notifications/{id}/read и /notifications/read-all
  // его нет вовсе, а JSON.stringify(undefined) даёт строку "undefined",
  // которую бэк не разберёт.
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
