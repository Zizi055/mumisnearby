import { NavLink, useLocation } from 'react-router-dom';
import { navigation } from '../config/navigation';

export default function Submenu() {
  const location = useLocation();

 
  const current = navigation.find((item) =>
    location.pathname.startsWith(item.path)
  );

  if (!current) return null;

  return (
    <aside className="lk-submenu">
      <div className="lk-submenu__title">{current.label}</div>

      <nav className="lk-submenu__nav">
        {current.children.map((child) => (
          <NavLink
            key={child.path}
            to={child.path}
            className={({ isActive }) =>
              `lk-submenu__link ${isActive ? 'is-active' : ''}`
            }
          >
            {child.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}