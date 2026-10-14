import { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Loader,
  RefreshCw,
  UserPlus,
  Key,
  Trash2,
  AlertCircle,
  Info,
  Copy,
  Check,
} from 'lucide-react';
import {
  getStaff,
  createStaff,
  updateStaff,
  resetStaffPassword,
  deleteStaff,
  getPlans,
  getSlots,
  readSlotLevel,
  hasFreeStaffSeat,
} from '../../api/company.service';
import { isNotImplemented } from '../../api/companyClient';
import HrPending from '../../components/hr/HrPending';

// ─────────────────────────────────────────────────────────────────────
// Сотрудники компании.
//
// Промокодов на бэке нет. Компания заводит человека сама — с почтой и
// паролем — и передаёт ему эти данные. Он входит в обычное приложение
// через /auth/login, подтверждение почты не требуется.
//
// Тариф назначается по plan_id из каталога, НЕ по уровню доступа. Но
// ограничивают выдачу именно слоты уровня: несколько тарифов одного
// уровня делят общую кучу. Поэтому в селекте тарифы сгруппированы по
// уровням, а уровни с исчерпанными слотами выключены — иначе человек
// выбирает тариф и получает 429 уже после отправки формы.
// ─────────────────────────────────────────────────────────────────────

function generatePassword() {
  // Без похожих знаков: пароль диктуют по телефону и переписывают с
  // бумаги, и 0/O, 1/l/I — самая частая причина «не могу войти».
  const abc = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const bytes = new Uint32Array(12);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (n) => abc[n % abc.length]).join('');
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

