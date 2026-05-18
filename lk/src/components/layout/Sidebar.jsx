import { NavLink } from 'react-router-dom';
import { navigation } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();

  const getInitial = () => {
    if (!user?.name) return '?';
    return user.name[0].toUpperCase();
  };

  return (
    <aside className="lk-sidebar">

      {/* TOP — основная навигация (Главная, Библиотека, Голос, Подписка) */}
      <div className="lk-sidebar__top">
        <nav className="lk-sidebar__nav">
          {navigation.slice(0, 4).map((item) => (
            <NavLink
              key={item.path}
              to={item.children[0].path}
              aria-label={item.label}
              className={({ isActive }) =>
                `lk-sidebar__icon ${isActive ? 'is-active' : ''}`
              }
            >
              <span className="lk-sidebar__icon-inner">
                {item.icon}
              </span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* BOTTOM — Настройки и Профиль */}
      <div className="lk-sidebar__bottom">
        {navigation.slice(4).map((item) => {
          const isProfile = item.path === '/profile';

          return (
            <NavLink
              key={item.path}
              to={item.children[0].path}
              aria-label={item.label}
              className={({ isActive }) =>
                `lk-sidebar__icon ${isProfile ? 'lk-sidebar__icon--profile' : ''} ${isActive ? 'is-active' : ''}`
              }
            >
              {isProfile ? (
                // Аватар с буквой вместо иконки User
                <span className="lk-sidebar__avatar">
                  {getInitial()}
                </span>
              ) : (
                <span className="lk-sidebar__icon-inner">
                  {item.icon}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

    </aside>
  );
}