import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Copy, Loader2, Ticket } from 'lucide-react';
import { createPromoCode, listPromoCodes } from '../../api/admin.service';
import { PLAN_ID_MAP } from '../../data/planIdMap';
import { tariffs } from '../../data/tariffs.data';

// Выпуск и список промокодов — /admin/promo-codes.
//
// Два разных срока, их легко перепутать:
//   expires_at — до какого календарного дня действует подписка,
//                которую получит человек. Конец этого дня по Москве.
//   valid_days — сколько суток с выпуска код ещё можно ввести.
//                После этого код сгорает, даже если дата подписки
//                ещё впереди.

const PAGE_SIZE = 20;

const GRANTABLE = tariffs
  .filter((t) => PLAN_ID_MAP[t.id])
  .map((t) => ({ id: PLAN_ID_MAP[t.id], name: t.name }));

function todayStamp() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function defaultExpiryDate() {
  const date = new Date();
  date.setFullYear(date.getFullYear() + 1);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function formatDay(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 10);
  return date.toLocaleDateString('ru-RU');
}

const FILTERS = [
  { id: 'all', label: 'Все' },
  { id: 'not_activated', label: 'Свободные' },
  { id: 'activated', label: 'Активированные' },
];

export default function AdminPromos() {
  const [planId, setPlanId] = useState(String(GRANTABLE[0]?.id ?? ''));
  const [expiresOn, setExpiresOn] = useState(defaultExpiryDate);
  const [validDays, setValidDays] = useState('30');

  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [issued, setIssued] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [list, setList] = useState({ items: [], total: 0, activatedCount: 0 });
  const [listState, setListState] = useState('loading');
  const [listError, setListError] = useState('');

  const load = async (nextPage = page, nextFilter = filter) => {
    setListState('loading');
    setListError('');
    try {
      const activated = nextFilter === 'activated'
        ? true
        : nextFilter === 'not_activated'
          ? false
          : null;
      const data = await listPromoCodes({
        activated,
        skip: (nextPage - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      });
      setList(data);
      setListState('ready');
    } catch (err) {
      setListError(err.message || 'Не удалось загрузить промокоды');
      setListState('error');
    }
  };

  useEffect(() => {
    load(1, 'all');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPages = Math.max(1, Math.ceil(list.total / PAGE_SIZE));

  const changeFilter = (id) => {
    setFilter(id);
    setPage(1);
    load(1, id);
  };

  const changePage = (next) => {
    setPage(next);
    load(next, filter);
  };

  const copyCode = async (id, code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId((current) => (current === id ? null : current)), 2000);
    } catch {
      setCopiedId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const days = Number(validDays);
    if (!Number.isInteger(days) || days < 1 || days > 3650) {
      setError('Срок активации — целое число дней от 1 до 3650.');
      setStatus('error');
      return;
    }

    if (!expiresOn || expiresOn < todayStamp()) {
      setError('Дата окончания подписки не может быть раньше сегодня.');
      setStatus('error');
      return;
    }

    const plan = GRANTABLE.find((p) => String(p.id) === String(planId));

    setStatus('loading');
    setError('');

    try {
      const created = await createPromoCode({
        planId,
        expiresAt: expiresOn,
        validDays: days,
      });
      setIssued({
        code: created?.code ?? '',
        planName: created?.conditions?.plan_name || plan?.name || `тариф #${planId}`,
        until: formatDay(created?.conditions?.expires_at || expiresOn),
        activateUntil: formatDay(created?.conditions?.valid_until),
      });
      setStatus('success');
      setFilter('all');
      setPage(1);
      load(1, 'all');
    } catch (err) {
      setError(err.message || 'Не удалось выпустить промокод');
      setStatus('error');
    }
  };

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Промокоды</h1>
        </div>
      </header>

      <div className="lk-admin-detail">
        <h2 className="lk-admin-detail__title">Выпустить промокод</h2>

        <p className="lk-admin-detail__hint">
          Код одноразовый. Человек вводит его в кабинете после регистрации,
          и подписка включается без оплаты.
        </p>

        <form className="lk-admin-form" onSubmit={handleSubmit}>
          <label className="lk-admin-login__field">
            <span>Тариф</span>
            <select value={planId} onChange={(e) => setPlanId(e.target.value)}>
              {GRANTABLE.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (ID {p.id})
                </option>
              ))}
            </select>
          </label>

          <label className="lk-admin-login__field">
            <span>Подписка действует до</span>
            <input
              type="date"
              value={expiresOn}
              min={todayStamp()}
              required
              onChange={(e) => setExpiresOn(e.target.value)}
            />
          </label>

          <label className="lk-admin-login__field">
            <span>Дней на активацию</span>
            <input
              type="number"
              min="1"
              max="3650"
              required
              value={validDays}
              onChange={(e) => setValidDays(e.target.value)}
            />
          </label>

          <p className="lk-admin-detail__hint lk-admin-form__full">
            «Подписка действует до» — до какого дня человек будет на тарифе.
            «Дней на активацию» — сколько суток с этой минуты код можно ввести.
            Это не длина подписки.
          </p>

          {status === 'error' && (
            <div className="lk-admin-login__error lk-admin-form__full">{error}</div>
          )}

          {status === 'success' && issued?.code && (
            <div className="lk-admin-login__success lk-admin-form__full">
              Код <strong>{issued.code}</strong> — «{issued.planName}» до {issued.until}.
              Ввести можно до {issued.activateUntil}.
              <button
                type="button"
                className="lk-admin-table__action"
                style={{ marginLeft: 12 }}
                onClick={() => copyCode('issued', issued.code)}
              >
                <Copy size={14} />
                {copiedId === 'issued' ? 'Скопирован' : 'Скопировать'}
              </button>
            </div>
          )}

          <div className="lk-admin-form__actions">
            <button type="submit" disabled={status === 'loading'}>
              <Ticket size={15} />
              {status === 'loading' ? 'Выпускаем…' : 'Выпустить код'}
            </button>
          </div>
        </form>
      </div>

      <div className="lk-admin-detail">
        <h2 className="lk-admin-detail__title">
          Выпущенные
          {listState === 'ready' ? ` (${list.total})` : ''}
        </h2>

        <div className="lk-admin-list__filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`lk-admin-filter ${filter === item.id ? 'is-active' : ''}`}
              onClick={() => changeFilter(item.id)}
            >
              {item.label}
              {item.id === 'activated' && listState === 'ready' ? ` (${list.activatedCount})` : ''}
            </button>
          ))}
        </div>

        {listState === 'loading' && (
          <p className="lk-admin-detail__hint">
            <Loader2 size={14} className="lk-spin" /> Загружаем список…
          </p>
        )}

        {listState === 'error' && (
          <div className="lk-admin-login__error">{listError}</div>
        )}

        {listState === 'ready' && list.items.length === 0 && (
          <p className="lk-admin-detail__hint">Промокодов в этом списке нет.</p>
        )}

        {listState === 'ready' && list.items.length > 0 && (
          <div className="lk-admin-table lk-admin-table--promos">
            <div className="lk-admin-table__row lk-admin-table__row--head">
              <span>Код</span>
              <span>Статус</span>
              <span>Тариф</span>
              <span>Подписка до</span>
              <span>Ввести до</span>
              <span>Кто активировал</span>
            </div>

            {list.items.map((item) => {
              const used = item.status === 'activated';
              return (
                <div className="lk-admin-table__row" key={item.id}>
                  <span className="lk-admin-table__name">
                    {item.code}
                    <button
                      type="button"
                      className="lk-admin-table__action"
                      onClick={() => copyCode(item.id, item.code)}
                    >
                      <Copy size={13} />
                      {copiedId === item.id ? 'Ок' : 'Копировать'}
                    </button>
                  </span>
                  <span>{used ? 'Активирован' : 'Свободен'}</span>
                  <span>{item.conditions?.plan_name || '—'}</span>
                  <span>{formatDay(item.conditions?.expires_at)}</span>
                  <span>{formatDay(item.conditions?.valid_until)}</span>
                  <span>
                    {used
                      ? `#${item.redeemed_by_user_id ?? '—'}, ${formatDay(item.redeemed_at)}`
                      : '—'}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {listState === 'ready' && list.total > PAGE_SIZE && (
          <div className="lk-admin-pager">
            <button
              type="button"
              className="lk-carousel-nav__btn"
              onClick={() => changePage(Math.max(1, page - 1))}
              disabled={page <= 1}
              aria-label="Предыдущая страница"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="lk-admin-pager__counter">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              className="lk-carousel-nav__btn"
              onClick={() => changePage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              aria-label="Следующая страница"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
