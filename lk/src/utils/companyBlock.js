// ─────────────────────────────────────────────────────────────────────
// Блокировка сотрудника корпоративного клиента.
//
// Когда компанию выключили или её договор истёк, бэк отвечает 403 на
// ЛЮБОЙ запрос сотрудника — с конкретным текстом в detail:
//
//   «Доступ компании приостановлен»
//   «Срок действия договора компании истёк»
//
// Показывать в этот момент пейволл нельзя: сотрудник ничего не платит и
// оплатой ситуацию не исправит. Ему нужно идти к администратору своей
// компании, а не к нам в кассу.
//
// Признак ловим в одном месте — в клиенте — и поднимаем флаг, который
// читает оболочка кабинета. Иначе пришлось бы обрабатывать 403 в
// каждом экране по отдельности и один всё равно забыли бы.
// ─────────────────────────────────────────────────────────────────────

export const COMPANY_BLOCK_EVENT = 'company:blocked';

const REASONS = [
  {
    id: 'suspended',
    test: /приостановлен/i,
    title: 'Доступ компании приостановлен',
    text:
      'Ваша компания временно отключила корпоративный доступ. Записи и ' +
      'созданные озвучки сохранены — они вернутся, как только доступ ' +
      'включат снова.',
  },
  {
    id: 'expired',
    test: /срок действия договора/i,
    title: 'Срок действия договора компании истёк',
    text:
      'Доступ приостановлен до продления договора. Ваши записи и озвучки ' +
      'сохранены.',
  },
];

let current = null;

/** Разобрать ответ 403: это блокировка договора или обычный отказ? */
export function detectCompanyBlock(status, detail) {
  if (status !== 403 || !detail) return null;

  const reason = REASONS.find((r) => r.test.test(detail));
  if (!reason) return null;

  current = reason;

  window.dispatchEvent(new CustomEvent(COMPANY_BLOCK_EVENT, { detail: reason }));

  return reason;
}

export function getCompanyBlock() {
  return current;
}

export function clearCompanyBlock() {
  current = null;
}

// ─── Признак сотрудника ──────────────────────────────────────────────
//
// GET /auth/who_am_i пока НЕ отдаёт company_id, отличить сотрудника по
// профилю нельзя. Надёжный признак один: попытка создать платёж даёт
// 403 «Тариф сотрудника оплачивает компания». Запоминаем это, чтобы
// больше не показывать ему оплату и реферальные бонусы.

const STAFF_KEY = 'lk-company-staff';

export function markAsCompanyStaff() {
  try {
    localStorage.setItem(STAFF_KEY, '1');
  } catch {
    // приватный режим — не критично, просто не запомним
  }
}

export function isCompanyStaff() {
  try {
    return localStorage.getItem(STAFF_KEY) === '1';
  } catch {
    return false;
  }
}

export function forgetCompanyStaff() {
  try {
    localStorage.removeItem(STAFF_KEY);
  } catch {
    // ничего
  }
}

/** Ответ на попытку оплаты: это сотрудник компании? */
export function detectCompanyStaffFromPaymentError(status, detail) {
  if (status === 403 && /оплачивает компания/i.test(detail || '')) {
    markAsCompanyStaff();
    return true;
  }
  return false;
}
