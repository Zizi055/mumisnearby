import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Info } from 'lucide-react';
import { loginCompany } from '../../api/company.service';
import { loginAdmin } from '../../api/adminAuth.service';

// ─────────────────────────────────────────────────────────────────────
// Форма входа юрлица внутри общего экрана авторизации.
//
// Поле называется «Логин», а не «Почта компании»: на бэке это
// username (наследие OAuth2PasswordRequestForm), и пока туда
// подставляют почту, но завязывать подпись на текущий формат значения
// не стоит — поменяется формат, придётся править интерфейс.
//
// Запрос устроен ровно так же, как вход в админку: POST,
// x-www-form-urlencoded, поля username и password. Отличаются только
// адрес и ключ, под которым лежит токен, — и это не формальность:
// токен компании принимают /companies/*, токен администратора —
// /admin/*, перекрёстно оба дают 401.
//
// Поэтому форма пробует оба адреса подряд. Человек со стороны сервиса
// и человек со стороны клиента набирают логин в одном и том же поле,
// а разводит их результат запроса, а не выбор вкладки, — иначе
// администратор упирается в «неверный логин» на своих же доступах.
//
// Самостоятельной регистрации нет — компании заводит администратор при
// заключении договора. Поэтому вместо вкладки «Регистрация» здесь
// объяснение, откуда берутся доступы: иначе человек ищет кнопку,
// которой не существует.
// ─────────────────────────────────────────────────────────────────────

// Порядок важен: сначала учётка компании — это основной сценарий
// вкладки, и администраторов на весь сервис единицы. Пароль уходит на
// второй адрес только после отказа на первом.
async function signIn(login, password) {
  try {
    await loginCompany({ email: login, password });
    return '/company/dashboard';
  } catch (companyError) {
    try {
      await loginAdmin({ username: login, password });
      return '/admin/companies';
    } catch {
      // Про админский адрес человеку знать незачем: он выбрал вкладку
      // «Компания» и ждёт ответа про неё.
      throw companyError;
    }
  }
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
