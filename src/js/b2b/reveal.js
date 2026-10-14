/**
 * Появление блоков при прокрутке.
 *
 * Начальное состояние (прозрачность 0) включается классом на <html> и
 * только отсюда. Если IntersectionObserver недоступен или анимации
 * отключены в системе, класс не ставится вовсе — и контент виден сразу,
 * а не остаётся невидимым навсегда.
 */
export function initReveal(root = document) {
  const targets = Array.from(root.querySelectorAll('[data-reveal]'));
  if (targets.length === 0) return;

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  document.documentElement.classList.add('rg-reveal-ready');

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // показали один раз — дальше не следим
      });
    },
    { rootMargin: '0px 0px -12% 0px', threshold: 0.08 },
  );

  targets.forEach((target) => observer.observe(target));
}
