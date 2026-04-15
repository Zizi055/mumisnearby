export default function HeroCard() {
  return (
    <section className="lk-section">
      <div className="lk-section__head">
        <div>
          <h2 className="lk-section__title">Добро пожаловать, Мария</h2>
          <p className="lk-section__text">Ваша модель голоса записана</p>
        </div>
      </div>

      <article className="lk-hero-card">
        <div className="lk-hero-card__overlay">
          <div className="lk-hero-card__content">
            <div className="lk-hero-card__eyebrow">Продолжить прослушивание</div>
            <h3 className="lk-hero-card__title">Лесные друзья</h3>

            <div className="lk-hero-card__meta">
              <span className="lk-hero-card__age">3–6 лет</span>
              <span className="lk-hero-card__time">7 минут</span>
            </div>

            <span className="lk-hero-card__badge">Сказка</span>
          </div>

          <div className="lk-hero-card__actions">
            <button type="button" className="lk-icon-btn">▶</button>
            <button type="button" className="lk-icon-btn">＋</button>
          </div>
        </div>
      </article>
    </section>
  );
}