import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, UserPlus } from 'lucide-react';
import { createAdmin, getAdmins, isStoredSuperAdmin } from '../../api/adminAuth.service';

// Управление админами — доступно только супер-админу (проверка роли ниже
// на фронте; реальное разграничение прав всё равно на бэке по токену).
//
// Бэк даёт GET /auth/super_admin/admins (список) и POST
// /auth/super_admin/create (добавление) — обе используются здесь.
// Удаления администратора и журнала его действий на бэке нет.
export default function AdminAdmins() {
  const isSuperAdmin = isStoredSuperAdmin();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [error, setError] = useState('');

  const [admins, setAdmins] = useState([]);
  const [listState, setListState] = useState('loading'); // loading | ready | error
  const [listError, setListError] = useState('');

  const loadAdmins = async () => {
    try {
      const data = await getAdmins();
      setAdmins(Array.isArray(data) ? data : []);
      setListState('ready');
    } catch (err) {
      setListError(err.message || 'Не удалось загрузить список администраторов');
      setListState('error');
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;
    loadAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

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
      // Перечитываем список, чтобы новый администратор появился сразу.
      loadAdmins();
    } catch (err) {
      setError(err.message || 'Не удалось создать администратора');
      setStatus('error');
    }
  };

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
              Администратор создан — он может войти со своим логином и паролем.
            </div>
          )}

          <button type="submit" disabled={status === 'loading'}>
            <UserPlus size={15} className="lk-admin-login__submit-icon" />
            {status === 'loading' ? 'Создаём…' : 'Создать'}
          </button>
        </form>
      </div>

      <div className="lk-admin-detail">
        <h2 className="lk-admin-detail__title">
          Администраторы{listState === 'ready' ? ` (${admins.length})` : ''}
        </h2>

        {listState === 'loading' && (
          <p className="lk-admin-detail__hint">
            <Loader2 size={14} className="lk-spin" /> Загружаем список…
          </p>
        )}

        {listState === 'error' && (
          <div className="lk-admin-login__error">{listError}</div>
        )}

        {listState === 'ready' && admins.length === 0 && (
          <p className="lk-admin-detail__hint">Администраторов пока нет.</p>
        )}

        {listState === 'ready' && admins.length > 0 && (
          <div className="lk-admin-table lk-admin-table--3col">
            <div className="lk-admin-table__row lk-admin-table__row--head">
              <span>Логин</span>
              <span>Роль</span>
              <span>Создан</span>
            </div>

            {admins.map((a) => (
              <div className="lk-admin-table__row" key={a.id}>
                <span className="lk-admin-table__name">{a.username}</span>
                <span>{a.is_admin ? 'Администратор' : 'Супер-админ'}</span>
                <span>
                  {a.created_at
                    ? new Date(a.created_at).toLocaleDateString('ru-RU')
                    : '—'}
                </span>
              </div>
            ))}
          </div>
        )}

        <p className="lk-admin-detail__hint">
          Удаление администраторов и журнал их действий на бэкенде пока
          не реализованы.
        </p>
      </div>

    </div>
  );
}
