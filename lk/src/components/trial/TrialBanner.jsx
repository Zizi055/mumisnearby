import { useNavigate } from 'react-router-dom';
import { Sparkles, Clock, BookOpen, Mic } from 'lucide-react';
import { useTrialStore } from '../../store/trial.store';
import '../../styles/scss/pages/trial-banner.scss';

export default function TrialBanner() {
  const navigate = useNavigate();
  const trial = useTrialStore((s) => s.trial);

  if (!trial) return null;

  if (trial.isExpired || trial.storiesLimitReached) {
    return (
      <div className="trial-banner trial-banner--expired">
        <div className="trial-banner__inner">
          <div className="trial-banner__icon">
            <Clock size={18} />
          </div>
          <div className="trial-banner__text">
            <strong>
              {trial.isExpired
                ? 'Пробный период завершён'
                : 'Лимит сказок исчерпан'}
            </strong>
            <span>
              {trial.isExpired
                ? 'Оформите подписку, чтобы продолжить'
                : `Использовано ${trial.storiesGenerated} из 5 сказок. Оформите подписку для безлимита`}
            </span>
          </div>
          <button
            type="button"
            className="trial-banner__cta trial-banner__cta--primary"
            onClick={() => navigate('/subscription/tariff')}
          >
            Выбрать тариф
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="trial-banner trial-banner--active">
      <div className="trial-banner__inner">
        <div className="trial-banner__icon">
          <Sparkles size={18} />
        </div>

        <div className="trial-banner__text">
          <strong>Пробный период</strong>
          <span>
            {trial.daysLeft === 1
              ? 'Остался 1 день'
              : `Осталось ${trial.daysLeft} дн.`}
          </span>
        </div>

        <div className="trial-banner__stats">
          <div className="trial-banner__stat">
            <BookOpen size={13} />
            <span>
              Сказки: <strong>{trial.storiesLeft} из 5</strong>
            </span>
          </div>
          <div className="trial-banner__stat">
            <Mic size={13} />
            <span>
              Голос: <strong>1 доступен</strong>
            </span>
          </div>
        </div>

        <button
          type="button"
          className="trial-banner__cta"
          onClick={() => navigate('/subscription/tariff')}
        >
          Оформить подписку
        </button>
      </div>
    </div>
  );
}
