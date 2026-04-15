export default function LibraryCard({ item }) {
  return (
    <article className="lk-library-card">
      <div className="lk-library-card__media">
        <img
          className="lk-library-card__image"
          src={item.image}
          alt={item.title}
        />

        <span className="lk-library-card__badge">{item.type}</span>

        <button
          type="button"
          className={`lk-library-card__bookmark ${item.isFavorite ? 'is-active' : ''}`}
          aria-label="Добавить в избранное"
        >
          🔖
        </button>
      </div>

      <div className="lk-library-card__body">
        <h3 className="lk-library-card__title">{item.title}</h3>

        <div className="lk-library-card__meta">
          <span className="lk-library-card__meta-item">◷ {item.duration}</span>
          <span className="lk-library-card__meta-item">{item.age}</span>
        </div>

        <div className="lk-library-card__tags">
          {item.tags.map((tag) => (
            <span key={tag} className="lk-library-card__tag">
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="lk-library-card__actions">
        <button type="button" className="lk-library-card__action" aria-label="Слушать">
          ▶
        </button>
        <button type="button" className="lk-library-card__action" aria-label="Дополнительно">
          ◻
        </button>
      </div>
    </article>
  );
}