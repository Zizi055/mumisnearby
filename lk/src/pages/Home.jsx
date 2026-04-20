import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  const openLK = () => {
    navigate('/dashboard/progress');
  };

  return (
    <div className="wrapper">
      <header className="header">
        <div className="container header__container">
          <a href="index.html" className="header__brand">Родные голоса</a>

          <nav className="header__nav" aria-label="Основная навигация">
            <a href="index.html" className="header__link is-active">Главная</a>
            <a href="#about" className="header__link">О проекте</a>
            <a href="#advantages" className="header__link">Преимущества</a>
            <a href="#pricing" className="header__link">Тарифы</a>
            <a href="#how-it-works" className="header__link">Как это работает</a>

            <div className="header__dropdown">
              <button
                className="header__dropdown-trigger"
                type="button"
                aria-expanded="false"
                aria-label="Открыть дополнительные разделы"
              >
                <span>Ещё</span>
                <span className="header__dropdown-icon">⌄</span>
              </button>

              <div className="header__dropdown-menu">
                <a href="/constructor.html" className="header__dropdown-link">Конструктор</a>
                <a href="#faq" className="header__dropdown-link">FAQ</a>
                <a href="#forms" className="header__dropdown-link">Связаться с нами</a>
                <a href="#contacts" className="header__dropdown-link">Контакты</a>
              </div>
            </div>
          </nav>

          <div className="header__actions">
            <button
              className="header__profile"
              type="button"
              onClick={openLK}
              aria-label="Профиль"
            >
              <img src="/src/assets/img/index/account.svg" alt="" />
            </button>

            <button
              className="header__burger"
              type="button"
              aria-label="Открыть меню"
              aria-expanded="false"
              aria-controls="mobileMenu"
            >
              <span></span>
              <span></span>
            </button>
          </div>
        </div>

        <div className="header__mobile" id="mobileMenu">
          <div className="header__mobile-inner">
            <a href="index.html" className="header__mobile-link">Главная</a>
            <a href="#about" className="header__mobile-link">О проекте</a>
            <a href="#advantages" className="header__mobile-link">Преимущества</a>
            <a href="#tariffs" className="header__mobile-link">Тарифы</a>
            <a href="#how-it-works" className="header__mobile-link">Как это работает</a>
            <a href="/constructor.html" className="header__mobile-link">Конструктор</a>
            <a href="#forms" className="header__dropdown-link">Связаться с нами</a>
            <a href="#faq" className="header__mobile-link">FAQ</a>
            <a href="#contacts" className="header__mobile-link">Контакты</a>
          </div>
        </div>
      </header>

      <section className="hero hero--split">
        <div className="hero__container">
          <div className="hero__grid">
            <div className="hero__content">
              <div className="hero__label">
                Технология нового поколения
              </div>

              <h1 className="hero__title">
                Ваш голос — это основной инстинкт
                спокойствия вашего ребёнка
              </h1>

              <p className="hero__lead">
                Теперь он может работать
                <span className="hero__lead-accent">на расстоянии</span>
              </p>

              <p className="hero__subtitle">
                Любовь, которую можно услышать
              </p>

              <div className="hero__actions">
                <button type="button" className="btn btn--primary hero__btn">
                  <span className="btn__text">Создать голосового двойника за 10 минут</span>
                  <span className="btn__icon">↗</span>
                </button>

                <button type="button" className="btn btn--ghost hero__btn">
                  <span className="btn__text">Как это работает?</span>
                </button>
              </div>
            </div>

            <div className="hero__visual">
              <div className="hero-card">
                <div className="hero-card__image" aria-hidden="true">
                  <img
                    src="/src/assets/img/index/dragon-Photoroom.png"
                    alt=""
                    className="hero-card__image-item"
                  />
                </div>

                <div className="hero-card__top">
                  <span className="hero-card__badge">AI Voice</span>
                </div>

                <h3 className="hero-card__title">
                  Голос остаётся рядом
                </h3>

                <p className="hero-card__text">
                  Даже если вы далеко — ребёнок слышит вас перед сном,
                  в дороге и в важные моменты
                </p>

                <div className="hero-card__player">
                  <div className="hero-card__demo">
                    <button
                      type="button"
                      className="hero-card__play"
                      id="playVoice"
                      aria-label="Воспроизвести пример"
                      aria-pressed="false"
                    >
                      <span className="hero-card__play-icon hero-card__play-icon--play">▶</span>
                      <span className="hero-card__play-icon hero-card__play-icon--pause">❚❚</span>
                    </button>

                    <div className="hero-card__wave" aria-hidden="true">
                      <span></span><span></span><span></span><span></span>
                    </div>
                  </div>

                  <div className="hero-card__progress-wrap">
                    <button
                      type="button"
                      className="hero-card__listen"
                      id="listenExample"
                    >
                      Послушать пример
                    </button>

                    <div className="hero-card__progress-block">
                      <div className="hero-card__time">
                        <span id="currentTime">0:00</span>
                        <span id="durationTime">0:00</span>
                      </div>

                      <div className="hero-card__progress" id="audioProgress" aria-label="Прогресс аудио">
                        <div className="hero-card__progress-bar" id="audioProgressBar"></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="hero-card__meta">
                  <span>1273 семьи</span>
                  <span>•</span>
                  <span>10 минут настройка</span>
                </div>

                <audio id="heroAudio" preload="metadata">
                  <source src="/audio/demo2mp3.mp3" type="audio/mpeg" />
                </audio>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="love-tech">
        <div className="container">
          <div className="love-tech__head">
            <div className="love-tech__intro">
              <h2 className="display-2 love-tech__title">
                Технология, в которой живёт любовь
              </h2>

              <p className="text-lg text-muted love-tech__text">
                Уже 1273 семьи читают сказки, убаюкивают и поддерживают малышей
                своим голосом, даже находясь за тысячи километров.
                Присоединяйтесь — это займёт 10 минут.
              </p>
            </div>

            <div className="love-tech__grid">
              <article className="love-tech-card love-tech-card--outline">
                <div className="love-tech-card__top">
                  <span className="love-tech-card__dot"></span>
                </div>

                <h3 className="heading-4 love-tech-card__title">
                  РАЗЛУКА УЧИТ ЕГО ЗАСЫПАТЬ
                  <br />
                  БЕЗ ВАС
                </h3>

                <p className="text-md love-tech-card__text">
                  Когда вечерний ритуал всё чаще заменяется экраном, ребёнок учится
                  засыпать не под ваш голос, а под внешний источник
                </p>
              </article>

              <article className="love-tech-card love-tech-card--soft">
                <div className="love-tech-card__top">
                  <span className="love-tech-card__dot"></span>
                </div>

                <h3 className="heading-4 love-tech-card__title">
                  ОН ДОВЕРЯЕТ АЛИСЕ БОЛЬШЕ,
                  <br />
                  ЧЕМ ВАМ
                </h3>

                <p className="text-md love-tech-card__text">
                  Он задаёт вопросы не вам, а устройству — потому что оно всегда
                  отвечает быстро и без пауз
                </p>
              </article>

              <article className="love-tech-card love-tech-card--accent">
                <div className="love-tech-card__top">
                  <span className="love-tech-card__dot"></span>
                </div>

                <h3 className="heading-4 love-tech-card__title">
                  ВЫ ИСЧЕЗАЕТЕ ИЗ ЕГО НАСТОЯЩЕГО
                </h3>

                <p className="text-md love-tech-card__text">
                  Вы рядом физически, но не в тех моментах, где формируются память,
                  эмоции и чувство близости
                </p>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works">
        <div className="how-it-works__top">
          <div className="container">
            <div className="how-it-works__top-inner">
              <div className="how-it-works__teaser">
                <p className="display-2 how-it-works__teaser-text">
                  Знакомо? Теперь у этой проблемы
                  есть простое и волшебное решение.
                </p>
              </div>

              <a className="btn btn--primary btn--arrow">
                <span className="btn__text">Подать заявку</span>
                <span className="btn__icon">
                  <svg viewBox="0 0 18 18" fill="none">
                    <path
                      d="M5 13L13 5M13 5H7M13 5V11"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
              </a>
            </div>
          </div>
        </div>

        <div className="how-it-works__body">
          <div className="container">
            <div className="how-it-works__inner">
              <div className="how-it-works__media">
                <div className="how-it-works__photo how-it-works__photo--top">
                  <img
                    src="/src/assets/img/index/hand.svg"
                    alt="Мама играет с ребёнком"
                    className="how-it-works__photo-image"
                  />
                </div>

                <div className="how-it-works__photo how-it-works__photo--bottom">
                  <img
                    src="/src/assets/img/index/boy.svg"
                    alt="Мама с ребёнком"
                    className="how-it-works__photo-image"
                  />
                </div>
              </div>

              <div className="how-it-works__content">
                <div className="how-it-works__intro">
                  <h2 className="display-2 how-it-works__title">Как это работает</h2>

                  <p className="text-lg text-muted how-it-works__description">
                    Это проще, чем кажется. Весь процесс займёт 10 минут.
                    А первый сказочный сценарий для теста мы подарим сразу
                  </p>
                </div>

                <div className="how-it-works__steps">
                  <article className="how-it-works-step">
                    <div className="how-it-works-step__icon" aria-hidden="true">
                      <img src="/src/assets/img/index/Chat.svg" alt="" className="how-it-works-step__icon-image" />
                    </div>

                    <div className="how-it-works-step__body">
                      <div className="how-it-works-step__head">
                        <h3 className="heading-4 how-it-works-step__title">ВЫ ГОВОРИТЕ 10 МИНУТ</h3>

                        <div className="how-it-works-step__marks" aria-hidden="true">
                          <span className="how-it-works-step__mark"></span>
                        </div>
                      </div>

                      <p className="text-md how-it-works-step__text">
                        Вы записываете свой голос — читаете небольшой текст.
                        Не нужно быть актёром. Нужно просто быть собой.
                        Наша технология улавливает сотни нюансов:
                        <strong>как вы смягчаете звуки, как меняете ритм, где улыбаетесь.</strong>
                      </p>
                    </div>
                  </article>

                  <article className="how-it-works-step">
                    <div className="how-it-works-step__icon" aria-hidden="true">
                      <img src="/src/assets/img/index/Virtual.svg" alt="" className="how-it-works-step__icon-image" />
                    </div>

                    <div className="how-it-works-step__body">
                      <div className="how-it-works-step__head">
                        <h3 className="heading-4 how-it-works-step__title">МЫ СОЗДАЁМ ЭХО 24 ЧАСА</h3>

                        <div className="how-it-works-step__marks" aria-hidden="true">
                          <span className="how-it-works-step__mark"></span>
                        </div>
                      </div>

                      <p className="text-md how-it-works-step__text">
                        Наша система, основанная на этичных и конфиденциальных принципах,
                        создаёт персональную голосовую модель.
                        <strong>Это ваш цифровой двойник, который будет говорить вашим голосом.</strong>
                      </p>
                    </div>
                  </article>

                  <article className="how-it-works-step">
                    <div className="how-it-works-step__icon" aria-hidden="true">
                      <img src="/src/assets/img/index/Books.svg" alt="" className="how-it-works-step__icon-image" />
                    </div>

                    <div className="how-it-works-step__body">
                      <div className="how-it-works-step__head">
                        <h3 className="heading-4 how-it-works-step__title">ВЫ ВЫБИРАЕТЕ ИСТОРИЮ 100+</h3>

                        <div className="how-it-works-step__marks" aria-hidden="true">
                          <span className="how-it-works-step__mark"></span>
                        </div>
                      </div>

                      <p className="text-md how-it-works-step__text">
                        Огромная библиотека проверенных сказок, терапевтических сценариев,
                        составленных детскими психологами, или ваш собственный текст.
                        <strong>Любящее письмо ребёнку, семейную историю, стихотворение.</strong>
                      </p>
                    </div>
                  </article>

                  <article className="how-it-works-step">
                    <div className="how-it-works-step__icon" aria-hidden="true">
                      <img src="/src/assets/img/index/Auditory.png" alt="" className="how-it-works-step__icon-image" />
                    </div>

                    <div className="how-it-works-step__body">
                      <div className="how-it-works-step__head">
                        <h3 className="heading-4 how-it-works-step__title">ОНИ СЛЫШАТ ВАС.</h3>

                        <div className="how-it-works-step__marks" aria-hidden="true">
                          <span className="how-it-works-step__mark"></span>
                        </div>
                      </div>

                      <p className="text-md how-it-works-step__text">
                        Ребёнок включает сказку и слышит ваш голос. Не похожий. Не другой.
                        Именно ваш. Он убаюкивает, утешает, рассказывает про драконов и принцесс,
                        помогает победить страх темноты или просто шепчет:
                        <strong>«Я рядом. Я люблю тебя».</strong>
                      </p>
                    </div>
                  </article>
                </div>

                <div className="how-it-works__footer">
                  <button
                    type="button"
                    className="btn btn--secondary btn--arrow label-md pricing-card__btn cadr-btn__one"
                    data-modal="plan-3"
                    aria-label="Оформить подписку на пакет Волшебник"
                  >
                    <span className="btn__text">Записать бесплатно</span>

                    <span className="btn__icon">
                      <svg viewBox="0 0 18 18" fill="none">
                        <path
                          d="M5 13L13 5M13 5H7M13 5V11"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="why-tech" id="advantages">
        <div className="container">
          <div className="why-tech__head">
            <div className="why-tech__intro">
              <h2 className="display-2 why-tech__title">
                Почему это больше, чем технология?
              </h2>

              <p className="text-lg text-muted why-tech__text">
                Потому что срабатывает на уровне инстинкта: мозг ребёнка
                запрограммирован успокаиваться на голос родителей. Всё, что мы
                сделали, — дали вам дистанционный пульт от этого врождённого механизма.
              </p>
            </div>
          </div>

          <div className="why-tech__layout">
            <div className="why-tech__side">
              <article className="why-tech-card why-tech-card--problem">
                <div className="why-tech-card__num">01</div>

                <h3 className="heading-4 why-tech-card__title">ПРОБЛЕМА</h3>

                <p className="text-md why-tech-card__text">
                  Ребёнок не спит, капризничает, скучает, а вы не можете быть рядом.
                </p>
              </article>

              <article className="why-tech-card why-tech-card--regular">
                <div className="why-tech-card__num">02</div>

                <h3 className="heading-4 why-tech-card__title">ОБЫЧНОЕ «РЕШЕНИЕ»</h3>

                <p className="text-md why-tech-card__text">
                  Чужая аудиокнига, мультик, уговоры по телефону. Работает плохо, потому
                  что не трогает струны привязанности.
                </p>
              </article>
            </div>

            <article className="why-tech-card why-tech-card--solution why-tech-card--hero">
              <div className="why-tech-card__num">03</div>

              <div className="why-tech-card__hero-top">
                <div className="why-tech-card__hero-copy">
                  <h3 className="heading-4 why-tech-card__title">НАШЕ РЕШЕНИЕ</h3>

                  <p className="text-md why-tech-card__text">
                    Вы включаете ребёнку ваш собственный голос, который читает проверенную
                    терапевтическую сказку. Срабатывает инстинкт. Ребёнок получает порцию
                    вашего спокойствия. Вы делаете дело.
                  </p>
                </div>

                <div className="why-tech-audio-box">
                  <div className="why-tech-audio-box__inner">
                    <button type="button" className="why-tech-audio-box__play" id="whyPlay" aria-label="Воспроизвести сказку">
                      ▶
                    </button>

                    <div className="why-tech-audio-box__wave" id="whyWave" aria-hidden="true">
                      <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>

                    <button type="button" className="why-tech-audio-box__cta" id="whyListen">
                      Послушать сказку
                    </button>
                  </div>

                  <audio id="whyAudio" preload="metadata">
                    <source src="/audio/demo.mp3" type="audio/mpeg" />
                    Ваш браузер не поддерживает аудио.
                  </audio>
                </div>
              </div>

              <div className="why-tech-card__hero-bottom">
                <div className="why-tech-card__hero-badge">Голос вместо расстояния</div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="loyalty-banner">
        <div className="loyalty-banner__body">
          <div className="container">
            <div className="loyalty-banner__card">
              <div className="loyalty-banner__left">
                <h2 className="heading-3 loyalty-banner__title">
                  Наша программа лояльности
                </h2>

                <div className="loyalty-banner__caterpillar" aria-hidden="true">
                  <img
                    src="/src/assets/img/index/улитка.svg"
                    alt="Caterpillar"
                    className="loyalty-banner__caterpillar-image"
                  />
                </div>
              </div>

              <div className="loyalty-banner__center">
                <div className="loyalty-banner__badge" aria-hidden="true">
                  <img
                    src="/src/assets/img/index/Discount.svg"
                    alt="Discount"
                    className="loyalty-banner__badge-image"
                  />
                </div>
              </div>

              <div className="loyalty-banner__right">
                <h3 className="heading-4 loyalty-banner__text">
                  Подтвердите статус многодетной семьи
                  и получите постоянную скидку 25 %
                </h3>
                <button
                  type="button"
                  className="btn btn--primary label-md loyalty-banner__btn"
                  aria-label="Подать заявку"
                >
                  <span className="btn__text">Подать заявку</span>
                  <span className="btn__icon">↗</span>
                </button>

                <div className="loyalty-banner__family" aria-hidden="true">
                  <img
                    src="/src/assets/img/index/family.svg"
                    alt="Family"
                    className="loyalty-banner__family-image"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="voices-echo">
        <div className="container">
          <div className="voices-echo__inner">
            <div className="voices-echo__content">
              <h2 className="display-2 voices-echo__title">
                «Родные голоса» — для тех, кто верит, что любовь можно записать.
                И проиграть снова.
              </h2>

              <div className="voices-echo__text-group">
                <p className="text-md voices-echo__text">
                  Для пилотов, смотрящих в ночное небо, и для их детей, засыпающих
                  под их историю про облака. Для врачей на суточном дежурстве, чей
                  голос может пожелать спокойной ночи. Для бабушек и дедушек из
                  другого города, чьи сказки должны стать наследством. Для пап в
                  командировках и мам на важных совещаниях. Для всех, чьё сердце
                  разрывается от мысли:
                  <strong>«Вот бы сейчас быть рядом».</strong>
                </p>

                <p className="text-md voices-echo__text">
                  Присоединяйтесь. Давайте сохраним самое ценное. Подарите своему
                  ребёнку эхо своего голоса. Это эхо будет звучать в нём всю жизнь.
                </p>
              </div>

              <button
                type="button"
                className="btn btn--primary label-md voices-echo__btn"
                aria-label="Попробовать"
              >
                <span className="btn__text">Попробовать</span>
                <span className="btn__icon">↗</span>
              </button>
            </div>

            <div className="voices-echo__media">
              <img
                src="/src/assets/img/index/deti2.svg"
                alt="Дети подняли руки вверх"
                className="voices-echo__image"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="audience">
        <div className="audience__body">
          <div className="container">
            <div className="audience__inner">
              <div className="audience__media">
                <div className="audience__photo audience__photo--top">
                  <img
                    src="/src/assets/img/index/mama3.svg"
                    alt="Мама с ребёнком"
                    className="audience__image"
                  />
                </div>

                <div className="audience__photo audience__photo--bottom">
                  <video
                    className="audience-tech__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/src/assets/video/mom.mp4"
                  >
                    <source src="/src/assets/video/mom.mp4" type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </div>
              </div>

              <div className="audience__content">
                <div className="audience__intro">
                  <h2 className="display-2 audience__title">Для кого?</h2>

                  <p className="text-lg audience__subtitle">
                    Подарите своему ребёнку эхо своего голоса.
                    Это эхо будет звучать в нём всю жизнь.
                  </p>
                </div>

                <div className="audience__list">
                  <article className="audience-card audience-card--featured">
                    <div className="audience-card__quote" aria-hidden="true">❝</div>

                    <div className="audience-card__body">
                      <h3 className="heading-4 audience-card__title">
                        Анна, 33 года, врач хирург
                      </h3>

                      <p className="text-md audience-card__text">
                        После ночной операции открываю приложение и включаю дочери
                        сказку, которую «рассказываю» я. Она спит, а я спокойна.
                        Мой голос бережно держит её сон. Между нами тишина,
                        наполненная смыслом: она — в мире грёз, я — в мире забот,
                        и всё равно мы рядом. Пусть я не в комнате, но я в её ночи.
                        Пусть она не слышит меня сейчас — моя любовь всё равно
                        доходит. Иногда быть мамой — это просто быть голосом, который
                        говорит: «Я с тобой. Даже когда ты спишь».
                      </p>
                    </div>
                  </article>

                  <article className="audience-card audience-card--white">
                    <div className="audience-card__quote" aria-hidden="true">❝</div>

                    <div className="audience-card__body">
                      <h3 className="heading-4 audience-card__title">
                        Родитель в командировке:
                      </h3>

                      <p className="text-md audience-card__text">
                        Чтобы мой “скоро приеду” звучал каждый вечер как новая глава
                        нашей общей сказки
                      </p>
                    </div>
                  </article>

                  <article className="audience-card audience-card--white">
                    <div className="audience-card__quote" aria-hidden="true">❝</div>

                    <div className="audience-card__body">
                      <h3 className="heading-4 audience-card__title">
                        Бабушка и дедушка в другом городе:
                      </h3>

                      <p className="text-md audience-card__text">
                        Чтобы наши сказки и колыбельные стали живым наследством,
                        а не воспоминанием
                      </p>
                    </div>
                  </article>

                  <article className="audience-card audience-card--white">
                    <div className="audience-card__quote" aria-hidden="true">❝</div>

                    <div className="audience-card__body">
                      <h3 className="heading-4 audience-card__title">
                        Работающий родитель:
                      </h3>

                      <p className="text-md audience-card__text">
                        Чтобы я мог закончить срочный проект, зная, что моё спокойствие
                        уже убаюкивает сына
                      </p>
                    </div>
                  </article>

                  <article className="audience-card audience-card--white">
                    <div className="audience-card__quote" aria-hidden="true">❝</div>

                    <div className="audience-card__body">
                      <h3 className="heading-4 audience-card__title">
                        Родитель на расстоянии:
                      </h3>

                      <p className="text-md audience-card__text">
                        Чтобы даже в разлуке ребёнок засыпал с ощущением, что вы рядом —
                        не через экран, а через знакомый, родной голос
                      </p>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pricing" id="pricing">
        <div className="container">
          <div className="pricing__head">
            <h2 className="display-2 pricing__title">Тарифы</h2>
            <p className="text-lg pricing__subtitle">
              Выберите подходящий для вас, остальное за вас сделаем мы
            </p>
          </div>

          <div className="pricing__grid">
            <article className="pricing-card pricing-card--soft" data-plan-card>
              <div className="pricing-card__badge" aria-hidden="true">
                <img
                  src="/src/assets/img/index/вввв 1.svg"
                  alt=""
                  className="pricing-card__badge-image"
                />
              </div>

              <div className="pricing-card__body">
                <h3 className="heading-3 pricing-card__title">
                  <span className="pricing-card__title-strong">Пакет 1:</span>
                  <span className="pricing-card__title-light">СКАЗОЧНИК</span>
                </h3>

                <p className="text-md pricing-card__lead">
                  Идеальный старт. Ваш голос оживляет классические сказки.
                </p>

                <ol className="pricing-card__list text-md">
                  <li>Создание 1 голосового двойника (родитель 1).</li>
                  <li>
                    <strong>Библиотека «Базовая»:</strong>
                    50 проверенных сказок и 10 колыбельных (обновление +10 в квартал).
                  </li>
                  <li>
                    <strong>Три простых терапевтических сценария на выбор (из 5 доступных):</strong>
                    «Засыпай-ка», «Не боюсь темноты», «Мамин лучик» (для сепарации).
                  </li>
                  <li>
                    <strong>Формат:</strong>
                    Прослушивание в MP3 безлимитно.
                  </li>
                  <li>
                    <strong>Поддержка:</strong>
                    Чат-бот + база знаний.
                  </li>
                </ol>
              </div>

              <div className="pricing-card__footer">
                <div className="pricing-card__price-block">
                  <p className="pricing-card__price-label">Подписка</p>
                  <p className="pricing-card__price">14 400 ₽ / год</p>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary btn--arrow label-md pricing-card__btn cadr-btn__one"
                  data-modal="plan-3"
                  aria-label="Оформить подписку на пакет Волшебник"
                >
                  <span className="btn__text">Оформить подписку</span>

                  <span className="btn__icon">
                    <svg viewBox="0 0 18 18" fill="none">
                      <path
                        d="M5 13L13 5M13 5H7M13 5V11"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </article>

            <article className="pricing-card pricing-card--light pricing-card--featured" data-plan-card>
              <div className="pricing-card__badge" aria-hidden="true">
                <img
                  src="/src/assets/img/index/character1.svg"
                  alt=""
                  className="pricing-card__badge-image"
                />
              </div>

              <div className="pricing-card__tag">Самый выгодный</div>

              <div className="pricing-card__body">
                <h3 className="heading-3 pricing-card__title">
                  <span className="pricing-card__title-strong">Пакет 2:</span>
                  <span className="pricing-card__title-light">ХРАНИТЕЛЬ</span>
                </h3>

                <p className="text-md pricing-card__lead">
                  Полноценное присутствие. Ваш голос растёт вместе с ребёнком, поддерживая и утешая.
                  <strong>Самый выгодный пакет</strong>
                </p>

                <ol className="pricing-card__list text-md">
                  <li>
                    Создание 2 голосовых двойников (родитель 1 + родитель 2/бабушка/дедушка).
                  </li>
                  <li>
                    <strong>Библиотека «Расширенная»:</strong>
                    100+ сказок, 10 колыбельных (обновление + 5 в месяц).
                  </li>
                  <li>
                    <strong>Полный доступ к «Мастерской сценариев»:</strong>
                    20+ терапевтических сценариев от психологов
                    (тревожность, адаптация, гнев, уверенность).
                  </li>
                  <li>
                    <strong>Формат:</strong>
                    Безлимитное прослушивание в MP3.
                  </li>
                  <li>
                    <strong>Приоритетная поддержка:</strong>
                    Email + чат в течение 24 ч.
                  </li>
                </ol>
              </div>

              <div className="pricing-card__footer">
                <div className="pricing-card__price-block">
                  <p className="pricing-card__price-label">Подписка</p>
                  <p className="pricing-card__price">24 400 ₽ / год</p>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary btn--arrow label-md pricing-card__btn cadr-btn__one"
                  data-modal="plan-3"
                  aria-label="Оформить подписку на пакет Волшебник"
                >
                  <span className="btn__text">Оформить подписку</span>

                  <span className="btn__icon">
                    <svg viewBox="0 0 18 18" fill="none">
                      <path
                        d="M5 13L13 5M13 5H7M13 5V11"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </article>

            <article className="pricing-card pricing-card--accent" data-plan-card>
              <div className="pricing-card__badge" aria-hidden="true">
                <img
                  src="/src/assets/img/index/character2.svg"
                  alt=""
                  className="pricing-card__badge-image"
                />
              </div>

              <div className="pricing-card__body">
                <h3 className="heading-3 pricing-card__title">
                  <span className="pricing-card__title-strong">Пакет 3:</span>
                  <span className="pricing-card__title-light">ВОЛШЕБНИК</span>
                </h3>

                <p className="text-md pricing-card__lead">
                  Голос как наследие. Ваша любовь, интонации и мудрость останутся с ребёнком
                  навсегда, в любой истории и в любом диалоге
                </p>

                <ol className="pricing-card__list text-md">
                  <li>
                    До 5 голосовых двойников
                    (родители, бабушки, дедушки, няня — «семейный круг»)
                  </li>
                  <li>
                    <strong>Безграничная библиотека + конструктор:</strong>
                    озвучка любого текста без ограничений + эксклюзивные сценарии
                  </li>
                  <li>
                    <strong>Терапевтический конструктор:</strong>
                    адаптация сценариев с куратором (2 сессии в год)
                  </li>
                  <li>
                    <strong>Капсула времени:</strong>
                    архив записи + подарочный формат
                    <br />
                    <span className="pricing-card__note">+15 000 ₽</span>
                  </li>
                  <li>
                    <strong>Персональный менеджер:</strong>
                    консьерж-поддержка
                  </li>
                  <li>
                    <strong>Формат:</strong>
                    MP3 + WAV
                  </li>
                  <li>
                    <strong>Лимиты:</strong>
                    отсутствуют
                  </li>
                </ol>
              </div>

              <div className="pricing-card__footer">
                <div className="pricing-card__price-block">
                  <p className="pricing-card__price-label">Подписка</p>
                  <p className="pricing-card__price">59 900 ₽ / год</p>
                </div>

                <button
                  type="button"
                  className="btn btn--secondary btn--arrow label-md pricing-card__btn cadr-btn__one"
                  data-modal="plan-3"
                  aria-label="Оформить подписку на пакет Волшебник"
                >
                  <span className="btn__text">Оформить подписку</span>

                  <span className="btn__icon">
                    <svg viewBox="0 0 18 18" fill="none">
                      <path
                        d="M5 13L13 5M13 5H7M13 5V11"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>
              </div>
            </article>

            <article className="pricing-card pricing-card--builder" data-plan-card>
              <div className="pricing-card__body">
                <h3 className="heading-3 pricing-card__title">
                  <span className="pricing-card__title-strong">Конструктор:</span>
                  <span className="pricing-card__title-light">СОБЕРИ САМ</span>
                </h3>

                <p className="text-md pricing-card__subtitle">Maximum Flexibility:</p>

                <p className="text-md pricing-card__text">
                  Собери сам — ты выбираешь форму, наполнение и логику конструктора под свои задачи.
                  Максимальная гибкость позволяет легко менять блоки, сценарии и элементы,
                  создавая уникальный продукт без ограничений шаблонами.
                </p>
              </div>

              <div className="pricing-card__footer">
                <a className="btn btn--primary btn--arrow card-btn__new">
                  <span className="btn__text">Подробнее</span>
                  <span className="btn__icon">
                    <svg viewBox="0 0 18 18" fill="none">
                      <path
                        d="M5 13L13 5M13 5H7M13 5V11"
                        stroke="currentColor"
                        strokeWidth="1.8"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </a>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="about" id="about">
        <div className="container">
          <div className="about__head">
            <h2 className="display-2 about__title">О проекте</h2>
          </div>

          <div className="about__grid">
            <div className="about__content">
              <p className="about__eyebrow">Почему это работает</p>
              <p className="about__quote">
                “Самый важный звук детства — это вы. Давайте сохраним его.”
              </p>
              <div className="about__eyebrow">Технология с человеческим смыслом</div>
              <div className="about__text">
                <p>
                  Есть то, что не сфотографировать и не положить на полку. Тихий смех мамы, когда герой сказки попадает впросак. Уверенное бормотание папы, читающего про паровозы. Шёпот бабушки, от которого ресницы сами становятся тяжелыми.
                </p>

                <p>
                  Это звуковой портрет любви, который ваш ребёнок будет помнить всю жизнь. Но реальность вносит поправки. Рейс отменяется. Совещание затягивается. Вы смотрите на часы — и понимаете, что опять пропускаете самый важный ритуал. А там дома, ждёт ваш самый строгий судья. Мы не нашли волшебной палочки, чтобы быть в двух местах сразу.
                </p>

                <p>
                  Но мы нашли способ отправить ваше спокойствие — вперёд вас самих. Скопировать ту самую интонацию, которая работает безотказно. И доставить её ребёнку ровно в 21:00, даже если вы в это время будете смотреть в иллюминатор.
                </p>
              </div>
            </div>

            <div className="about__content about__content--right">
              <div className="about__text">
                <p>
                  Наша технология — это не клон. Это — эхо. Ваше личное, запрограммированное эхо, которое всегда найдёт дорогу к детской кроватке, чтобы шепнуть: <strong>«Спокойной ночи. Я рядом».</strong>
                </p>

                <p>
                  <strong>«Родные голоса» — </strong>это технология, которую мы наполнили смыслом. Это цифровой слепок вашего уникального голоса, который становится мостом между вами и вашим ребёнком.
                </p>

                <p className="about__note">
                  Это не холодный искусственный интеллект — это ваши интонации, ваша манера говорить, ваше тепло, преобразованное в данные и возвращённое обратно в мир — в виде сказок, бесед и успокоения
                </p>

                <p className="about__add">
                  И это не про технологии. то про связь, которая не обрывается.
                  Про возможность быть рядом — даже когда расстояние между вами
                  измеряется не шагами, а километрами.
                  Это про ощущение, которое остаётся с ребёнком — тихое,
                  устойчивое, настоящее: что его любят, слышат и никогда
                  по-настоящему не оставляют.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="guarantees" id="guarantees">
        <div className="container">
          <div className="guarantees__head">
            <h2 className="display-2 guarantees__title">Наши гарантии</h2>
          </div>

          <div className="guarantees__grid">
            <article className="guarantee-card guarantee-card--outline">
              <div className="guarantee-card__num">01</div>
              <div className="guarantee-card__body">
                <h3 className="heading-3 guarantee-card__title">
                  3 ДНЯ БЕСПЛАТНОГО
                  <br />
                  ТЕСТА ДЛЯ ГОДОВОЙ
                  <br />
                  ПОДПИСКИ
                </h3>

                <p className="text-md guarantee-card__text">
                  Попробуйте все возможности сервиса и убедитесь, что он подходит вашей
                  семье — прежде чем оформить подписку.
                </p>
              </div>
            </article>

            <article className="guarantee-card guarantee-card--soft">
              <div className="guarantee-card__num">02</div>

              <div className="guarantee-card__body">
                <h3 className="heading-3 guarantee-card__title">
                  ВОЗВРАТ ДЕНЕГ
                  <br />
                  ЗА НЕИСПОЛЬЗОВАННЫЙ
                  <br />
                  ПЕРИОД ПРИ ОТМЕНЕ
                </h3>

                <p className="text-md guarantee-card__text">
                  Если вы решите отменить подписку, мы вернём деньги за оставшийся
                  неиспользованный период — честно и без лишних вопросов.
                </p>
              </div>
            </article>

            <article className="guarantee-card guarantee-card--accent">
              <div className="guarantee-card__num">03</div>

              <div className="guarantee-card__body">
                <h3 className="heading-3 guarantee-card__title">
                  ЗАМОРОЗКА ПОДПИСКИ НА 60
                  <br />
                  ДНЕЙ В ГОДУ
                </h3>

                <p className="text-md guarantee-card__text">
                  При необходимости вы можете приостановить подписку до 60 дней в году
                  — удобно для длительных поездок, отпусков или пауз без потери доступа.
                </p>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="contact-block" id="forms">
        <div className="contact-block__body">
          <div className="container">
            <div className="contact-block__inner">
              <div className="contact-block__content">
                <div className="contact-block__intro">
                  <h2 className="display-2 contact-block__title">Свяжитесь с нами</h2>

                  <p className="text-lg contact-block__text">
                    Напишите нам — мы ответим на любые вопросы, поможем разобраться
                    и подскажем лучшее решение именно для вас. Мы всегда рядом
                    и готовы помочь.
                  </p>
                </div>

                <div className="contact-block__illustration" aria-hidden="true">
                  <video
                    className="why-tech__video"
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    poster="/src/assets/video/dracon3.mov"
                  >
                    <source src="/src/assets/video/dracon3.mov" type="video/mp4" />
                    Ваш браузер не поддерживает видео.
                  </video>
                </div>
              </div>

              <div className="contact-block__form-wrap">
                <form className="contact-form" action="#" method="post">
                  <div className="contact-form__field">
                    <label className="text-md contact-form__label" htmlFor="contact-name">Имя</label>
                    <input
                      className="contact-form__input"
                      type="text"
                      id="contact-name"
                      name="name"
                      placeholder="Ваше имя"
                      autoComplete="name"
                    />
                  </div>

                  <div className="contact-form__field">
                    <label className="text-md contact-form__label" htmlFor="contact-email">E-mail</label>
                    <input
                      className="contact-form__input"
                      type="email"
                      id="contact-email"
                      name="email"
                      placeholder="Ваш e-mail"
                      autoComplete="email"
                    />
                  </div>

                  <div className="contact-form__field">
                    <label className="text-md contact-form__label" htmlFor="contact-phone">Телефон</label>
                    <input
                      className="contact-form__input"
                      type="tel"
                      id="contact-phone"
                      name="phone"
                      placeholder="Ваш телефон"
                      autoComplete="tel"
                    />
                  </div>

                  <div className="contact-form__actions">
                    <button
                      type="button"
                      className="btn btn--secondary btn--arrow label-md pricing-card__btn cadr-btn__one"
                      data-modal="plan-3"
                      aria-label="Оформить подписку на пакет Волшебник"
                    >
                      <span className="btn__text">Связаться с нами</span>

                      <span className="btn__icon">
                        <svg viewBox="0 0 18 18" fill="none">
                          <path
                            d="M5 13L13 5M13 5H7M13 5V11"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </button>
                  </div>

                  <label className="contact-form__agree">
                    <input
                      className="contact-form__checkbox"
                      type="checkbox"
                      name="policy"
                      required
                    />
                    <span className="contact-form__checkbox-ui" aria-hidden="true"></span>
                    <span className="text-sm contact-form__agree-text">
                      Отправляя форму, вы подтверждаете согласие на обработку
                      персональных данных согласно политике сайта
                    </span>
                  </label>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="faq" id="faq">
        <div className="faq__container">
          <h2 className="display-2 faq__title">Часто задаваемые вопросы</h2>

          <div className="faq__list" data-accordion>
            <article className="faq-item">
              <button
                className="faq-item__trigger"
                type="button"
                aria-expanded="false"
                aria-controls="faq-content-1"
                id="faq-trigger-1"
              >
                <span className="faq-item__question">Это безопасно?</span>
                <span className="faq-item__icon" aria-hidden="true"></span>
              </button>

              <div
                className="faq-item__content"
                id="faq-content-1"
                role="region"
                aria-labelledby="faq-trigger-1"
              >
                <div className="faq-item__content-inner">
                  <p>
                    Да. Данные пользователя обрабатываются в защищённой среде, а доступ
                    к ним строго ограничен. Мы используем современные меры безопасности
                    и не передаём голосовые данные третьим лицам без согласия.
                  </p>
                </div>
              </div>
            </article>

            <article className="faq-item">
              <button
                className="faq-item__trigger"
                type="button"
                aria-expanded="false"
                aria-controls="faq-content-2"
                id="faq-trigger-2"
              >
                <span className="faq-item__question">Где хранится мой голос?</span>
                <span className="faq-item__icon" aria-hidden="true"></span>
              </button>

              <div
                className="faq-item__content"
                id="faq-content-2"
                role="region"
                aria-labelledby="faq-trigger-2"
              >
                <div className="faq-item__content-inner">
                  <p>
                    Голосовые данные хранятся на защищённых серверах с ограниченным
                    доступом. Архитектура хранения организована так, чтобы минимизировать
                    риски несанкционированного доступа.
                  </p>
                </div>
              </div>
            </article>

            <article className="faq-item">
              <button
                className="faq-item__trigger"
                type="button"
                aria-expanded="false"
                aria-controls="faq-content-3"
                id="faq-trigger-3"
              >
                <span className="faq-item__question">Насколько голос похож?</span>
                <span className="faq-item__icon" aria-hidden="true"></span>
              </button>

              <div
                className="faq-item__content"
                id="faq-content-3"
                role="region"
                aria-labelledby="faq-trigger-3"
              >
                <div className="faq-item__content-inner">
                  <p>
                    Сходство зависит от качества исходной записи, но при хорошем
                    материале результат получается очень близким по тембру, интонации
                    и общей подаче.
                  </p>
                </div>
              </div>
            </article>

            <article className="faq-item">
              <button
                className="faq-item__trigger"
                type="button"
                aria-expanded="false"
                aria-controls="faq-content-4"
                id="faq-trigger-4"
              >
                <span className="faq-item__question">Что если не понравится?</span>
                <span className="faq-item__icon" aria-hidden="true"></span>
              </button>

              <div
                className="faq-item__content"
                id="faq-content-4"
                role="region"
                aria-labelledby="faq-trigger-4"
              >
                <div className="faq-item__content-inner">
                  <p>
                    В таком случае можно внести корректировки, улучшить исходный материал
                    или пересобрать результат с учётом ваших пожеланий.
                  </p>
                </div>
              </div>
            </article>

            <article className="faq-item">
              <button
                className="faq-item__trigger"
                type="button"
                aria-expanded="false"
                aria-controls="faq-content-5"
                id="faq-trigger-5"
              >
                <span className="faq-item__question">А если я передумаю?</span>
                <span className="faq-item__icon" aria-hidden="true"></span>
              </button>

              <div
                className="faq-item__content"
                id="faq-content-5"
                role="region"
                aria-labelledby="faq-trigger-5"
              >
                <div className="faq-item__content-inner">
                  <p>
                    Вы сможете запросить удаление данных и остановить использование
                    голоса в рамках действующих условий сервиса.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      <footer className="footer" id="contacts">
        <div className="footer__wave" aria-hidden="true">
          <svg viewBox="0 0 1440 120" preserveAspectRatio="none">
            <path
              d="M0,20 
                 C60,40 90,75 140,70
                 C190,65 220,20 300,20
                 C380,20 420,65 480,65
                 C540,65 570,20 660,20
                 C750,20 780,65 840,65
                 C900,65 930,20 1020,20
                 C1110,20 1140,65 1200,70
                 C1260,75 1320,40 1440,0
                 L1440,120 L0,120 Z"
              fill="#18181b"
            />
          </svg>
        </div>

        <div className="footer__body">
          <div className="footer__container">
            <div className="footer__top">
              <div className="footer__brand">
                <h2 className="footer__title">Родные голоса</h2>
                <p className="footer__subtitle">
                  Для тех, кто верит, что любовь можно записать.
                  <br />
                  И проиграть снова.
                </p>
              </div>

              <nav className="footer__nav" aria-label="Навигация по сайту">
                <ul className="footer__menu">
                  <li className="footer__menu-item"><a href="#about">О проекте</a></li>
                  <li className="footer__menu-item"><a href="#advantages">Преимущества</a></li>
                  <li className="footer__menu-item"><a href="#tariffs">Тарифы</a></li>
                  <li className="footer__menu-item"><a href="#how-it-works">Как это работает</a></li>
                  <li className="footer__menu-item"><a href="#contacts">Контакты</a></li>
                </ul>
              </nav>

              <div className="footer__details">
                <p>Индивидуальный предприниматель</p>
                <p>Бабочкин Вячеслав Вячеславович</p>
                <p>ИНН 343534427084</p>
                <p>Расчетный счет</p>
                <p>40802810000008656886</p>
                <p>АО «Т-Банк»</p>
              </div>

              <div className="footer__cta">
                <div className="footer__socials">
                  <a href="#" className="footer__social" aria-label="Позвонить">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M21 16.42V19A2 2 0 0 1 18.82 21C9.87 21 3 14.13 3 5.18A2 2 0 0 1 5 3h2.58a2 2 0 0 1 1.98 1.72l.38 2.65a2 2 0 0 1-.57 1.72l-1.27 1.27a16 16 0 0 0 5.66 5.66l1.27-1.27a2 2 0 0 1 1.72-.57l2.65.38A2 2 0 0 1 21 16.42Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                </div>

                <a href="#" className="footer__button">
                  <span>Попробовать</span>
                  <span className="footer__button-icon">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M5 13L13 5M13 5H7M13 5V11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                </a>

                <p className="footer__note">
                  Подарите ребёнку главный звук детства.
                  <br />
                  Начните бесплатно прямо сейчас
                </p>
              </div>
            </div>

            <div className="footer__bottom">
              <div className="footer__copyright">
                <p>Все права защищены. 2026</p>
                <p>
                  Весь контент сайта защищен авторским правом
                  <br />
                  и принадлежит правообладателю.
                </p>
              </div>

              <a href="#" className="footer__policy">Политика конфиденциальности данных</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}