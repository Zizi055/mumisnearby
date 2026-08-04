import './src/scss/style.scss';
import { initLivePricing } from './src/js/pricing-live.js';

// Цены и лимиты тарифов подтягиваются с бэка — те же данные, что в ЛК.
document.addEventListener('DOMContentLoaded', initLivePricing);

// Захватываем реферальный код из URL (?ref=CODE или /invite/CODE)
(function captureRefCode() {
  const params = new URLSearchParams(window.location.search);
  const refFromParam  = params.get('ref');
  const refFromPath   = window.location.pathname.match(/\/ref\/([A-Z0-9]+)/i)?.[1];
  const refFromInvite = window.location.pathname.match(/\/invite\/([A-Z0-9]+)/i)?.[1];
  const code = (refFromParam || refFromPath || refFromInvite || '').toUpperCase();
  if (code) {
    localStorage.setItem('ref_code', code);
  }
})();

// FAQ accordion
document.addEventListener('DOMContentLoaded', () => {
  const accordion = document.querySelector('[data-accordion]');

  if (accordion) {
    const items = accordion.querySelectorAll('.faq-item');

    const closeItem = (item) => {
      const trigger = item.querySelector('.faq-item__trigger');
      const content = item.querySelector('.faq-item__content');

      content.style.height = `${content.scrollHeight}px`;
      requestAnimationFrame(() => {
        content.style.height = '0px';
      });

      item.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    };

    const openItem = (item) => {
      const trigger = item.querySelector('.faq-item__trigger');
      const content = item.querySelector('.faq-item__content');

      item.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
      content.style.height = `${content.scrollHeight}px`;

      const onEnd = (e) => {
        if (e.propertyName !== 'height') return;
        if (!item.classList.contains('is-open')) return;

        content.style.height = 'auto';
        content.removeEventListener('transitionend', onEnd);
      };

      content.addEventListener('transitionend', onEnd);
    };

    items.forEach((item) => {
      const trigger = item.querySelector('.faq-item__trigger');
      const content = item.querySelector('.faq-item__content');

      content.style.height = '0px';

      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('is-open');

        items.forEach((otherItem) => {
          if (otherItem !== item && otherItem.classList.contains('is-open')) {
            closeItem(otherItem);
          }
        });

        if (isOpen) {
          closeItem(item);
        } else {
          if (content.style.height === 'auto') {
            content.style.height = `${content.scrollHeight}px`;
          }
          openItem(item);
        }
      });
    });

    window.addEventListener('resize', () => {
      items.forEach((item) => {
        if (!item.classList.contains('is-open')) return;

        const content = item.querySelector('.faq-item__content');
        content.style.height = `${content.scrollHeight}px`;

        requestAnimationFrame(() => {
          content.style.height = 'auto';
        });
      });
    });
  }

  // Constructor modal
  const builder = document.getElementById('builder');
  const openBtn = document.querySelector('[data-builder]');
  const closeBtn = document.querySelector('.builder__close');
  const options = document.querySelectorAll('.builder-option input');
  const totalEl = document.getElementById('totalPrice');
  const listEl = document.getElementById('summaryList');

  let basePrice = 6000;

  if (builder && openBtn && closeBtn && totalEl && listEl) {
    openBtn.addEventListener('click', () => {
      builder.classList.add('is-open');
    });

    closeBtn.addEventListener('click', () => {
      builder.classList.remove('is-open');
    });

    options.forEach((option) => {
      option.addEventListener('change', update);
    });

    function update() {
      let total = basePrice;
      listEl.innerHTML = `<div>Каркас — 6000 ₽</div>`;

      options.forEach((opt) => {
        if (opt.checked) {
          const price = +opt.dataset.price;
          const name = opt.parentElement.innerText.split('+')[0].trim();

          total += price;
          listEl.innerHTML += `<div>${name} — ${price} ₽</div>`;
        }
      });

      totalEl.innerText = total.toLocaleString() + ' ₽';
    }

    update();
  }

  // Hero audio
  const audio = document.getElementById('heroAudio');
  const playBtn = document.getElementById('playVoice');
  const listenBtn = document.getElementById('listenExample');

  if (audio && playBtn) {
    const setAudioState = (isPlaying) => {
      playBtn.classList.toggle('is-playing', isPlaying);
      playBtn.setAttribute('aria-pressed', String(isPlaying));

      if (listenBtn) {
        // Меняем только подпись. Раньше здесь стоял listenBtn.textContent,
        // который переписывал всё содержимое кнопки — вместе с иконкой.
        const label = listenBtn.querySelector('.btn__text') || listenBtn;
        label.textContent = isPlaying ? 'Остановить' : 'Послушать пример';
        listenBtn.classList.toggle('is-playing', isPlaying);
      }
    };

    const toggleAudio = async () => {
      try {
        if (audio.paused) {
          await audio.play();
        } else {
          audio.pause();
          audio.currentTime = 0;
        }
      } catch (e) {
        console.error('Ошибка аудио:', e);
      }
    };

    playBtn.addEventListener('click', toggleAudio);

    if (listenBtn) {
      listenBtn.addEventListener('click', toggleAudio);
    }

    audio.addEventListener('play', () => {
      setAudioState(true);
    });

    audio.addEventListener('pause', () => {
      if (!audio.ended) {
        setAudioState(false);
      }
    });

    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      setAudioState(false);
    });
  }
});
//audio why tech
const whyAudio = document.getElementById('whyAudio');
const whyPlay = document.getElementById('whyPlay');
const whyListen = document.getElementById('whyListen');

