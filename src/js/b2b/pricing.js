// Переключатель срока на тарифах. На карточке всегда одна цена —
// та, что соответствует выбранной кнопке. «Волшебник» годовой:
// на коротких сроках сумма не подменяется месячной, остаётся
// пояснение, что этот план только на 12 месяцев.

const NOTES = {
  12: 'за сотрудника на 12 месяцев',
  3: 'за сотрудника на 3 месяца',
  1: 'за сотрудника в месяц',
};

export function initPricing() {
  const root = document.querySelector('[data-pricing]');
  if (!root) return;

  const buttons = [...root.querySelectorAll('[data-period]')];
  const cards = [...root.querySelectorAll('[data-plan-price]')];

  function apply(period) {
    buttons.forEach((button) => {
      const active = button.dataset.period === period;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-selected', active ? 'true' : 'false');
    });

    cards.forEach((card) => {
      const amount = card.querySelector('.rg-plan__amount');
      const note = card.querySelector('[data-plan-note]');
      const yearOnly = card.hasAttribute('data-year-only');
      const unavailable = yearOnly && period !== '12';

      card.classList.toggle('is-unavailable', unavailable);

      if (amount) {
        const value = card.getAttribute(`data-price-${period}`)
          || card.getAttribute('data-price-12');
        if (value) amount.textContent = value;
      }

      if (note) {
        note.textContent = unavailable ? 'Только на 12 месяцев' : NOTES[period];
      }
    });
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => apply(button.dataset.period));
  });

  apply('12');
}
