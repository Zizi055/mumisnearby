import { useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TrialBanner from '../trial/TrialBanner';
import { navigation } from '../../config/navigation';
import { getSubscription } from '../../store/subscription.store';
import { getTrialInfo } from '../../store/trial.store';

export default function LkLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sub = getSubscription();
  const hasPaidPlan = !!sub?.currentPlanId;
  const trial = !hasPaidPlan ? getTrialInfo() : null;

  const currentSection =
    navigation.find((item) =>
      location.pathname.startsWith(item.path)
    ) || navigation[0];

  return (
    <div className="lk">

      {/* Оверлей для мобильного меню */}
      {sidebarOpen && (
        <div
          className="lk-sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Левый сайдбар */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Основная оболочка */}
      <div className="lk-shell">

        {/* Шапка */}
        <Header onMenuToggle={() => setSidebarOpen((v) => !v)} />

        {/* Горизонтальное подменю — всегда видно */}
        <div className="lk-subnav">
          <span className="lk-subnav__section">
            {currentSection.label}
          </span>
          <nav className="lk-subnav__links">
            {currentSection.children.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `lk-subnav__link ${isActive ? 'is-active' : ''}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Триал-баннер */}
        {trial && <TrialBanner />}

        {/* Тело */}
        <div className="lk-body">

          {/* Боковое подменю (десктоп) */}
          <aside className="lk-submenu">
            <div className="lk-submenu__title">
              {currentSection.label}
            </div>
            <nav className="lk-submenu__nav">
              {currentSection.children.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `lk-submenu__link ${isActive ? 'is-active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          {/* Контент */}
          <main className="lk-content">
            <Outlet />
          </main>

        </div>
      </div>
    </div>
  );
}
