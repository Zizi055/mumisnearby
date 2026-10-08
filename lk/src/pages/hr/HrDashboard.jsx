import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader, RefreshCw, Users, Ticket, Mic, AudioLines } from 'lucide-react';
import { getCompanyStats } from '../../api/b2b.service';
import { isNotImplemented } from '../../api/hrClient';
import HrPending from '../../components/hr/HrPending';

// ─────────────────────────────────────────────────────────────────────
// Обзор для HR: сколько мест занято, сколько кодов выдано и работают ли
// люди с сервисом.
//
// Содержимого здесь намеренно нет — ни названий сказок, ни записей, ни
// имён детей. HR видит только факт активности. Это требование 152-ФЗ и,
// что важнее, условие доверия: льготу, при которой работодатель может
// слушать записи семьи, сотрудники просто не включат.
// ─────────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HrDashboard() {
  const [stats, setStats] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | pending | failed
  const [error, setError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      setStats(await getCompanyStats());
      setStatus('ready');
    } catch (err) {
      if (isNotImplemented(err)) {
        setStatus('pending');
        return;
      }
      setError(err.message || 'Не удалось загрузить статистику');
      setStatus('failed');
    }
  }

  if (status === 'pending') return <HrPending what="Статистика компании" />;

  const used = stats?.seats_used ?? 0;
  const totalSeats = stats?.seats_total ?? 0;
  const free = stats?.seats_free ?? Math.max(0, totalSeats - used);
  const fillPercent = totalSeats > 0 ? Math.round((used / totalSeats) * 100) : 0;

  return (
    <div className="lk-hr-page">
      <header className="lk-hr-page__head">
        <div>
          <span className="lk-text-eyebrow">Кабинет компании</span>
          <h1>Обзор</h1>
        </div>

        <button
          type="button"
          className="lk-hr-refresh"
          onClick={load}
          title="Обновить"
        >
          <RefreshCw size={16} className={status === 'loading' ? 'is-spinning' : ''} />
        </button>
      </header>

      {status === 'loading' && (
        <div className="lk-hr-loader">
          <Loader size={20} className="is-spinning" />
        </div>
      )}

      {status === 'failed' && (
        <div className="lk-hr-pending">
          <h2>Не удалось загрузить статистику</h2>
          <p>{error}</p>
          <button type="button" className="lk-btn lk-btn--secondary lk-btn--md" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          {/* Места — главная цифра: от неё зависит, можно ли выдавать
              новые промокоды. */}
          <section className="lk-hr-card">
            <div className="lk-hr-seats">
              <div>
                <span className="lk-text-eyebrow">Места</span>
                <strong>
                  {used} из {totalSeats}
                </strong>
                <p>
                  {free > 0
                    ? `Свободно ${free} — на столько сотрудников ещё можно выдать коды.`
                    : 'Все места заняты. Чтобы подключить ещё сотрудников, нужно докупить места.'}
                </p>
              </div>

              <div className="lk-hr-seats__bar" aria-hidden="true">
                <span style={{ width: `${fillPercent}%` }} />
              </div>
            </div>

            {stats?.expires_at && (
              <p className="lk-hr-card__foot">
                Подписка активна до {formatDate(stats.expires_at)}
              </p>
            )}
          </section>

          <div className="lk-hr-metrics">
            <article className="lk-hr-metric">
              <Ticket size={18} />
              <strong>{stats?.promo_issued ?? 0}</strong>
              <span>Промокодов выдано</span>
              <em>
                активировано {stats?.promo_activated ?? 0}, просрочено{' '}
                {stats?.promo_expired ?? 0}
              </em>
            </article>

            <article className="lk-hr-metric">
              <Mic size={18} />
              <strong>{stats?.voices_recorded ?? 0}</strong>
              <span>Голосов записано</span>
              <em>сотрудники, дошедшие до главного шага</em>
            </article>

            <article className="lk-hr-metric">
              <AudioLines size={18} />
              <strong>{stats?.generations_count ?? 0}</strong>
              <span>Озвучек создано</span>
              <em>за всё время</em>
            </article>

            <article className="lk-hr-metric">
              <Users size={18} />
              <strong>{stats?.active_employees_30d ?? 0}</strong>
              <span>Активны за 30 дней</span>
              <em>пользовались сервисом в последний месяц</em>
            </article>
          </div>

          <div className="lk-hr-actions">
            <Link to="/hr/promocodes" className="lk-btn lk-btn--primary lk-btn--md">
              Выдать промокоды
            </Link>
            <Link to="/hr/employees" className="lk-btn lk-btn--secondary lk-btn--md">
              Сотрудники
            </Link>
          </div>

          <p className="lk-hr-privacy">
            Здесь видно только то, пользуется ли сотрудник сервисом. Что
            именно он озвучивает, какие записи сделал и как зовут его детей —
            компании недоступно.
          </p>
        </>
      )}
    </div>
  );
}
