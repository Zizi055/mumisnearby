import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader, RefreshCw, Users, Mic, AudioLines, AlertCircle } from 'lucide-react';
import { getCompanyStats, readSlotLevel } from '../../api/company.service';
import { isNotImplemented } from '../../api/companyClient';
import HrPending from '../../components/hr/HrPending';

// ─────────────────────────────────────────────────────────────────────
// Обзор компании: сколько мест занято, по каким уровням тарифов, как
// сотрудники пользуются сервисом.
//
// Содержимого здесь намеренно нет — ни названий сказок, ни записей, ни
// имён детей. Компания видит только факт активности. Это и 152-ФЗ, и
// условие доверия: льготу, при которой работодатель может слушать
// записи семьи, сотрудники просто не включат.
//
// Два разных счётчика, которые легко перепутать:
//   staff_used  — заведённых аккаунтов (даже без тарифа)
//   used уровня — активных подписок этого уровня
// Сотрудник без тарифа занимает место, но не занимает слот.
// ─────────────────────────────────────────────────────────────────────

const LEVEL_LABELS = {
  1: 'Уровень 1 · Сказочник',
  2: 'Уровень 2 · Хранитель',
  3: 'Уровень 3 · Волшебник',
};

const CONTENT_LABELS = {
  fairy_tale: 'Сказки',
  lullaby: 'Колыбельные',
  therapy: 'Терапевтические',
  family_story: 'Семейные истории',
  poem: 'Стихи',
  story: 'Рассказы',
};

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

  const slots = stats?.slots;
  const staffUsed = slots?.staff_used ?? 0;
  const staffLimit = slots?.staff_limit ?? 0;
  const staffFree = Math.max(0, staffLimit - staffUsed);
  const fill = staffLimit > 0 ? Math.round((staffUsed / staffLimit) * 100) : 0;

  const gen = stats?.generations;
  const voicesTotal = (stats?.staff ?? []).reduce((s, u) => s + (u.voices || 0), 0);
  const withoutVoice = (stats?.staff ?? []).filter((u) => !u.voices).length;

  return (
    <div className="lk-hr-page">
      <header className="lk-hr-page__head">
        <div>
          <span className="lk-text-eyebrow">Кабинет компании</span>
          <h1>Обзор</h1>
        </div>

        <button type="button" className="lk-hr-refresh" onClick={load} title="Обновить">
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
          <AlertCircle size={26} />
          <h2>Не удалось загрузить статистику</h2>
          <p>{error}</p>
          <button type="button" className="lk-btn lk-btn--secondary lk-btn--md" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'ready' && (
        <>
          <section className="lk-hr-card">
            <div className="lk-hr-seats">
              <div>
                <span className="lk-text-eyebrow">Сотрудники</span>
                <strong>
                  {staffUsed} из {staffLimit}
                </strong>
                <p>
                  {staffFree > 0
                    ? `Свободно ${staffFree} — на столько человек ещё можно завести доступ.`
                    : 'Все места заняты. Чтобы подключить ещё сотрудников, обратитесь к менеджеру.'}
                </p>
              </div>

              <div className="lk-hr-seats__bar" aria-hidden="true">
                <span style={{ width: `${fill}%` }} />
              </div>
            </div>

            <p className="lk-hr-card__foot">
              Договор действует до {formatDate(stats?.expires_at)}
              {stats?.is_expired && ' — срок истёк'}
            </p>
          </section>

          {/* Слоты по уровням. Именно они ограничивают, какой тариф можно
              выдать: несколько тарифов одного уровня делят общую кучу. */}
          <section className="lk-hr-card">
            <h2 className="lk-hr-card__title">Слоты по уровням тарифов</h2>

            <div className="lk-hr-levels">
              {[1, 2, 3].map((lvl) => {
                const l = readSlotLevel(slots, lvl);
                const pct = l.limit > 0 ? Math.round((l.used / l.limit) * 100) : 0;

                return (
                  <article key={lvl} className="lk-hr-level">
                    <div className="lk-hr-level__head">
                      <span>{LEVEL_LABELS[lvl]}</span>
                      <strong>
                        {l.used} / {l.limit}
                      </strong>
                    </div>

                    <div className="lk-hr-seats__bar" aria-hidden="true">
                      <span style={{ width: `${pct}%` }} />
                    </div>

                    <p>
                      {l.limit === 0
                        ? 'Слоты этого уровня не оплачены'
                        : l.free > 0
                        ? `Свободно ${l.free}`
                        : 'Слоты закончились'}
                    </p>
                  </article>
                );
              })}
            </div>
          </section>

          <div className="lk-hr-metrics">
            <article className="lk-hr-metric">
              <Users size={18} />
              <strong>{stats?.staff?.length ?? 0}</strong>
              <span>Сотрудников подключено</span>
              <em>с доступом в приложение</em>
            </article>

            <article className="lk-hr-metric">
              <Mic size={18} />
              <strong>{voicesTotal}</strong>
              <span>Голосов записано</span>
              <em>
                {withoutVoice > 0
                  ? `${withoutVoice} ещё не записали`
                  : 'записали все'}
              </em>
            </article>

            <article className="lk-hr-metric">
              <AudioLines size={18} />
              <strong>{gen?.total ?? 0}</strong>
              <span>Озвучек создано</span>
              <em>
                готово {gen?.by_status?.ready ?? 0}
                {gen?.by_status?.failed ? `, ошибок ${gen.by_status.failed}` : ''}
              </em>
            </article>
          </div>

          {gen?.by_content_type && Object.keys(gen.by_content_type).length > 0 && (
            <section className="lk-hr-card">
              <h2 className="lk-hr-card__title">Что слушают</h2>

              <div className="lk-hr-chips">
                {Object.entries(gen.by_content_type)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <span key={type} className="lk-hr-chip">
                      {CONTENT_LABELS[type] ?? type}
                      <em>{count}</em>
                    </span>
                  ))}
              </div>
            </section>
          )}

          <div className="lk-hr-actions">
            <Link to="/company/staff" className="lk-btn lk-btn--primary lk-btn--md">
              Сотрудники
            </Link>
          </div>

          <p className="lk-hr-privacy">
            Здесь видно только то, пользуется ли сотрудник сервисом. Что именно
            он озвучивает, какие записи сделал и как зовут его детей — компании
            недоступно.
          </p>
        </>
      )}
    </div>
  );
}
