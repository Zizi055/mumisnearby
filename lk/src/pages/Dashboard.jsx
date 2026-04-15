import { useEffect, useState } from 'react';
import Layout from '../components/layout/Layout';

const DASHBOARD_TAB_KEY = 'lk-dashboard-tab-v1';

const dashboardTabs = {
  progress: 'Прогрессбар',
  activity: 'Активность',
  support: 'Поддержка',
};

const todayStories = [
  {
    id: 1,
    type: 'Сказка',
    title: 'О мальчике и лисе',
    age: '3-6 лет',
    image: '/dashboard/card-fox.jpg',
  },
  {
    id: 2,
    type: 'Сказка',
    title: 'О мальчике и лисе',
    age: '3-6 лет',
    image: '/dashboard/card-friends.jpg',
  },
  {
    id: 3,
    type: 'Колыбельная',
    title: 'Спокойной ночи, малыш',
    age: '3-6 лет',
    image: '/dashboard/card-girl.jpg',
  },
  {
    id: 4,
    type: 'Терапия',
    title: 'Терапевтическое упражнение',
    age: '3-6 лет',
    image: '/dashboard/card-sleep.jpg',
  },
];

const activityItems = [
  {
    id: 1,
    title: 'Друзья в лесу',
    time: '5 минут назад',
    avatar: '/dashboard/activity-avatar-1.png',
  },
  {
    id: 2,
    title: 'Мальчик и лис',
    time: 'Вчера, 17:15',
    avatar: '/dashboard/activity-avatar-2.png',
  },
  {
    id: 3,
    title: 'Оплата тарифного плана “Хранитель”',
    time: '11.01.2026, 16:30',
    avatar: '/dashboard/activity-avatar-3.png',
  },
  {
    id: 4,
    title: 'Верные друзья',
    time: '11.01.2026, 16:30',
    avatar: '/dashboard/activity-avatar-4.png',
  },
  {
    id: 5,
    title: 'Мальчик и собака',
    time: '11.01.2026, 16:30',
    avatar: '/dashboard/activity-avatar-5.png',
  },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(DASHBOARD_TAB_KEY) || 'progress';
  });

  useEffect(() => {
    localStorage.setItem(DASHBOARD_TAB_KEY, activeTab);
  }, [activeTab]);

  return (
    <Layout
      dashboardMenu={{
        activeTab,
        onChangeTab: setActiveTab,
        items: [
          { key: 'progress', label: dashboardTabs.progress },
          { key: 'activity', label: dashboardTabs.activity },
          { key: 'support', label: dashboardTabs.support },
        ],
      }}
    >
      <section className="lk-page lk-page--dashboard">
        <div className="lk-page__inner">
          {activeTab === 'progress' && <DashboardProgress />}
          {activeTab === 'activity' && <DashboardActivity />}
          {activeTab === 'support' && <DashboardSupport />}
        </div>
      </section>
    </Layout>
  );
}