if (whyAudio && whyPlay) {
  const toggle = async () => {
    try {
      if (whyAudio.paused) {
        await whyAudio.play();
      } else {
        whyAudio.pause();
        whyAudio.currentTime = 0;
      }
    } catch (e) {
      console.error(e);
    }
  };

  whyPlay.addEventListener('click', toggle);
  if (whyListen) whyListen.addEventListener('click', toggle);

  whyAudio.addEventListener('play', () => {
    if (whyListen) {
      whyListen.textContent = 'Остановить';
      whyListen.classList.add('is-playing');
    }
  });

  whyAudio.addEventListener('ended', () => {
    whyAudio.currentTime = 0;
    if (whyListen) {
      whyListen.textContent = 'Послушать сказку';
      whyListen.classList.remove('is-playing');
    }
  });

  whyAudio.addEventListener('pause', () => {
    if (!whyAudio.ended && whyListen) {
      whyListen.textContent = 'Послушать сказку';
      whyListen.classList.remove('is-playing');
    }
  });
}
///Дропдаун меню
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  const dropdown = document.querySelector('.header__dropdown');
  const dropdownTrigger = document.querySelector('.header__dropdown-trigger');

  const burger = document.querySelector('.header__burger');
  const mobileMenu = document.querySelector('.header__mobile');

  const allNavLinks = document.querySelectorAll(
    '.header__link, .header__mobile-link, .header__dropdown-link'
  );

  // sticky header state
  window.addEventListener('scroll', () => {
    if (!header) return;
    header.classList.toggle('is-scrolled', window.scrollY > 10);
  });

  // dropdown
  if (dropdown && dropdownTrigger) {
    dropdownTrigger.addEventListener('click', () => {
      const isOpen = dropdown.classList.toggle('is-open');
      dropdownTrigger.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('is-open');
        dropdownTrigger.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // burger
  if (burger && mobileMenu) {
    burger.addEventListener('click', () => {
      const isOpen = burger.classList.toggle('is-open');
      mobileMenu.classList.toggle('is-open', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // close mobile menu after click
  allNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (burger && mobileMenu) {
        burger.classList.remove('is-open');
        mobileMenu.classList.remove('is-open');
        burger.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // scroll spy
  const navMap = new Map();

  allNavLinks.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href || !href.startsWith('#')) return;

    if (!navMap.has(href)) {
      navMap.set(href, []);
    }
    navMap.get(href).push(link);
  });

  const sections = [...navMap.keys()]
    .map((id) => document.querySelector(id))
    .filter(Boolean);

  const clearActiveLinks = () => {
    allNavLinks.forEach((link) => link.classList.remove('is-active'));
  };

  const setActiveLinks = (id) => {
    clearActiveLinks();
    const matchedLinks = navMap.get(id);
    if (!matchedLinks) return;
    matchedLinks.forEach((link) => link.classList.add('is-active'));
  };

  const updateActiveSection = () => {
    const scrollY = window.scrollY;
    const headerOffset = 120;

    let currentId = '';

    sections.forEach((section) => {
      const sectionTop = section.offsetTop - headerOffset;
      const sectionBottom = sectionTop + section.offsetHeight;

      if (scrollY >= sectionTop && scrollY < sectionBottom) {
        currentId = `#${section.id}`;
      }
    });

    if (currentId) {
      setActiveLinks(currentId);
    } else {
      clearActiveLinks();
    }
  };

  updateActiveSection();
  window.addEventListener('scroll', updateActiveSection);
  window.addEventListener('resize', updateActiveSection);
});
//Блок модалки при клике на кнопку "Связаться с нами"
const openButtons = document.querySelectorAll('[data-modal]');
const modals = document.querySelectorAll('[data-modal-window]');

openButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const id = btn.dataset.modal;
    const modal = document.querySelector(`[data-modal-window="${id}"]`);

    if (modal) {
      modal.classList.add('is-open');
      document.body.style.overflow = 'hidden';
    }
  });
});

modals.forEach(modal => {
  modal.addEventListener('click', e => {
    if (e.target.hasAttribute('data-modal-close')) {
      modal.classList.remove('is-open');
      document.body.style.overflow = '';
    }
  });
});

