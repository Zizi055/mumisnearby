// ─────────────────────────────────────────────────────────────────────
// Демонстрационные данные кабинета компании.
//
// Корпоративного модуля на бэкенде пока нет: все адреса /companies/* и
// /admin/companies/* отвечают 404 (см. API-REVIEW.md в корне). Без
// данных кабинет показывает три пустых экрана, и ни согласовать
// вёрстку, ни показать её клиенту нельзя.
//
// Поэтому на 404 — и только на него — клиент подставляет эти ответы.
// Как только бэкенд отдаст настоящие адреса, подстановка перестанет
// срабатывать сама: ответ будет 200, до ветки с демо дело не дойдёт.
// Удалять ничего не придётся, но и забыть не получится — в кабинете
// висит жёлтая плашка «демо-данные», пока работает этот файл.
//
// Формы ответов повторяют те, что описаны в frontend-b2b.md, включая
// строковые ключи уровней в tariffs ("1", "2", "3"): если бэкенд
// сделает иначе, экраны сломаются одинаково и на демо, и на боевых
// данных, а не «на демо всё было хорошо».
// ─────────────────────────────────────────────────────────────────────

const PLANS = [
  { id: 1, name: 'Сказочник', access_lvl: 1, price: 24000 },
  { id: 2, name: 'Хранитель', access_lvl: 2, price: 31200 },
  { id: 3, name: 'Волшебник', access_lvl: 3, price: 59900 },
];

const COMPANY = {
  id: 1,
  name: 'Северная логистическая компания',
  inn: '7701234567',
  email: 'hr@severlogistic.ru',
  phone: '+7 495 120-44-10',
  is_active: true,
  expires_at: '2027-04-30T00:00:00',
  staff_limit: 12,
  tariff1_count: 6,
  tariff2_count: 4,
  tariff3_count: 2,
};

// Живёт между запросами: добавили сотрудника — он остался в списке,
// удалили — пропал. Иначе демо рассыпается на первом же действии.
let staff = [
  { id: 101, email: 'a.kovaleva@severlogistic.ru', username: 'Анна Ковалёва',     phone_number: '+79031110011', plan_id: 2, access_lvl: 2, voices: 2, created_at: '2026-02-11T09:12:00' },
  { id: 102, email: 'd.sorokin@severlogistic.ru',  username: 'Дмитрий Сорокин',   phone_number: '+79031110022', plan_id: 1, access_lvl: 1, voices: 1, created_at: '2026-02-11T09:14:00' },
  { id: 103, email: 'm.eremina@severlogistic.ru',  username: 'Марина Ерёмина',    phone_number: '+79031110033', plan_id: 3, access_lvl: 3, voices: 3, created_at: '2026-03-02T14:40:00' },
  { id: 104, email: 'p.zaitsev@severlogistic.ru',  username: 'Павел Зайцев',      phone_number: null,           plan_id: 1, access_lvl: 1, voices: 1, created_at: '2026-03-18T11:05:00' },
  { id: 105, email: 'o.belova@severlogistic.ru',   username: 'Ольга Белова',      phone_number: '+79031110055', plan_id: 2, access_lvl: 2, voices: 0, created_at: '2026-04-07T16:22:00' },
  { id: 106, email: 'i.gurov@severlogistic.ru',    username: 'Игорь Гуров',       phone_number: '+79031110066', plan_id: 1, access_lvl: 1, voices: 1, created_at: '2026-05-20T10:31:00' },
  { id: 107, email: 'n.lapina@severlogistic.ru',   username: 'Наталья Лапина',    phone_number: null,           plan_id: null, access_lvl: null, voices: 0, created_at: '2026-09-29T08:50:00' },
];

let nextId = 108;

function slots() {
  const used = (lvl) => staff.filter((u) => u.access_lvl === lvl).length;

  return {
    staff_limit: COMPANY.staff_limit,
    staff_used: staff.length,
    tariffs: {
      1: { limit: COMPANY.tariff1_count, used: used(1) },
      2: { limit: COMPANY.tariff2_count, used: used(2) },
      3: { limit: COMPANY.tariff3_count, used: used(3) },
    },
  };
}

