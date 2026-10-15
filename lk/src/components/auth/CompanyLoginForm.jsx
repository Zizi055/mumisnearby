import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { loginCompany } from '../../api/company.service';

// ─────────────────────────────────────────────────────────────────────
// Форма входа юрлица внутри общего экрана авторизации.
//
// Логин — ПОЧТА компании, не название. На бэке поле формы называется
// username (наследие OAuth2PasswordRequestForm), но принимает email:
// об этом легко забыть и потом долго искать причину 401.
//
// Самостоятельной регистрации нет — компании заводит администратор при
// заключении договора. Поэтому вместо вкладки «Регистрация» здесь
// объяснение, откуда берутся доступы: иначе человек ищет кнопку,
// которой не существует.
// ─────────────────────────────────────────────────────────────────────

export default function CompanyLoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!email.trim() || !password) return;

    setStatus('loading');
    setError('');

    try {
      await loginCompany({ email: email.trim(), password });

      const redirect = params.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/company/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Не удалось войти');
      setStatus('idle');
    }
  };

  return (
    <form className="auth__form" onSubmit={handleSubmit}>
      <div className="auth__field">
        <label className="auth__label" htmlFor="company-email">
          Почта компании
        </label>
        <input
          className="auth__input"
          id="company-email"
          type="email"
          placeholder="b2b@company.ru"
          value={email}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="auth__field">
        <label className="auth__label" htmlFor="company-password">
          Пароль
        </label>
        <div className="auth__input-wrap">
          <input
            className="auth__input"
            id="company-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="auth__eye"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && <div className="auth__server-error">{error}</div>}

      <button className="auth__submit" type="submit" disabled={status === 'loading'}>
        {status === 'loading' ? (
          <span className="auth__spinner" />
        ) : (
          <>
            Войти
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="auth__hint">
        <Info size={14} />
        <span>
          Доступ создаёт менеджер сервиса при заключении договора. Если доступа
          ещё нет — оставьте заявку на главной странице.
        </span>
      </p>
    </form>
  );
}