// ─── CTA → Регистрация ──────────────────────────────────────────────────────
// Все кнопки, которые должны вести на страницу регистрации в ЛК
document.addEventListener('DOMContentLoaded', () => {
  const REG_URL = '/lk/';

  // Навигация на регистрацию
  const toReg = () => { window.location.href = REG_URL; };

  // 1. Кнопки тарифов / «Оформить подписку» / «Записать бесплатно»
  document.querySelectorAll('.cadr-btn__one').forEach(btn => {
    btn.addEventListener('click', toReg);
  });

  // 2. Главный hero CTA «Создать голосового двойника»
  const heroPrimary = document.querySelector('.hero__actions .btn--primary');
  if (heroPrimary) heroPrimary.addEventListener('click', toReg);

  // 3. «Как это работает?» — плавная прокрутка к секции
  const heroGhost = document.querySelector('.hero__actions .btn--ghost');
  if (heroGhost) {
    heroGhost.addEventListener('click', () => {
      const target = document.getElementById('how-it-works');
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 4. «Попробовать» в секции voices-echo
  const echoCta = document.querySelector('.voices-echo__btn');
  if (echoCta) echoCta.addEventListener('click', toReg);

  // 5. «Попробовать» в footer
  const footerBtn = document.querySelector('.footer__button');
  if (footerBtn) footerBtn.addEventListener('click', toReg);

  // 6. «Подать заявку» (программа лояльности + how-it-works top)
  document.querySelectorAll('.loyalty-banner__btn, .how-it-works__top .btn--primary').forEach(btn => {
    btn.addEventListener('click', toReg);
  });

  // 7. Кнопка «Подробнее» на карточке конструктора (index.html) → конструктор
  const constructorBtn = document.querySelector('.card-btn__new');
  if (constructorBtn) constructorBtn.addEventListener('click', () => {
    window.location.href = '/constructor.html';
  });

  // 8. «Оформить тариф» внутри модалки конструктора (constructor.html)
  const builderSubmit = document.querySelector('.builder__submit');
  if (builderSubmit) builderSubmit.addEventListener('click', toReg);

  // 9. footer «Попробовать» на constructor.html (тег <a> без href)
  document.querySelectorAll('.footer__button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toReg();
    });
  });

  // 10. Слайдер программы лояльности
  const loyaltySlides = document.querySelectorAll('.loyalty-banner__card.is-slide');
  const loyaltyDots = document.querySelectorAll('.loyalty-banner__dot');

  function goToLoyaltySlide(index) {
    loyaltySlides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
    });
    loyaltyDots.forEach((dot, i) => {
      dot.classList.toggle('is-active', i === index);
    });
  }

  loyaltyDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      goToLoyaltySlide(Number(dot.dataset.dot));
    });
  });

  if (loyaltySlides.length > 1) {
    let loyaltyIndex = 0;
    setInterval(() => {
      loyaltyIndex = (loyaltyIndex + 1) % loyaltySlides.length;
      goToLoyaltySlide(loyaltyIndex);
    }, 6000);
  }
});

// ── Заявки: форма «Свяжитесь с нами» на главной (#forms) и модалка
// «Связаться с нами» на Конструкторе — обе помечены [data-lead-source]
// и шлются в одно и то же место (POST /leads), откуда попадают в
// админку (/lk/#/admin/leads). Эндпоинта на бэке пока нет — форма будет
// показывать ошибку отправки, пока бэкендер его не добавит; менять
// фронт для этого больше не нужно.
document.addEventListener('DOMContentLoaded', () => {
  const leadForms = document.querySelectorAll('[data-lead-source]');

  leadForms.forEach((form) => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const source = form.dataset.leadSource;
      const statusEl = form.querySelector('[data-form-status]');
      const submitBtn = form.querySelector('button[type="submit"]');

      const name  = form.querySelector('[name="name"]')?.value.trim()  || '';
      const email = form.querySelector('[name="email"]')?.value.trim() || '';
      const phone = form.querySelector('[name="phone"]')?.value.trim() || '';

      if (statusEl) {
        statusEl.textContent = '';
        statusEl.classList.remove('is-error', 'is-success');
      }

      if (!name || (!email && !phone)) {
        if (statusEl) {
          statusEl.textContent = 'Укажите имя и хотя бы один способ связи.';
          statusEl.classList.add('is-error');
        }
        return;
      }

      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch('/leads', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, phone, source }),
        });

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        form.reset();
        if (statusEl) {
          statusEl.textContent = 'Заявка отправлена — мы свяжемся с вами в ближайшее время.';
          statusEl.classList.add('is-success');
        }
      } catch (err) {
        if (statusEl) {
          statusEl.textContent = 'Не удалось отправить заявку, попробуйте ещё раз или напишите нам напрямую.';
          statusEl.classList.add('is-error');
        }
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  });
});
