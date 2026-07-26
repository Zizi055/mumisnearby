import { NavLink, Outlet } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/admin/support', label: 'Обращения' },
  { path: '/admin/leads', label: 'Заявки' },
  { path: '/admin/users', label: 'Пользователи' },
];

// Общая шапка админки (без клиентского LkLayout — своя, отдельная от ЛК
// пользователя). Каждый раздел (Support/Leads/Users) — самостоятельная
// страница внутри <Outlet />.
export default function AdminLayout() {
  return (
    <div className="lk-admin-shell">
      <nav className="lk-admin-nav">
        <span className="lk-admin-nav__title">Админ-панель</span>
        <div className="lk-admin-nav__links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `lk-admin-nav__link ${isActive ? 'is-active' : ''}`}
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
