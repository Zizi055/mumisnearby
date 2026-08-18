import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginAdmin, loginSuperAdmin } from '../../api/adminAuth.service';

// ─────────────────────────────────────────────────────────────────────
// Вход в админ-панель.
//
// На бэке ДВЕ независимые таблицы учёток и два эндпоинта:
//   POST /auth/admin/login        → таблица admins
//   POST /auth/super_admin/login  → таблица super_admin
//
// Логин из одной таблицы во второй не найдётся: будет 401 «Неверный
// логин или пароль», хотя учётка исправна. Поэтому выбор роли — явный,
// галочкой, а не автоподбором: в консоли сразу видно, куда ушёл запрос.
// ─────────────────────────────────────────────────────────────────────

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setStatus('loading');
    setError('');

    try {
      if (isSuperAdmin) {
        await loginSuperAdmin({ username: username.trim(), password });
      } else {
        await loginAdmin({ username: username.trim(), password });
      }

      // Суперадмину /admin/* недоступен (там нужен админский токен),
      // поэтому ведём его в «Админы», а не в «Обращения».
      const home = isSuperAdmin ? '/admin/admins' : '/admin/support';

      // Сохранённый redirect уважаем только если роль его потянет.
      const redirect = params.get('redirect');
      const target =
        redirect && !(isSuperAdmin && !decodeURIComponent(redirect).startsWith('/admin/admins'))
          ? decodeURIComponent(redirect)
          : home;

      navigate(target, { replace: true });
    } catch (err) {
      // Подсказываем про вторую таблицу — самая частая причина 401.
      setError(
        (err.message || 'Неверный логин или пароль') +
          (isSuperAdmin
            ? ''
            : ' Если это учётка супер-администратора — поставьте галочку ниже.')
      );
      setStatus('error');
    }
  };

  return (
    <div className="lk-admin-shell">
      <div className="lk-admin-login">
        <div className="lk-admin-login__card">
          <h1>Вход в админ-панель</h1>
          <p>Отдельный логин от личного кабинета пользователей.</p>

          <form className="lk-admin-login__form" onSubmit={handleSubmit}>
            <label className="lk-admin-login__field">
              <span>Логин</span>
              <input
                type="text"
                value={username}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck="false"
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>

            <label className="lk-admin-login__field">
              <span>Пароль</span>
              <input
                type="password"
                value={password}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>

            <label className="lk-admin-login__checkbox">
              <input
                type="checkbox"
                checked={isSuperAdmin}
                onChange={(e) => setIsSuperAdmin(e.target.checked)}
              />
              Я супер-администратор
            </label>

            {error && <div className="lk-admin-login__error">{error}</div>}

            <button type="submit" disabled={status === 'loading'}>
              {status === 'loading' ? 'Входим…' : 'Войти'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
