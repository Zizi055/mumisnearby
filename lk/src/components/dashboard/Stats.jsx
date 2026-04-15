export default function Stats() {
  return (
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
  );
}