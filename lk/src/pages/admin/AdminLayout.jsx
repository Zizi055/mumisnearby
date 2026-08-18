import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getAdminMe, isStoredSuperAdmin, logoutAdmin } from '../../api/adminAuth.service';

// Роли на бэке НЕ наследуются, и меню это отражает.
//
// Администратор (POST /auth/admin/login) работает с /admin/*:
// обращения, выдача подписки. Раздела «Админы» ему не видно —
// /auth/super_admin/admins его токен не примет.
//
// Супер-администратор (POST /auth/super_admin/login) управляет только
// учётками администраторов. На /admin/* его токен даёт 401, поэтому
// «Обращения» и «Выдать подписку» ему не показываем: раньше он попадал
// туда после входа и видел пустой экран с ошибкой.
//
// Разделы «Заявки» (/admin/leads) и «Пользователи» (/admin/users) убраны
// у всех — таких эндпоинтов на бэке нет. Роуты и страницы сохранены.
const ADMIN_NAV_ITEMS = [
  { path: '/admin/support', label: 'Обращения' },
  { path: '/admin/grant', label: 'Выдать подписку' },
];

const SUPER_ADMIN_NAV_ITEMS = [
  { path: '/admin/admins', label: 'Админы' },
];

// Куда вести сразу после входа — зависит от роли.
export const HOME_BY_ROLE = {
  admin: '/admin/support',
  super_admin: '/admin/admins',
};

// Общая шапка админки (своя, отдельная от ЛК пользователя). Без валидного
// adminToken (получен через /auth/admin/login) сюда не попасть — редирект
// на /admin/login. Каждый раздел — страница внутри <Outlet />.
//
// Пункт «Админы» показываем только тем, у кого реально есть права супер-
// админа: признака в AdminOut нет, поэтому проверяем запросом к
// /auth/super_admin/admins (см. checkSuperAdmin).
export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState('checking'); // checking | ready
  const [admin, setAdmin] = useState(null);
  const isSuper = isStoredSuperAdmin();

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

  // Суперадмин, попавший по прямой ссылке в «Обращения» или «Выдать
  // подписку», получил бы там 401 и пустой экран. Возвращаем его в
  // доступный раздел вместо того, чтобы показывать ошибку.
  useEffect(() => {
    if (status !== 'ready' || !isSuper) return;
    if (location.pathname.startsWith('/admin/admins')) return;

    navigate('/admin/admins', { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isSuper, location.pathname]);

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
          {(isSuper ? SUPER_ADMIN_NAV_ITEMS : ADMIN_NAV_ITEMS).map((item) => (
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
