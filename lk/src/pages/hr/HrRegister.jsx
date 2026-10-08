import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import { registerCompany } from '../../api/hrAuth.service';
import { tariffs } from '../../data/tariffs.data';
import { PLAN_ID_MAP } from '../../data/planIdMap';

// ─────────────────────────────────────────────────────────────────────
// Регистрация компании.
//
// Компания создаётся сразу в пробном статусе на 3 дня — это обещано в
// блоке гарантий на лендинге. Оплата — отдельным шагом, уже из кабинета:
// заставлять HR платить до того, как он увидел продукт, значит потерять
// его на форме оплаты.
//
// Цена считается ЗА СОТРУДНИКА В ГОД, поэтому итог пересчитывается прямо
// в форме при изменении количества мест — HR должен видеть бюджет до
// отправки заявки, а не узнавать его в счёте.
// ─────────────────────────────────────────────────────────────────────

const GRANTABLE = tariffs.filter((t) => PLAN_ID_MAP[t.id]);

function formatMoney(value) {
  return new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
}

export default function HrRegister() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: '',
    inn: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    planId: String(PLAN_ID_MAP[GRANTABLE[1]?.id ?? GRANTABLE[0]?.id] ?? ''),
    seatsTotal: '10',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const plan = GRANTABLE.find((t) => String(PLAN_ID_MAP[t.id]) === form.planId);
  const seats = Number(form.seatsTotal) || 0;
  const total = plan && seats > 0 ? plan.priceYear * seats : null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (seats < 1) {
      setError('Укажите количество сотрудников — минимум одного.');
      setStatus('error');
      return;
    }

    if (form.password.length < 8) {
      setError('Пароль должен быть не короче 8 символов.');
      setStatus('error');
      return;
    }

    setStatus('loading');
    setError('');

    try {
      await registerCompany(form);
      navigate('/hr/dashboard', { replace: true });
    } catch (err) {
      setError(
        err.message === 'NOT_IMPLEMENTED'
          ? 'Регистрация компаний ещё не подключена на сервере. Оставьте заявку на главной — мы откроем доступ вручную.'
          : err.message || 'Не удалось зарегистрировать компанию'
      );
      setStatus('error');
    }
  };

  return (
    <div className="lk-hr-shell">
      <div className="lk-hr-login lk-hr-login--wide">
        <div className="lk-hr-login__card">
          <span className="lk-text-eyebrow">Кабинет компании</span>
          <h1>Регистрация компании</h1>
          <p>
            Первые 3 дня — бесплатно, без оплаты. Оплатить можно потом, уже
            из кабинета.
          </p>

          <form className="lk-hr-form lk-hr-form--grid" onSubmit={handleSubmit}>
            <label className="lk-hr-field">
              <span>Название компании</span>
              <input type="text" value={form.name} required onChange={set('name')} />
            </label>

            <label className="lk-hr-field">
              <span>ИНН <em>— для счёта, необязательно</em></span>
              <input
                type="text"
                value={form.inn}
                inputMode="numeric"
                onChange={set('inn')}
              />
            </label>

            <label className="lk-hr-field">
              <span>Ваше имя</span>
              <input
                type="text"
                value={form.contactName}
                required
                onChange={set('contactName')}
              />
            </label>

            <label className="lk-hr-field">
              <span>Рабочая почта <em>— она же логин</em></span>
              <input
                type="email"
                value={form.contactEmail}
                required
                autoCapitalize="none"
                spellCheck="false"
                onChange={set('contactEmail')}
              />
            </label>

            <label className="lk-hr-field">
              <span>Телефон <em>— необязательно</em></span>
              <input
                type="tel"
                value={form.contactPhone}
                onChange={set('contactPhone')}
              />
            </label>

            <label className="lk-hr-field">
              <span>Пароль <em>— минимум 8 символов</em></span>
              <div className="lk-hr-field__password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  required
                  autoComplete="new-password"
                  onChange={set('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            <label className="lk-hr-field">
              <span>Тариф</span>
              <select value={form.planId} onChange={set('planId')}>
                {GRANTABLE.map((t) => (
                  <option key={t.id} value={PLAN_ID_MAP[t.id]}>
                    {t.name} — {formatMoney(t.priceYear)} за сотрудника в год
                  </option>
                ))}
              </select>
            </label>

            <label className="lk-hr-field">
              <span>Сотрудников</span>
              <input
                type="number"
                min="1"
                value={form.seatsTotal}
                required
                onChange={set('seatsTotal')}
              />
            </label>

            {/* Итог считаем на экране: HR планирует бюджет до отправки
                формы, а не после выставления счёта. */}
            {total != null && (
              <div className="lk-hr-total lk-hr-form__full">
                <div>
                  <span className="lk-text-eyebrow">Стоимость в год</span>
                  <strong>{formatMoney(total)}</strong>
                </div>
                <p>
                  {plan.name} · {formatMoney(plan.priceYear)} × {seats}{' '}
                  {seats === 1 ? 'сотрудник' : 'сотрудников'}
                </p>
              </div>
            )}

            <p className="lk-hr-hint lk-hr-form__full">
              <Info size={14} />
              Места можно докупить в любой момент. Промокоды выдаются только в
              пределах оплаченных мест.
            </p>

            {status === 'error' && (
              <div className="lk-hr-error lk-hr-form__full">{error}</div>
            )}

            <div className="lk-hr-form__full">
              <button
                type="submit"
                className="lk-btn lk-btn--primary lk-btn--md"
                disabled={status === 'loading'}
              >
                {status === 'loading' ? 'Регистрируем…' : 'Зарегистрировать компанию'}
              </button>
            </div>
          </form>

          <p className="lk-hr-login__foot">
            Уже зарегистрированы? <Link to="/hr/login">Войти</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
