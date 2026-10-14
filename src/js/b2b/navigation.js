/**
 * Навигация: мобильное меню и подсветка текущего раздела.
 */

/** Мобильное меню: бургер открывает панель, любая ссылка её закрывает. */
export function initMobileMenu() {
  const burger = document.querySelector('[data-burger]');
  const menu = document.querySelector('[data-mobile-menu]');

  if (!burger || !menu) return;

  const setOpen = (open) => {
    menu.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
  };

  burger.addEventListener('click', () => {
    setOpen(burger.getAttribute('aria-expanded') !== 'true');
  });

  menu.addEventListener('click', (event) => {
    if (event.target.closest('a')) setOpen(false);
  });

  // Панель рассчитана на узкие экраны; при развороте окна её нужно
  // убрать, иначе она останется висеть поверх обычного меню.
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1040) setOpen(false);
  });
}

/**
 * Подсветка пункта меню для секции, которая сейчас на экране.
 *
 * IntersectionObserver вместо слушателя scroll: браузер сам считает
 * пересечения, и на каждом пикселе прокрутки ничего не выполняется.
 * rootMargin сдвигает «активную» зону к верхней трети экрана — туда,
 * куда человек смотрит, а не к геометрическому центру.
 */
export function initSectionHighlight() {
  const links = Array.from(document.querySelectorAll('[data-nav-link]'));
  if (links.length === 0 || !('IntersectionObserver' in window)) return;

  const byId = new Map();

  links.forEach((link) => {
    const id = link.getAttribute('href')?.replace('#', '');
    if (!id) return;

    const section = document.getElementById(id);
    if (section) byId.set(section, link);
  });

  if (byId.size === 0) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        links.forEach((link) => link.classList.remove('is-active'));
        byId.get(entry.target)?.classList.add('is-active');
      });
    },
    { rootMargin: '-25% 0px -65% 0px' },
  );

  byId.forEach((_link, section) => observer.observe(section));
}
