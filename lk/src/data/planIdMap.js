// Соответствие между строковым slug'ом тарифа (id в tariffs.data.js —
// 'fairy'/'guardian'/'wizard'/'builder', используется у нас для роутинга
// и отображения) и РЕАЛЬНЫМ числовым plan_id в базе бэкенда.
//
// POST /api/payments/create ждёт plan_id: integer — это ID строки в
// таблице тарифов на бэке, не наш slug.
//
// 0 — демо/триал (5 сказок, один голос), не покупается через этот эндпоинт,
// сюда не входит.
export const PLAN_ID_MAP = {
  fairy: 1,    // Сказочник
  guardian: 2, // Хранитель
  wizard: 3,   // Волшебник
  builder: 4,  // Конструктор
};

// Бросает понятную ошибку вместо того, чтобы улететь на бэк со строкой
// и получить сырой HTTP 422 "Input should be a valid integer".
export function getBackendPlanId(slug) {
  const id = PLAN_ID_MAP[slug];
  if (id == null) {
    throw new Error(
      `Для тарифа «${slug}» ещё не известен ID в базе бэкенда. Уточните у бэкендера и заполните planIdMap.js`
    );
  }
  return id;
}
