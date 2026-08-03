// ─────────────────────────────────────────────────────────────────────
// Живые тарифы на лендинге.
//
// До этого цены и состав пакетов были вписаны в index.html руками и
// разъезжались с базой: у Сказочника значилось «50 сказок», в базе 30;
// у Хранителя на лендинге 24 400 ₽, а ЮKassa списывала 24 000.
// Теперь берём те же данные, что и личный кабинет — GET /subscription/{plan_id}.
//
// Статическая разметка остаётся как запасной вариант: если бэкенд не
// ответил, посетитель видит прежний текст, а не пустые карточки.
// ─────────────────────────────────────────────────────────────────────

// Слаг на лендинге -> ID тарифа в базе (совпадает с lk/src/data/planIdMap.js)
const PLAN_IDS = {
  fairy: 3,
  guardian: 4,
  wizard: 5,
};

// Порядок и подписи строк — те же, что в карточках ЛК
const LIMIT_ROWS = [
  ['fairy_tale_generation_limit', 'Сказки'],
  ['lullaby_generation_limit', 'Колыбельные'],
  ['therapic_generation_limit', 'Терапевтические'],
  ['family_stories_generation_limit', 'Семейные истории'],
  ['poems_generation_limit', 'Стихи'],
  ['stories_generation_limit', 'Рассказы'],
  ['voice_clones_limit', 'Голосовые двойники'],
];

function formatPrice(value, period) {
  const suffix = period === 'month' ? 'мес' : 'год';
  return `${Number(value).toLocaleString('ru-RU')} ₽ / ${suffix}`;
}

function renderLimits(container, plan) {
  const rows = LIMIT_ROWS
    .filter(([key]) => plan[key] != null)
    .map(
      ([key, label]) => `
        <div class="pricing-card__limit">
          <span>${label}</span>
          <strong>${plan[key]}</strong>
        </div>`
    )
    .join('');

  if (!rows) return;

  const note = plan.audio_format
    ? `<p class="pricing-card__limits-note">Формат аудио: ${String(plan.audio_format).toUpperCase()}${
        plan.has_time_capsule ? ' · Капсула времени' : ''
      }</p>`
    : '';

  container.innerHTML = `
    <p class="pricing-card__limits-title">Лимиты генерации в месяц</p>
    <div class="pricing-card__limits">${rows}</div>
    ${note}
  `;
}

function applyPlan(card, plan) {
  // Цена: обновляем и подписи для тумблера «Месяц/Год», и то, что видно сейчас
  const priceBlock = card.querySelector('[data-plan-price]');

  if (priceBlock) {
    if (plan.price_year) {
      priceBlock.dataset.priceYear = formatPrice(plan.price_year, 'year');
    }

    // У «Волшебника» месячной оплаты нет — атрибут не трогаем, чтобы
    // тумблер не показал годовую сумму как месячную.
    if (plan.price_month && priceBlock.dataset.priceMonth) {
      priceBlock.dataset.priceMonth = formatPrice(plan.price_month, 'month');
    }

    const priceEl = priceBlock.querySelector('.pricing-card__price');
    const activeBtn = document.querySelector('.pricing__billing-btn.is-active');
    const period = activeBtn?.dataset.billing === 'month' ? 'month' : 'year';

    const shown =
      period === 'month' && priceBlock.dataset.priceMonth
        ? priceBlock.dataset.priceMonth
        : priceBlock.dataset.priceYear;

    if (priceEl && shown) priceEl.textContent = shown;
  }

  const limitsBox = card.querySelector('[data-plan-limits]');
  if (limitsBox) renderLimits(limitsBox, plan);
}

export function initLivePricing() {
  const cards = document.querySelectorAll('[data-plan-slug]');
  if (!cards.length) return;

  cards.forEach(async (card) => {
    const planId = PLAN_IDS[card.dataset.planSlug];
    if (!planId) return;

    try {
      const res = await fetch(`/subscription/${planId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const plan = await res.json();
      applyPlan(card, plan);
    } catch (error) {
      // Молча остаёмся на статичном тексте — лендинг не должен
      // ломаться из-за недоступного бэкенда.
      console.warn(
        `Не удалось загрузить тариф ${card.dataset.planSlug}:`,
        error.message
      );
    }
  });
}
