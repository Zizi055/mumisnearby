/**
 * Аккордеон FAQ.
 *
 * Высота анимируется в пикселях, а не через max-height «с запасом»:
 * произвольный максимум либо обрезает длинный ответ, либо растягивает
 * переход у короткого. После раскрытия высота переводится в auto —
 * иначе ответ поедет при смене ширины окна.
 */
export function initAccordion(root = document.querySelector('[data-accordion]')) {
  if (!root) return;

  const items = Array.from(root.querySelectorAll('[data-accordion-item]'));

  const close = (item) => {
    const content = item.querySelector('[data-accordion-content]');
    const trigger = item.querySelector('[data-accordion-trigger]');

    content.style.height = `${content.scrollHeight}px`;
    requestAnimationFrame(() => {
      content.style.height = '0px';
    });

    item.classList.remove('is-open');
    trigger.setAttribute('aria-expanded', 'false');
  };

  const open = (item) => {
    const content = item.querySelector('[data-accordion-content]');
    const trigger = item.querySelector('[data-accordion-trigger]');

    item.classList.add('is-open');
    trigger.setAttribute('aria-expanded', 'true');
    content.style.height = `${content.scrollHeight}px`;

    const onEnd = (event) => {
      if (event.propertyName !== 'height') return;
      if (!item.classList.contains('is-open')) return;

      content.style.height = 'auto';
      content.removeEventListener('transitionend', onEnd);
    };

    content.addEventListener('transitionend', onEnd);
  };

  items.forEach((item) => {
    const trigger = item.querySelector('[data-accordion-trigger]');
    if (!trigger) return;

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('is-open');

      items.forEach((other) => {
        if (other !== item && other.classList.contains('is-open')) close(other);
      });

      if (isOpen) close(item);
      else open(item);
    });
  });
}
