import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { login, register } from '../../api/auth.service';
import { useAuth } from '../../context/AuthContext';
import AuthDNA from './AuthDNA';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  return password.length >= 8;
}

function validateName(name) {
  return name.trim().length >= 2;
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
      const user = isRegister
        ? await register({ name, email, password })
        : await login({ email, password });

      setUser(user);
      navigate('/subscription/manage');
    } catch (e) {
      setServerError(e.message || 'Что-то пошло не так');
      setStatus('error');
    }
  };

  const handleTabSwitch = (newTab) => {
    setTab(newTab);
    setTouched({ name: false, email: false, password: false });
    setServerError('');
    setStatus('idle');
  };

  return (
    <div className="auth">

      {/* ═══ ЛЕВАЯ ПАНЕЛЬ ═══ */}
      <div className="auth__left">

        {/* Анимация  */}
        <AuthDNA />

        {/* Контент  */}
        <div className="auth__left-content">

          <div className="auth__brand">
            <Sparkles size={16} />
            Momis
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
              <div className="auth__server-error">{serverError}</div>
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
                <a href="/terms" target="_blank" rel="noreferrer">условия использования</a>
                {' '}и{' '}
                <a href="/privacy" target="_blank" rel="noreferrer">политику конфиденциальности</a>
              </p>
            )}

          </div>
        </div>
      </div>
       </div>   
  );
} 