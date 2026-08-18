import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Volume2, VolumeX } from 'lucide-react';
import { getAdminMe, isStoredSuperAdmin, logoutAdmin } from '../../api/adminAuth.service';
import { getAdminTickets } from '../../api/admin.service';
import { playNotifySound, isSoundMuted, setSoundMuted } from '../../utils/notifySound';

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

  // Сколько обращений висит в статусе «Новое». Отдельного колокольчика
  // для админов на бэке нет — /notifications работает по пользовательскому
  // токену. Поэтому считаем сами: раз в 30 секунд спрашиваем список с
  // фильтром по статусу и берём total.
  const [newTickets, setNewTickets] = useState(0);
  const [muted, setMuted] = useState(isSoundMuted);
  const prevNew = useRef(null);

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

  // Счётчик новых обращений — только для админов: суперадмину /admin/*
  // недоступен, запрос всё равно вернёт 401.
  useEffect(() => {
    if (status !== 'ready' || isSuper) return;

    let cancelled = false;

    const check = async () => {
      try {
        const res = await getAdminTickets({ status: 'new', page: 1, pageSize: 1 });
        if (cancelled) return;

        setNewTickets(res.total);

        // Звук только когда обращений стало больше, и не при первой
        // загрузке — иначе звенело бы при каждом заходе в панель.
        if (prevNew.current !== null && res.total > prevNew.current) {
          playNotifySound();
        }
        prevNew.current = res.total;
      } catch {
        // молча: панель не должна ломаться из-за счётчика
      }
    };

    check();
    const timer = setInterval(check, 30_000);

    const onFocus = () => check();

    // Страница обращений сообщает, что статус поменялся — пересчитываем
    // сразу, не дожидаясь следующего тика опроса.
    const onChanged = () => check();

    window.addEventListener('focus', onFocus);
    window.addEventListener('admin:tickets-changed', onChanged);

    return () => {
      cancelled = true;
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('admin:tickets-changed', onChanged);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isSuper]);

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

              {/* Сколько обращений ждут ответа. Видно из любого раздела,
                  не нужно заходить в «Обращения» и проверять глазами. */}
              {item.path === '/admin/support' && newTickets > 0 && (
                <span className="lk-admin-nav__badge">{newTickets}</span>
              )}
            </NavLink>
          ))}
        </div>
        <div className="lk-admin-nav__user">
          {!isSuper && (
            <button
              type="button"
              onClick={() => {
                const next = !muted;
                setSoundMuted(next);
                setMuted(next);
                if (!next) playNotifySound();
              }}
              title={muted ? 'Включить звук новых обращений' : 'Выключить звук'}
            >
              {muted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            </button>
          )}

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
