import { NavLink, useLocation } from 'react-router-dom';
import { navigation } from '../../config/navigation';

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="lk-sidebar">
      <div className="lk-sidebar__top">
        <nav className="lk-sidebar__nav">
          {navigation.slice(0, 4).map((item) => {
            const isActive = location.pathname.startsWith(item.path);

            return (
              <NavLink
                key={item.path}
                to={item.children[0].path}
                className={`lk-sidebar__icon ${isActive ? 'is-active' : ''}`}
                aria-label={item.label}
              >
                <span>{item.icon}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      <div className="lk-sidebar__bottom">
        {navigation.slice(4).map((item) => {
          const isActive = location.pathname.startsWith(item.path);

          return (
            <NavLink
              key={item.path}
              to={item.children[0].path}
              className={`lk-sidebar__icon ${isActive ? 'is-active' : ''}`}
              aria-label={item.label}
            >
              <span>{item.icon}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}