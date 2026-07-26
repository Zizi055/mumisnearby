import { useEffect, useState } from 'react';
import { getAdminUsers } from '../../api/admin.service';
import { Loader, RefreshCw, AlertCircle } from 'lucide-react';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
  } catch {
    return iso;
  }
}

// Поля пользователя в списке для админки точно не подтверждены по спеке
// (GET /admin/users на бэке пока не существует) — подстраховываемся
// несколькими вариантами имён на случай расхождений, когда бэк появится.
function getTariffLabel(u) {
  return u.tariff ?? u.plan ?? u.subscription?.plan_name ?? u.subscription?.plan_id ?? 'Демо';
}

// Список личных кабинетов (ЛК) пользователей. Без демо-режима — как только
// бэк добавит GET /admin/users, здесь появится реальный список.
export default function AdminUsers() {
  const [users, setUsers]   = useState([]);
  const [status, setStatus] = useState('loading'); // loading | success | failed

  useEffect(() => { loadUsers(); }, []);

  async function loadUsers() {
    setStatus('loading');
    try {
      const data = await getAdminUsers();
      setUsers(data);
      setStatus('success');
    } catch {
      setStatus('failed');
    }
  }

  return (
    <div className="lk-admin">
      <header className="lk-admin__head">
        <div>
          <span className="lk-admin__eyebrow">Админ-панель</span>
          <h1>Пользователи</h1>
        </div>
        <button type="button" className="lk-admin__refresh" onClick={loadUsers} title="Обновить">
          <RefreshCw size={16} className={status === 'loading' ? 'is-spinning' : ''} />
        </button>
      </header>

      {status === 'loading' && (
        <div className="lk-admin-list__loader"><Loader size={20} className="is-spinning" /></div>
      )}

      {status === 'failed' && (
        <div className="lk-admin-gate">
          <AlertCircle size={28} />
          <h2>Не удалось загрузить пользователей</h2>
          <p>Эндпоинт /admin/users пока может быть не готов на бэке.</p>
          <button type="button" onClick={loadUsers}>Попробовать снова</button>
        </div>
      )}

      {status === 'success' && users.length === 0 && (
        <div className="lk-admin-list__empty">Пользователей пока нет</div>
      )}

      {status === 'success' && users.length > 0 && (
        <div className="lk-admin-table">
          <div className="lk-admin-table__row lk-admin-table__row--head">
            <span>Пользователь</span>
            <span>Email</span>
            <span>Тариф</span>
            <span>Регистрация</span>
          </div>
          {users.map((u) => (
            <div className="lk-admin-table__row" key={u.id}>
              <span className="lk-admin-table__name">{u.username || u.name || `#${u.id}`}</span>
              <span className="lk-admin-table__contacts"><a href={`mailto:${u.email}`}>{u.email}</a></span>
              <span>{getTariffLabel(u)}</span>
              <span>{formatDate(u.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
