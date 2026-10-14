import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Info } from 'lucide-react';
import { loginCompany } from '../../api/company.service';
import HrAuthLayout from '../../components/hr/HrAuthLayout';

// ─────────────────────────────────────────────────────────────────────
// Вход в кабинет компании.
//
// Логин — ПОЧТА компании, не название и не выдуманный логин. На бэке
// поле формы называется username (наследие OAuth2PasswordRequestForm),
// но принимает именно email: об этом легко забыть и потом долго искать
// причину 401.
//
// Самостоятельной регистрации нет — компании заводит администратор
// сервиса при заключении договора. Поэтому здесь нет вкладки
// «Регистрация», а есть объяснение, откуда берутся доступы: иначе
// человек ищет несуществующую кнопку.
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
      await loginCompany({ email: email.trim(), password });

      const redirect = params.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/company/dashboard', {
        replace: true,
      });
    } catch (err) {
      setError(err.message || 'Не удалось войти');
      setStatus('error');
    }
  };

  return (
    <HrAuthLayout>
      <h1 className="lk-hr-auth__title">Кабинет компании</h1>

      <p className="lk-hr-auth__lead">
        Управление сотрудниками, тарифами и статистикой использования.
      </p>

      <form className="lk-hr-form" onSubmit={handleSubmit}>
        <label className="lk-hr-field">
          <span>Почта компании</span>
          <input
            type="email"
            value={email}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck="false"
            placeholder="b2b@company.ru"
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

      <p className="lk-hr-hint lk-hr-auth__note">
        <Info size={14} />
        Доступ создаёт менеджер сервиса при заключении договора. Если доступа
        ещё нет — оставьте заявку на главной странице.
      </p>

      <p className="lk-hr-login__foot">
        Вы сотрудник компании? Входите в{' '}
        <a href="#/auth">обычный личный кабинет</a> по почте, которую выдал
        работодатель.
      </p>
    </HrAuthLayout>
  );
}
