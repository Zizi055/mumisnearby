export default function StoryCard({ type, title, age, imageClass = '' }) {
  return (
    <article className="lk-story-card">
      <div className={`lk-story-card__image ${imageClass}`.trim()}></div>

      <div className="lk-story-card__body">
        <span className="lk-story-card__type">{type}</span>
        <h3 className="lk-story-card__title">{title}</h3>
        <div className="lk-story-card__age">{age}</div>
      </div>

      <button type="button" className="lk-story-card__play">▶</button>
    </article>
  );
}