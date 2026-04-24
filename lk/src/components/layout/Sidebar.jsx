import { NavLink } from 'react-router-dom';
import { navigation } from '../../config/navigation';

export default function Sidebar() {
  return (
    <aside className="lk-sidebar">
      {/* TOP */}
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

      {/* BOTTOM */}
      <div className="lk-sidebar__bottom">
        {navigation.slice(4).map((item) => (
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
      </div>
    </aside>
  );
}