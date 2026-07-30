import { useState } from 'react';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { createAdmin, getStoredAdminRole } from '../../api/adminAuth.service';

// Управление админами — доступно только супер-админу (проверка роли ниже
// на фронте; реальное разграничение прав всё равно на бэке по токену).
//
// На бэке пока есть только POST /auth/super_admin/create — эта форма им и
// пользуется, создание реально работает. Списка существующих админов,
// удаления и просмотра их активности на бэке нет вообще (не только для
// фронта — этих эндпоинтов не существует), поэтому здесь только форма
// создания и честная заглушка вместо списка.
export default function AdminAdmins() {
  const isSuperAdmin = getStoredAdminRole() === 'super_admin';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  if (!isSuperAdmin) {
    return (
      <div className="lk-admin">
        <div className="lk-admin-gate">
          <ShieldAlert size={28} />
          <h2>Доступно только супер-админу</h2>
          <p>Войдите под супер-админом, чтобы управлять администраторами.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setStatus('loading');
    setError('');

    try {
      await createAdmin({ username: username.trim(), password });
      setStatus('success');
      setUsername('');
      setPassword('');
    } catch (err) {
      setError(err.message || 'Не удалось создать администратора');
      setStatus('error');
    }
  };

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Админы</h1>
        </div>
      </header>

      <div className="lk-admin-detail">
        <h2 className="lk-admin-detail__title">Добавить администратора</h2>

        <form className="lk-admin-login__form" onSubmit={handleSubmit}>
          <label className="lk-admin-login__field">
            <span>Логин</span>
            <input
              type="text"
              value={username}
              autoComplete="off"
              onChange={(e) => setUsername(e.target.value)}
            />
          </label>

          <label className="lk-admin-login__field">
            <span>Пароль</span>
            <input
              type="password"
              value={password}
              autoComplete="new-password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          {status === 'error' && <div className="lk-admin-login__error">{error}</div>}
          {status === 'success' && (
            <div className="lk-admin-login__success">
              Администратор создан. Он может войти на странице входа со своим логином и паролем.
            </div>
          )}

          <button type="submit" disabled={status === 'loading'}>
            <UserPlus size={15} className="lk-admin-login__submit-icon" />
            {status === 'loading' ? 'Создаём…' : 'Создать'}
          </button>
        </form>
      </div>

      <div className="lk-admin-gate">
        <h2>Список и активность админов пока недоступны</h2>
        <p>
          На бэкенде ещё нет эндпоинтов для получения списка администраторов,
          их удаления и просмотра активности — только создание нового.
          Как только они появятся, эта страница дополнится.
        </p>
      </div>
    </div>
  );
}
