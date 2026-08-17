import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { loginAdmin } from '../../api/adminAuth.service';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | error
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setStatus('loading');
    setError('');

    try {
      // Вход один на всех: права супер-админа определяются по токену,
      // отдельного /auth/super_admin/login на бэке не существует.
      await loginAdmin({ username: username.trim(), password });

      const redirect = params.get('redirect');
      navigate(redirect ? decodeURIComponent(redirect) : '/admin/support', { replace: true });
    } catch (err) {
      setError(err.message || 'Неверный логин или пароль');
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
