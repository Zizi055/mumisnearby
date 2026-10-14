import { useEffect, useState } from 'react';
import {
  Loader,
  RefreshCw,
  Search,
  Building2,
  Plus,
  AlertCircle,
  Power,
  ChevronDown,
  ChevronRight,
  Info,
} from 'lucide-react';
import {
  getCompanies,
  createCompany,
  updateCompany,
  setCompanyActive,
  getCompanySlots,
  validatePackage,
  validateInn,
} from '../../api/adminCompanies.service';

// ─────────────────────────────────────────────────────────────────────
// Админка юрлиц.
//
// Компании заводит только администратор: самостоятельной регистрации на
// бэке нет. Здесь же выдаётся пакет — не один тариф, а СЛОТЫ по
// уровням: сколько сотрудников компания сможет посадить на уровень 1,
// 2 и 3.
//
// Сумма слотов обязана равняться числу сотрудников, иначе бэк отвечает
// 400. Проверяем это прямо в форме и показываем остаток на лету: четыре
// числа руками сходятся далеко не с первого раза.
//
// Срок договора правится здесь же. Важно помнить: смена expires_at
// двигает дату подписки ВСЕМ активным сотрудникам компании — это и есть
// продление договора.
// ─────────────────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: '',
  inn: '',
  email: '',
  phone: '',
  password: '',
  staffLimit: '10',
  tariff1: '10',
  tariff2: '0',
  tariff3: '0',
  expiresAt: defaultExpiry(),
};

function defaultExpiry() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

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

function isPast(iso) {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t < Date.now();
}