function stats() {
  return {
    expires_at: COMPANY.expires_at,
    is_expired: false,
    slots: slots(),
    staff: staff.map(({ id, username, email, access_lvl, voices }) => ({
      id,
      username,
      email,
      access_lvl,
      voices,
      generations: voices * 7,
    })),
    generations: {
      total: 184,
      by_status: { ready: 176, processing: 3, failed: 5 },
      by_content_type: {
        'Сказки': 112,
        'Колыбельные': 38,
        'Терапевтические сценарии': 21,
        'Семейные истории': 13,
      },
    },
  };
}

// ─── Разбор адреса ───────────────────────────────────────────────────

// Пути приходят и корпоративные (/companies/staff), и админские
// (/admin/companies/7/staff) — отличие только в начале. Срезаем его и
// дальше смотрим один и тот же хвост.
function tail(path) {
  const route = path.split('?')[0];

  if (route.startsWith('/admin/companies')) {
    const rest = route.slice('/admin/companies'.length);
    // /admin/companies/{id} → профиль компании, он же /companies/me
    const m = rest.match(/^\/\d+(\/.*)?$/);
    if (m) return m[1] || '/me';
    return rest || '/list';
  }

  if (route.startsWith('/companies')) return route.slice('/companies'.length) || '/list';

  return null;
}

/**
 * Ответ вместо 404, если адрес относится к кабинету компании.
 * @returns данные, либо undefined — тогда вызывающий код оставляет ошибку.
 */
export function demoCompanyResponse(path, method = 'GET', body = null) {
  const route = tail(path);
  if (route === null) return undefined;

  const verb = method.toUpperCase();
  const staffId = Number(route.match(/^\/staff\/(\d+)/)?.[1]);

  if (route === '/list' && verb === 'GET') return [COMPANY];
  if (route === '/me' && verb === 'GET') return COMPANY;
  if (route === '/plans' && verb === 'GET') return PLANS;
  if (route === '/slots' && verb === 'GET') return slots();
  if (route === '/stats' && verb === 'GET') return stats();

  // Смена пароля: подтверждаем, ничего не меняя — хранить его негде.
  if (route === '/me/password' && verb === 'POST') return { ok: true };

  if (route === '/staff' && verb === 'GET') return staff;

  if (route === '/staff' && verb === 'POST') {
    const plan = PLANS.find((p) => p.id === Number(body?.plan_id));

    const created = {
      id: nextId++,
      email: body?.email ?? '',
      username: body?.username ?? '',
      phone_number: body?.phone_number ?? null,
      plan_id: plan?.id ?? null,
      access_lvl: plan?.access_lvl ?? null,
      voices: 0,
      created_at: new Date().toISOString(),
    };

    staff = [...staff, created];
    return created;
  }

  if (Number.isFinite(staffId)) {
    const found = staff.find((u) => u.id === staffId);
    if (!found) return undefined;

    if (route.endsWith('/password') && verb === 'POST') return { ok: true };

    if (verb === 'GET') return found;

    if (verb === 'PATCH') {
      const plan = PLANS.find((p) => p.id === Number(body?.plan_id));

      const updated = {
        ...found,
        ...(body?.username !== undefined ? { username: body.username } : {}),
        ...(body?.phone_number !== undefined ? { phone_number: body.phone_number } : {}),
        ...(body?.plan_id !== undefined
          ? { plan_id: plan?.id ?? null, access_lvl: plan?.access_lvl ?? null }
          : {}),
      };

      staff = staff.map((u) => (u.id === staffId ? updated : u));
      return updated;
    }

    if (verb === 'DELETE') {
      staff = staff.filter((u) => u.id !== staffId);
      return null;
    }
  }

  return undefined;
}
