import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { getHrMe, logoutHr, getStoredCompanyName } from '../../api/hrAuth.service';
import { isNotImplemented } from '../../api/hrClient';

// ─────────────────────────────────────────────────────────────────────
// Оболочка кабинета компании.
//
// Своя, не LkLayout: у HR нет библиотеки, голоса и профиля ребёнка —
// сайдбар клиентского кабинета ему не нужен и только путал бы.
//
// Пока корпоративный модуль не выкачен на бэк, /auth/hr/me отвечает 404.
// В этом случае НЕ выкидываем на логин (токен-то валидный, просто
// эндпоинта нет) — пускаем внутрь, а экраны сами показывают заглушку.
// Иначе фронт нельзя было бы ни посмотреть, ни показать заказчику до
// готовности бэка.
// ─────────────────────────────────────────────────────────────────────

const HR_NAV_ITEMS = [
  { path: '/hr/dashboard', label: 'Обзор' },
  { path: '/hr/promocodes', label: 'Промокоды' },
  { path: '/hr/employees', label: 'Сотрудники' },
  { path: '/hr/company', label: 'Компания' },
];

export default function HrLayout() {
  const navigate = useNavigate();

  const [status, setStatus] = useState('checking'); // checking | ready
  const [admin, setAdmin] = useState(null);
  const [company, setCompany] = useState(getStoredCompanyName());

  useEffect(() => {
    const token = localStorage.getItem('hrToken');

    if (!token) {
      const current = window.location.hash.replace(/^#/, '') || '/hr/dashboard';
      navigate(`/hr/login?redirect=${encodeURIComponent(current)}`, { replace: true });
      return;
    }

    getHrMe()
      .then((data) => {
        setAdmin(data);
        if (data?.company_name) setCompany(data.company_name);
        setStatus('ready');
      })
      .catch((err) => {
        if (isNotImplemented(err)) {
          setStatus('ready');
          return;
        }
        // 401 уже обработан в hrClient — он сам уведёт на /hr/login.
        setStatus('ready');
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleLogout() {
    logoutHr();
    navigate('/hr/login', { replace: true });
  }

  if (status === 'checking') {
    return (
      <div className="lk-hr-shell">
        <div className="lk-hr-login__card">Проверяем доступ…</div>
      </div>
    );
  }

  return (
    <div className="lk-hr-shell">
      <nav className="lk-hr-nav">
        <div className="lk-hr-nav__brand">
          <span className="lk-hr-nav__title">Кабинет компании</span>
          {company && <span className="lk-hr-nav__company">{company}</span>}
        </div>

        <div className="lk-hr-nav__links">
          {HR_NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `lk-hr-nav__link ${isActive ? 'is-active' : ''}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="lk-hr-nav__user">
          {admin?.full_name && <span>{admin.full_name}</span>}
          <button type="button" onClick={handleLogout} title="Выйти">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <Outlet />
    </div>
  );
}