export default function AdminCompanies() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | failed
  const [error, setError] = useState('');

  const [queryInput, setQueryInput] = useState('');
  const [query, setQuery] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [expanded, setExpanded] = useState(null);
  const [slots, setSlots] = useState({});
  const [rowBusy, setRowBusy] = useState(null);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      setItems(await getCompanies({ query }));
      setStatus('ready');
    } catch (err) {
      setError(err.message || 'Не удалось загрузить список компаний');
      setStatus('failed');
    }
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const sum =
    (Number(form.tariff1) || 0) + (Number(form.tariff2) || 0) + (Number(form.tariff3) || 0);
  const limit = Number(form.staffLimit) || 0;
  const packageOk = sum === limit && limit > 0;

  const handleCreate = async (e) => {
    e.preventDefault();

    const innError = validateInn(form.inn);
    if (innError) {
      setCreateError(innError);
      return;
    }

    const packError = validatePackage(form);
    if (packError) {
      setCreateError(packError);
      return;
    }

    if (form.password.length < 8) {
      setCreateError('Пароль должен быть не короче 8 символов.');
      return;
    }

    // Бэк требует дату строго в будущем и отвечает 400. Проверяем сами:
    // при создании «задним числом» компания появилась бы уже истёкшей.
    if (isPast(form.expiresAt)) {
      setCreateError('Дата окончания договора должна быть в будущем.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      await createCompany(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await load();
    } catch (err) {
      setCreateError(err.message || 'Не удалось создать компанию');
    } finally {
      setCreating(false);
    }
  };

  async function toggleExpand(company) {
    if (expanded === company.id) {
      setExpanded(null);
      return;
    }

    setExpanded(company.id);

    if (!slots[company.id]) {
      try {
        const data = await getCompanySlots(company.id);
        setSlots((s) => ({ ...s, [company.id]: data }));
      } catch {
        setSlots((s) => ({ ...s, [company.id]: null }));
      }
    }
  }

  async function toggleActive(company) {
    setRowBusy(company.id);

    try {
      await setCompanyActive(company.id, company.is_active === false);
      await load();
    } catch (err) {
      setError(err.message || 'Не удалось изменить статус');
    } finally {
      setRowBusy(null);
    }
  }

  async function extendContract(company) {
    const next = window.prompt(
      'Новая дата окончания договора (ГГГГ-ММ-ДД).\n\n' +
        'Внимание: она применится ко всем активным сотрудникам компании.',
      company.expires_at ? String(company.expires_at).slice(0, 10) : defaultExpiry()
    );

    if (!next) return;

    setRowBusy(company.id);

    try {
      await updateCompany(company.id, { expiresAt: next });
      await load();
    } catch (err) {
      setError(err.message || 'Не удалось продлить договор');
    } finally {
      setRowBusy(null);
    }
  }

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Компании</h1>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="lk-admin-table__action"
            onClick={() => setShowForm((v) => !v)}
          >
            <Plus size={14} />
            {showForm ? 'Свернуть' : 'Новая компания'}
          </button>

          <button type="button" className="lk-admin__refresh" onClick={load} title="Обновить">
            <RefreshCw size={16} className={status === 'loading' ? 'is-spinning' : ''} />
          </button>
        </div>
      </header>

      {showForm && (
        <div className="lk-admin-detail">
          <h2 className="lk-admin-detail__title">Новая компания</h2>

          <p className="lk-admin-detail__hint">
            <Info size={14} />
            Доступ создаётся сразу: передайте компании почту и пароль — больше
            пароль нигде не показывается.
          </p>

          <form className="lk-admin-form" onSubmit={handleCreate}>
            <label className="lk-admin-login__field">
              <span>Название</span>
              <input type="text" value={form.name} required onChange={set('name')} />
            </label>

            <label className="lk-admin-login__field">
              <span>ИНН</span>
              <input
                type="text"
                value={form.inn}
                required
                inputMode="numeric"
                maxLength={12}
                placeholder="7707083893"
                onChange={set('inn')}
              />
            </label>

            <label className="lk-admin-login__field">
              <span>Почта — она же логин</span>
              <input
                type="email"
                value={form.email}
                required
                autoCapitalize="none"
                onChange={set('email')}
              />
            </label>

            <label className="lk-admin-login__field">
              <span>Телефон</span>
              <input type="tel" value={form.phone} onChange={set('phone')} />
            </label>

            <label className="lk-admin-login__field">
              <span>Пароль — минимум 8 символов</span>
              <input
                type="text"
                value={form.password}
                required
                onChange={set('password')}
              />
            </label>

            <label className="lk-admin-login__field">
              <span>Договор до</span>
              <input type="date" value={form.expiresAt} required onChange={set('expiresAt')} />
            </label>

            <label className="lk-admin-login__field">
              <span>Сотрудников всего</span>
              <input
                type="number"
                min="1"
                value={form.staffLimit}
                required
                onChange={set('staffLimit')}
              />
            </label>

            <label className="lk-admin-login__field">
              <span>Слотов уровня 1</span>
              <input type="number" min="0" value={form.tariff1} onChange={set('tariff1')} />
            </label>

            <label className="lk-admin-login__field">
              <span>Слотов уровня 2</span>
              <input type="number" min="0" value={form.tariff2} onChange={set('tariff2')} />
            </label>

            <label className="lk-admin-login__field">
              <span>Слотов уровня 3</span>
              <input type="number" min="0" value={form.tariff3} onChange={set('tariff3')} />
            </label>

            {/* Сумма слотов обязана сойтись с числом сотрудников. Пишем
                разницу прямо здесь, чтобы не ловить 400 после отправки. */}
            <div
              className={`lk-admin-detail__hint lk-admin-form__full ${
                packageOk ? '' : 'lk-admin-detail__hint--warn'
              }`}
            >
              {packageOk ? (
                <>Пакет сходится: {sum} слотов на {limit} сотрудников.</>
              ) : (
                <>
                  Сумма слотов {sum}, сотрудников {limit} — не хватает{' '}
                  {limit - sum > 0 ? `${limit - sum}` : `убрать ${sum - limit}`}.
                </>
              )}
            </div>

            {createError && (
              <div className="lk-admin-login__error lk-admin-form__full">{createError}</div>
            )}

            <div className="lk-admin-form__actions">
              <button type="submit" disabled={creating || !packageOk}>
                <Building2 size={15} />
                {creating ? 'Создаём…' : 'Создать компанию'}
              </button>
            </div>
          </form>
        </div>
      )}

      <form
        className="lk-admin-search"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(queryInput);
        }}
      >
        <Search size={16} />
        <input
          type="search"
          value={queryInput}
          placeholder="Название, ИНН или почта"
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
          <h2>Не удалось загрузить компании</h2>
          <p>{error}</p>
          <button type="button" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'ready' && items.length === 0 && (
        <div className="lk-admin-list__empty">
          {query ? `По запросу «${query}» ничего не нашли.` : 'Компаний пока нет.'}
        </div>
      )}

      {status === 'ready' && items.length > 0 && (
        <div className="lk-admin-table lk-admin-table--users">
          <div className="lk-admin-table__row lk-admin-table__row--head">
            <span>Компания</span>
            <span>Почта</span>
            <span>Места</span>
            <span>Договор</span>
          </div>

          {items.map((c) => {
            const isOpen = expanded === c.id;
            const off = c.is_active === false;
            const over = isPast(c.expires_at);
            const s = slots[c.id];

            return (
              <div key={c.id} className="lk-admin-table__group">
                <div
                  className={`lk-admin-table__row lk-admin-table__row--clickable ${
                    isOpen ? 'is-open' : ''
                  }`}
                  onClick={() => toggleExpand(c)}
                >
                  <span className="lk-admin-table__name">
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    {c.name}
                    <em className="lk-admin-table__id">ИНН {c.inn}</em>
                  </span>

                  <span className="lk-admin-table__contacts">
                    <a href={`mailto:${c.email}`} onClick={(e) => e.stopPropagation()}>
                      {c.email}
                    </a>
                  </span>

                  <span>{c.staff_limit ?? 0}</span>

                  <span>
                    {formatDate(c.expires_at)}
                    <em
                      className={`lk-hr-status lk-hr-status--${
                        off ? 'cancelled' : over ? 'expired' : 'active'
                      }`}
                    >
                      {off ? 'выключена' : over ? 'истёк' : 'активен'}
                    </em>
                  </span>
                </div>

                {isOpen && (
                  <div className="lk-admin-table__details">
                    <dl>
                      <dt>Пакет слотов</dt>
                      <dd>
                        уровень 1 — {c.tariff1_count ?? 0}, уровень 2 —{' '}
                        {c.tariff2_count ?? 0}, уровень 3 — {c.tariff3_count ?? 0}
                      </dd>

                      <dt>Занято</dt>
                      <dd>
                        {s
                          ? `${s.staff_used ?? 0} из ${s.staff_limit ?? 0} мест`
                          : 'загружаем…'}
                      </dd>

                      <dt>Телефон</dt>
                      <dd>{c.phone || '—'}</dd>

                      <dt>Создана</dt>
                      <dd>{formatDate(c.created_at)}</dd>
                    </dl>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="lk-admin-table__action"
                        disabled={rowBusy === c.id}
                        onClick={() => extendContract(c)}
                      >
                        Продлить договор
                      </button>

                      <button
                        type="button"
                        className="lk-admin-table__action"
                        disabled={rowBusy === c.id}
                        onClick={() => toggleActive(c)}
                      >
                        <Power size={14} />
                        {off ? 'Включить' : 'Приостановить'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
