import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getAdminMe, getStoredAdminRole, logoutAdmin } from '../../api/adminAuth.service';

const NAV_ITEMS = [
  { path: '/admin/support', label: 'Обращения' },
  { path: '/admin/leads', label: 'Заявки' },
  { path: '/admin/users', label: 'Пользователи' },
];

const SUPER_ADMIN_NAV_ITEMS = [
  ...NAV_ITEMS,
  { path: '/admin/admins', label: 'Админы' },
];

// Общая шапка админки (без клиентского LkLayout — своя, отдельная от ЛК
// пользователя). Доступ реальный: без валидного adminToken (получен через
// /auth/admin/login или /auth/super_admin/login) сюда не попасть — редирект
// на /admin/login. Каждый раздел (Support/Leads/Users) — страница внутри <Outlet />.
export default function AdminLayout() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('checking'); // checking | ready
  const [admin, setAdmin] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) {
      redirectToLogin();
      return;
    }

    getAdminMe()
      .then((data) => {
        setAdmin(data);
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
          {(getStoredAdminRole() === 'super_admin' ? SUPER_ADMIN_NAV_ITEMS : NAV_ITEMS).map((item) => (
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
