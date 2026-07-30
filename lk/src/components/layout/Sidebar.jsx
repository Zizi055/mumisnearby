import { NavLink } from 'react-router-dom';
import { navigation } from '../../config/navigation';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth();

  const getInitial = () => {
    if (!user?.name) return '?';
    return user.name[0].toUpperCase();
  };

  return (
    <aside className={`lk-sidebar ${isOpen ? 'is-open' : ''}`}>

      {/* Вся навигация одной группой наверху — Главная, Библиотека, Голос,
          Подписка, Настройки, Профиль */}
      <div className="lk-sidebar__top">
        <nav className="lk-sidebar__nav">
          {navigation.map((item) => {
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

                {/* Название пункта — видно только в мобильной раскладке,
                    на десктопе/планшете его и так показывает .lk-submenu */}
                <span className="lk-sidebar__label">
                  {item.tooltip || item.label}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </div>

    </aside>
  );
}