import { useEffect, useState } from 'react';
import { Loader, RefreshCw, Search, Mic, MicOff } from 'lucide-react';
import { getEmployees } from '../../api/b2b.service';
import { isNotImplemented } from '../../api/hrClient';
import HrPending from '../../components/hr/HrPending';

// ─────────────────────────────────────────────────────────────────────
// Сотрудники, подключённые к корпоративной подписке.
//
// Намеренно без содержимого: только имя, почта, дата активации, записан
// ли голос и признак активности. Что сотрудник озвучивает и какие записи
// у него есть — компании не показываем.
//
// Колонка «Голос записан» — самая полезная для HR: сотрудник, который
// активировал код и не дошёл до записи голоса, продуктом не пользуется.
// Это тот, кому стоит напомнить, а не повод докупать места.
// ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export default function HrEmployees() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  const [status, setStatus] = useState('loading'); // loading | ready | pending | failed
  const [error, setError] = useState('');

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, query]);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      const data = await getEmployees({ page, pageSize: PAGE_SIZE, query });
      setItems(data.items);
      setTotal(data.total);
      setStatus('ready');
    } catch (err) {
      if (isNotImplemented(err)) {
        setStatus('pending');
        return;
      }
      setError(err.message || 'Не удалось загрузить список сотрудников');
      setStatus('failed');
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(queryInput);
  };

  if (status === 'pending') return <HrPending what="Список сотрудников" />;

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const withoutVoice = items.filter((u) => !u.voice_ready).length;

  return (
    <div className="lk-hr-page">
      <header className="lk-hr-page__head">
        <div>
          <span className="lk-text-eyebrow">Кабинет компании</span>
          <h1>Сотрудники</h1>
        </div>

        <button type="button" className="lk-hr-refresh" onClick={load} title="Обновить">
          <RefreshCw size={16} className={status === 'loading' ? 'is-spinning' : ''} />
        </button>
      </header>

      <form className="lk-hr-search" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          type="search"
          value={queryInput}
          placeholder="Имя или рабочая почта"
          onChange={(e) => setQueryInput(e.target.value)}
        />
        <button type="submit">Найти</button>
        {query && (
          <button
            type="button"
            className="lk-hr-search__reset"
            onClick={() => {
              setQueryInput('');
              setQuery('');
              setPage(1);
            }}
          >
            Сбросить
          </button>
        )}
      </form>

      {status === 'loading' && (
        <div className="lk-hr-loader">
          <Loader size={20} className="is-spinning" />
        </div>
      )}

      {status === 'failed' && (
        <div className="lk-hr-pending">
          <h2>Не удалось загрузить список</h2>
          <p>{error}</p>
          <button type="button" className="lk-btn lk-btn--secondary lk-btn--md" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="lk-hr-empty">
          {query
            ? `По запросу «${query}» никого не нашли.`
            : 'Пока никто не активировал промокод.'}
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <>
          {withoutVoice > 0 && !query && (
            <p className="lk-hr-hint">
              <MicOff size={14} />
              {withoutVoice}{' '}
              {withoutVoice === 1
                ? 'сотрудник активировал доступ, но ещё не записал голос'
                : 'сотрудников активировали доступ, но ещё не записали голос'}{' '}
              — продуктом они пока не пользуются.
            </p>
          )}

          <div className="lk-hr-table lk-hr-table--employees">
            <div className="lk-hr-table__row lk-hr-table__row--head">
              <span>Сотрудник</span>
              <span>Почта</span>
              <span>Подключён</span>
              <span>Голос</span>
              <span>Озвучек</span>
            </div>

            {items.map((u) => (
              <div key={u.id} className="lk-hr-table__row">
                <span className="lk-hr-table__name">{u.username || `#${u.id}`}</span>

                <span className="lk-hr-table__contacts">
                  <a href={`mailto:${u.email}`}>{u.email}</a>
                </span>

                <span>{formatDate(u.activated_at)}</span>

                <span>
                  {u.voice_ready ? (
                    <em className="lk-hr-status lk-hr-status--active">
                      <Mic size={13} /> записан
                    </em>
                  ) : (
                    <em className="lk-hr-status lk-hr-status--expired">
                      <MicOff size={13} /> нет
                    </em>
                  )}
                </span>

                <span>{u.generations_count ?? 0}</span>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="lk-hr-pagination">
              <button type="button" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Назад
              </button>
              <span>
                {page} из {totalPages} · всего {total}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Вперёд
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
