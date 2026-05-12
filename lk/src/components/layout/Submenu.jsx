import { NavLink, useLocation } from 'react-router-dom';
import { navigation } from '../../config/navigation';
import { useEffect, useState } from 'react';

export default function Submenu() {
  const location = useLocation();
  const [isVisible, setIsVisible] = useState(false);


  const path = location.hash.replace('#', '') || '/';

  const currentSection = navigation.find((item) =>
    path.startsWith(item.path)
  );

  useEffect(() => {
    setIsVisible(false);

    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 80);

    return () => clearTimeout(timer);
  }, [location.hash]);

  if (!currentSection) {
    console.warn('Submenu not found for:', path);
    return <aside className="lk-submenu" />;
  }

  return (
    <aside className={`lk-submenu ${isVisible ? 'is-visible' : ''}`}>
      <div className="lk-submenu__title">
        {currentSection.label}
      </div>

      <nav className="lk-submenu__nav">
        {currentSection.children.map((child, index) => (
          <NavLink
            key={child.path}
            to={child.path}
            className={({ isActive }) =>
              `lk-submenu__link ${isActive ? 'is-active' : ''}`
            }
            style={{
              transitionDelay: `${index * 0.05}s`,
            }}
          >
            {child.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}