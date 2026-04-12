import './src/scss/style.scss';

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
        listenBtn.textContent = isPlaying ? 'Остановить' : 'Послушать пример';
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