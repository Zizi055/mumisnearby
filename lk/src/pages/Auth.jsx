import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Sparkles, MailCheck } from 'lucide-react';
import { login, register, resendVerification } from '../api/auth.service';
import { getStoredReferralCode, clearStoredReferralCode } from '../utils/referral';
import { useAuth } from '../context/AuthContext';
import AuthDNA from './AuthDNA';
import '../styles/scss/pages/auth.scss';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function validateName(name) {
  return name.trim().length >= 2;
}

function getRedirectPath() {
  const hash = window.location.hash;
  const queryStart = hash.indexOf('?');
  if (queryStart === -1) return null;
  const params = new URLSearchParams(hash.slice(queryStart + 1));
  const redirect = params.get('redirect');
  return redirect ? decodeURIComponent(redirect) : null;
}

export default function Auth() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [status, setStatus] = useState('idle');
  const [serverError, setServerError] = useState('');

  // Заполняется после успешной регистрации — показываем экран "проверьте
  // почту" вместо того чтобы вести в ЛК: POST /auth/register токена не
  // выдаёт (RegisterResponse = { message }), пользователь ещё не
  // подтвердил почту, вести его в ЛК нельзя.
  const [awaitingVerification, setAwaitingVerification] = useState(null);
  const [resendState, setResendState] = useState('idle'); // idle | sending | sent | error
  const [resendError, setResendError] = useState('');

  const isRegister = tab === 'register';
  const isLoading = status === 'loading';

  const errors = {
    name: isRegister && !validateName(name) ? 'Введите имя (минимум 2 символа)' : '',
    email: !validateEmail(email) ? 'Введите корректный email' : '',
    password: !validatePassword(password) ? 'Минимум 8 символов' : '',
  };

  const showError = (field) => touched[field] ? errors[field] : '';

  const isFormValid = isRegister
    ? !errors.name && !errors.email && !errors.password
    : !errors.email && !errors.password;

  const handleBlur = (field) => setTouched((p) => ({ ...p, [field]: true }));

  const handleSubmit = async () => {
    setTouched({ name: true, email: true, password: true });
    if (!isFormValid) return;

    setStatus('loading');
    setServerError('');

    try {
      if (isRegister) {
        const refCode = getStoredReferralCode();

        await register({ name, email, password, referral_code: refCode || undefined });

        if (refCode) {
          // referral_code уже ушёл в /auth/register — локальный код можно очистить
          clearStoredReferralCode();
        }

        setStatus('idle');
        setAwaitingVerification(email);
        return;
      }

      const user = await login({ email, password });
      setUser(user);

      // После входа проверяем redirect
      // Если пользователь пришёл с тарифной страницы — ведём на оплату
      const redirect = getRedirectPath();
      navigate(redirect || '/dashboard/progress');

    } catch (e) {
      setServerError(e.message || 'Что-то пошло не так');
      setStatus('error');
    }
  };

  const handleResend = async () => {
    setResendState('sending');
    setResendError('');
    try {
      await resendVerification();
      setResendState('sent');
    } catch (e) {
      setResendState('error');
      setResendError(
        e.message || 'Не получилось отправить письмо повторно. Попробуйте позже.'
      );
    }
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setTouched({ name: false, email: false, password: false });
    setServerError('');
    setStatus('idle');
    setAwaitingVerification(null);
    setResendState('idle');
    setResendError('');
  };

  return (
    <div className="auth">

      {/* ═══ ЛЕВАЯ ПАНЕЛЬ ═══ */}
      <div className="auth__left">

        <AuthDNA />

        <div className="auth__left-content">

          <div className="auth__brand">
            <Sparkles size={16} />
            Родные голоса
          </div>

          <div className="auth__tagline">
            <h1>Голос близких —<br />в каждой сказке</h1>
            <p>
              Создайте голосового двойника и подарите ребёнку
              сказки, рассказанные именно вами.
            </p>
          </div>

          <div className="auth__features">
            <div className="auth__feature">
              <span className="auth__feature-dot" />
              Голосовые двойники родных
            </div>
            <div className="auth__feature">
              <span className="auth__feature-dot" />
              Библиотека из 100+ сказок
            </div>
            <div className="auth__feature">
              <span className="auth__feature-dot" />
              Терапевтические сценарии
            </div>
          </div>

        </div>
      </div>

      {/* ═══ ПРАВАЯ ПАНЕЛЬ ═══ */}
      <div className="auth__right">
        <div className="auth__card">

          <div className="auth__tabs">
            <button
              type="button"
              className={`auth__tab ${tab === 'login' ? 'is-active' : ''}`}
              onClick={() => handleTabSwitch('login')}
            >
              Войти
            </button>
            <button
              type="button"
              className={`auth__tab ${tab === 'register' ? 'is-active' : ''}`}
              onClick={() => handleTabSwitch('register')}
            >
              Регистрация
            </button>
          </div>

          {awaitingVerification ? (
            <div className="auth__reset-success">
              <div className="auth__reset-success__icon">
                <MailCheck size={32} />
              </div>
              <h2>Проверьте почту</h2>
              <p>
                Мы отправили письмо со ссылкой подтверждения на{' '}
                <strong>{awaitingVerification}</strong>. Перейдите по ссылке
                из письма, чтобы завершить регистрацию — после этого можно
                будет войти. Проверьте папку «Спам», если письмо не пришло.
              </p>

              {resendState === 'sent' ? (
                <p className="auth__verify-sent">Письмо отправлено повторно.</p>
              ) : (
                <>
                  {resendState === 'error' && (
                    <div className="auth__server-error">{resendError}</div>
                  )}
                  <button
                    type="button"
                    className="auth__submit"
                    disabled={resendState === 'sending'}
                    onClick={handleResend}
                  >
                    {resendState === 'sending' ? 'Отправляем…' : 'Отправить письмо ещё раз'}
                  </button>
                </>
              )}

              <div className="auth__forgot">
                <button type="button" onClick={() => handleTabSwitch('login')}>
                  Уже подтвердили — войти
                </button>
              </div>
            </div>
          ) : (
          <div className="auth__form">

            {isRegister && (
              <div className={`auth__field ${showError('name') ? 'is-error' : ''}`}>
                <label className="auth__label">Ваше имя</label>
                <input
                  className="auth__input"
                  type="text"
                  placeholder="Как вас зовут?"
                  value={name}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                  onBlur={() => handleBlur('name')}
                />
                {showError('name') && (
                  <span className="auth__error">{showError('name')}</span>
                )}
              </div>
            )}

            <div className={`auth__field ${showError('email') ? 'is-error' : ''}`}>
              <label className="auth__label">Email</label>
              <input
                className="auth__input"
                type="email"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => handleBlur('email')}
              />
              {showError('email') && (
                <span className="auth__error">{showError('email')}</span>
              )}
            </div>

            <div className={`auth__field ${showError('password') ? 'is-error' : ''}`}>
              <label className="auth__label">Пароль</label>
              <div className="auth__input-wrap">
                <input
                  className="auth__input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder={isRegister ? 'Минимум 8 символов' : '••••••••'}
                  value={password}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => handleBlur('password')}
                />
                <button
                  type="button"
                  className="auth__eye"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label="Показать пароль"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {showError('password') && (
                <span className="auth__error">{showError('password')}</span>
              )}
            </div>

            {!isRegister && (
              <div className="auth__forgot">
                <button type="button" onClick={() => navigate('/auth/reset')}>
                  Забыли пароль?
                </button>
              </div>
            )}

            {serverError && (
              <div className="auth__server-error">
                {serverError}
                {!isRegister && serverError.includes('не подтверждён') && (
                  <>
                    {resendState === 'sent' ? (
                      <p className="auth__verify-sent">Письмо отправлено повторно.</p>
                    ) : (
                      <button
                        type="button"
                        className="auth__resend-inline"
                        onClick={handleResend}
                        disabled={resendState === 'sending'}
                      >
                        {resendState === 'sending' ? 'Отправляем…' : 'Отправить письмо ещё раз'}
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            <button
              type="button"
              className="auth__submit"
              disabled={isLoading}
              onClick={handleSubmit}
            >
              {isLoading ? (
                <span className="auth__spinner" />
              ) : (
                <>
                  {isRegister ? 'Создать аккаунт' : 'Войти'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            {isRegister && (
              <p className="auth__agree">
                Регистрируясь, вы принимаете{' '}
                <a href="/terms" target="_blank" rel="noreferrer">
                  условия использования
                </a>
                {' '}и{' '}
                <a href="/privacy.html" target="_blank" rel="noreferrer">
                  политику конфиденциальности
                </a>
              </p>
            )}

          </div>
          )}
        </div>
      </div>

    </div>
  );
}
