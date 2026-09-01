import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Loader,
  RefreshCw,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronRight,
  Gift,
} from 'lucide-react';
import { getAdminUsers } from '../../api/admin.service';

// ─────────────────────────────────────────────────────────────────────
// Пользователи ЛК — GET /admin/support/users.
//
// Страница долго висела мёртвой: она ходила на /admin/users, которого на
// бэке нет. Реальный эндпоинт живёт под префиксом поддержки и отдаёт
// карточку целиком — подписку, приглашённых и обращения. Отдельный запрос
// за деталями не нужен, поэтому строку просто раскрываем на месте.
//
// Поиск (?q=) серверный: ищет по имени, почте, телефону и реферальному
// коду. Фильтровать пришедшую страницу на клиенте было бы неправильно —
// нашлось бы только то, что попало в текущие 20 записей.
// ─────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

const SUB_STATUS_LABELS = {
  active: 'активна',
  expired: 'истекла',
  cancelled: 'отменена',
  pending: 'ожидает оплаты',
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

export default function AdminUsers() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  // Отдельно поле ввода и отправленный запрос: дёргать бэк на каждой
  // букве незачем, ищем по Enter или по кнопке.
  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  const [expandedId, setExpandedId] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | success | failed
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, [page, query]);

  async function loadUsers() {
    setStatus('loading');
    setError('');

    try {
      const data = await getAdminUsers({ page, pageSize: PAGE_SIZE, query });
      setUsers(data.items);
      setTotal(data.total);
      setStatus('success');
    } catch (err) {
      setError(err.message || 'Не удалось загрузить пользователей');
      setStatus('failed');
    }
  }

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    setQuery(queryInput);
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Пользователи</h1>
        </div>

        <button
          type="button"
          className="lk-admin__refresh"
          onClick={loadUsers}
          title="Обновить"
        >
          <RefreshCw size={16} className={status === 'loading' ? 'is-spinning' : ''} />
        </button>
      </header>

      <form className="lk-admin-search" onSubmit={handleSearch}>
        <Search size={16} />
        <input
          type="search"
          value={queryInput}
          placeholder="Имя, почта, телефон или реферальный код"
          onChange={(e) => setQueryInput(e.target.value)}
        />
        <button type="submit">Найти</button>
        {query && (
          <button
            type="button"
            className="lk-admin-search__reset"
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
        <div className="lk-admin-list__loader">
          <Loader size={20} className="is-spinning" />
        </div>
      )}

      {status === 'failed' && (
        <div className="lk-admin-gate">
          <AlertCircle size={28} />
          <h2>Не удалось загрузить пользователей</h2>
          <p>{error}</p>
          <button type="button" onClick={loadUsers}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'success' && users.length === 0 && (
        <div className="lk-admin-list__empty">
          {query
            ? `По запросу «${query}» никого не нашли.`
            : 'Пользователей пока нет.'}
        </div>
      )}

      {status === 'success' && users.length > 0 && (
        <>
          <div className="lk-admin-table lk-admin-table--users">
            <div className="lk-admin-table__row lk-admin-table__row--head">
              <span>Пользователь</span>
              <span>Email</span>
              <span>Телефон</span>
              <span>Подписка</span>
            </div>

            {users.map((u) => {
              const isOpen = expandedId === u.id;
              const sub = u.subscription;

              return (
                <div key={u.id} className="lk-admin-table__group">
                  <div
                    className={`lk-admin-table__row lk-admin-table__row--clickable ${
                      isOpen ? 'is-open' : ''
                    }`}
                    onClick={() => setExpandedId(isOpen ? null : u.id)}
                  >
                    <span className="lk-admin-table__name">
                      {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      {u.username || `#${u.id}`}
                      <em className="lk-admin-table__id">ID {u.id}</em>
                    </span>

                    <span className="lk-admin-table__contacts">
                      <a href={`mailto:${u.email}`} onClick={(e) => e.stopPropagation()}>
                        {u.email}
                      </a>
                    </span>

                    <span>{u.phone_number || '—'}</span>

                    <span>
                      {sub ? (
                        <>
                          {sub.plan_name}
                          <em className={`lk-admin-sub lk-admin-sub--${sub.status}`}>
                            {SUB_STATUS_LABELS[sub.status] || sub.status}
                          </em>
                        </>
                      ) : (
                        'без подписки'
                      )}
                    </span>
                  </div>

                  {isOpen && (
                    <div className="lk-admin-table__details">
                      <dl>
                        <dt>Реферальный код</dt>
                        <dd>{u.referral_code || '—'}</dd>

                        <dt>Приглашено</dt>
                        <dd>
                          {u.invited_emails?.length
                            ? u.invited_emails.join(', ')
                            : 'никого'}
                        </dd>

                        <dt>Подписка</dt>
                        <dd>
                          {sub
                            ? `${sub.plan_name} — ${
                                SUB_STATUS_LABELS[sub.status] || sub.status
                              }, с ${formatDate(sub.started_at)} по ${formatDate(
                                sub.expires_at
                              )}`
                            : 'нет активной подписки'}
                        </dd>

                        <dt>Обращения</dt>
                        <dd>
                          {u.support_tickets?.length ? (
                            <ul className="lk-admin-table__tickets">
                              {u.support_tickets.map((t) => (
                                <li key={t.id}>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      navigate(`/admin/support?ticket=${t.id}`)
                                    }
                                  >
                                    #{t.id} — {t.subject}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            'не обращался'
                          )}
                        </dd>
                      </dl>

                      {/* ID уже известен — не заставляем админа
                          переписывать его руками в форму выдачи. */}
                      <button
                        type="button"
                        className="lk-admin-table__action"
                        onClick={() => navigate(`/admin/grant?user=${u.id}`)}
                      >
                        <Gift size={14} />
                        Выдать подписку
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="lk-admin-pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
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