export default function HrEmployees() {
  const { expired } = useOutletContext() ?? {};

  const [staff, setStaff] = useState([]);
  const [plans, setPlans] = useState([]);
  const [slots, setSlots] = useState(null);

  const [status, setStatus] = useState('loading'); // loading | ready | pending | failed
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    email: '',
    username: '',
    phoneNumber: '',
    planId: '',
    password: generatePassword(),
  });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [created, setCreated] = useState(null);
  const [copied, setCopied] = useState('');

  const [rowBusy, setRowBusy] = useState(null);
  const [rowError, setRowError] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setStatus('loading');
    setError('');

    try {
      const [staffData, plansData, slotsData] = await Promise.all([
        getStaff(),
        getPlans(),
        getSlots(),
      ]);

      setStaff(staffData);
      setPlans(plansData);
      setSlots(slotsData);
      setStatus('ready');
    } catch (err) {
      if (isNotImplemented(err)) {
        setStatus('pending');
        return;
      }
      setError(err.message || 'Не удалось загрузить сотрудников');
      setStatus('failed');
    }
  }

  // Тарифы по уровням — ровно так их показывает селект.
  const plansByLevel = useMemo(() => {
    const map = { 1: [], 2: [], 3: [] };
    for (const p of plans) {
      if (map[p.access_lvl]) map[p.access_lvl].push(p);
    }
    return map;
  }, [plans]);

  const seatsLeft = slots
    ? Math.max(0, (slots.staff_limit ?? 0) - (slots.staff_used ?? 0))
    : null;

  const canAdd = !expired && hasFreeStaffSeat(slots);

  const handleCreate = async (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      setCreateError('Пароль должен быть не короче 8 символов.');
      return;
    }

    setCreating(true);
    setCreateError('');

    try {
      const res = await createStaff(form);

      // Пароль показываем ОДИН раз: бэк его больше не отдаёт, и если
      // закрыть окно не скопировав — останется только сбросить.
      setCreated({ ...res, password: form.password });

      setForm({
        email: '',
        username: '',
        phoneNumber: '',
        planId: '',
        password: generatePassword(),
      });

      await load();
    } catch (err) {
      setCreateError(err.message || 'Не удалось создать сотрудника');
    } finally {
      setCreating(false);
    }
  };

  async function handlePlanChange(user, planId) {
    setRowBusy(user.id);
    setRowError('');

    try {
      await updateStaff(user.id, { planId: planId || null });
      await load();
    } catch (err) {
      setRowError(err.message || 'Не удалось сменить тариф');
    } finally {
      setRowBusy(null);
    }
  }

  async function handleResetPassword(user) {
    const next = generatePassword();

    setRowBusy(user.id);
    setRowError('');

    try {
      await resetStaffPassword(user.id, next);
      setCreated({ ...user, password: next, reset: true });
    } catch (err) {
      setRowError(err.message || 'Не удалось сменить пароль');
    } finally {
      setRowBusy(null);
    }
  }

  async function handleDelete(user) {
    const ok = window.confirm(
      `Удалить ${user.username || user.email}?\n\n` +
        'Вместе с аккаунтом удалятся записанные голоса и все созданные ' +
        'озвучки. Восстановить их нельзя. Место в пакете освободится.'
    );
    if (!ok) return;

    setRowBusy(user.id);
    setRowError('');

    try {
      await deleteStaff(user.id);
      await load();
    } catch (err) {
      setRowError(err.message || 'Не удалось удалить сотрудника');
    } finally {
      setRowBusy(null);
    }
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(''), 1800);
    });
  }

  if (status === 'pending') return <HrPending what="Список сотрудников" />;

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

      {/* Только что созданный доступ. Отдельным блоком и наверху: пароль
          показывается единственный раз, и его нужно успеть передать. */}
      {created && (
        <section className="lk-hr-card lk-hr-card--accent">
          <h2 className="lk-hr-card__title">
            {created.reset ? 'Новый пароль' : 'Доступ создан'}
          </h2>

          <p className="lk-hr-hint">
            <AlertCircle size={14} />
            Пароль показывается один раз. Скопируйте и передайте сотруднику —
            посмотреть его позже будет нельзя, только сбросить.
          </p>

          <div className="lk-hr-creds">
            <div>
              <span>Почта</span>
              <code>{created.email}</code>
            </div>
            <div>
              <span>Пароль</span>
              <code>{created.password}</code>
            </div>
          </div>

          <div className="lk-hr-actions">
            <button
              type="button"
              className="lk-btn lk-btn--primary lk-btn--md"
              onClick={() =>
                copy(
                  `Вход: ${window.location.origin}/lk/\nПочта: ${created.email}\nПароль: ${created.password}`,
                  'creds'
                )
              }
            >
              {copied === 'creds' ? <Check size={15} /> : <Copy size={15} />}
              {copied === 'creds' ? 'Скопировано' : 'Скопировать для отправки'}
            </button>

            <button
              type="button"
              className="lk-btn lk-btn--ghost lk-btn--md"
              onClick={() => setCreated(null)}
            >
              Я передал, скрыть
            </button>
          </div>
        </section>
      )}

      {/* ДОБАВЛЕНИЕ */}
      <section className="lk-hr-card">
        <h2 className="lk-hr-card__title">Добавить сотрудника</h2>

        {!canAdd && (
          <p className="lk-hr-hint lk-hr-hint--warn">
            <AlertCircle size={14} />
            {expired
              ? 'Договор истёк — добавлять сотрудников нельзя. Обратитесь к менеджеру.'
              : 'Все места в пакете заняты. Чтобы подключить ещё людей, обратитесь к менеджеру.'}
          </p>
        )}

        <form className="lk-hr-form lk-hr-form--grid" onSubmit={handleCreate}>
          <label className="lk-hr-field">
            <span>Рабочая почта <em>— это логин сотрудника</em></span>
            <input
              type="email"
              value={form.email}
              required
              disabled={!canAdd}
              autoCapitalize="none"
              spellCheck="false"
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </label>

          <label className="lk-hr-field">
            <span>Имя</span>
            <input
              type="text"
              value={form.username}
              required
              disabled={!canAdd}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
            />
          </label>

          <label className="lk-hr-field">
            <span>Телефон <em>— необязательно</em></span>
            <input
              type="tel"
              value={form.phoneNumber}
              disabled={!canAdd}
              onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))}
            />
          </label>

          <label className="lk-hr-field">
            <span>
              Тариф
              {seatsLeft != null && <em> — мест свободно {seatsLeft}</em>}
            </span>
            <select
              value={form.planId}
              disabled={!canAdd}
              onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
            >
              <option value="">Без тарифа — назначить позже</option>

              {[1, 2, 3].map((lvl) => {
                const level = readSlotLevel(slots, lvl);
                const list = plansByLevel[lvl] ?? [];

                if (list.length === 0) return null;

                return (
                  <optgroup
                    key={lvl}
                    label={`Уровень ${lvl} — свободно ${level.free} из ${level.limit}`}
                    disabled={level.free === 0}
                  >
                    {list.map((p) => (
                      <option key={p.id} value={p.id} disabled={level.free === 0}>
                        {p.name}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>

          <label className="lk-hr-field lk-hr-form__full">
            <span>Пароль <em>— сгенерирован, можно заменить своим</em></span>
            <div className="lk-hr-field__password">
              <input
                type="text"
                value={form.password}
                required
                disabled={!canAdd}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, password: generatePassword() }))}
                title="Сгенерировать заново"
                aria-label="Сгенерировать заново"
              >
                <RefreshCw size={16} />
              </button>
            </div>
          </label>

          {createError && (
            <div className="lk-hr-error lk-hr-form__full">{createError}</div>
          )}

          <div className="lk-hr-form__full">
            <button
              type="submit"
              className="lk-btn lk-btn--primary lk-btn--md"
              disabled={creating || !canAdd}
            >
              <UserPlus size={15} />
              {creating ? 'Создаём…' : 'Создать доступ'}
            </button>
          </div>
        </form>
      </section>

      {status === 'loading' && (
        <div className="lk-hr-loader">
          <Loader size={20} className="is-spinning" />
        </div>
      )}

      {status === 'failed' && (
        <div className="lk-hr-pending">
          <AlertCircle size={26} />
          <h2>Не удалось загрузить список</h2>
          <p>{error}</p>
          <button type="button" className="lk-btn lk-btn--secondary lk-btn--md" onClick={load}>
            Попробовать снова
          </button>
        </div>
      )}

      {status === 'ready' && staff.length === 0 && (
        <div className="lk-hr-empty">
          Сотрудников пока нет. Создайте первый доступ в форме выше.
        </div>
      )}

      {status === 'ready' && staff.length > 0 && (
        <>
          {rowError && <div className="lk-hr-error">{rowError}</div>}

          <div className="lk-hr-table lk-hr-table--staff">
            <div className="lk-hr-table__row lk-hr-table__row--head">
              <span>Сотрудник</span>
              <span>Почта</span>
              <span>Тариф</span>
              <span>Подключён</span>
              <span />
            </div>

            {staff.map((u) => (
              <div key={u.id} className="lk-hr-table__row">
                <span className="lk-hr-table__name">{u.username || `#${u.id}`}</span>

                <span className="lk-hr-table__contacts">
                  <a href={`mailto:${u.email}`}>{u.email}</a>
                </span>

                <span>
                  <select
                    className="lk-hr-inline-select"
                    value={u.plan?.id ?? ''}
                    disabled={expired || rowBusy === u.id}
                    onChange={(e) => handlePlanChange(u, e.target.value)}
                  >
                    <option value="">Без тарифа</option>

                    {[1, 2, 3].map((lvl) => {
                      const level = readSlotLevel(slots, lvl);
                      const list = plansByLevel[lvl] ?? [];
                      if (list.length === 0) return null;

                      // Свой текущий тариф всегда доступен, даже если
                      // слоты уровня исчерпаны: иначе селект показывал
                      // бы пустоту вместо реального тарифа.
                      const blocked = level.free === 0 && u.plan?.access_lvl !== lvl;

                      return (
                        <optgroup key={lvl} label={`Уровень ${lvl}`} disabled={blocked}>
                          {list.map((p) => (
                            <option key={p.id} value={p.id} disabled={blocked}>
                              {p.name}
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                  </select>
                </span>

                <span>{formatDate(u.created_at)}</span>

                <span className="lk-hr-table__tools">
                  <button
                    type="button"
                    onClick={() => handleResetPassword(u)}
                    disabled={rowBusy === u.id}
                    title="Сбросить пароль"
                  >
                    <Key size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(u)}
                    disabled={rowBusy === u.id}
                    title="Удалить сотрудника"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            ))}
          </div>

          <p className="lk-hr-hint">
            <Info size={14} />
            Сотрудник входит на том же сайте, в обычный личный кабинет — по
            почте и паролю, которые вы ему выдали. Отдельного приложения нет.
          </p>
        </>
      )}
    </div>
  );
}
