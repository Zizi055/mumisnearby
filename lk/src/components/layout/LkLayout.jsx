import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { navigation } from '../../config/navigation';

export default function LkLayout() {
  const location = useLocation();

  const currentSection =
    navigation.find((item) =>
      location.pathname.startsWith(item.path)
    ) || navigation[0];

  return (
    <div className="lk">
      {/* левый сайдбар */}
      <Sidebar />

      {/* основная оболочка */}
      <div className="lk-shell">

        {/* верх */}
        <Header />

        {/* тело */}
        <div className="lk-body">

          {/* submenu */}
          <aside className="lk-submenu">
            <div className="lk-submenu__title">
              {currentSection.label}
            </div>

            <nav className="lk-submenu__nav">
              {currentSection.children.map((item) => (
                <a
                  key={item.path}
                  href={`#${item.path}`}
                  className={`lk-submenu__link ${
                    location.pathname === item.path ? 'is-active' : ''
                  }`}
                >
                  {item.label}
                </a>
              ))}
            </nav>
          </aside>

          {/* контент */}
          <main className="lk-content">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
}