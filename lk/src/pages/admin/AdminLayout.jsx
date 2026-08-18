import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getAdminMe, checkSuperAdmin, logoutAdmin } from '../../api/adminAuth.service';

// ВНИМАНИЕ: разделы «Заявки» (/admin/leads) и «Пользователи»
// (/admin/users) убраны из меню — соответствующих эндпоинтов на бэке
// не существует (проверено по openapi.json), страницы открывались
// пустыми с ошибкой. Роуты и сами страницы сохранены: как только бэк
// добавит маршруты, достаточно вернуть их сюда.
const NAV_ITEMS = [
  { path: '/admin/support', label: 'Обращения' },
  { path: '/admin/grant', label: 'Выдать подписку' },
];

const SUPER_ADMIN_NAV_ITEMS = [
  ...NAV_ITEMS,
  { path: '/admin/admins', label: 'Админы' },
];

// Общая шапка админки (своя, отдельная от ЛК пользователя). Без валидного
// adminToken (получен через /auth/admin/login) сюда не попасть — редирект
// на /admin/login. Каждый раздел — страница внутри <Outlet />.
//
// Пункт «Админы» показываем только тем, у кого реально есть права супер-
// админа: признака в AdminOut нет, поэтому проверяем запросом к
// /auth/super_admin/admins (см. checkSuperAdmin).
export default function AdminLayout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | ready
  const [admin, setAdmin] = useState(null);
  const [isSuper, setIsSuper] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      redirectToLogin();
      return;
    }

    getAdminMe()
      .then(async (data) => {
        setAdmin(data);
        setIsSuper(await checkSuperAdmin());
        setStatus('ready');
      })
      .catch(() => {
        redirectToLogin();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function redirectToLogin() {
    const current = window.location.hash.replace(/^#/, '') || '/admin/support';
    navigate(`/admin/login?redirect=${encodeURIComponent(current)}`, { replace: true });
  }

  function handleLogout() {
    logoutAdmin();
    navigate('/admin/login', { replace: true });
  }

  if (status !== 'ready') {
    return (
      <div className="lk-admin-shell">
        <div className="lk-admin-gate">
          <h2>Проверяем доступ…</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="lk-admin-shell">
      <nav className="lk-admin-nav">
        <span className="lk-admin-nav__title">Админ-панель</span>
        <div className="lk-admin-nav__links">
          {(isSuper ? SUPER_ADMIN_NAV_ITEMS : NAV_ITEMS).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `lk-admin-nav__link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
        <div className="lk-admin-nav__user">
          <span>{admin?.username}</span>
          <button type="button" onClick={handleLogout} title="Выйти">
            <LogOut size={15} />
          </button>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
