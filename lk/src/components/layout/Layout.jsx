import { NavLink, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { navigation } from '../../config/navigation';

export default function Layout({ children, libraryMenu = null, dashboardMenu = null }) {
  const location = useLocation();

  const currentSection =
    navigation.find((item) => location.pathname.startsWith(item.path)) ||
    navigation[0];

  return (
    <div className="lk-wrap">
      <div className="lk">
        <Sidebar />

        <div className="lk-shell">
          <Header />

          <div className="lk-body">
            <aside className="lk-menu">
              <nav className="lk-menu__nav">
             {currentSection.path === '/' && dashboardMenu ? (
  <>
    {dashboardMenu.items.map((item) => (
      <button
        key={item.key}
        type="button"
        className={`lk-menu__link ${dashboardMenu.activeTab === item.key ? 'is-active' : ''}`}
        onClick={() => dashboardMenu.onChangeTab(item.key)}
      >
        {item.label}
      </button>
    ))}
  </>
) : currentSection.path === '/library' && libraryMenu ? (
  <>
    <button
      type="button"
      className={`lk-menu__link ${libraryMenu.activeCategory === 'stories' ? 'is-active' : ''}`}
      onClick={() => libraryMenu.onChangeCategory('stories')}
    >
      Сказки
    </button>
    <button
      type="button"
      className={`lk-menu__link ${libraryMenu.activeCategory === 'lullabies' ? 'is-active' : ''}`}
      onClick={() => libraryMenu.onChangeCategory('lullabies')}
    >
      Колыбельные
    </button>
    <button
      type="button"
      className={`lk-menu__link ${libraryMenu.activeCategory === 'therapy' ? 'is-active' : ''}`}
      onClick={() => libraryMenu.onChangeCategory('therapy')}
    >
      Терапия
    </button>
    <button
      type="button"
      className={`lk-menu__link ${libraryMenu.activeCategory === 'family' ? 'is-active' : ''}`}
      onClick={() => libraryMenu.onChangeCategory('family')}
    >
      Семейные истории
    </button>
  </>
) : (
  currentSection.children.map((item) => (
    <NavLink
      key={item.path}
      to={item.path}
      className={({ isActive }) =>
        `lk-menu__link ${isActive ? 'is-active' : ''}`
      }
    >
      {item.label}
    </NavLink>
  ))
)}
              </nav>
            </aside>

            <main className="lk-content">{children}</main>
          </div>
        </div>
      </div>
    </div>
  );
}