import { useEffect, useState } from 'react';
import { Outlet, useLocation, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import TrialBanner from '../trial/TrialBanner';
import { navigation } from '../../config/navigation';
import { useSubscriptionStore, useHasPaidPlan } from '../../store/subscription.store';
import { getTrialInfo } from '../../store/trial.store';
import CompanyBlockNotice from './CompanyBlockNotice';
import {
  COMPANY_BLOCK_EVENT,
  getCompanyBlock,
} from '../../utils/companyBlock';

export default function LkLayout() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const loadSubscription = useSubscriptionStore((s) => s.load);

  useEffect(() => {
    loadSubscription();
  }, []);

  // Мобильное меню закрываем на любую смену маршрута. Раньше onClose
  // передавался в Sidebar, но нигде не вызывался: после нажатия на пункт
  // страница менялась, а панель оставалась открытой поверх контента —
  // приходилось тыкать в пустое место экрана.
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const hasPaidPlan = useHasPaidPlan();
  const trial = !hasPaidPlan ? getTrialInfo() : null;

  // Сотрудник корпоративного клиента, которому отключили доступ: бэк
  // отвечает 403 на любой запрос, и показывать кабинет бессмысленно —
  // все разделы будут пустыми с ошибками. Вместо него один экран с
  // объяснением, куда идти.
  const [companyBlock, setCompanyBlock] = useState(getCompanyBlock);

  useEffect(() => {
    const onBlock = (e) => setCompanyBlock(e.detail);

    window.addEventListener(COMPANY_BLOCK_EVENT, onBlock);
    return () => window.removeEventListener(COMPANY_BLOCK_EVENT, onBlock);
  }, []);

  const currentSection =
    navigation.find((item) =>
      location.pathname.startsWith(item.path)
    ) || navigation[0];

  if (companyBlock) return <CompanyBlockNotice />;

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
