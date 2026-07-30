// Соответствие между строковым slug'ом тарифа (id в tariffs.data.js —
// 'fairy'/'guardian'/'wizard'/'builder', используется у нас для роутинга
// и отображения) и РЕАЛЬНЫМ числовым plan_id в базе бэкенда.
//
// POST /api/payments/create ждёт plan_id: integer — это ID строки в
// таблице тарифов на бэке, не наш slug.
//
// 6 — демо/триал (5 сказок, один голос), не покупается через этот эндпоинт,
// сюда не входит.
export const PLAN_ID_MAP = {
  fairy: 3,    // Сказочник
  guardian: 4, // Хранитель
  wizard: 5,   // Волшебник
  // builder ('Конструктор') намеренно без ID — тариф разрабатывается
  // отдельно, покупка через этот эндпоинт пока не предусмотрена.
};

// Обратное соответствие: числовой plan_id с бэка → наш строковый slug.
// Нужно везде, где приходит GET /subscription/status с plan.id = 4 и надо
// найти тариф в tariffs.data.js, где id === 'guardian'. Раньше сравнивали
// напрямую (t.id === 4), строка никогда не равнялась числу, поэтому
// «текущий тариф» не находился и показывался прочерк.
export const SLUG_BY_PLAN_ID = Object.fromEntries(
  Object.entries(PLAN_ID_MAP).map(([slug, id]) => [id, slug])
);

export function getTariffSlug(planId) {
  if (planId == null) return null;
  return SLUG_BY_PLAN_ID[Number(planId)] ?? null;
}

// Бросает понятную ошибку вместо того, чтобы улететь на бэк со строкой
// и получить сырой HTTP 422 "Input should be a valid integer".
export function getBackendPlanId(slug) {
  const id = PLAN_ID_MAP[slug];
  if (id == null) {
    throw new Error(
      `Тариф «${slug}» пока нельзя оформить — для него ещё нет ID в базе бэкенда.`
    );
  }
  return id;
}
