import { hrApi, HR_TOKEN_KEY, HR_COMPANY_KEY } from './hrClient';

// ─────────────────────────────────────────────────────────────────────
// Регистрация компании и вход HR-администратора.
//
// POST /auth/hr/login — form-urlencoded, как и остальные логины на бэке
// (OAuth2PasswordRequestForm). Поле называется username, но по смыслу это
// рабочая почта HR: так устроен бэк, переименовать нельзя.
//
// Регистрация компании (POST /b2b/companies/register) сразу возвращает
// токен — заставлять человека логиниться второй раз после заполнения
// большой формы незачем.
// ─────────────────────────────────────────────────────────────────────

function storeSession(data, companyName) {
  if (data?.access_token) {
    localStorage.setItem(HR_TOKEN_KEY, data.access_token);
    if (companyName) localStorage.setItem(HR_COMPANY_KEY, companyName);
  }
}

export async function loginHr({ email, password }) {
  const res = await fetch('/auth/hr/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ username: email, password }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(describeLoginError(res.status, text));
  }

  const data = await res.json();
  storeSession(data);
  return data;
}

export async function registerCompany(payload) {
  const data = await hrApi.post('/b2b/companies/register', {
    name: payload.name,
    // ИНН и телефон обязательны: без ИНН не выставить счёт и не
    // подписать договор, а по корпоративным заявкам менеджер звонит —
    // почта в компаниях часто уходит в общий ящик. Отправляем только
    // цифры: бэк хранит их без скобок и дефисов, иначе один и тот же
    // телефон приходит в трёх разных видах.
    inn: payload.inn.replace(/\D/g, ''),
    contact_name: payload.contactName,
    contact_email: payload.contactEmail,
    contact_phone: payload.contactPhone.replace(/[^\d+]/g, ''),
    plan_id: Number(payload.planId),
    seats_total: Number(payload.seatsTotal),
    billing_period: 'year',
    password: payload.password,
  });

  storeSession(data, data?.company?.name ?? payload.name);
  return data;
}

export function logoutHr() {
  localStorage.removeItem(HR_TOKEN_KEY);
  localStorage.removeItem(HR_COMPANY_KEY);
}

export function hasHrSession() {
  return !!localStorage.getItem(HR_TOKEN_KEY);
}

export function getStoredCompanyName() {
  return localStorage.getItem(HR_COMPANY_KEY) || '';
}

export function getHrMe() {
  return hrApi.get('/auth/hr/me');
}

function describeLoginError(status, text) {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.detail === 'string') return parsed.detail;
  } catch {
    // не JSON — ниже текст по коду
  }

  if (status === 401) return 'Неверная почта или пароль.';
  if (status === 404) {
    return 'Вход для компаний ещё не подключён на сервере. Мы уже работаем над этим.';
  }
  if (status === 502 || status === 503 || status === 504) {
    return 'Сервер не отвечает. Попробуйте через минуту.';
  }
  if (status >= 500) return 'Ошибка на сервере. Мы уже знаем о проблеме.';

  return `Не удалось войти (код ${status}).`;
}
