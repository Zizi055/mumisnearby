import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Check, AlertCircle, Loader } from 'lucide-react';
import {
  validatePromoCode,
  activatePromoCode,
  attachPromoCode,
  formatPromoInput,
  isPromoCodeComplete,
} from '../api/b2b.service';

// ─────────────────────────────────────────────────────────────────────
// Активация корпоративного промокода сотрудником.
//
// Два шага, и порядок здесь важен:
//
//  1. Проверяем код ДО регистрации. Человек сразу видит, в какую компанию
//     и на какой тариф он попадёт. Заполнить длинную форму и только потом
//     узнать «код просрочен» — худший из возможных сценариев.
//
//  2. Регистрация одним запросом: учётка + привязка к компании + подписка.
//     Оплаты нет вообще — доступ оплатила компания.
//
// Код приходит и из QR (?code=...), и руками. Во втором случае поле
// доформатирует введённое: префикс не обязателен, регистр не важен, а
// 0/1/I/L подменяются на O/J — в нашем алфавите этих знаков нет, и это
// самая частая ошибка переписывания с бумаги.
// ─────────────────────────────────────────────────────────────────────

export default function PromoActivate() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(null); // { valid, company_name, plan_name, reason }

  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    phoneNumber: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const hasAccount = !!localStorage.getItem('token');

  // Код из QR-ссылки — проверяем сразу, человек ничего не вводил.
  useEffect(() => {
    const fromUrl = params.get('code');
    if (!fromUrl) return;

    const formatted = formatPromoInput(fromUrl);
    setCode(formatted);

    if (isPromoCodeComplete(formatted)) check(formatted);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function check(value) {
    setChecking(true);
    setChecked(null);
    setError('');

    try {
      const res = await validatePromoCode(value);
      setChecked(res);
    } catch (err) {
      // Не-200 здесь означает «эндпоинта нет» или «сервер упал», а не
      // «код неверный»: при неверном коде бэк отвечает 200 + valid: false.
      setError(
        /404/.test(err.message)
          ? 'Активация промокодов ещё не подключена на сервере. Напишите своему HR — он подскажет, когда заработает.'
          : err.message || 'Не удалось проверить код'
      );
    } finally {
      setChecking(false);
    }
  }

  const handleCodeChange = (e) => {
    const formatted = formatPromoInput(e.target.value);
    setCode(formatted);
    setChecked(null);
  };

  const handleCheck = (e) => {
    e.preventDefault();
    if (isPromoCodeComplete(code)) check(code);
  };

  // Уже вошедший пользователь (был частным клиентом) — не создаём второй
  // аккаунт на ту же почту, а привязываем код к существующему.
  const handleAttach = async () => {
    setSubmitting(true);
    setError('');

    try {
      await attachPromoCode(code);
      navigate('/voice/my', { replace: true });
    } catch (err) {
      setError(err.message || 'Не удалось привязать код');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password.length < 8) {
      setError('Пароль должен быть не короче 8 символов.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const data = await activatePromoCode({ code, ...form });

      if (data?.access_token) {
        localStorage.setItem('token', data.access_token);
      }

      // Сразу к записи голоса: это главный и единственный обязательный
      // шаг, без него сервисом пользоваться невозможно.
      navigate('/voice/my?welcome=1', { replace: true });
    } catch (err) {
      setError(err.message || 'Не удалось активировать доступ');
    } finally {
      setSubmitting(false);
    }
  };

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const reasonText = {
    expired: 'Срок действия кода истёк. Попросите у HR новый.',
    used: 'Этот код уже использован.',
    deactivated: 'Код отключён компанией.',
    not_found: 'Такого кода нет. Проверьте, нет ли опечатки.',
    no_seats: 'В компании закончились свободные места. Сообщите HR.',
  };

  return (
    <div className="lk-promo-shell">
      <div className="lk-promo">
        <div className="lk-promo__card">
          <span className="lk-text-eyebrow">Корпоративный доступ</span>
          <h1>Активация промокода</h1>
          <p>
            Введите код, который выдала ваша компания, — или отсканируйте
            QR-код из письма.
          </p>

          {/* ШАГ 1 — КОД */}
          <form className="lk-promo__code" onSubmit={handleCheck}>
            <label className="lk-hr-field">
              <span>Промокод</span>
              <input
                type="text"
                value={code}
                placeholder="RODN-GOLOS-17-K4P9TXM2"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck="false"
                onChange={handleCodeChange}
              />
            </label>

            {!checked?.valid && (
              <button
                type="submit"
                className="lk-btn lk-btn--primary lk-btn--md"
                disabled={!isPromoCodeComplete(code) || checking}
              >
                {checking ? 'Проверяем…' : 'Проверить код'}
              </button>
            )}
          </form>

          {checking && (
            <div className="lk-hr-loader">
              <Loader size={18} className="is-spinning" />
            </div>
          )}

          {checked && checked.valid === false && (
            <div className="lk-promo__status lk-promo__status--bad">
              <AlertCircle size={18} />
              {reasonText[checked.reason] ?? 'Код не подошёл.'}
            </div>
          )}

          {error && <div className="lk-hr-error">{error}</div>}

          {/* ШАГ 2 — РЕГИСТРАЦИЯ */}
          {checked?.valid && (
            <>
              <div className="lk-promo__status lk-promo__status--good">
                <Check size={18} />
                <div>
                  <strong>Код подходит</strong>
                  <p>
                    {checked.company_name} · тариф «{checked.plan_name}»
                  </p>
                </div>
              </div>

              {hasAccount ? (
                <>
                  <p className="lk-promo__note">
                    Вы уже вошли в свой личный кабинет. Код привяжется к текущей
                    учётной записи — заводить вторую не нужно.
                  </p>

                  <button
                    type="button"
                    className="lk-btn lk-btn--primary lk-btn--md"
                    onClick={handleAttach}
                    disabled={submitting}
                  >
                    {submitting ? 'Подключаем…' : 'Подключить корпоративный доступ'}
                  </button>
                </>
              ) : (
                <form className="lk-hr-form lk-hr-form--grid" onSubmit={handleRegister}>
                  <label className="lk-hr-field">
                    <span>Как вас зовут</span>
                    <input type="text" value={form.username} required onChange={set('username')} />
                  </label>

                  <label className="lk-hr-field">
                    <span>Почта</span>
                    <input
                      type="email"
                      value={form.email}
                      required
                      autoCapitalize="none"
                      spellCheck="false"
                      onChange={set('email')}
                    />
                  </label>

                  <label className="lk-hr-field">
                    <span>Телефон <em>— необязательно</em></span>
                    <input type="tel" value={form.phoneNumber} onChange={set('phoneNumber')} />
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

                  <p className="lk-promo__note lk-hr-form__full">
                    Платить ничего не нужно — доступ уже оплатила компания.
                    Записи вашего голоса и созданные сказки работодателю
                    недоступны.
                  </p>

                  <div className="lk-hr-form__full">
                    <button
                      type="submit"
                      className="lk-btn lk-btn--primary lk-btn--md"
                      disabled={submitting}
                    >
                      {submitting ? 'Создаём доступ…' : 'Активировать и записать голос'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          <p className="lk-promo__foot">
            Уже активировали раньше? <Link to="/auth">Войти в кабинет</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
