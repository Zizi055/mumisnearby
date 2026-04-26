import { useEffect, useState } from 'react';

const DASHBOARD_TAB_KEY = 'lk-dashboard-tab-v1';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem(DASHBOARD_TAB_KEY) || 'progress';
  });

  useEffect(() => {
    localStorage.setItem(DASHBOARD_TAB_KEY, activeTab);
  }, [activeTab]);

  return (
    <section className="lk-page">
      <div className="lk-page__inner">

        {/* tabs */}
        <div className="lk-tabs">
          {['progress', 'activity', 'support'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`lk-tabs__btn ${activeTab === tab ? 'is-active' : ''}`}
            >
              {tab === 'progress' && 'Прогресс'}
              {tab === 'activity' && 'Активность'}
              {tab === 'support' && 'Поддержка'}
            </button>
          ))}
        </div>

        {/* content */}
        {activeTab === 'progress' && <DashboardProgress />}
        {activeTab === 'activity' && <DashboardActivity />}
        {activeTab === 'support' && <DashboardSupport />}

      </div>
    </section>
  );
}

/* ===================== PROGRESS ===================== */

function DashboardProgress() {
  return (
    <>
      {/* KPI */}
      <div className="lk-kpi">
        <Kpi title="Активных голосов" value="2" />
        <Kpi title="Прослушиваний" value="220" />
        <Kpi title="Средняя сессия" value="8 мин" />
        <Kpi title="Тариф" value="Хранитель" accent />
      </div>

      {/* HERO */}
      <div className="lk-hero">
        <div>
          <span className="lk-hero__eyebrow">Продолжить</span>
          <h2 className="lk-hero__title">Лесные друзья</h2>
          <p className="lk-hero__meta">3–6 лет · 7 минут</p>
        </div>

        <button className="lk-btn-primary">▶ Слушать</button>
      </div>

      {/* STORIES */}
      <div className="lk-grid">
        <StoryCard title="Мальчик и лиса" />
        <StoryCard title="Спокойной ночи" />
        <StoryCard title="Верные друзья" />
      </div>
    </>
  );
}

/* ===================== ACTIVITY ===================== */

function DashboardActivity() {
  return (
    <div className="lk-block">
      <h3 className="lk-title">Последняя активность</h3>

      <div className="lk-list">
        <ListItem text="Сказка 'Мальчик и лиса'" time="5 мин назад" />
        <ListItem text="Оплата тарифа" time="Вчера" />
        <ListItem text="Создан голос" time="2 дня назад" />
      </div>
    </div>
  );
}

/* ===================== SUPPORT ===================== */

function DashboardSupport() {
  return (
    <div className="lk-block">
      <h3 className="lk-title">Поддержка</h3>

      <div className="lk-grid">
        <SupportCard title="Чат поддержки" />
        <SupportCard title="Email" />
        <SupportCard title="Телефон" />
        <SupportCard title="FAQ" />
      </div>
    </div>
  );
}

/* ===================== COMPONENTS ===================== */

function Kpi({ title, value, accent }) {
  return (
    <div className={`lk-card ${accent ? 'lk-card--accent' : ''}`}>
      <div className="lk-card__value">{value}</div>
      <div className="lk-card__label">{title}</div>
    </div>
  );
}

function StoryCard({ title }) {
  return (
    <div className="lk-story">
      <div className="lk-story__title">{title}</div>
      <button className="lk-story__play">▶</button>
    </div>
  );
}

function ListItem({ text, time }) {
  return (
    <div className="lk-list__item">
      <span>{text}</span>
      <span className="lk-list__time">{time}</span>
    </div>
  );
}

function SupportCard({ title }) {
  return <div className="lk-card lk-card--hover">{title}</div>;
}