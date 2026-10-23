import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { loginCompany } from '../../api/company.service';
import { startDemoCompanySession } from '../../api/mock/company.demo';

// ─────────────────────────────────────────────────────────────────────
// Форма входа юрлица внутри общего экрана авторизации.
//
// Сюда входит только компания. Администратор сервиса ходит своим
// входом, /lk/#/admin/login, и в этот кабинет не попадает вовсе:
// он заводит компанию и выдаёт ей доступ, а дальше компания сама
// раздаёт доступы сотрудникам. Два этих круга обязанностей не
// пересекаются, и сводить их в один экран — значит показывать
// администратору чужой кабинет, а компании чужие возможности.
//
// Поле называется «Логин», а не «Почта компании»: на бэке это
// username (наследие OAuth2PasswordRequestForm), и пока туда
// подставляют почту, но завязывать подпись на текущий формат значения
// не стоит — поменяется формат, придётся править интерфейс.
//
// Самостоятельной регистрации нет — компании заводит администратор при
// заключении договора. Поэтому вместо вкладки «Регистрация» здесь
// объяснение, откуда берутся доступы: иначе человек ищет кнопку,
// которой не существует.
// ─────────────────────────────────────────────────────────────────────

async function signIn(username, password) {
  try {
    await loginCompany({ email: username, password });
  } catch (error) {
    // 404 означает, что корпоративного модуля на сервере ещё нет, и
    // проверять логин попросту негде. Пока так, кабинет открывается на
    // демо-данных с плашкой наверху — иначе экраны невозможно ни
    // согласовать, ни показать. Как только бэкенд ответит, сюда
    // вернётся обычная проверка: ветка срабатывает только на 404.
    if (error.status !== 404) throw error;

    startDemoCompanySession();
  }

  return '/company/dashboard';
}

export default function CompanyLoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!login.trim() || !password) return;

    setStatus('loading');
    setError('');

    try {
      const home = await signIn(login.trim(), password);

      const redirect = params.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : home, { replace: true });
    } catch (err) {
      setError(err.message || 'Не удалось войти');
      setStatus('idle');
    }
  };

  return (
    <form className="auth__form" onSubmit={handleSubmit}>
      <div className="auth__field">
        <label className="auth__label" htmlFor="company-login">
          Логин
        </label>
        {/* type="text", а не "email": браузер не должен отбрасывать
            логин только потому, что в нём нет собачки. Проверять формат
            — работа бэкенда, он и скажет, что не так. */}
        <input
          className="auth__input"
          id="company-login"
          type="text"
          placeholder="логин"
          value={login}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck="false"
          onChange={(e) => setLogin(e.target.value)}
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