function DashboardProgress() {
  return (
    <>
      <section className="lk-section lk-section--first">
        <div className="lk-stats">
          <article className="lk-stats__item lk-stats__item--accent">
            <div className="lk-stats__top">
              <span className="lk-stats__icon">🎙</span>
              <span className="lk-stats__icon">〰</span>
            </div>
            <div className="lk-stats__value">2</div>
            <div className="lk-stats__label">Активных голоса</div>
          </article>

          <article className="lk-stats__item">
            <div className="lk-stats__value">220</div>
            <div className="lk-stats__label">Проиграно</div>
          </article>

          <article className="lk-stats__item lk-stats__item--accent-soft">
            <div className="lk-stats__value">8 минут</div>
            <div className="lk-stats__label">Средняя сессия</div>
          </article>

          <article className="lk-stats__item lk-stats__item--tariff">
            <div className="lk-stats__value">Хранитель</div>
            <div className="lk-stats__badge">Тариф</div>
          </article>
        </div>
      </section>

      <section className="lk-section">
        <div className="lk-section__head">
          <div>
            <h2 className="lk-section__title">Добро пожаловать, Мария</h2>
            <p className="lk-section__text">Ваша модель голоса записана</p>
          </div>
        </div>

        <article className="lk-hero-card lk-hero-card--image">
          <img
            className="lk-hero-card__image"
            src="/dashboard/hero-forest.jpg"
            alt="Лесные друзья"
          />

          <div className="lk-hero-card__overlay">
            <div className="lk-hero-card__content">
              <div className="lk-hero-card__eyebrow">Продолжить прослушивание</div>
              <h3 className="lk-hero-card__title">Лесные друзья</h3>

              <div className="lk-hero-card__meta">
                <span className="lk-hero-card__age">3-6 лет</span>
                <span className="lk-hero-card__time">7 минут</span>
              </div>

              <span className="lk-hero-card__badge">Сказка</span>
            </div>

            <div className="lk-hero-card__actions">
              <button type="button" className="lk-icon-btn">▶</button>
              <button type="button" className="lk-icon-btn">◻</button>
            </div>
          </div>
        </article>
      </section>

      <section className="lk-section">
        <div className="lk-section__head">
          <div>
            <h2 className="lk-section__title">Подборка на сегодня</h2>
          </div>
        </div>

        <div className="lk-story-grid">
          {todayStories.map((story) => (
            <article key={story.id} className="lk-story-card lk-story-card--image">
              <div className="lk-story-card__image-wrap">
                <img
                  className="lk-story-card__image-real"
                  src={story.image}
                  alt={story.title}
                />
                <span className="lk-story-card__type-badge">{story.type}</span>
              </div>

              <div className="lk-story-card__body">
                <span className="lk-story-card__type">{story.type}</span>
                <h3 className="lk-story-card__title">{story.title}</h3>
                <div className="lk-story-card__age">{story.age}</div>
              </div>

              <button type="button" className="lk-story-card__play">▶</button>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function DashboardActivity() {
  return (
    <section className="lk-dashboard-activity">
      <div className="lk-dashboard-activity__top">
        <div className="lk-dashboard-card">
          <h2 className="lk-dashboard-card__title">Быстрые действия</h2>

          <div className="lk-dashboard-actions">
            <button type="button" className="lk-dashboard-action">
              <span className="lk-dashboard-action__icon">＋</span>
              <span className="lk-dashboard-action__text">Пригласить друга</span>
            </button>

            <button type="button" className="lk-dashboard-action">
              <span className="lk-dashboard-action__icon">👥</span>
              <span className="lk-dashboard-action__text">Управление семей</span>
            </button>

            <button type="button" className="lk-dashboard-action">
              <span className="lk-dashboard-action__icon">🎙</span>
              <span className="lk-dashboard-action__text">Создать мой голос</span>
            </button>
          </div>
        </div>

        <div className="lk-dashboard-card">
          <h2 className="lk-dashboard-card__title">Активная подписка</h2>

          <div className="lk-dashboard-actions">
            <button type="button" className="lk-dashboard-action">
              <span className="lk-dashboard-action__icon">🔖</span>
              <span className="lk-dashboard-action__text">
                Ваш тарифный план “Хранитель”
              </span>
            </button>

            <button type="button" className="lk-dashboard-action">
              <span className="lk-dashboard-action__icon">👤</span>
              <span className="lk-dashboard-action__text">Сменить тариф</span>
            </button>
          </div>
        </div>
      </div>

      <div className="lk-dashboard-history">
        <h2 className="lk-dashboard-history__title">Последняя активность</h2>

        <div className="lk-dashboard-history__table">
          <div className="lk-dashboard-history__head">История изменений</div>

          <div className="lk-dashboard-history__list">
            {activityItems.map((item) => (
              <div key={item.id} className="lk-dashboard-history__row">
                <div className="lk-dashboard-history__left">
                  <img
                    className="lk-dashboard-history__avatar"
                    src={item.avatar}
                    alt={item.title}
                  />
                  <span className="lk-dashboard-history__name">{item.title}</span>
                </div>

                <div className="lk-dashboard-history__time">{item.time}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardSupport() {
  return (
    <section className="lk-dashboard-support">
      <div className="lk-dashboard-support__hero">
        <div className="lk-dashboard-support__hero-left">
          <img
            className="lk-dashboard-support__hero-image"
            src="/dashboard/support-mom.png"
            alt="Поддержка"
          />
        </div>

        <div className="lk-dashboard-support__hero-center">
          <h2 className="lk-dashboard-support__title">Чем мы можем вам помочь?</h2>
          <p className="lk-dashboard-support__text">
            Напишите или позвоните нам и мы ответим на все ваши вопросы
          </p>
        </div>

        <div className="lk-dashboard-support__hero-right">
          <img
            className="lk-dashboard-support__hero-image"
            src="/dashboard/support-dragon.png"
            alt="Помощник"
          />
        </div>
      </div>

      <div className="lk-dashboard-support__grid">
        <article className="lk-support-card">
          <div className="lk-support-card__icon-wrap">
            <img src="/dashboard/icon-chat.png" alt="Чат" className="lk-support-card__icon" />
          </div>
          <div className="lk-support-card__content">
            <h3 className="lk-support-card__title">Напишите нам в чат поддержки</h3>
            <p className="lk-support-card__text">Мы на связи 24/7</p>
          </div>
        </article>

        <article className="lk-support-card">
          <div className="lk-support-card__icon-wrap">
            <img src="/dashboard/icon-mail.png" alt="Email" className="lk-support-card__icon" />
          </div>
          <div className="lk-support-card__content">
            <h3 className="lk-support-card__title">Напишите нам на e-mail</h3>
            <p className="lk-support-card__text">info@rodnyegolosa.ru</p>
          </div>
        </article>

        <article className="lk-support-card">
          <div className="lk-support-card__icon-wrap">
            <img src="/dashboard/icon-phone.png" alt="Телефон" className="lk-support-card__icon" />
          </div>
          <div className="lk-support-card__content">
            <h3 className="lk-support-card__title">Позвоните нам на горячую линию</h3>
            <p className="lk-support-card__text">8 800 000 00 00</p>
          </div>
        </article>

        <article className="lk-support-card">
          <div className="lk-support-card__icon-wrap">
            <img src="/dashboard/icon-faq.png" alt="FAQ" className="lk-support-card__icon" />
          </div>
          <div className="lk-support-card__content">
            <h3 className="lk-support-card__title">Частые вопросы</h3>
            <p className="lk-support-card__text">Тут вы можете найти ответы на свои вопросы</p>
          </div>
        </article>
      </div>
    </section>
  );
}