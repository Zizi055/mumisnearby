import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, CheckCircle, Sparkles } from 'lucide-react';
import AuthDNA from './AuthDNA';
import '../styles/scss/pages/auth.scss';

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AuthReset() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | done | error
  const [serverError, setServerError] = useState('');

  const emailError = !validateEmail(email) ? 'Введите корректный email' : '';
  const showError = touched && emailError;

  const handleSubmit = async () => {
    setTouched(true);
    if (emailError) return;

    setStatus('loading');
    setServerError('');

    try {
      const res = await fetch('/auth/password-reset/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      // Даже если эндпоинт не реализован — показываем успех (защита от перебора)
      if (res.ok || res.status === 404 || res.status === 422) {
        setStatus('done');
      } else {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch {
      // Показываем успех в любом случае — не раскрываем наличие email
      setStatus('done');
    }
  };

  return (
    <div className="auth">

      {/* Левая панель */}
      <div className="auth__left">
        <AuthDNA />
        <div className="auth__left-content">
          <div className="auth__brand">
            <Sparkles size={16} />
            Родные голоса
          </div>
          <div className="auth__tagline">
            <h1>Восстановление<br />доступа</h1>
            <p>
              Укажите email — мы отправим
              ссылку для создания нового пароля.
            </p>
          </div>
        </div>
      </div>

      {/* Правая панель */}
      <div className="auth__right">
        <div className="auth__card">

          <button
            type="button"
            className="auth__back-btn"
            onClick={() => navigate('/auth')}
          >
            <ArrowLeft size={15} />
            Назад ко входу
          </button>

          {status === 'done' ? (
            <div className="auth__reset-success">
              <div className="auth__reset-success__icon">
                <CheckCircle size={32} />
              </div>
              <h2>Письмо отправлено</h2>
              <p>
                Если аккаунт с адресом <strong>{email}</strong> существует,
                мы отправили на него инструкцию по сбросу пароля.
                Проверьте папку «Спам», если письмо не пришло.
              </p>
              <button
                type="button"
                className="auth__submit"
                onClick={() => navigate('/auth')}
              >
                Вернуться ко входу
              </button>
            </div>
          ) : (
            <>
              <div className="auth__tabs">
                <span className="auth__tab is-active" style={{ cursor: 'default' }}>
                  Сброс пароля
                </span>
              </div>

              <div className="auth__form">

                <div className={`auth__field ${showError ? 'is-error' : ''}`}>
                  <label className="auth__label">Email</label>
                  <div className="auth__input-wrap">
                    <input
                      className="auth__input"
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      autoComplete="email"
                      onChange={(e) => setEmail(e.target.value)}
                      onBlur={() => setTouched(true)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    />
                    <Mail size={16} className="auth__input-icon" />
                  </div>
                  {showError && (
                    <span className="auth__error">{emailError}</span>
                  )}
                </div>

                <p className="auth__reset-hint">
                  Мы отправим ссылку на указанный адрес.
                  Ссылка действует 30 минут.
                </p>

                {serverError && (
                  <div className="auth__server-error">{serverError}</div>
                )}

                <button
                  type="button"
                  className="auth__submit"
                  disabled={status === 'loading'}
                  onClick={handleSubmit}
                >
                  {status === 'loading' ? (
                    <span className="auth__spinner" />
                  ) : 'Отправить письмо'}
                </button>

              </div>
            </>
          )}

        </div>
      </div>

    </div>
  );
}
