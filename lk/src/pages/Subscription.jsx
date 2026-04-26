import { useLocation, useState } from 'react';

export default function Subscription() {
  const location = useLocation();
  const page = location.pathname.split('/').pop();

  return (
    <section className="lk-page lk-page--subscription">
      <div className="lk-page__inner">

        {page === 'tariff' && <SubscriptionTariff />}
        {page === 'payments' && <SubscriptionPayments />}
        {page === 'manage' && <SubscriptionManage />}
        {page === 'bonus' && <SubscriptionBonus />}

      </div>
    </section>
  );
}

/* ===================== ТАРИФ (ПРЕМИУМ) ===================== */

function SubscriptionTariff() {
  const [isYear, setIsYear] = useState(true);

  return (
    <div className="lk-subscription">

      <div className="lk-subscription-head">
        <h2 className="lk-title">Выберите тариф</h2>

        <div className="lk-switch">
          <button
            className={!isYear ? 'is-active' : ''}
            onClick={() => setIsYear(false)}
          >
            Месяц
          </button>

          <button
            className={isYear ? 'is-active' : ''}
            onClick={() => setIsYear(true)}
          >
            Год
          </button>
        </div>
      </div>

      <div className="lk-subscription-grid">

        {/* БАЗОВЫЙ */}
        <div className="lk-card lk-card--hover">
          <div className="lk-subscription-card__name">Базовый</div>

          <div className="lk-subscription-card__price">
            {isYear ? '6 000 ₽ / год' : '590 ₽ / мес'}
          </div>

          <ul className="lk-subscription-list">
            <li>1 голос</li>
            <li>15 сказок</li>
            <li>Базовая библиотека</li>
          </ul>

          <button className="lk-btn-secondary">Выбрать</button>
        </div>

        {/* ОСНОВНОЙ */}
        <div className="lk-card lk-card--accent lk-card--premium">
          <div className="lk-badge">Популярный</div>

          <div className="lk-subscription-card__name">Хранитель</div>

          <div className="lk-subscription-card__price">
            {isYear ? '14 400 ₽ / год' : '1 490 ₽ / мес'}
          </div>

          <ul className="lk-subscription-list">
            <li>1 голос</li>
            <li>100+ материалов</li>
            <li>Обновления каждый месяц</li>
            <li>Терапия</li>
          </ul>

          <button className="lk-btn-primary">Текущий тариф</button>
        </div>

        {/* ПРЕМИУМ */}
        <div className="lk-card lk-card--hover">
          <div className="lk-subscription-card__name">Премиум</div>

          <div className="lk-subscription-card__price">
            {isYear ? '24 900 ₽ / год' : '2 490 ₽ / мес'}
          </div>

          <ul className="lk-subscription-list">
            <li>3 голоса</li>
            <li>Вся библиотека</li>
            <li>Терапия + сценарии</li>
            <li>AI генерация историй</li>
          </ul>

          <button className="lk-btn-secondary">Выбрать</button>
        </div>

      </div>
    </div>
  );
}

/* ===================== ПЛАТЕЖИ ===================== */

function SubscriptionPayments() {
  return (
    <div className="lk-subscription">

      <h2 className="lk-title">История платежей</h2>

      <div className="lk-list">
        <PaymentItem title="Хранитель" date="12.01.2026" amount="14 400 ₽" />
        <PaymentItem title="Продление" date="12.01.2025" amount="14 400 ₽" />
      </div>

    </div>
  );
}

/* ===================== УПРАВЛЕНИЕ ===================== */

function SubscriptionManage() {
  return (
    <div className="lk-subscription">

      <h2 className="lk-title">Управление подпиской</h2>

      <div className="lk-card">
        <div className="lk-card__label">Следующее списание</div>
        <div className="lk-card__value">12 февраля 2026</div>
      </div>

      <div className="lk-actions">
        <button className="lk-btn-primary">Сменить тариф</button>
        <button className="lk-btn-secondary">Отменить подписку</button>
      </div>

    </div>
  );
}

/* ===================== БОНУСЫ ===================== */

function SubscriptionBonus() {
  return (
    <div className="lk-subscription">

      <h2 className="lk-title">Бонусы</h2>

      <div className="lk-grid">
        <div className="lk-card lk-card--hover">
          -20% при оплате на год
        </div>

        <div className="lk-card lk-card--hover">
          Пригласи друга — получи месяц
        </div>

        <div className="lk-card lk-card--hover">
          Новые сказки каждую неделю
        </div>
      </div>

    </div>
  );
}

/* ===================== КОМПОНЕНТЫ ===================== */

function PaymentItem({ title, date, amount }) {
  return (
    <div className="lk-list__item">
      <div>
        <div>{title}</div>
        <div className="lk-list__time">{date}</div>
      </div>
      <div>{amount}</div>
    </div>
  );
}