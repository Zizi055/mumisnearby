import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { loginHr } from '../../api/hrAuth.service';
import HrAuthTabs from '../../components/hr/HrAuthTabs';

// ─────────────────────────────────────────────────────────────────────
// Вход HR-администратора компании.
//
// Третья роль на бэке, помимо пользователя и админа поддержки: своя
// таблица учёток, свой POST /auth/hr/login, токен с role: hr. Поэтому
// отдельный экран, а не галочка на общем входе — HR и сотрудник могут
// сидеть в одном браузере, и путать их сессии нельзя.
// ─────────────────────────────────────────────────────────────────────

export default function HrLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setStatus('loading');
    setError('');

    try {
      await loginHr({ email: email.trim(), password });

      const redirect = params.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/hr/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Не удалось войти');
      setStatus('error');
    }
  };

  return (
    <div className="lk-hr-shell">
      <div className="lk-hr-login">
        <div className="lk-hr-login__card">
          <span className="lk-text-eyebrow">Кабинет компании</span>

          <HrAuthTabs />

          <p>
            Войдите, чтобы управлять корпоративной подпиской, промокодами и
            сотрудниками.
          </p>

          <form className="lk-hr-form" onSubmit={handleSubmit}>
            <label className="lk-hr-field">
              <span>Рабочая почта</span>
              <input
                type="email"
                value={email}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck="false"
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>

            <label className="lk-hr-field">
              <span>Пароль</span>
              <div className="lk-hr-field__password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  title={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </label>

            {error && <div className="lk-hr-error">{error}</div>}

            <button
              type="submit"
              className="lk-btn lk-btn--primary lk-btn--md"
              disabled={status === 'loading'}
            >
              {status === 'loading' ? 'Входим…' : 'Войти'}
            </button>
          </form>

          <p className="lk-hr-login__foot">
            Вы сотрудник и у вас есть промокод?{' '}
            <Link to="/promo">Активировать доступ</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
