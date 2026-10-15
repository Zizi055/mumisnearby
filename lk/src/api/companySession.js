// ─────────────────────────────────────────────────────────────────────
// Чья сессия открыта в кабинете компании.
//
// Кабинет один и тот же — тот, что нарисован в графитовом дизайне, — но
// данные под ним приходят из двух разных наборов адресов:
//
//   учётка юрлица  → /companies/*                  (токен companyToken)
//   администратор  → /admin/companies/{id}/*       (токен adminToken)
//
// Тела запросов и ответов у этих пар совпадают, различается только
// путь. Поэтому выбор делается здесь, в одном месте, а экраны и
// сервисы продолжают спрашивать «свои» адреса и ничего не знают о том,
// кто вошёл. Иначе разветвление расползлось бы по каждой странице.
//
// Режим администратора всегда привязан к конкретной компании: админ
// видит их десятки, и без явно выбранной кабинет не имеет смысла.
// ─────────────────────────────────────────────────────────────────────

const COMPANY_ID_KEY = 'companyAsAdminId';
const COMPANY_NAME_KEY = 'companyAsAdminName';

/** Админ открыл кабинет конкретной компании. */
export function openCompanyAsAdmin({ id, name }) {
  localStorage.setItem(COMPANY_ID_KEY, String(id));
  localStorage.setItem(COMPANY_NAME_KEY, name || '');
}

export function closeCompanyAsAdmin() {
  localStorage.removeItem(COMPANY_ID_KEY);
  localStorage.removeItem(COMPANY_NAME_KEY);
}

/** { id, name } или null, если кабинет открыт обычным входом юрлица. */
export function getCompanyAsAdmin() {
  const id = localStorage.getItem(COMPANY_ID_KEY);
  if (!id || !localStorage.getItem('adminToken')) return null;

  return { id, name: localStorage.getItem(COMPANY_NAME_KEY) || '' };
}

export function isAdminMode() {
  return getCompanyAsAdmin() !== null;
}

// ─── Перевод адреса ──────────────────────────────────────────────────

// Каталог тарифов общий для всех компаний и у админа не привязан к id.
const SHARED = new Map([['/companies/plans', '/admin/companies/plans']]);

// Профиль компании у админа — это карточка самой компании, а не
// отдельный ресурс «me».
function translate(path, id) {
  const [route, query] = path.split('?');

  if (SHARED.has(route)) return SHARED.get(route);

  if (route === '/companies/me') return `/admin/companies/${id}`;

  // Смена собственного пароля — действие юрлица. Админ задаёт пароль
  // компании через её карточку в админке, отдельного адреса нет.
  if (route === '/companies/me/password') {
    throw new Error(
      'Пароль компании меняется в её карточке в админке — здесь поле только для самой компании.',
    );
  }

  // Статистика у админа без диапазона дат: параметры отбрасываем, иначе
  // бэк ответит 422 на неизвестные поля.
  if (route === '/companies/stats') return `/admin/companies/${id}/stats`;

  // Остальное — ровно тот же хвост после /companies: slots, staff,
  // staff/{userId}, staff/{userId}/password.
  const tail = route.slice('/companies'.length);
  return `/admin/companies/${id}${tail}${query ? `?${query}` : ''}`;
}

/**
 * Куда и с каким токеном уходит запрос кабинета компании.
 * @returns {{ path: string, token: string|null, asAdmin: boolean }}
 */
export function resolveCompanyRequest(path) {
  const session = getCompanyAsAdmin();

  if (!session) {
    return {
      path,
      token: localStorage.getItem('companyToken'),
      asAdmin: false,
    };
  }

  return {
    path: translate(path, session.id),
    token: localStorage.getItem('adminToken'),
    asAdmin: true,
  };
}
