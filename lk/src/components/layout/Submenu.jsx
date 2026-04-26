import { NavLink, useLocation } from 'react-router-dom';
import { navigation } from '../../config/navigation';

export default function Submenu() {
  const location = useLocation();

  // находим текущий раздел (dashboard / library / voice / subscription)
  const currentSection = navigation.find((item) =>
    location.pathname.startsWith(item.path)
  );

  if (!currentSection) return null;

  return (
    <aside className="lk-submenu">
      <div className="lk-submenu__title">
        {currentSection.label}
      </div>

      <nav className="lk-submenu__nav">
        {currentSection.children.map((child) => (
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