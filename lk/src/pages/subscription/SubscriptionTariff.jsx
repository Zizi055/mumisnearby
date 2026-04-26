import { useState } from 'react';

export default function SubscriptionTariff() {
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