import { useEffect, useState } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';
import { getAdmins, isStoredSuperAdmin } from '../../api/adminAuth.service';

// Управление админами — доступно только супер-админу (проверка роли ниже
// на фронте; реальное разграничение прав всё равно на бэке по токену).
//
// Бэк даёт только GET /auth/super_admin/admins — список. Создания
// (/auth/super_admin/create), удаления и журнала действий не существует,
// поэтому формы добавления здесь нет: она отправляла бы запрос в никуда.
export default function AdminAdmins() {
  const isSuperAdmin = isStoredSuperAdmin();

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
