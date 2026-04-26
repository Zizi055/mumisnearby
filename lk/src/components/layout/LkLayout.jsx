import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import Submenu from './Submenu';

export default function LkLayout() {
  return (
    <div className="lk">
      <Sidebar />

      <div className="lk-shell">
        <Header />

        <div className="lk-body">
          <Submenu />

          <main className="lk-content">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}