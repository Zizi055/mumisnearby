import {
  Clock3,
  Heart,
  Play,
  Lock,
} from 'lucide-react';

export default function LibraryCard({
  item,
}) {
  return (
    <article className="lk-library-card">
      {/* image */}
      <div className="lk-library-card__media">
        <img
          src={item.image}
          alt={item.title}
        />

        <div className="lk-library-card__overlay" />

        <div className="lk-library-card__top">
          <span className="lk-library-card__type">
            {getTypeLabel(item.type)}
          </span>

          <button
            type="button"
            className={`lk-library-card__favorite ${
              item.isFavorite
                ? 'is-active'
                : ''
            }`}
          >
            <Heart size={14} />
          </button>
        </div>

        <button
          type="button"
          className="lk-library-card__play"
        >
          <Play
            size={18}
            fill="currentColor"
          />
        </button>

        {item.isPremium && (
          <div className="lk-library-card__premium">
            <Lock size={12} />
            Premium
          </div>
        )}
      </div>

      {/* content */}
      <div className="lk-library-card__content">
        <div className="lk-library-card__meta">
          <span>
            <Clock3 size={14} />
            {item.duration} мин
          </span>

          <span>
            {getAgeLabel(item.age)}
          </span>
        </div>

        <h3>{item.title}</h3>

        <p>{item.description}</p>

        {/* tags */}
        <div className="lk-library-card__tags">
          {item.emotions.map((tag) => (
            <span key={tag}>
              {getEmotionLabel(tag)}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

function getTypeLabel(type) {
  switch (type) {
    case 'fairy_tale':
      return 'Сказка';

    case 'lullaby':
      return 'Колыбельная';

    case 'therapy':
      return 'Терапия';

    case 'family_story':
      return 'История';

    default:
      return 'Контент';
  }
}

function getAgeLabel(age) {
  switch (age) {
    case '0-2':
      return '0–2 года';

    case '3-6':
      return '3–6 лет';

    case '7-10':
      return '7–10 лет';

    case '10+':
      return '10+';

    default:
      return age;
  }
}

function getEmotionLabel(tag) {
  switch (tag) {
    case 'happiness':
      return 'Счастье';

    case 'sleep':
      return 'Сон';

    case 'coziness':
      return 'Уют';

    case 'calm':
      return 'Спокойствие';

    case 'warmth':
      return 'Тепло';

    case 'joy':
      return 'Радость';

    case 'bravery':
      return 'Смелость';

    case 'family':
      return 'Семья';

    default:
      return tag;
  }
}