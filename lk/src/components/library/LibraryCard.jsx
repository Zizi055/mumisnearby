import { useState } from 'react';

import {
  Clock3,
  Heart,
  X,
  Lock,
  Play,
  Star,
} from 'lucide-react';

import { useLibraryStore } from '../../store/library.store';

export default function LibraryCard({ item }) {
  const [expanded, setExpanded] = useState(false);
  const toggleFavorite = useLibraryStore((s) => s.toggleFavorite);

  const handleFavorite = (e) => {
    e.stopPropagation();
    toggleFavorite(item.id);
  };

  return (
    <>
      <article className="lk-library-card">
        {/* image */}
        <div className="lk-library-card__media">
          <img src={item.image} alt={item.title} />
          <div className="lk-library-card__overlay" />

          <div className="lk-library-card__top">
            <span className="lk-library-card__type">
              {getTypeLabel(item.type)}
            </span>

            <button
              type="button"
              className={`lk-library-card__favorite ${item.isFavorite ? 'is-active' : ''}`}
              onClick={handleFavorite}
              aria-label={item.isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
            >
              <Heart size={14} />
            </button>
          </div>

          {item.isPremium && (
            <div className="lk-library-card__premium">
              <Lock size={12} />
              Premium
            </div>
          )}

          {item.isRussianFolk && (
            <div className="lk-library-card__folk">
              <Star size={11} />
              Народная
            </div>
          )}
        </div>

        {/* content */}
        <div className="lk-library-card__content">
          <div className="lk-library-card__meta">
            <span>
              <Clock3 size={13} />
              {item.duration > 0 ? `${item.duration} мин` : '—'}
            </span>
            <span>{getAgeLabel(item.age)}</span>
          </div>

          <h3>{item.title}</h3>

          <p className="lk-library-card__desc">
            {item.description}
          </p>

          {item.emotions?.length > 0 && (
            <div className="lk-library-card__tags">
              {item.emotions.slice(0, 3).map((tag) => (
                <span key={tag}>{getEmotionLabel(tag)}</span>
              ))}
            </div>
          )}

          <div className="lk-library-card__footer">
            <button
              type="button"
              className="lk-btn lk-btn--secondary lk-btn--sm"
              onClick={() => setExpanded(true)}
            >
              Подробнее
            </button>
          </div>
        </div>
      </article>

      {/* detail modal */}
      {expanded && (
        <div
          className="lk-card-modal-overlay"
          onClick={() => setExpanded(false)}
        >
          <div
            className="lk-card-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="lk-card-modal__close"
              onClick={() => setExpanded(false)}
            >
              <X size={18} />
            </button>

            <div className="lk-card-modal__image">
              <img src={item.image} alt={item.title} />
              <div className="lk-card-modal__image-overlay" />

              <div className="lk-card-modal__image-top">
                <span className="lk-library-card__type">
                  {getTypeLabel(item.type)}
                </span>

                <button
                  type="button"
                  className={`lk-library-card__favorite ${item.isFavorite ? 'is-active' : ''}`}
                  onClick={handleFavorite}
                >
                  <Heart size={14} />
                </button>
              </div>

              {item.isPremium && (
                <div className="lk-library-card__premium">
                  <Lock size={12} />
                  Premium
                </div>
              )}

              {item.isRussianFolk && (
                <div className="lk-library-card__folk">
                  <Star size={11} />
                  Народная
                </div>
              )}
            </div>

            <div className="lk-card-modal__body">
              <div className="lk-card-modal__meta">
                <span>
                  <Clock3 size={13} />
                  {item.duration > 0 ? `${item.duration} мин` : '—'}
                </span>
                <span>{getAgeLabel(item.age)}</span>
              </div>

              <h2 className="lk-card-modal__title">{item.title}</h2>

              <p className="lk-card-modal__desc">{item.description}</p>

              {item.emotions?.length > 0 && (
                <div className="lk-library-card__tags lk-card-modal__tags">
                  {item.emotions.map((tag) => (
                    <span key={tag}>{getEmotionLabel(tag)}</span>
                  ))}
                </div>
              )}

              <div className="lk-card-modal__actions">
                <button
                  type="button"
                  className="lk-btn lk-btn--primary"
                >
                  <Play size={14} />
                  Слушать
                </button>

                <button
                  type="button"
                  className={`lk-card-modal__fav-btn ${item.isFavorite ? 'is-active' : ''}`}
                  onClick={handleFavorite}
                >
                  <Heart size={16} />
                  {item.isFavorite ? 'В избранном' : 'В избранное'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function getTypeLabel(type) {
  switch (type) {
    case 'fairy_tale': return 'Сказка';
    case 'lullaby': return 'Колыбельная';
    case 'therapy': return 'Терапия';
    case 'family_story': return 'История';
    default: return 'Контент';
  }
}

function getAgeLabel(age) {
  switch (age) {
    case '0-2': return '0–2 года';
    case '3-6': return '3–6 лет';
    case '7-10': return '7–10 лет';
    case '10+': return '10+';
    default: return age;
  }
}

function getEmotionLabel(tag) {
  switch (tag) {
    case 'happiness': return 'Счастье';
    case 'sleep': return 'Сон';
    case 'coziness': return 'Уют';
    case 'calm': return 'Спокойствие';
    case 'warmth': return 'Тепло';
    case 'joy': return 'Радость';
    case 'bravery': return 'Смелость';
    case 'family': return 'Семья';
    default: return tag;
  }
}
