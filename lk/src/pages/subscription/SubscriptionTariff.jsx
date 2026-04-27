import { useState } from 'react';
import { tariffs } from '../../data/tariffs.data';

export default function SubscriptionTariff() {

  return (

    <section className="lk-tariffs">

      <h2 className="lk-title">Тарифы</h2>

      <p className="lk-text">Выберите подходящий для вас, остальное сделаем мы</p>

      <div className="lk-tariffs-grid">

        {tariffs.map((tariff) => (

          <TariffCard key={tariff.id} tariff={tariff} />

        ))}

      </div>

    </section>

  );

}

function TariffCard({ tariff }) {

  return (

    <article className={`lk-tariff-card lk-tariff-card--${tariff.accent}`}>

      {tariff.badge && <span className="lk-tariff-badge">{tariff.badge}</span>}

      <div className="lk-tariff-card__head">

        <h3>

          {tariff.isBuilder ? 'Конструктор: ' : 'Пакет: '}

          <span>{tariff.name.toUpperCase()}</span>

        </h3>

        <p>{tariff.description}</p>

      </div>

      <ol className="lk-tariff-card__list">

        {tariff.features.map((feature) => (

          <li key={feature}>{feature}</li>

        ))}

      </ol>

      <div className="lk-tariff-card__footer">

        {tariff.price && (

          <div>

            <span className="lk-tariff-card__label">Подписка</span>

            <div className="lk-tariff-card__price">{tariff.price}</div>

          </div>

        )}

        <button className="lk-tariff-card__button">

          {tariff.isBuilder ? 'Подробнее' : 'Оформить подписку'}

          <span>↗</span>

        </button>

      </div>

    </article>

  );

}